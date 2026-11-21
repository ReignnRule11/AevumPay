# Aevum Testnet deployment

Deployment is deliberately manual. Do not deploy to mainnet or use a wallet holding real assets.

## Before deployment

1. Create a dedicated test-only EVM wallet. Never use your primary wallet or a wallet with real funds.
2. Add the wallet's private key as a GitHub Actions repository secret named `AEVUM_DEPLOYER_PRIVATE_KEY`:
   - Repository → Settings → Secrets and variables → Actions → New repository secret.
   - Never paste the key into an issue, commit, chat, workflow input or log.
3. Fund the test wallet with tQDAY for gas using the official QDay faucet.
4. Obtain tUSD8 from the official QDay Aevum faucet.
5. Independently verify chain ID, RPC and tUSD8 address against the current QDay Wiki.

## Run the gated deployment

1. Open the repository's Actions tab.
2. Select **Deploy AevumPay to QDay Aevum Testnet**.
3. Select **Run workflow** on the `main` branch.
4. Enter exactly `DEPLOY_TO_TESTNET` in the confirmation field.
5. Inspect the run. The workflow builds the contracts, broadcasts the deployment, and uploads the Foundry broadcast record as an artifact.

The deploy workflow will fail if the repository secret is missing. It does not deploy automatically on push.

## After deployment

1. Download the artifact named `aevumpay-aevum-testnet-deployment`.
2. Inspect `transactions` and identify the AevumPay contract creation transaction and deployed address. Verify the transaction and contract address on the official explorer.
3. Add the deployed address to the Vercel project environment variable `NEXT_PUBLIC_AEVUMPAY_ADDRESS` (or local `.env.local`).
4. Set `NEXT_PUBLIC_TUSD8_ADDRESS` to the official tUSD8 address only if overriding the documented default.
5. Redeploy the frontend, then run the full merchant → payer → receipt flow using test wallets.

## Safety notes

- The GitHub Actions secret is exposed only to the manually invoked deployment job; it is not a substitute for a hardware wallet or a production key-management system.
- Use a fresh test-only wallet with no real assets and rotate/delete the secret after the challenge if desired.
- The contract has not been audited. Testnet tokens have no real value.
- Do not represent a transaction receipt as final settlement until the network's finality policy has been checked.
