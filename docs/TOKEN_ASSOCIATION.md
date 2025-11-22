# Token Association Flow Documentation

## Overview

DreamMarket implements a seamless token association flow for Soul NFTs. Users need to associate the Soul NFT token with their Hedera account before they can receive NFTs.

## User Experience

### Scenario 1: User Already Associated
- User clicks **"Mint Soul"** button
- **1 popup approval** appears (for mint/transfer transaction)
- Soul NFT is minted and transferred to user
- Total approvals: **1**

### Scenario 2: User Not Yet Associated
- User clicks **"Mint Soul"** button
- **Popup #1**: TokenAssociateTransaction approval
  - User approves to associate Soul NFT token with their account
  - Small HBAR fee (~$0.05)
- **Popup #2**: Mint/Transfer transaction approval
  - User approves the actual NFT minting and transfer
- Soul NFT is minted and transferred to user
- Total approvals: **2**

## Technical Implementation

### 1. Association Check (`lib/hederaAssociation.ts`)

```typescript
// Check if account is associated with token via Mirror Node
const isAssociated = await isTokenAssociated(
  accountId,      // "0.0.123456"
  tokenId,        // "0.0.7242548"
  network         // "testnet" | "mainnet"
);
```

**How it works:**
- Queries Hedera Mirror Node API
- Endpoint: `/api/v1/tokens/{tokenId}/balances?account.id={accountId}`
- Returns `true` if account appears in balances array
- Returns `false` if not found or API error

### 2. Ensure Association (`lib/ensureSoulAssociation.ts`)

```typescript
// Ensure user is associated before minting
await ensureSoulAssociated(
  accountId,        // User's Hedera account
  sendTransaction,  // Function from WalletContext
  soulTokenId,      // Soul NFT token ID
  network           // "testnet" | "mainnet"
);
```

**Flow:**
1. Check association via Mirror Node
2. If already associated → return immediately (no action)
3. If not associated:
   - Create `TokenAssociateTransaction`
   - Send to user's wallet for approval
   - Wait for transaction to complete
   - Verify association succeeded

### 3. Integration in Create Page (`app/create/page.tsx`)

```typescript
const handleMint = async () => {
  // ... wallet connection check ...

  // STEP 0: Ensure token association
  await ensureSoulAssociated(
    accountId,
    sendTransaction,
    soulTokenId,
    network
  );

  // STEP 1: Mint NFT (user already associated)
  // ... rest of minting flow ...
};
```

## Error Handling

### User Rejects Association
```
Error: "You rejected the token association. Please approve to continue."
```
**Solution:** User needs to click "Mint Soul" again and approve the association.

### Insufficient HBAR
```
Error: "Insufficient HBAR for transaction fee. Please add HBAR to your account."
```
**Solution:** User needs to add HBAR to their account (minimum ~0.1 HBAR recommended).

### Association Verification Failed
```
Warning: "Association verification failed. Mirror Node may not have updated yet."
```
**Impact:** Non-critical. The system proceeds anyway. If association truly failed, the mint/transfer will fail with a clear error.

## Backend Considerations

### `/api/prepare-mint` Endpoint
- **Assumes:** User account is already associated (frontend handled it)
- **Does NOT:** Perform association on backend
- **If transfer fails:** Returns clear error about token not being associated

### Error Response Example
```json
{
  "success": false,
  "error": "TOKEN_NOT_ASSOCIATED_TO_ACCOUNT",
  "message": "User account is not associated with Soul NFT token. Please try minting again."
}
```

## Testing Checklist

### First-Time User (No Association)
- [ ] Click "Mint Soul" button
- [ ] See "Checking Token Association" toast
- [ ] Popup #1 appears for TokenAssociateTransaction
- [ ] Approve in HashPack
- [ ] See "Preparing Transaction" toast
- [ ] Popup #2 appears for mint/transfer
- [ ] Approve in HashPack
- [ ] Soul NFT successfully minted and transferred

### Returning User (Already Associated)
- [ ] Click "Mint Soul" button
- [ ] See "Checking Token Association" toast (brief)
- [ ] NO association popup (skipped)
- [ ] Popup appears for mint/transfer
- [ ] Approve in HashPack
- [ ] Soul NFT successfully minted and transferred

### Error Cases
- [ ] Reject association → See clear error message
- [ ] Reject mint/transfer → See clear error message
- [ ] Insufficient HBAR → See clear error message
- [ ] Network error → See clear error message

## Configuration

### Environment Variables Required

```env
# Frontend (public)
NEXT_PUBLIC_SOUL_NFT_TOKEN_ID=0.0.7242548
NEXT_PUBLIC_HEDERA_NETWORK=testnet

# Backend (private)
HEDERA_OPERATOR_ID=0.0.YOUR_OPERATOR
HEDERA_OPERATOR_KEY=YOUR_PRIVATE_KEY
SOUL_NFT_TOKEN_ID=0.0.7242548
```

## Logging

The association flow includes comprehensive logging:

```
🔗 ENSURE SOUL ASSOCIATION
============================================================
Account: 0.0.123456
Token: 0.0.7242548
Network: testnet

📡 Step 1: Checking association via Mirror Node...
🔍 [Association Check] Checking if 0.0.123456 is associated with token 0.0.7242548
   Mirror Node URL: https://testnet.mirrornode.hedera.com/api/v1/tokens/0.0.7242548/balances?account.id=0.0.123456
❌ [Association Check] Account 0.0.123456 is NOT associated with token 0.0.7242548

⚠️  Not associated yet. Creating TokenAssociateTransaction...
📝 TokenAssociateTransaction created
   Account: 0.0.123456
   Token: 0.0.7242548

🔐 Step 2: Requesting user approval via wallet...
   User will see popup to approve TokenAssociateTransaction
✅ Association transaction approved!
   Transaction ID: 0.0.123456@1234567890.123456789

⏳ Waiting 2 seconds for Mirror Node to update...

🔍 Step 3: Verifying association...
✅ [Association Check] Account 0.0.123456 IS associated with token 0.0.7242548
✅ Association verified successfully!
============================================================
```

## Future Enhancements

### Potential Improvements
1. **Batch Association**: Associate multiple tokens at once
2. **Auto-Association Detection**: Check `max_automatic_token_associations` slot
3. **Association Cache**: Cache association status in localStorage
4. **Retry Logic**: Auto-retry failed associations
5. **Gas Estimation**: Show estimated HBAR cost before association

### Not Implemented (By Design)
- ❌ Auto-association magic (requires special account setup)
- ❌ Backend-side association (requires user private key)
- ❌ Separate "Associate" button (UX decision - keep it simple)

## Troubleshooting

### "Association failed" but Mirror Node shows associated
**Cause:** Mirror Node delay (2-5 seconds)
**Solution:** Wait a few seconds and try minting again

### Association succeeds but mint/transfer fails
**Cause:** Race condition or backend issue
**Solution:** Check backend logs, verify token ID matches

### Multiple association popups for same token
**Cause:** Mirror Node cache issue
**Solution:** Clear browser cache, refresh page

## Support

For issues or questions:
1. Check browser console logs
2. Check Hedera Mirror Node status
3. Verify token ID in `.env` matches deployed token
4. Check HashScan for transaction details
