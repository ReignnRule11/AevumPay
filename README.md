# AevumPay — Aevum Builder Challenge #1

A solo-built invoice-based tUSD8 settlement application for QDay Aevum Testnet.

> **Status: initial engineering scaffold.** The contract and tests are source files only; they have not yet been compiled, executed, deployed, or independently audited. No real funds.

## Competition configuration (verify before deployment)

- Network: QDay Aevum Testnet
- Chain ID: `44005`
- RPC: `https://rpc-test.qday.info`
- Explorer: `https://explorer-test.qday.info`
- tUSD8 address currently recorded in the starter configuration: `0x456569838f1d43009A91ebA4263147Afd7233483`
- Token decimals: 6 (confirm against the official token contract)
- Native gas token: tQDAY

Check the current official QDay documentation and explorer before relying on any network or token parameter. Test tokens have no real-world value.

## Product scope

A merchant creates an invoice with an exact tUSD8 amount, optional designated payer, expiry and external reference. A payer approves the payment contract to spend the exact amount and calls `pay(invoiceId)`. The contract transfers the exact amount directly to the merchant, records the payment and emits an indexed receipt event.

The MVP deliberately excludes pooled custody, protocol fees, arbitrary token selection, autonomous spending and AI-controlled signing.

## Contract invariants

- Only the configured ERC-20 token is accepted.
- Invoice amount is non-zero and stored in token base units.
- An invoice can be settled once.
- Optional designated payer is enforced on-chain.
- Expired invoices cannot be paid.
- Merchant can cancel only its own unpaid invoice.
- Fee-on-transfer behavior is rejected using the merchant balance delta.
- Payment event includes invoice ID, payer, merchant, amount and external reference.
- No owner/admin withdrawal function exists.

## Repository layout

```text
contracts/       Solidity settlement contract
test/            Foundry tests with a local mock token
script/          Deployment script
frontend/        Next.js + viem wallet-connected merchant/payer interface
docs/            Architecture, threat model, deployment and demo checklist
.github/workflows/  Solidity CI, web CI and gated testnet deployment
```

## Frontend

See [frontend/README.md](frontend/README.md). In short:

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_AEVUMPAY_ADDRESS after contract deployment
npm run typecheck
npm run build
npm run dev
```

The UI connects to an injected EVM wallet, creates and fetches invoices, requests exact tUSD8 approval and submits payment transactions. Invoice actions remain disabled until the deployed contract address is configured.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). A manually gated GitHub Actions workflow is provided; it requires a dedicated test-only wallet private key stored as the repository secret `AEVUM_DEPLOYER_PRIVATE_KEY`. Never commit or share private keys.


## Prerequisites

- Foundry (`forge`, `cast`, `anvil`)
- Git
- A dedicated test wallet with testnet tQDAY and tUSD8

## Install dependencies and test

```bash
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
forge test -vv
```

Dependency versions/remappings still need to be pinned and validated as part of the build hardening work.

## Configure Aevum

Copy `.env.example` to `.env` and fill in a dedicated test wallet private key locally:

```bash
AEVUM_RPC_URL=https://rpc-test.qday.info
PRIVATE_KEY= # test wallet only; never share or commit
TUSD8_ADDRESS=0x456569838f1d43009A91ebA4263147Afd7233483
```

Deploy only after the tests pass and the token address has been independently verified:

```bash
source .env
forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$AEVUM_RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast
```

Never paste private keys or seed phrases into chat, issues, logs or screenshots.

## Planned frontend payment sequence

1. Connect wallet and verify `chain.id === 44005`.
2. Read the configured token and deployed payment-contract addresses from deployment configuration.
3. Merchant creates an invoice using integer base units (tUSD8 uses 6 decimals).
4. Payer reviews merchant, exact amount, invoice reference and expiry.
5. Payer approves the exact amount—not an unlimited allowance.
6. Payer calls `pay(invoiceId)`.
7. Wait for the transaction receipt; show **Payment seen** first, then **Payment final** only after the network's documented finality signal.
8. Display a verifiable receipt with chain ID, token and contract addresses, invoice ID, transaction hash, log index, block number, payer, merchant and amount.

Use integer/bigint arithmetic for token amounts. Never use JavaScript floating-point numbers for money.

## Security and limitations

- This contract is an invoice settlement primitive, not a complete payment processor.
- Refunds require a separately designed merchant-authorized workflow and are out of scope.
- The test suite uses a local mock token; it does not prove behavior against the live tUSD8 contract.
- The project is not audited and is not suitable for real funds.
- Do not claim production readiness, quantum resistance, audited security or real-money support.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) and [docs/DEMO_CHECKLIST.md](docs/DEMO_CHECKLIST.md).
