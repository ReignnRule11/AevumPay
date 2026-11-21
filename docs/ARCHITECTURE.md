# Architecture and trust boundaries

## MVP topology

Merchant browser creates an invoice on AevumPay. Payer browser reviews it, approves the exact tUSD8 amount, and calls the contract. The contract transfers tUSD8 directly to the merchant. Frontend/indexer reads invoice events and produces an explorer-verifiable receipt.

## Trust boundaries

- Wallet signs all merchant and payer transactions.
- Contract enforces invoice state, expiry, designated payer and exact amount.
- Token address is pinned in deployment configuration and the contract constructor.
- Frontend rejects the wrong chain ID and never treats a pending transaction as settled.
- Backend/indexer is a convenience layer, not the source of truth.

## Payment states

Draft (frontend only) → Open (on-chain) → Paid (on-chain), or Cancelled (on-chain). Expired is derived by the UI; the contract rejects payment after expiry.

## Receipt fields

Chain ID, token and payment contract addresses, invoice ID, external reference, payer and merchant addresses, exact amount, transaction hash, log index, block number and finality state.

## Security controls

- Exact allowance only; never request unlimited approval.
- User reviews amount, recipient, chain and expiry before signing.
- No private keys stored in app or backend.
- No AI agent signs or submits payments autonomously.
- Indexer idempotency key: transactionHash:logIndex.
- Distinguish payment seen from payment final using documented network finality.
