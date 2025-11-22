"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SoulAgent } from "@/types/agent";
import { buySoul, cancelListing } from "@/lib/hederaClient";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { ShoppingCart, Tag, X, Loader2 } from "lucide-react";

interface TradingDialogProps {
  soul: SoulAgent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TradingDialog({ soul, open, onOpenChange, onSuccess }: TradingDialogProps) {
  const { toast } = useToast();
  const { accountId, sendTransaction } = useWallet();
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const isOwner = soul.owner === accountId;
  const isListed = (soul as any).isListed;
  const currentPrice = (soul as any).price;

  const handleList = async () => {
    if (!price || parseFloat(price) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price in HBAR",
        variant: "destructive",
      });
      return;
    }

    if (!accountId) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!soul.tokenId) {
      toast({
        title: "Token ID Missing",
        description: "Soul token ID not found. Cannot list.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Parse token ID (format: "0.0.7242548:2")
      const [tokenIdStr, serialNum] = soul.tokenId.split(':');
      if (!tokenIdStr || !serialNum) {
        throw new Error(`Invalid token ID format: ${soul.tokenId}`);
      }

      // Get marketplace operator account ID
      const MARKETPLACE_OPERATOR = process.env.NEXT_PUBLIC_OPERATOR_ACCOUNT_ID || "0.0.7158483";

      console.log("📝 Checking allowance requirements...");
      console.log(`   Account ID: ${accountId}`);
      console.log(`   Marketplace Operator: ${MARKETPLACE_OPERATOR}`);
      console.log(`   Is operator account: ${accountId === MARKETPLACE_OPERATOR}`);

      // Skip allowance approval for operator account (already has control)
      if (accountId === MARKETPLACE_OPERATOR) {
        console.log("⚠️ Operator account detected - skipping allowance approval");
        
        // Directly proceed to listing API call
        toast({
          title: "Listing...",
          description: "Updating marketplace database",
        });

        const response = await fetch('/api/list-nft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenId: tokenIdStr,
            serialNumber: parseInt(serialNum),
            price: parseFloat(price),
            ownerAccountId: accountId,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to list NFT");
        }

        toast({
          title: "Listed for Sale! 🏷️",
          description: `${soul.name} is now listed for ${price} HBAR`,
        });

        onSuccess();
        onOpenChange(false);
        return; // Exit early for operator account
      }

      // Step 1: Approve NFT allowance to marketplace (operator account)
      toast({
        title: "Step 1: Approve NFT",
        description: "Please approve marketplace to manage your NFT",
      });

      const { AccountAllowanceApproveTransaction, NftId, TokenId, AccountId } = await import("@hashgraph/sdk");

      const nftId = new NftId(
        TokenId.fromString(tokenIdStr),
        parseInt(serialNum)
      );

      const allowanceTx = new AccountAllowanceApproveTransaction()
        .approveTokenNftAllowance(
          nftId,
          AccountId.fromString(accountId),
          AccountId.fromString(MARKETPLACE_OPERATOR)
        );

      await sendTransaction(allowanceTx);
      console.log("✅ NFT allowance approved!");

      // Step 2: List on marketplace (database)
      toast({
        title: "Step 2: Listing...",
        description: "Updating marketplace database",
      });

      const response = await fetch('/api/list-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId: tokenIdStr,
          serialNumber: parseInt(serialNum),
          price: parseFloat(price),
          ownerAccountId: accountId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to list NFT");
      }

      toast({
        title: "Listed for Sale! 🏷️",
        description: `${soul.name} is now listed for ${price} HBAR`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Listing error:", error);
      toast({
        title: "Listing Failed",
        description: error.message || "Failed to list soul. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!accountId) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("💰 Initiating purchase...");
      console.log(`   Buyer: ${accountId}`);
      console.log(`   Seller: ${soul.owner}`);
      console.log(`   Price: ${currentPrice} HBAR`);
      console.log(`   Token ID: ${soul.tokenId}`);

      if (!soul.tokenId) {
        throw new Error("Soul token ID not found. Cannot transfer NFT.");
      }

      // Parse token ID (format: "0.0.7242548:2")
      const [tokenIdStr, serialNum] = soul.tokenId.split(':');
      if (!tokenIdStr || !serialNum) {
        throw new Error(`Invalid token ID format: ${soul.tokenId}`);
      }

      console.log(`   Parsed Token ID: ${tokenIdStr}, Serial: ${serialNum}`);

      // Get marketplace operator account ID
      const MARKETPLACE_OPERATOR = process.env.NEXT_PUBLIC_OPERATOR_ACCOUNT_ID || "0.0.7158483";
      const isOperatorBuyer = accountId === MARKETPLACE_OPERATOR;
      const isOperatorSeller = soul.owner === MARKETPLACE_OPERATOR;

      console.log("📝 Checking purchase requirements...");
      console.log(`   Is operator buyer: ${isOperatorBuyer}`);
      console.log(`   Is operator seller: ${isOperatorSeller}`);

      // Import Hedera SDK
      const { 
        TransferTransaction, 
        Hbar, 
        AccountId
      } = await import("@hashgraph/sdk");

      let paymentResult: any = null;

      // Step 1: Transfer HBAR from buyer to seller (skip if buyer is operator buying from operator)
      if (isOperatorBuyer && isOperatorSeller) {
        console.log("⚠️ Operator buying from operator - skipping HBAR transfer");
        // Create dummy payment result for consistency
        paymentResult = {
          transactionId: `operator-self-transfer-${Date.now()}`,
        };
      } else {
        toast({
          title: "Step 1: Payment",
          description: "Please approve HBAR transfer in HashPack",
        });

        const hbarTx = new TransferTransaction()
          .addHbarTransfer(AccountId.fromString(accountId!), new Hbar(-currentPrice))
          .addHbarTransfer(AccountId.fromString(soul.owner), new Hbar(currentPrice))
          .setTransactionMemo(`Buy Soul: ${soul.name} - Payment`);

        paymentResult = await sendTransaction(hbarTx);
        console.log("✅ Payment submitted:", paymentResult.transactionId);
      }

      // Step 2: Transfer NFT from seller to buyer (using marketplace operator)
      toast({
        title: "Step 2: Transfer NFT",
        description: "Transferring NFT ownership...",
      });

      // Call API to transfer NFT using marketplace operator (has allowance from seller)
      console.log("📝 Calling API to transfer NFT...");
      
      const transferResponse = await fetch('/api/transfer-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: tokenIdStr,
          serialNumber: parseInt(serialNum),
          fromAccountId: soul.owner,
          toAccountId: accountId,
          paymentTxId: paymentResult.transactionId,
        }),
      });

      const transferResult = await transferResponse.json();

      if (!transferResult.success) {
        throw new Error(transferResult.error || "Failed to transfer NFT");
      }

      console.log("✅ NFT transfer submitted:", transferResult.transactionId);

      toast({
        title: "Processing...",
        description: "Updating ownership on blockchain",
      });

      // Step 3: Update database
      const apiResponse = await fetch('/api/buy-soul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soulId: soul.id,
          buyerAccountId: accountId,
          transactionId: transferResult.transactionId || paymentResult.transactionId,
          paymentTxId: paymentResult.transactionId,
          nftTransferTxId: transferResult.transactionId,
        }),
      });

      const apiResult = await apiResponse.json();

      if (!apiResult.success) {
        throw new Error(apiResult.error || "Failed to update ownership");
      }

      console.log("✅ Purchase successful!");

      toast({
        title: "Purchase Successful! 🎉",
        description: `You now own ${soul.name}! NFT transferred and paid ${currentPrice} HBAR`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to buy soul. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await cancelListing(soul.id);
      
      toast({
        title: "Listing Cancelled",
        description: `${soul.name} is no longer for sale`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Trade Soul
          </DialogTitle>
          <DialogDescription>
            {isOwner 
              ? isListed 
                ? "Your soul is currently listed for sale"
                : "List your soul on the marketplace"
              : "Purchase this soul from the marketplace"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Soul Info */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="font-semibold mb-1">{soul.name}</h3>
            <p className="text-sm text-muted-foreground">{soul.tagline}</p>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span>Level {soul.level}</span>
              <span>•</span>
              <span className="text-purple-400">{soul.rarity}</span>
              <span>•</span>
              <span>{soul.skills.length} skills</span>
            </div>
          </div>

          {/* Owner Actions */}
          {isOwner && !isListed && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="price">List Price (HBAR)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g., 100"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">
                  Set your asking price in HBAR
                </p>
              </div>

              <Button
                variant="cosmic"
                className="w-full"
                onClick={handleList}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Listing...
                  </>
                ) : (
                  <>
                    <Tag className="mr-2 h-4 w-4" />
                    List for Sale
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Owner - Cancel Listing */}
          {isOwner && isListed && (
            <div className="space-y-3">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-sm text-green-300">
                  <strong>Listed for:</strong> {currentPrice} HBAR
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleCancel}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Cancel Listing
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Buyer Actions */}
          {!isOwner && isListed && (
            <div className="space-y-3">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="text-2xl font-bold text-purple-400">
                    {currentPrice} ℏ
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Marketplace fee: 2.5% (included)
                </p>
              </div>

              <Button
                variant="cosmic"
                className="w-full"
                onClick={handleBuy}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Purchasing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Buy Now for {currentPrice} HBAR
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Not Listed */}
          {!isOwner && !isListed && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-sm text-yellow-300">
                This soul is not currently listed for sale.
              </p>
            </div>
          )}

          {/* Technical Note */}
          <div className="text-xs text-muted-foreground bg-blue-500/5 border border-blue-500/20 rounded p-3">
            <p className="mb-2">
              <strong className="text-blue-300">How it works:</strong>
            </p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Payment: HBAR transferred on-chain (verifiable)</li>
              <li>Ownership: Updated in database immediately</li>
              <li>NFT Transfer: Requires seller approval (manual process)</li>
            </ul>
            <p className="mt-2 text-yellow-300">
              <strong>Note:</strong> Seller must manually transfer NFT after receiving payment. 
              Production version would use smart contract escrow for atomic swaps.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
