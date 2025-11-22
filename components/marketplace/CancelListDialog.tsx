"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cancelListingDB } from "@/lib/supabaseClient";

interface CancelListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: {
    token_id: string;
    serial_number: number;
  };
  price: number;
  accountId: string;
  onSuccess?: () => void;
}

export function CancelListDialog({ open, onOpenChange, nft, price, accountId, onSuccess }: CancelListDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCancel = async () => {
    setLoading(true);

    try {
      console.log("🔓 Canceling listing for:", { tokenId: nft.token_id, serialNumber: nft.serial_number, accountId });
      
      // DEBUG: Check what's actually in the database
      const { supabase } = await import("@/lib/supabase");
      const tokenIdKey = `${nft.token_id}:${nft.serial_number}`;
      
      console.log("🔍 Searching for token_id:", tokenIdKey);
      
      // Check all records with this serial number
      const { data: allRecords, error: allError } = await supabase
        .from('souls')
        .select('*')
        .like('token_id', `%:${nft.serial_number}`);
      
      console.log("📊 All records with serial", nft.serial_number, ":", allRecords);
      console.log("📊 Error:", allError);
      
      // Find the exact match
      const { data: soulRecord, error: findError } = await supabase
        .from('souls')
        .select('*')
        .eq('token_id', tokenIdKey)
        .single();
      
      console.log("🎯 Exact match result:", { soulRecord, findError });
      
      if (!soulRecord) {
        // Try to find any record with this serial
        const { data: anyRecord } = await supabase
          .from('souls')
          .select('*')
          .like('token_id', `%:${nft.serial_number}`)
          .limit(1)
          .single();
        
        if (anyRecord) {
          console.log("🔄 Using alternative record:", anyRecord);
          await cancelListingDB(anyRecord.soul_id);
        } else {
          throw new Error(`No soul found with serial number ${nft.serial_number} in database`);
        }
      } else {
        console.log("✅ Found exact soul_id:", soulRecord.soul_id);
        await cancelListingDB(soulRecord.soul_id);
      }
      
      console.log("✅ Cancel completed successfully");
      
      toast({
        title: "Delisted Successfully! 🔓",
        description: `Soul #${nft.serial_number} removed from marketplace`,
      });
      
      // Close dialog immediately
      onOpenChange(false);
      
      // Wait for database to update, then reload
      setTimeout(() => {
        if (onSuccess) {
          console.log("🔄 Reloading profile after cancel");
          onSuccess();
        }
      }, 1000);
      
    } catch (error: any) {
      console.error("Cancel listing error:", error);
      toast({
        title: "Delist Failed",
        description: error.message || "Failed to delist NFT",
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
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Cancel Listing
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this Soul from the marketplace?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* NFT Info */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Soul</span>
              <span className="text-sm font-mono">#{nft.serial_number}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Token ID</span>
              <span className="text-sm font-mono">{nft.token_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Price</span>
              <span className="text-sm font-bold text-green-400">{price} HBAR</span>
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-3">
            <p className="text-xs text-orange-400">
              ⚠️ <strong>This action will:</strong>
            </p>
            <ul className="text-xs text-orange-400 mt-2 space-y-1 ml-4">
              <li>• Remove your Soul from the marketplace</li>
              <li>• Cancel all pending offers</li>
              <li>• You can list it again anytime</li>
            </ul>
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
            Keep Listed
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            className="flex-1"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Canceling...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel Listing
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
