"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, TrendingUp, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@/contexts/WalletContext";

interface ListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: {
    token_id: string;
    serial_number: number;
  };
  accountId: string;
  onSuccess?: () => void;
}

export function ListDialog({ open, onOpenChange, nft, accountId, onSuccess }: ListDialogProps) {
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadyListed, setAlreadyListed] = useState(false);
  const { toast } = useToast();
  const { sendTransaction } = useWallet();

  // Log when dialog opens
  useEffect(() => {
    if (open) {
      console.log("💬 ListDialog opened!");
      console.log("   NFT:", nft);
      console.log("   AccountId:", accountId);
    }
  }, [open, nft, accountId]);

  // Debug: Track button disabled state
  useEffect(() => {
    const isDisabled = loading || checking || alreadyListed || !price || parseFloat(price) <= 0;
    console.log("🔘 List Button State:", {
      loading,
      checking,
      alreadyListed,
      price,
      priceValid: price && parseFloat(price) > 0,
      isDisabled,
    });
  }, [loading, checking, alreadyListed, price]);

  // Check if NFT is already listed
  useEffect(() => {
    const checkListing = async () => {
      if (!open) return;
      
      setChecking(true);
      try {
        const response = await fetch(`/api/check-listing?tokenId=${nft.token_id}&serialNumber=${nft.serial_number}`);
        const result = await response.json();
        
        if (result.success && result.isListed) {
          setAlreadyListed(true);
          toast({
            title: "Already Listed",
            description: `This Soul is already listed for ${result.price} HBAR`,
            variant: "destructive",
          });
        } else {
          setAlreadyListed(false);
        }
      } catch (error) {
        console.error("Failed to check listing:", error);
      } finally {
        setChecking(false);
      }
    };

    checkListing();
  }, [open, nft.token_id, nft.serial_number]);

  const handleList = async () => {
    console.log("🚀 handleList called!");
    console.log("   NFT:", nft);
    console.log("   Price:", price);
    console.log("   AccountId:", accountId);
    
    if (!price || parseFloat(price) <= 0) {
      console.log("❌ Invalid price:", price);
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price in HBAR",
        variant: "destructive",
      });
      return;
    }

    console.log("✅ Price validation passed, setting loading...");
    setLoading(true);

    try {
      // Step 1: Approve NFT allowance to marketplace (operator account)
      toast({
        title: "Step 1: Approve NFT",
        description: "Please approve marketplace to manage your NFT",
      });

      const { AccountAllowanceApproveTransaction, NftId, TokenId, AccountId } = await import("@hashgraph/sdk");

      // Parse token ID and serial from token_id format (e.g., "0.0.7232401:8")
      let tokenIdStr, serialNum;
      
      if (nft.token_id.includes(':')) {
        [tokenIdStr, serialNum] = nft.token_id.split(':');
      } else {
        tokenIdStr = nft.token_id;
        serialNum = nft.serial_number.toString();
      }

      console.log("📝 Preparing NFT allowance...");
      console.log(`   Token ID: ${tokenIdStr}`);
      console.log(`   Serial: ${serialNum}`);

      // Marketplace operator account (your treasury account)
      const MARKETPLACE_OPERATOR = process.env.NEXT_PUBLIC_OPERATOR_ACCOUNT_ID || "0.0.7158483";

      console.log("📝 Checking allowance requirements...");
      console.log(`   Account ID: ${accountId}`);
      console.log(`   Marketplace Operator: ${MARKETPLACE_OPERATOR}`);
      console.log(`   Is operator account: ${accountId === MARKETPLACE_OPERATOR}`);

      // Skip allowance approval for operator account (already has control)
      if (accountId === MARKETPLACE_OPERATOR) {
        console.log("⚠️ Operator account detected - skipping allowance approval");
        
        // Directly proceed to listing API call
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

        console.log(`📡 API response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API returned error:", errorText);
          throw new Error(`API error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log("📦 API result:", result);

        if (result.success) {
          toast({
            title: "✅ Listed Successfully!",
            description: `Soul #${nft.serial_number} listed for ${price} HBAR`,
          });
          
          console.log("✅ Listing success, closing dialog and calling onSuccess");
          
          // Close dialog
          onOpenChange(false);
          setPrice("");
          
          // Call success callback to reload profile data
          if (onSuccess) {
            console.log("📊 Calling onSuccess to reload profile");
            onSuccess();
          }
        } else {
          throw new Error(result.error);
        }
        
        return; // Exit early for operator account
      }

      // Create NftId properly
      const nftId = new NftId(
        TokenId.fromString(tokenIdStr),
        parseInt(serialNum)
      );

      // Create allowance approval transaction
      const allowanceTx = new AccountAllowanceApproveTransaction()
        .approveTokenNftAllowance(
          nftId,
          AccountId.fromString(accountId),
          AccountId.fromString(MARKETPLACE_OPERATOR)
        );

      console.log("📝 Approving NFT allowance...");
      console.log(`   NftId: ${nftId.toString()}`);
      console.log(`   Owner: ${accountId}`);
      console.log(`   Operator: ${MARKETPLACE_OPERATOR}`);

      let allowanceResult;
      try {
        allowanceResult = await sendTransaction(allowanceTx);
      } catch (allowanceError: any) {
        console.error("❌ Allowance transaction failed:", allowanceError);
        
        // Handle specific error types
        if (allowanceError.message?.includes("SPENDER_ACCOUNT_SAME_AS_OWNER")) {
          throw new Error("Cannot approve allowance: You cannot approve yourself as spender. Please check your wallet connection and try again.");
        } else if (allowanceError.message?.includes("INSUFFICIENT_ACCOUNT_BALANCE")) {
          throw new Error("Insufficient HBAR balance to pay transaction fees. Please add more HBAR to your account.");
        } else if (allowanceError.message?.includes("INVALID_ACCOUNT_ID")) {
          throw new Error("Invalid account ID. Please reconnect your wallet and try again.");
        } else {
          throw new Error(`Allowance approval failed: ${allowanceError.message || "Unknown error"}`);
        }
      }

      console.log("✅ NFT allowance approved!");
      console.log("   Transaction ID:", allowanceResult.transactionId);

      // Step 2: List on marketplace (database)
      toast({
        title: "Step 2: Listing...",
        description: "Updating marketplace database",
      });

      console.log("📝 Calling /api/list-nft with:", {
        tokenId: tokenIdStr,
        serialNumber: parseInt(serialNum),
        price: parseFloat(price),
        ownerAccountId: accountId,
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

      console.log(`📡 API response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API returned error:", errorText);
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("📦 API result:", result);

      if (result.success) {
        toast({
          title: "✅ Listed Successfully!",
          description: `Soul #${nft.serial_number} listed for ${price} HBAR`,
        });
        
        console.log("✅ Listing success, closing dialog and calling onSuccess");
        
        // Close dialog
        onOpenChange(false);
        setPrice("");
        
        // Call success callback to reload profile data
        if (onSuccess) {
          console.log("📊 Calling onSuccess to reload profile");
          onSuccess();
        }
        
        // Force reload after a short delay to ensure database is updated
        setTimeout(() => {
          if (onSuccess) {
            console.log("🔄 Force reload profile data");
            onSuccess();
          }
        }, 1000);
        
        // Note: Removed window.location.reload() to allow console inspection
        // onSuccess callback will reload profile data without full page refresh
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("Listing error:", error);
      toast({
        title: "Listing Failed",
        description: error.message || "Failed to list NFT",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-green-500" />
            List Soul on Marketplace
          </DialogTitle>
          <DialogDescription>
            Set a price for Soul #{nft.serial_number} and list it for sale
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* NFT Info */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Token ID</span>
              <span className="text-sm font-mono">{nft.token_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Serial Number</span>
              <span className="text-sm font-mono">#{nft.serial_number}</span>
            </div>
          </div>

          {/* Price Input */}
          <div className="space-y-2">
            <Label htmlFor="price" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Listing Price
            </Label>
            <div className="relative">
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="10.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pr-16"
                disabled={loading}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                HBAR
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Buyers will pay this amount to purchase your Soul
            </p>
          </div>

          {/* Fee Info */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
            <p className="text-xs text-blue-400">
              💡 <strong>Marketplace Fee:</strong> 2.5% of sale price
            </p>
            {price && parseFloat(price) > 0 && (
              <p className="text-xs text-blue-400 mt-1">
                You'll receive: <strong>{(parseFloat(price) * 0.975).toFixed(2)} HBAR</strong>
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="cosmic"
            onClick={(e) => {
              console.log("🔥🔥🔥 List for Sale button clicked! 🔥🔥🔥");
              console.log("   Button disabled check:", {
                loading,
                checking,
                alreadyListed,
                price,
                priceValid: price && parseFloat(price) > 0,
                isDisabled: loading || checking || alreadyListed || !price || parseFloat(price) <= 0,
              });
              if (!loading && !checking && !alreadyListed && price && parseFloat(price) > 0) {
                handleList();
              } else {
                console.error("❌ Button click ignored - button is disabled!");
              }
            }}
            className="flex-1"
            disabled={loading || checking || alreadyListed || !price || parseFloat(price) <= 0}
          >
            {checking ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Checking...
              </>
            ) : alreadyListed ? (
              <>Already Listed</>
            ) : loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Listing...
              </>
            ) : (
              <>
                <Store className="h-4 w-4 mr-2" />
                List for Sale
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
