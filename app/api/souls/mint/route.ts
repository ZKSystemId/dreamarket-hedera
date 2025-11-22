// API Route: POST /api/souls/mint
// Mint Soul NFT on Hedera via backend (custodial approach)

import { NextRequest, NextResponse } from 'next/server';
import {
  Client,
  TokenMintTransaction,
  TokenId,
  PrivateKey,
  AccountId,
} from "@hashgraph/sdk";

export async function POST(request: NextRequest) {
  console.log('\n🚀 ===== MINT API CALLED =====');
  
  try {
    const body = await request.json();
    const { name, tagline, rarity, personality, skills, creationStory } = body;

    console.log('📝 Request body:', { name, tagline, rarity, skillsCount: skills?.length });

    // Validate input
    if (!name || !tagline || !rarity) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: name, tagline, or rarity' },
        { status: 400 }
      );
    }

    // Get Hedera credentials from environment
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;
    const tokenId = process.env.SOUL_NFT_TOKEN_ID;

    console.log('🔑 Checking Hedera credentials...');
    console.log('   Operator ID:', operatorId ? '✅ Set' : '❌ Missing');
    console.log('   Operator Key:', operatorKey ? '✅ Set' : '❌ Missing');
    console.log('   Token ID:', tokenId ? `✅ ${tokenId}` : '❌ Missing');

    if (!operatorId || !operatorKey || !tokenId) {
      console.error('❌ Hedera credentials not configured');
      return NextResponse.json(
        { 
          error: 'Hedera credentials not configured',
          missing: {
            operatorId: !operatorId,
            operatorKey: !operatorKey,
            tokenId: !tokenId
          }
        },
        { status: 500 }
      );
    }

    // Setup Hedera client
    console.log('🔧 Setting up Hedera client...');
    const client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(operatorId),
      PrivateKey.fromString(operatorKey)
    );
    console.log('✅ Hedera client ready');

    // Create ULTRA COMPACT metadata for NFT
    // Hedera NFT metadata: STRICT 100 bytes limit
    // Strategy: Minimal but readable
    
    console.log('📦 Creating ultra-compact metadata...');
    
    // Use short keys to save space
    const metadata = {
      n: name.substring(0, 25),      // name (max 25 chars)
      r: rarity.substring(0, 1),     // rarity (C/R/L/M)
      t: "Soul"                       // type
    };

    const metadataString = JSON.stringify(metadata);
    const metadataBuffer = Buffer.from(metadataString);
    
    console.log('📏 Metadata size:', metadataBuffer.length, 'bytes');
    console.log('📄 Metadata:', metadataString);
    
    // Safety check - MUST be under 100 bytes
    if (metadataBuffer.length >= 100) {
      console.error('❌ Metadata still too large!');
      throw new Error(`Metadata too large: ${metadataBuffer.length} bytes (max 100)`);
    }
    
    console.log('✅ Metadata size OK:', metadataBuffer.length, 'bytes');
    
    console.log('🔨 Creating mint transaction...');
    const mintTx = new TokenMintTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .setMetadata([metadataBuffer])
      .setMaxTransactionFee(10);

    console.log('📤 Executing transaction on Hedera...');
    const mintResponse = await mintTx.execute(client);
    
    console.log('⏳ Waiting for receipt...');
    const mintReceipt = await mintResponse.getReceipt(client);
    const serial = mintReceipt.serials[0].toNumber();

    console.log('✅ Soul NFT minted successfully!');
    console.log('   Serial:', serial);
    console.log('   Token:', tokenId);
    console.log('   TX:', mintResponse.transactionId.toString());

    client.close();

    // Return success response with full metadata
    return NextResponse.json({
      success: true,
      tokenId: tokenId,
      serial: serial,
      txHash: mintResponse.transactionId.toString(),
      nftId: `${tokenId}/${serial}`,
      hashscanUrl: `https://hashscan.io/testnet/token/${tokenId}/${serial}`,
      metadata: {
        name,
        tagline,
        rarity,
        personality,
        skills,
        creationStory,
        mintedAt: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('❌ Error minting soul:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // More detailed error info
    let errorDetails = 'Unknown error';
    if (error.message) {
      errorDetails = error.message;
    }
    if (error.status) {
      errorDetails += ` (Status: ${error.status})`;
    }
    
    return NextResponse.json(
      {
        error: 'Failed to mint soul NFT',
        details: errorDetails,
        type: error.constructor.name,
        hint: 'Check console logs for more details'
      },
      { status: 500 }
    );
  }
}
