/**
 * User Mint Helper - Non-Custodial NFT Minting
 * User signs transaction via HashPack wallet
 */

import { 
  TokenMintTransaction,
  TransactionId,
} from "@hashgraph/sdk";

export interface MintNFTParams {
  tokenId: string;
  metadata: string;
  accountId: string;
}

export interface MintResult {
  success: boolean;
  serialNumber?: number;
  transactionId?: string;
  error?: string;
}

/**
 * Prepare NFT mint transaction for user to sign
 */
export async function prepareMintTransaction(
  tokenId: string,
  metadata: string
): Promise<Uint8Array> {
  try {
    // Create mint transaction
    const mintTx = new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([Buffer.from(metadata)])
      .setMaxTransactionFee(2); // 2 HBAR max

    // Freeze transaction (ready to sign)
    const frozenTx = await mintTx.freezeWith({
      // @ts-ignore - Client will be provided by HashPack
      _network: { "testnet": "https://testnet.mirrornode.hedera.com" }
    });

    // Serialize to bytes for HashPack
    return frozenTx.toBytes();
  } catch (error) {
    console.error("Error preparing mint transaction:", error);
    throw error;
  }
}

/**
 * Mint NFT via user's wallet (HashPack)
 */
export async function mintNFTViaUserWallet(
  params: MintNFTParams
): Promise<MintResult> {
  try {
    const { tokenId, metadata, accountId } = params;

    console.log("🎨 Preparing mint transaction...");
    console.log("   Token ID:", tokenId);
    console.log("   Metadata:", metadata);
    console.log("   User:", accountId);

    // Check if HashPack is available
    if (typeof window !== 'undefined' && !(window as any).hashconnect) {
      throw new Error("HashPack wallet not connected");
    }

    // Create transaction via HashConnect
    const provider = (window as any).hashconnect.getProvider(
      "testnet",
      accountId,
      "DreamMarket"
    );

    const signer = provider.getSigner();

    // Create mint transaction
    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([Buffer.from(metadata)])
      .setMaxTransactionFee(2)
      .freezeWithSigner(signer);

    console.log("📝 Transaction prepared, requesting signature...");

    // User signs via HashPack
    const signedTx = await mintTx.signWithSigner(signer);

    console.log("✍️ Transaction signed, executing...");

    // Execute transaction
    const txResponse = await signedTx.executeWithSigner(signer);

    console.log("⏳ Waiting for receipt...");

    // Get receipt
    const receipt = await txResponse.getReceiptWithSigner(signer);

    const serialNumber = receipt.serials[0].toNumber();
    const transactionId = txResponse.transactionId.toString();

    console.log("✅ NFT minted successfully!");
    console.log("   Serial Number:", serialNumber);
    console.log("   Transaction ID:", transactionId);

    return {
      success: true,
      serialNumber,
      transactionId,
    };
  } catch (error: any) {
    console.error("❌ Mint error:", error);
    return {
      success: false,
      error: error.message || "Failed to mint NFT",
    };
  }
}
