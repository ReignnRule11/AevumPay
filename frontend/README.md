# Web application

The Next.js client is a wallet-connected testnet interface for the AevumPay invoice contract.

## Local setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Set `NEXT_PUBLIC_AEVUMPAY_ADDRESS` to the deployed AevumPay contract address in `.env.local`. The public tUSD8 address defaults to the address currently listed in the QDay Aevum documentation. Do not put private keys or secrets in any `NEXT_PUBLIC_*` variable.

```bash
npm run typecheck
npm run build
npm run dev
```

## Implemented interaction path

- Connects to an injected EVM wallet.
- Requests QDay Aevum testnet (chain ID 44005) when needed.
- Reads the connected wallet's tUSD8 balance.
- Merchant creates an on-chain invoice with amount, optional designated payer and expiry.
- Payer fetches invoice state from the contract.
- Payer approves the exact invoice amount, then calls the payment contract.
- The interface displays transaction hashes and explorer links.

## Boundaries

- Browser wallet only; no custodial keys.
- The app must be configured with the deployed AevumPay contract address before invoice actions are enabled.
- The frontend does not prove transaction finality beyond a successful RPC receipt; a production indexer should implement the chain's documented finality policy.
- The app is testnet-only and has not been security audited.
