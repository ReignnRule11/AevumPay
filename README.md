# AevumPay — Aevum Builder Challenge #1

[![Solidity CI](https://github.com/ReignnRule11/AevumPay/actions/workflows/solidity.yml/badge.svg)](https://github.com/ReignnRule11/AevumPay/actions/workflows/solidity.yml)
[![Web CI](https://github.com/ReignnRule11/AevumPay/actions/workflows/web.yml/badge.svg)](https://github.com/ReignnRule11/AevumPay/actions/workflows/web.yml)
[![Testnet deployment](https://github.com/ReignnRule11/AevumPay/actions/workflows/deploy-aevum.yml/badge.svg)](https://github.com/ReignnRule11/AevumPay/actions/workflows/deploy-aevum.yml)

A solo-built, invoice-based tUSD8 settlement application for QDay Aevum Testnet.

## Current status

- Smart contract deployed to QDay Aevum Testnet (chain ID `44005`).
- Contract: `0x961d85935D6b858aeAe802832aEC6c1cb6b3E9b4`.
- Deployment transaction: `0x88117310544c743377a3d84e3a63f3a37d97295455a72c9d0f4c285560ee6fa`.
- Foundry suite: 14 tests passed in GitHub Actions.
- Frontend TypeScript check and Next.js production build passed in GitHub Actions.
- A Vercel production deployment has been initiated; check the deployment link/status before treating the hosted UI as live.
- Explorer source verification and live end-to-end invoice settlement remain to be completed.

This is a testnet demonstration, not an audited or production payment system. Test assets have no real-world value.

## Network configuration

- Network: QDay Aevum Testnet
- Chain ID: `44005` (`0xABE5`)
- RPC: `https://rpc-test.qday.info`
- Explorer: `https://explorer-test.qday.info`
- Native gas token: tQDAY
- tUSD8: `0x456569838f1d43009A91ebA4263147Afd7233483`
- tUSD8 decimals: 6

Verify current network and token parameters against QDay's official documentation before use.

## Product scope

A merchant creates an invoice with an exact tUSD8 amount, optional designated payer, expiry and external reference. A payer reviews the invoice, approves the exact token amount and calls `pay(invoiceId)`. The contract transfers tokens directly to the merchant, records settlement and emits an indexed receipt event.

The MVP excludes pooled custody, protocol fees, arbitrary token selection, autonomous spending and AI-controlled signing.

## Contract invariants

- Only the configured ERC-20 token is accepted.
- Invoice amounts are non-zero and stored in token base units.
- An invoice can be settled once.
- Optional designated payer is enforced on-chain.
- Expired invoices cannot be paid.
- A merchant can cancel only its own unpaid invoice.
- Fee-on-transfer behavior is rejected using the merchant balance delta.
- Payment events include invoice ID, payer, merchant, amount and external reference.
- No owner/admin withdrawal function exists.

## Repository layout

```text
contracts/          Solidity settlement contract
test/               Foundry tests with a local mock token
script/             Deployment script
frontend/           Next.js + viem wallet-connected merchant/payer interface
docs/               Architecture, threat model, deployment and demo checklist
.github/workflows/  Solidity CI, web CI and gated testnet deployment
```

## Frontend

The hosted frontend is served from the Vercel project linked to this repository. The production build is configured with the deployed contract address through the public environment variable `NEXT_PUBLIC_AEVUMPAY_ADDRESS`.

For local development:

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_AEVUMPAY_ADDRESS to the deployed contract address.
npm run typecheck
npm run build
npm run dev
```

The UI connects to an injected EVM wallet, switches to QDay Aevum Testnet, creates and fetches invoices, requests exact tUSD8 approval and submits payment transactions. See [frontend/README.md](frontend/README.md).

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). The manually gated GitHub Actions workflow deploys to the testnet using a dedicated test-only wallet private key stored as the repository secret `AEVUM_DEPLOYER_PRIVATE_KEY`.

Never commit or share private keys or seed phrases. The frontend uses the visitor's injected wallet and does not handle private keys.

## Test and build

Contract tests:

```bash
forge test -vv
```

Frontend checks:

```bash
cd frontend
npm run typecheck
npm run build
```

## Security and limitations

- This contract is an invoice settlement primitive, not a complete payment processor.
- Refunds require a separately designed merchant-authorized workflow and are out of scope.
- The test suite uses a local mock token; it does not prove behavior against the live tUSD8 contract.
- The project has not been independently audited and is not suitable for real funds.
- Do not claim production readiness, quantum resistance, audited security or real-money support.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) and [docs/DEMO_CHECKLIST.md](docs/DEMO_CHECKLIST.md).
