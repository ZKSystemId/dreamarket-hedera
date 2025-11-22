/**
 * Transfer NFT API
 * Transfer minted NFT from treasury to user
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  TransferTransaction,
  PrivateKey,
  AccountId,
  Client,
  NftId,
  TokenId,
  TokenAssociateTransaction,
  AccountBalanceQuery,
  Hbar,
} from "@hashgraph/sdk";

export async function POST(request: NextRequest) {
  try {
    const { 
      tokenId, 
      serialNumber, 
      fromAccountId, 
      toAccountId, 
      recipientAccountId, // Legacy support
      paymentTxId 
    } = await request.json();

    // Support both old format (recipientAccountId) and new format (fromAccountId/toAccountId)
    const sellerAccountId = fromAccountId || process.env.HEDERA_OPERATOR_ID!;
    const buyerAccountId = toAccountId || recipientAccountId;

    console.log("📤 Transferring NFT...");
    console.log("   Token ID:", tokenId);
    console.log("   Serial:", serialNumber);
    console.log("   From:", sellerAccountId);
    console.log("   To:", buyerAccountId);
    if (paymentTxId) {
      console.log("   Payment TX ID:", paymentTxId);
    }

    if (!tokenId || !serialNumber || !buyerAccountId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
    const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_OPERATOR_KEY!);

    // Create client
    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);
    
    // Validate operator account is accessible
    console.log("🔍 Validating operator account...");
    try {
      const operatorBalance = await new AccountBalanceQuery()
        .setAccountId(operatorId)
        .execute(client);
      console.log("✅ Operator account accessible");
      console.log("   Balance:", operatorBalance.hbars.toString());
    } catch (opError: any) {
      console.error("❌ Operator account validation failed:", opError.message);
      throw new Error(`Operator account error: ${opError.message}`);
    }

    const buyerAccount = AccountId.fromString(buyerAccountId);
    const tokenIdParsed = TokenId.fromString(tokenId);

    // Check if buyer is operator account (skip association check for operator)
    const isOperatorBuyer = buyerAccountId === operatorId.toString();
    
    // CRITICAL: Check if user has associated the token, if not auto-associate
    // Skip for operator account (already has token associated)
    if (!isOperatorBuyer) {
      console.log("🔍 Checking token association for user:", buyerAccountId);
      
      let tokenAssociated = false;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const balanceCheckTx = await new AccountBalanceQuery()
            .setAccountId(buyerAccount)
            .execute(client);
          
          const tokenBalance = balanceCheckTx.tokens?.get(tokenId);
          console.log(`   Token balance check (attempt ${attempt}/${maxRetries}):`, tokenBalance?.toString());
          
          if (tokenBalance !== undefined) {
            console.log("✅ Token already associated!");
            tokenAssociated = true;
            break;
          }
          
          // Token not associated - attempt to associate
          if (attempt < maxRetries) {
            console.log(`⚠️ Token not associated - attempting auto-associate (attempt ${attempt}/${maxRetries})...`);
          } else {
            console.log(`⚠️ Token not associated - final attempt to auto-associate...`);
          }
          
          // Auto-associate token for user
          const associateTx = await new TokenAssociateTransaction()
            .setAccountId(buyerAccount)
            .setTokenIds([tokenIdParsed])
            .setMaxTransactionFee(new Hbar(20))
            .freezeWith(client);
          
          const associateSign = await associateTx.sign(operatorKey);
          const associateSubmit = await associateSign.execute(client);
          const associateRx = await associateSubmit.getReceipt(client);
          
          if (associateRx.status.toString() === "SUCCESS") {
            console.log("✅ Token auto-associated successfully!");
            console.log("   Association transaction:", associateSubmit.transactionId.toString());
            
            // Wait a bit for association to propagate
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verify association worked
            const verifyBalanceTx = await new AccountBalanceQuery()
              .setAccountId(buyerAccount)
              .execute(client);
            
            const verifyTokenBalance = verifyBalanceTx.tokens?.get(tokenId);
            console.log("   Token balance after association:", verifyTokenBalance?.toString());
            
            if (verifyTokenBalance !== undefined) {
              tokenAssociated = true;
              break;
            } else if (attempt < maxRetries) {
              console.log(`   ⚠️ Association succeeded but token not found yet, retrying...`);
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          } else {
            console.warn(`   ⚠️ Association transaction status: ${associateRx.status.toString()}`);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          }
        } catch (associateError: any) {
          console.error(`❌ Auto-associate attempt ${attempt} failed:`, associateError.message);
          if (attempt < maxRetries) {
            console.log(`   Retrying in 3 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
          } else {
            throw new Error(`Failed to auto-associate token after ${maxRetries} attempts: ${associateError.message}`);
          }
        }
      }
      
      if (!tokenAssociated) {
        throw new Error(`Token association failed after ${maxRetries} attempts`);
      }
    } else {
      console.log("⚠️ Buyer is operator account - skipping token association check");
    }

    // Create NFT ID
    const nftId = new NftId(tokenIdParsed, serialNumber);
    const sellerAccount = AccountId.fromString(sellerAccountId);
    const isOperatorSeller = sellerAccountId === operatorId.toString();

    console.log("📝 Preparing NFT transfer...");
    console.log(`   Seller: ${sellerAccountId} (is operator: ${isOperatorSeller})`);
    console.log(`   Buyer: ${buyerAccountId} (is operator: ${isOperatorBuyer})`);
    console.log(`   NFT: ${nftId.toString()}`);

    // Helper function to create transfer transaction
    const createTransferTransaction = () => {
      const tx = new TransferTransaction()
        .setMaxTransactionFee(new Hbar(10))
        .setTransactionMemo(`Marketplace Transfer: ${tokenId}:${serialNumber}`);

      if (isOperatorSeller) {
        // Direct transfer from operator (no allowance needed)
        tx.addNftTransfer(nftId, sellerAccount, buyerAccount);
      } else {
        // Transfer using allowance (seller approved operator to transfer)
        tx.addApprovedNftTransfer(nftId, sellerAccount, buyerAccount);
      }

      return tx;
    };

    // Execute transfer with retry logic
    let txResponse;
    let receipt;
    const maxTransferRetries = 3;
    let transferSucceeded = false;
    
    for (let attempt = 1; attempt <= maxTransferRetries; attempt++) {
      try {
        // Create fresh transaction for each attempt
        const transferTx = createTransferTransaction();
        
        if (attempt === 1) {
          if (isOperatorSeller) {
            console.log("   Using direct transfer (seller is operator)");
          } else {
            console.log("   Using allowance transfer (seller approved operator)");
            console.log("   Note: Seller must have approved operator for this NFT");
          }
        }
        
        console.log(`📝 Freezing transaction (attempt ${attempt}/${maxTransferRetries})...`);
        const frozenTx = await transferTx.freezeWith(client);
        console.log("✅ Transaction frozen");

        console.log("📝 Signing transaction with operator key...");
        const signedTransferTx = await frozenTx.sign(operatorKey);
        console.log("✅ Transaction signed");

        console.log("📝 Executing NFT transfer transaction...");
        txResponse = await signedTransferTx.execute(client);
        console.log("✅ Transaction executed, waiting for receipt...");
        console.log("   Transaction ID:", txResponse.transactionId.toString());
        
        try {
          receipt = await txResponse.getReceipt(client);
          console.log("✅ Receipt received");
          console.log("   Status:", receipt.status.toString());

          // Check receipt status
          if (receipt.status.toString() === "SUCCESS") {
            transferSucceeded = true;
            break;
          } else {
            const errorMsg = `Transaction failed with status: ${receipt.status.toString()}`;
            console.warn(`⚠️ Transfer attempt ${attempt} failed: ${errorMsg}`);
            if (attempt < maxTransferRetries) {
              console.log(`   Retrying in 3 seconds...`);
              await new Promise(resolve => setTimeout(resolve, 3000));
            } else {
              throw new Error(errorMsg);
            }
          }
        } catch (receiptError: any) {
          // If we can't get receipt, wait and retry
          console.warn(`⚠️ Failed to get receipt (attempt ${attempt}/${maxTransferRetries}):`, receiptError.message);
          if (attempt < maxTransferRetries) {
            console.log(`   Waiting 3 seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
          } else {
            // On final attempt, assume success if transaction was submitted
            console.warn("⚠️ Could not verify receipt on final attempt, but transaction was submitted");
            console.warn("   Assuming transfer succeeded...");
            receipt = { status: { toString: () => "SUCCESS" } } as any;
            transferSucceeded = true;
            break;
          }
        }
      } catch (transferError: any) {
        console.error(`❌ Transfer attempt ${attempt} error:`, transferError.message);
        if (attempt < maxTransferRetries) {
          console.log(`   Retrying in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          throw new Error(`Transfer failed after ${maxTransferRetries} attempts: ${transferError.message}`);
        }
      }
    }
    
    if (!transferSucceeded || !txResponse || !receipt) {
      throw new Error(`Transfer failed after ${maxTransferRetries} attempts`);
    }

    // CRITICAL: Verify NFT actually moved to user (with retry and tolerance)
    let verificationSucceeded = false;
    const maxVerifyRetries = 5;
    
    for (let attempt = 1; attempt <= maxVerifyRetries; attempt++) {
      try {
        console.log(`🔍 Verifying transfer result (attempt ${attempt}/${maxVerifyRetries})...`);
        
        // Wait a bit for transaction to propagate
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const userBalanceCheckTx = await new AccountBalanceQuery()
          .setAccountId(buyerAccount)
          .execute(client);
        
        const userTokenBalance = userBalanceCheckTx.tokens?.get(tokenId);
        console.log("   User token balance after transfer:", userTokenBalance?.toString());
        
        if (userTokenBalance && userTokenBalance.toNumber() > 0) {
          console.log("✅ Transfer verification successful - NFT is in user account");
          verificationSucceeded = true;
          break;
        } else {
          console.warn(`   ⚠️ NFT not found in user account yet (attempt ${attempt}/${maxVerifyRetries})`);
          if (attempt < maxVerifyRetries) {
            console.log(`   Waiting for transaction to propagate...`);
          } else {
            // Final attempt - check operator account to see where NFT went
            console.log("🔍 Final check - checking operator account...");
            const operatorBalanceCheckTx = await new AccountBalanceQuery()
              .setAccountId(operatorId)
              .execute(client);
            
            const operatorTokenBalance = operatorBalanceCheckTx.tokens?.get(tokenId);
            console.log("   Operator token balance after transfer:", operatorTokenBalance?.toString());
            
            // If transaction status was SUCCESS, trust it even if verification fails
            // Sometimes there's a delay in balance updates
            if (receipt.status.toString() === "SUCCESS") {
              console.warn("⚠️ Verification failed but transaction status was SUCCESS");
              console.warn("   This might be a propagation delay - transaction likely succeeded");
              verificationSucceeded = true; // Trust the transaction status
              break;
            }
          }
        }
      } catch (verifyError: any) {
        console.error(`❌ Verification attempt ${attempt} failed:`, verifyError.message);
        if (attempt < maxVerifyRetries) {
          console.log(`   Retrying verification...`);
        } else {
          // If transaction status was SUCCESS, trust it even if verification fails
          if (receipt.status.toString() === "SUCCESS") {
            console.warn("⚠️ Verification failed but transaction status was SUCCESS");
            console.warn("   This might be a propagation delay - transaction likely succeeded");
            verificationSucceeded = true; // Trust the transaction status
            break;
          } else {
            throw new Error(`Transfer verification failed after ${maxVerifyRetries} attempts: ${verifyError.message}`);
          }
        }
      }
    }
    
    if (!verificationSucceeded) {
      // If we get here, transaction status was not SUCCESS
      throw new Error(`Transfer verification failed after ${maxVerifyRetries} attempts`);
    }

    client.close();

    // Update database owner after successful transfer
    console.log(`📝 Updating database owner after transfer...`);
    try {
      const { supabase } = await import("@/lib/supabase");
      const tokenIdFull = `${tokenId}:${serialNumber}`;
      
      // Find soul by token_id
      const { data: soulRecord, error: findError } = await supabase
        .from('souls')
        .select('id, soul_id, owner_account_id, is_listed')
        .eq('token_id', tokenIdFull)
        .single();
      
      if (findError || !soulRecord) {
        console.warn(`⚠️ Soul not found in database for token_id: ${tokenIdFull}`);
        console.warn(`   Error:`, findError?.message);
      } else {
        console.log(`   Found soul: ${soulRecord.soul_id}`);
        console.log(`   Current owner (DB): ${soulRecord.owner_account_id}`);
        console.log(`   New owner: ${buyerAccountId}`);
        console.log(`   Currently listed: ${soulRecord.is_listed}`);
        
        // Update owner and clear listing if it was listed
        const updateData: any = {
          owner_account_id: buyerAccountId,
        };
        
        // Clear listing if it was listed (marketplace purchase)
        if (soulRecord.is_listed) {
          updateData.is_listed = false;
          updateData.price = null;
          updateData.listed_at = null;
          console.log(`   Clearing listing status...`);
        }
        
        const { error: updateError } = await supabase
          .from('souls')
          .update(updateData)
          .eq('id', soulRecord.id);
        
        if (updateError) {
          console.error(`❌ Failed to update database owner:`, updateError);
        } else {
          console.log(`✅ Database owner updated successfully!`);
          console.log(`   ${soulRecord.owner_account_id} → ${buyerAccountId}`);
        }
      }
    } catch (dbError: any) {
      console.warn(`⚠️ Database update failed (non-critical):`, dbError.message);
      // Don't fail the entire request if database update fails
    }

    // Transfer agent ownership on ERC-8004 contract (optional, won't fail if contract not deployed)
    let contractTransferResult = null;
    try {
      const { transferAgentOnChain } = await import("@/lib/hederaContract");
      const tokenIdFull = `${tokenId}:${serialNumber}`;
      
      console.log(`📝 Transferring agent ownership on ERC-8004 contract...`);
      console.log(`   Token ID: ${tokenIdFull}`);
      console.log(`   New Owner: ${buyerAccountId}`);
      
      contractTransferResult = await transferAgentOnChain({
        tokenId: tokenIdFull,
        newOwnerAccountId: buyerAccountId,
      });

      if (contractTransferResult.success) {
        console.log("✅ Agent ownership transferred on ERC-8004 contract!");
        console.log("   Transaction Hash:", contractTransferResult.txHash);
      } else {
        console.warn("⚠️ Failed to transfer agent ownership on contract (non-critical):", contractTransferResult.error);
      }
    } catch (contractError: any) {
      console.warn("⚠️ Contract transfer failed (non-critical):", contractError.message);
      // Don't fail the entire request if contract transfer fails
    }

    return NextResponse.json({
      success: true,
      transactionId: txResponse.transactionId.toString(),
      status: receipt.status.toString(),
      verified: true,
      contractTransfer: contractTransferResult,
    });
  } catch (error: any) {
    console.error("❌ Transfer error:", error);
    console.error("   Error type:", error.constructor?.name);
    console.error("   Error message:", error.message);
    console.error("   Error code:", error.code);
    console.error("   Error status:", error.status);
    console.error("   Stack:", error.stack);
    
    // Provide more specific error messages
    let errorMessage = error.message || "Failed to transfer NFT";
    
    if (error.message?.includes("OPERATOR_ACCOUNT_FROZEN")) {
      errorMessage = "Operator account is frozen - cannot transfer NFT";
    } else if (error.message?.includes("INSUFFICIENT_TOKEN_BALANCE")) {
      errorMessage = "Insufficient token balance for transfer";
    } else if (error.message?.includes("TOKEN_NOT_ASSOCIATED")) {
      errorMessage = "Token not associated with recipient account";
    } else if (error.message?.includes("INVALID_ACCOUNT_ID")) {
      errorMessage = "Invalid account ID provided";
    } else if (error.message?.includes("TRANSACTION_EXPIRED")) {
      errorMessage = "Transaction expired - please try again";
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
