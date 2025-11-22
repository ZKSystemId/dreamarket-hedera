"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { WalletErrorBoundary } from "@/components/WalletErrorBoundary";

// Static imports - avoid dynamic import issues
let HashConnect: any = null;
let LedgerId: any = null;

// Try to load at module level
if (typeof window !== "undefined") {
  try {
    const hc = require("hashconnect");
    const sdk = require("@hashgraph/sdk");
    HashConnect = hc.HashConnect;
    LedgerId = sdk.LedgerId;
  } catch (e) {
    // Will load dynamically later
  }
}

interface WalletContextType {
  accountId: string | null;
  isConnected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendTransaction: (transaction: any) => Promise<{ transactionId: string }>;
}

const WalletContext = createContext<WalletContextType>({
  accountId: null,
  isConnected: false,
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
  sendTransaction: async () => ({ transactionId: "" }),
});

export const useWallet = () => useContext(WalletContext);

// Global HashConnect instance (runtime only, tipenya any biar gak ribut sama SDK)
let hashconnect: any = null;
export const getHashConnect = () => hashconnect;

const appMetadata = {
  name: "DreamMarket",
  description: "Marketplace of Digital Souls - AI Soul NFTs on Hedera",
  icons: ["https://placehold.co/64x64/png"],
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "https://dreamarket-hedera.vercel.app",
};

const LOCAL_STORAGE_KEY = "dreammarket_hashconnect_v3";

type SavedSession = {
  accountId: string;
  topic: string;
};

// Helper: init HashConnect (v3)
async function ensureHashConnect(): Promise<any | null> {
  if (typeof window === "undefined") {
    console.log("🔒 Server-side, skipping HashConnect init");
    return null;
  }

  if (hashconnect) {
    console.log("♻️ HashConnect already initialized, reusing instance");
    return hashconnect;
  }

  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (!projectId) {
    console.error("❌ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID not set");
    return null;
  }

  try {
    console.log("🔧 Creating HashConnect instance...");
    
    // Use static imports if available, otherwise fallback to dynamic
    let HC = HashConnect;
    let LID = LedgerId;
    
    if (!HC || !LID) {
      console.log("📦 Static imports not available, trying dynamic import...");
      const hcModule = await import("hashconnect");
      const sdkModule = await import("@hashgraph/sdk");
      HC = hcModule.HashConnect;
      LID = sdkModule.LedgerId;
      console.log("✓ Dynamic import successful");
    } else {
      console.log("✓ Using static imports");
    }

    if (!HC || !LID) {
      throw new Error("Failed to load HashConnect or LedgerId");
    }

    // @ts-ignore - HashConnect v3 constructor
    hashconnect = new HC(
      LID.TESTNET,
      projectId,
      appMetadata,
      false // debug
    );
    console.log("✓ HashConnect instance created");

    console.log("🚀 Initializing HashConnect...");
    await hashconnect.init();
    console.log("✅ HashConnect initialized successfully");
    return hashconnect;
  } catch (err: any) {
    console.error("❌ Failed to initialize HashConnect:");
    console.error("   Error type:", err?.name);
    console.error("   Error message:", err?.message);
    console.error("   Stack:", err?.stack);
    hashconnect = null;
    return null;
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [topic, setTopic] = useState<string | null>(null);

  // Restore session + init HashConnect di client
  useEffect(() => {
    if (typeof window === "undefined") return;

    (async () => {
      const hc = await ensureHashConnect();
      if (!hc) return;

      const savedRaw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedRaw) {
        try {
          const saved: SavedSession = JSON.parse(savedRaw);
          if (saved.accountId && saved.topic) {
            setAccountId(saved.accountId);
            setTopic(saved.topic);
            setIsConnected(true);
            console.log("🔁 Restored HashConnect session:", saved.accountId);
          }
        } catch (e) {
          console.warn("Failed to parse saved session:", e);
        }
      }
    })();
  }, []);

  const connect = async () => {
    if (typeof window === "undefined") return;
    if (connecting) return;

    setConnecting(true);

    try {
      const hc = await ensureHashConnect();
      if (!hc) {
        throw new Error("Failed to initialize HashConnect");
      }

      console.log("🚀 Starting HashConnect pairing...");

      // Setup pairing listener BEFORE opening modal
      hc.pairingEvent.once((pairingData: any) => {
        console.log("🤝 Pairing successful:", pairingData);
        const acctId = pairingData.accountIds?.[0];

        if (acctId) {
          setAccountId(acctId);
          setTopic(pairingData.topic || "connected");
          setIsConnected(true);

          window.localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify({
              accountId: acctId,
              topic: pairingData.topic || "connected",
            } as SavedSession)
          );

          console.log("✅ Connected to HashPack:", acctId);
        }
      });

      // @ts-ignore - HashConnect v3 API
      hc.openPairingModal();
      console.log("📡 Opening HashPack pairing modal...");
    } catch (err: any) {
      console.error("❌ HashConnect error:", err);
      setAccountId(null);
      setIsConnected(false);
      setTopic(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
      alert(
        "Failed to connect HashPack.\n\nPlease make sure:\n1. HashPack extension is installed\n2. HashPack is unlocked\n3. Network is set to Testnet"
      );
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setAccountId(null);
    setIsConnected(false);
    setTopic(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    console.log("👋 Disconnected from HashPack");
  };

  const sendTransaction = async (
    transaction: any
  ): Promise<{ transactionId: string }> => {
    if (!accountId) {
      throw new Error("Wallet not connected");
    }

    const hc = await ensureHashConnect();
    if (!hc) {
      throw new Error("HashConnect is not initialized");
    }

    try {
      console.log("📤 Sending transaction via HashConnect...");

      // @ts-ignore - HashConnect v3 API
      const signer: any = hc.getSigner(accountId);

      // Check if transaction is already frozen (from server)
      let txToExecute = transaction;
      if (!transaction.isFrozen?.()) {
        console.log("🧊 Freezing transaction...");
        txToExecute = await transaction.freezeWithSigner(signer);
      } else {
        console.log("✓ Transaction already frozen (from server)");
      }

      console.log("🚀 Executing transaction...");
      const response: any = await txToExecute.executeWithSigner(signer);

      const transactionId = response.transactionId.toString();
      console.log("✅ Transaction submitted:", transactionId);

      // Try to get receipt (optional)
      try {
        const receipt: any = await response.getReceiptWithSigner(signer);
        const statusStr = receipt.status?.toString?.() || "UNKNOWN";
        console.log("📄 Receipt:", statusStr);
        if (statusStr !== "SUCCESS") {
          throw new Error(`Transaction failed: ${statusStr}`);
        }
      } catch (e: any) {
        console.warn("⚠️ Receipt error (continuing):", e?.message);
      }

      return { transactionId };
    } catch (error: any) {
      console.error("❌ Transaction error:", error);
      throw new Error(error.message || "Transaction failed");
    }
  };

  return (
    <WalletErrorBoundary>
      <WalletContext.Provider
        value={{
          accountId,
          isConnected,
          connecting,
          connect,
          disconnect,
          sendTransaction,
        }}
      >
        {children}
      </WalletContext.Provider>
    </WalletErrorBoundary>
  );
}
