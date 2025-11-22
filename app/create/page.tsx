"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BadgeRarity } from "@/components/common/BadgeRarity";
import { Rarity, SoulAgentInput, SoulBlueprint } from "@/types/agent";
import { useToast } from "@/components/ui/use-toast";
import {
  Sparkles,
  Loader2,
  Wallet,
  Wand2,
} from "lucide-react";
import { getAvatarGradient, getInitials } from "@/lib/utils";
import { useWallet } from "@/contexts/WalletContext";
import { WalletNotice } from "@/components/WalletNotice";
import { ensureSoulAssociated } from "@/lib/ensureSoulAssociation";

export default function CreateSoulPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { accountId, isConnected, connect, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState<"inspiration" | "preview" | "minting">(
    "inspiration"
  );

  // AI Generation inputs
  const [inspirationPrompt, setInspirationPrompt] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("general");
  const [personalityTone, setPersonalityTone] = useState("friendly");

  // Generated blueprint
  const [blueprint, setBlueprint] = useState<SoulBlueprint | null>(null);

  const [formData, setFormData] = useState<SoulAgentInput>({
    name: "",
    tagline: "",
    personality: "",
    skills: [],
    creationStory: "",
    rarity: "Common",
  });

  const [skillInput, setSkillInput] = useState("");

  const handleInputChange = (field: keyof SoulAgentInput, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const handleGenerateBlueprint = async () => {
    if (!inspirationPrompt.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an inspiration prompt",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch("/api/souls/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspirationPrompt,
          language: "English", // Always English for generation
          constraints: {
            domain: selectedDomain !== "general" ? selectedDomain : undefined,
            maxSkills: 6,
            tone: personalityTone,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBlueprint(data.data.blueprint);
        setFormData({
          name: data.data.soulInput.name,
          tagline: data.data.soulInput.tagline,
          personality: data.data.soulInput.personality,
          skills: data.data.soulInput.skills,
          creationStory: data.data.soulInput.creationStory,
          rarity: "Common",
        });
        setStep("preview");
        toast({
          title: "Blueprint Generated! ✨",
          description: "Review and edit your soul before minting",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate soul blueprint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleMint = async () => {
    if (!isConnected || !accountId) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Hedera wallet first.",
        variant: "destructive",
      });
      return;
    }

    setStep("minting");
    setLoading(true);

    try {
      console.log("🎨 Minting NFT via user wallet:", accountId);

      // STEP 0: Ensure Soul token is associated with user account
      // This will trigger TokenAssociateTransaction if not already associated
      // Use NEXT_PUBLIC_HEDERA_NFT_TOKEN_ID (existing variable in Vercel)
      const soulTokenId = process.env.NEXT_PUBLIC_HEDERA_NFT_TOKEN_ID || process.env.NEXT_PUBLIC_SOUL_NFT_TOKEN_ID;
      const network = (process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet") as "testnet" | "mainnet";

      if (!soulTokenId) {
        throw new Error("Soul NFT Token ID not configured");
      }

      console.log("🔗 Step 0: Ensuring token association...");
      toast({
        title: "Checking Token Association",
        description: "Verifying your wallet is ready to receive Soul NFT...",
        duration: 3000,
      });

      try {
        // This will check association and request user approval if needed
        // User will see 1 or 2 popups depending on association status:
        // - If NOT associated: Popup #1 for TokenAssociateTransaction
        // - Then: Popup #2 for mint/transfer (below)
        await ensureSoulAssociated(accountId, sendTransaction, soulTokenId, network);
        console.log("✅ Token association verified");
      } catch (associationError: any) {
        console.error("❌ Association failed:", associationError);
        throw new Error(associationError.message || "Failed to associate Soul NFT token");
      }

      toast({
        title: "Preparing Transaction",
        description: "Preparing mint transaction for your approval...",
        duration: 3000,
      });

      // 1) Prepare mint transaction on server
      const prepareResponse = await fetch("/api/prepare-mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientAccountId: accountId,
          soulData: {
            name: formData.name,
            description:
              formData.tagline ||
              formData.creationStory ||
              `A ${formData.rarity || "Common"} soul named ${formData.name}`,
            tagline: formData.tagline,
            personality: formData.personality,
            skills: formData.skills,
            creationStory: formData.creationStory,
            domain: selectedDomain,
            tone: personalityTone,
            level: 1,
            xp: 0,
            rarity: formData.rarity || "Common",
            imageUrl: undefined,
          },
        }),
      });

      const prepareResult = await prepareResponse.json();

      if (!prepareResponse.ok || !prepareResult.success) {
        throw new Error(prepareResult.error || "Failed to prepare transaction");
      }

      console.log("✅ Transaction prepared, requesting user approval...");

      // 2) Deserialize transaction & send via wallet context
      const { Transaction } = await import("@hashgraph/sdk");
      const txBytes = Buffer.from(prepareResult.transactionBytes, "base64");
      const transaction = Transaction.fromBytes(txBytes);

      toast({
        title: "Approve Transaction",
        description: "Please approve the minting transaction in your HashPack wallet.",
        duration: 10000,
      });

      console.log("✍️ Waiting for user approval in HashPack...");

      // Use WalletContext's sendTransaction abstraction (handles HashConnect inside)
      const { transactionId } = await sendTransaction(transaction);

      console.log("✅ Transaction sent. ID:", transactionId);

      // 3) Get serial number from backend (mirror node / operator)
      toast({
        title: "Finalizing Mint",
        description: "Fetching NFT serial number from Hedera...",
        duration: 5000,
      });

      let serialNumber = 0;

      try {
        const serialResponse = await fetch("/api/get-mint-serial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokenId: prepareResult.tokenId,
            transactionId,
          }),
        });

        if (serialResponse.ok) {
          const serialData = await serialResponse.json();
          if (serialData.success && serialData.serialNumber) {
            serialNumber = serialData.serialNumber;
            console.log("✅ Got serial number from API:", serialNumber);
          } else {
            console.warn("⚠️ API did not return serial number");
          }
        } else {
          console.warn("⚠️ Serial API failed:", serialResponse.status);
        }
      } catch (e) {
        console.warn("⚠️ Error calling serial API:", (e as any)?.message);
      }

      if (!serialNumber) {
        throw new Error(
          "Failed to determine NFT serial number. Please check on HashScan."
        );
      }

      // 4) Transfer NFT from operator to user
      toast({
        title: "Transferring NFT",
        description: "Transferring your soul NFT to your wallet...",
        duration: 5000,
      });

      let ownerAccountId: string = accountId;
      let transferSucceeded = false;

      try {
        const transferResponse = await fetch("/api/transfer-nft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokenId: prepareResult.tokenId,
            serialNumber,
            fromAccountId: undefined, // server uses operator
            toAccountId: accountId,
          }),
        });

        const transferResult = await transferResponse.json();

        if (!transferResponse.ok || !transferResult.success) {
          console.error("❌ Transfer failed:", transferResult);
          ownerAccountId = "OPERATOR";
          transferSucceeded = false;

          toast({
            title: "⚠️ Transfer Failed",
            description:
              "NFT minted but transfer failed. NFT is in operator account. You can still view it.",
            variant: "destructive",
          });
        } else {
          console.log("✅ NFT transferred to user wallet:", transferResult);
          transferSucceeded = true;
        }
      } catch (e) {
        console.warn("⚠️ Transfer NFT error:", (e as any)?.message);
        ownerAccountId = "OPERATOR";
      }

      // 5) Save soul to database
      console.log("💾 Saving soul to database. Owner:", ownerAccountId);

      let soulId: string | null = null;

      try {
        const dbResponse = await fetch("/api/mint-nft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientAccountId: ownerAccountId,
            tokenId: `${prepareResult.tokenId}:${serialNumber}`,
            transactionId,
            soulData: {
              name: formData.name,
              description:
                formData.tagline ||
                formData.creationStory ||
                `A ${formData.rarity || "Common"} soul named ${formData.name}`,
              tagline: formData.tagline,
              personality: formData.personality,
              skills: formData.skills,
              creationStory: formData.creationStory,
              domain: selectedDomain,
              tone: personalityTone,
              level: 1,
              xp: 0,
              rarity: formData.rarity || "Common",
              imageUrl: undefined,
            },
          }),
        });

        if (dbResponse.ok) {
          const dbResult = await dbResponse.json();
          console.log("✅ Soul saved to database");
          if (dbResult.data?.soulId) {
            soulId = dbResult.data.soulId as string;
          }
        } else {
          console.warn("⚠️ Failed to save soul to DB:", dbResponse.status);
        }
      } catch (e) {
        console.warn("⚠️ DB save error:", (e as any)?.message);
      }

      const mintedTokenId = prepareResult.tokenId;

      toast({
        title: "Soul NFT Minted Successfully! 🎉",
        description: (
          <div className="space-y-1">
            <p>Token ID: {mintedTokenId}</p>
            <p>Serial: #{serialNumber}</p>
            <a
              href={`https://hashscan.io/testnet/token/${mintedTokenId}/${serialNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline text-sm"
            >
              View on HashScan →
            </a>
          </div>
        ),
        duration: 10000,
      });

      setTimeout(() => {
        if (soulId) {
          router.push(`/agents/${soulId}`);
        } else {
          router.push("/profile");
        }
      }, 3000);
    } catch (error: any) {
      console.error("❌ Minting error:", error);
      toast({
        title: "Minting Failed",
        description:
          error?.message || "Failed to mint soul NFT. Please try again.",
        variant: "destructive",
      });
      setStep("preview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Create Your <span className="text-gradient">Digital Soul</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Design a unique AI personality and mint it on Hedera blockchain
            </p>
          </motion.div>

          {/* Wallet Notice */}
          <WalletNotice />

          {/* Inspiration Step - AI Generation */}
          {step === "inspiration" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="glass-panel border-2 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-6 w-6 text-purple-400" />
                    AI Soul Generator
                  </CardTitle>
                  <CardDescription>
                    Describe your soul idea and let AI create a complete personality
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Inspiration Prompt */}
                  <div className="space-y-2">
                    <Label htmlFor="inspiration">Soul Inspiration *</Label>
                    <Textarea
                      id="inspiration"
                      placeholder="e.g., 'AI penyair melankolis dari kota masa depan yang suka menulis tentang hujan dan lampu kota' or 'Wise AI mentor who has guided thousands through life's challenges'"
                      rows={4}
                      value={inspirationPrompt}
                      onChange={(e) => setInspirationPrompt(e.target.value)}
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      Describe your soul's concept, personality, or theme. Be creative!
                    </p>
                  </div>

                  {/* Domain & Personality Tone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="domain">Soul Domain</Label>
                      <Select
                        value={selectedDomain}
                        onValueChange={setSelectedDomain}
                      >
                        <SelectTrigger id="domain">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="Writer">Writer / Poet</SelectItem>
                          <SelectItem value="Mentor">Mentor / Coach</SelectItem>
                          <SelectItem value="Hacker">
                            Hacker / Developer
                          </SelectItem>
                          <SelectItem value="Philosopher">
                            Philosopher / Thinker
                          </SelectItem>
                          <SelectItem value="Artist">Artist / Creator</SelectItem>
                          <SelectItem value="Scientist">
                            Scientist / Researcher
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tone">Personality Tone</Label>
                      <Select
                        value={personalityTone}
                        onValueChange={setPersonalityTone}
                      >
                        <SelectTrigger id="tone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly">
                            Friendly &amp; Warm
                          </SelectItem>
                          <SelectItem value="professional">
                            Professional &amp; Formal
                          </SelectItem>
                          <SelectItem value="playful">
                            Playful &amp; Humorous
                          </SelectItem>
                          <SelectItem value="wise">
                            Wise &amp; Thoughtful
                          </SelectItem>
                          <SelectItem value="mysterious">
                            Mysterious &amp; Enigmatic
                          </SelectItem>
                          <SelectItem value="energetic">
                            Energetic &amp; Enthusiastic
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-semibold text-purple-300">
                      ✨ AI will generate:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                      <li>• Unique name and tagline</li>
                      <li>• Rich personality description</li>
                      <li>• 4-6 specific, actionable skills</li>
                      <li>• Compelling creation story</li>
                      <li>• Consistent speaking style</li>
                    </ul>
                    <div className="mt-3 pt-3 border-t border-purple-500/30">
                      <p className="text-xs text-purple-200">
                        💡 <strong>Languages unlock as your soul levels up:</strong>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Level 1-5: English • Level 6+: +2 languages • Level 11+: +2
                        more • Level 16+: All 8 languages
                      </p>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button
                    size="lg"
                    variant="cosmic"
                    onClick={handleGenerateBlueprint}
                    disabled={generating || !inspirationPrompt.trim()}
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating Soul Blueprint...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-5 w-5" />
                        Generate Soul with AI
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Example Prompts */}
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="text-sm">Example Prompts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      "AI penyair melankolis dari kota masa depan",
                      "Wise AI mentor with decades of wisdom",
                      "Cyberpunk hacker from digital underground",
                      "Ancient philosopher seeking truth",
                      "Creative artist who sees beauty in chaos",
                      "Curious scientist exploring quantum reality",
                    ].map((example) => (
                      <button
                        key={example}
                        onClick={() => setInspirationPrompt(example)}
                        className="text-left text-xs p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors border border-purple-500/20"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <Card className="glass-panel border-2 border-purple-500/50">
                <CardHeader>
                  <CardTitle className="text-center text-2xl">
                    Soul Preview
                  </CardTitle>
                  <CardDescription className="text-center">
                    Review your soul before minting on Hedera
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Avatar Preview */}
                    <div className="relative h-48 rounded-lg overflow-hidden">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${getAvatarGradient(
                          formData.name
                        )}`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-7xl font-bold text-white/90">
                          {getInitials(formData.name)}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4">
                        <BadgeRarity rarity={formData.rarity as Rarity} />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold">{formData.name}</h3>
                        <p className="text-muted-foreground">
                          {formData.tagline}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Personality</h4>
                        <p className="text-sm text-muted-foreground">
                          {formData.personality}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {formData.skills.map((skill) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {formData.creationStory && (
                        <div>
                          <h4 className="font-semibold mb-2">Creation Story</h4>
                          <p className="text-sm text-muted-foreground">
                            {formData.creationStory}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("inspiration")}
                  className="flex-1"
                >
                  Back to Edit
                </Button>
                {!isConnected ? (
                  <Button
                    variant="cosmic"
                    size="lg"
                    onClick={connect}
                    className="flex-1"
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    Connect Wallet to Mint
                  </Button>
                ) : (
                  <Button
                    variant="cosmic"
                    size="lg"
                    onClick={handleMint}
                    disabled={loading || !isConnected}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Minting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Mint Soul on Hedera
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* Minting Step */}
          {step === "minting" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <Card className="glass-panel border-2 border-purple-500/50">
                <CardContent className="py-12">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center"
                  >
                    <Sparkles className="w-12 h-12 text-white" />
                  </motion.div>

                  <h2 className="text-3xl font-bold mb-4">
                    Minting Your Soul...
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Creating your digital soul on Hedera blockchain
                  </p>

                  <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
                    <p>✓ Generating unique token ID</p>
                    <p>✓ Recording metadata on-chain</p>
                    <p>✓ Securing with Hedera consensus</p>
                    <p className="animate-pulse text-purple-400">
                      ⏳ Finalizing transaction...
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
