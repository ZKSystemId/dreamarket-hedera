"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Copy } from "lucide-react";

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateCollection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/create-collection', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create collection");
      }

      setResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <MainLayout>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>🔧 NFT Collection Setup</CardTitle>
              <CardDescription>
                Create the DreamMarket Souls NFT collection on Hedera Testnet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instructions */}
              <Alert>
                <AlertTitle>Before you start:</AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                  <p>Make sure you have configured in <code>.env</code>:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><code>HEDERA_OPERATOR_ID</code> - Your Hedera account ID</li>
                    <li><code>HEDERA_OPERATOR_KEY</code> - Your private key</li>
                    <li>Account must have at least 30 HBAR</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Create Button */}
              <Button
                onClick={handleCreateCollection}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Collection...
                  </>
                ) : (
                  "Create NFT Collection"
                )}
              </Button>

              {/* Success Result */}
              {result && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <AlertTitle className="text-green-500">Success!</AlertTitle>
                  <AlertDescription className="space-y-4 mt-4">
                    <div>
                      <p className="font-semibold mb-2">Token ID:</p>
                      <div className="flex items-center gap-2">
                        <code className="bg-black/30 px-3 py-2 rounded flex-1">
                          {result.tokenId}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(result.tokenId)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold mb-2">Next Steps:</p>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>
                          Add this to your <code>.env</code> file:
                          <div className="mt-2 flex items-center gap-2">
                            <code className="bg-black/30 px-3 py-2 rounded flex-1 text-xs">
                              HEDERA_NFT_TOKEN_ID={result.tokenId}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(`HEDERA_NFT_TOKEN_ID=${result.tokenId}`)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                        <li>Restart your dev server</li>
                        <li>Start minting Soul NFTs!</li>
                      </ol>
                    </div>

                    <div>
                      <a
                        href={result.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:underline text-sm"
                      >
                        View on HashScan →
                      </a>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Error */}
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-5 w-5" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription className="space-y-2 mt-2">
                    <p>{error}</p>
                    <p className="text-sm">
                      Please check:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>HEDERA_OPERATOR_ID is set in .env</li>
                      <li>HEDERA_OPERATOR_KEY is set in .env</li>
                      <li>Account has enough HBAR (~30 HBAR)</li>
                      <li>Network is Testnet</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
