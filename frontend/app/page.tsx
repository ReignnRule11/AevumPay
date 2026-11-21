"use client";

import { useMemo, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  formatUnits,
  keccak256,
  parseEventLogs,
  parseUnits,
  stringToHex,
  http,
  type Address,
  type Hex
} from "viem";
import { aevumPayAbi, erc20Abi } from "@/lib/abi";
import { AEVUMPAY_ADDRESS, qdayAevum, TUSD8_ADDRESS } from "@/lib/chain";

type InvoiceView = {
  id: Hex;
  merchant: Address;
  designatedPayer: Address;
  amount: bigint;
  expiresAt: bigint;
  status: number;
  externalRef: Hex;
};

declare global {
  interface Window {
    ethereum?: {
      request(args: { method: string; params?: unknown[] }): Promise<unknown>;
    };
  }
}

const publicClient = createPublicClient({ chain: qdayAevum, transport: http() });
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

function shortAddress(value?: string) {
  return value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "—";
}

function displayError(error: unknown) {
  if (error && typeof error === "object" && "shortMessage" in error) {
    return String(error.shortMessage);
  }
  return error instanceof Error ? error.message : "Transaction failed. Check your wallet and try again.";
}

export default function Home() {
  const [account, setAccount] = useState<Address>();
  const [chainId, setChainId] = useState<number>();
  const [balance, setBalance] = useState("—");
  const [amount, setAmount] = useState("10");
  const [payer, setPayer] = useState("");
  const [expiryHours, setExpiryHours] = useState("24");
  const [invoiceId, setInvoiceId] = useState("");
  const [invoice, setInvoice] = useState<InvoiceView>();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("Connect a wallet to begin.");
  const [txHash, setTxHash] = useState<Hex>();

  const configured = useMemo(
    () => /^0x[a-fA-F0-9]{40}$/.test(AEVUMPAY_ADDRESS),
    []
  );

  async function getWallet() {
    if (!window.ethereum) throw new Error("No injected wallet found. Open this app in MetaMask or another EVM wallet browser.");
    return createWalletClient({ chain: qdayAevum, transport: custom(window.ethereum) });
  }

  async function connect() {
    setBusy(true);
    try {
      const wallet = await getWallet();
      const [address] = await wallet.requestAddresses();
      const id = await wallet.getChainId();
      setAccount(address);
      setChainId(id);
      if (id !== qdayAevum.id) {
        setNotice("Wallet connected. Switch to QDay Aevum Testnet to use payment actions.");
      } else {
        await refreshBalance(address);
        setNotice("Wallet connected to QDay Aevum Testnet.");
      }
    } catch (error) {
      setNotice(displayError(error));
    } finally {
      setBusy(false);
    }
  }

  async function addOrSwitchNetwork() {
    if (!window.ethereum) return setNotice("No injected wallet found.");
    setBusy(true);
    try {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xABE5" }]
        });
      } catch (error) {
        const code = error && typeof error === "object" && "code" in error ? Number(error.code) : 0;
        if (code !== 4902) throw error;
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0xABE5",
            chainName: "QDay Aevum",
            rpcUrls: ["https://rpc-test.qday.info"],
            blockExplorerUrls: ["https://explorer-test.qday.info"],
            nativeCurrency: { name: "tQDAY", symbol: "tQDAY", decimals: 18 }
          }]
        });
      }
      const wallet = await getWallet();
      const id = await wallet.getChainId();
      setChainId(id);
      if (account) await refreshBalance(account);
      setNotice(id === qdayAevum.id ? "Connected to QDay Aevum Testnet." : "Network switch is not yet confirmed.");
    } catch (error) {
      setNotice(displayError(error));
    } finally {
      setBusy(false);
    }
  }

  async function refreshBalance(address = account) {
    if (!address) return;
    const value = await publicClient.readContract({
      address: TUSD8_ADDRESS,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address]
    });
    setBalance(formatUnits(value, 6));
  }

  async function createInvoice() {
    if (!configured) return setNotice("The payment contract address is not configured yet.");
    if (!account) return setNotice("Connect your wallet first.");
    if (chainId !== qdayAevum.id) return setNotice("Switch to QDay Aevum Testnet first.");
    if (!/^(0|[1-9]\d*)(\.\d{1,6})?$/.test(amount) || Number(amount) <= 0) {
      return setNotice("Enter a positive amount with no more than 6 decimal places.");
    }
    const hours = Number(expiryHours);
    if (!Number.isInteger(hours) || hours < 1 || hours > 168) {
      return setNotice("Expiry must be between 1 and 168 hours.");
    }
    if (payer && !/^0x[a-fA-F0-9]{40}$/.test(payer)) return setNotice("Enter a valid designated payer address or leave it blank.");
    setBusy(true);
    setTxHash(undefined);
    try {
      const wallet = await getWallet();
      const value = parseUnits(amount, 6);
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + hours * 3600);
      const externalRef = keccak256(stringToHex(`AEVUMPAY-${Date.now()}`));
      const hash = await wallet.writeContract({
        address: AEVUMPAY_ADDRESS,
        abi: aevumPayAbi,
        functionName: "createInvoice",
        args: [(payer || ZERO_ADDRESS) as Address, value, expiresAt, externalRef],
        account,
        chain: qdayAevum
      });
      setTxHash(hash);
      setNotice("Invoice transaction submitted. Waiting for confirmation…");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const logs = parseEventLogs({ abi: aevumPayAbi, eventName: "InvoiceCreated", logs: receipt.logs });
      const created = logs[0];
      if (!created) throw new Error("Invoice transaction confirmed, but InvoiceCreated event was not found.");
      setInvoiceId(created.args.invoiceId);
      setNotice("Invoice created on-chain. Copy the invoice ID for the payer.");
    } catch (error) {
      setNotice(displayError(error));
    } finally {
      setBusy(false);
    }
  }

  async function loadInvoice() {
    if (!configured) return setNotice("The payment contract address is not configured yet.");
    if (!/^0x[a-fA-F0-9]{64}$/.test(invoiceId)) return setNotice("Enter a valid 32-byte invoice ID.");
    setBusy(true);
    try {
      const result = await publicClient.readContract({
        address: AEVUMPAY_ADDRESS,
        abi: aevumPayAbi,
        functionName: "getInvoice",
        args: [invoiceId as Hex]
      });
      const [merchant, designatedPayer, value, expiresAt, status, externalRef] = result;
      setInvoice({ id: invoiceId as Hex, merchant, designatedPayer, amount: value, expiresAt, status, externalRef });
      setNotice("Invoice details loaded directly from QDay Aevum.");
    } catch (error) {
      setInvoice(undefined);
      setNotice(displayError(error));
    } finally {
      setBusy(false);
    }
  }

  async function settleInvoice() {
    if (!account || !invoice) return setNotice("Connect a wallet and load an invoice first.");
    if (chainId !== qdayAevum.id) return setNotice("Switch to QDay Aevum Testnet first.");
    if (invoice.status !== 1) return setNotice("This invoice is not open.");
    if (Date.now() / 1000 >= Number(invoice.expiresAt)) return setNotice("This invoice has expired.");
    if (invoice.designatedPayer !== ZERO_ADDRESS && invoice.designatedPayer.toLowerCase() !== account.toLowerCase()) {
      return setNotice("This invoice is restricted to a different payer wallet.");
    }
    if (!configured) return setNotice("The payment contract address is not configured yet.");
    setBusy(true);
    setTxHash(undefined);
    try {
      const wallet = await getWallet();
      const approvalHash = await wallet.writeContract({
        address: TUSD8_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [AEVUMPAY_ADDRESS, invoice.amount],
        account,
        chain: qdayAevum
      });
      setTxHash(approvalHash);
      setNotice("Exact tUSD8 approval submitted. Waiting for confirmation…");
      await publicClient.waitForTransactionReceipt({ hash: approvalHash });
      const paymentHash = await wallet.writeContract({
        address: AEVUMPAY_ADDRESS,
        abi: aevumPayAbi,
        functionName: "pay",
        args: [invoice.id],
        account,
        chain: qdayAevum
      });
      setTxHash(paymentHash);
      setNotice("Payment submitted. Waiting for on-chain confirmation…");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: paymentHash });
      const updated = await publicClient.readContract({
        address: AEVUMPAY_ADDRESS,
        abi: aevumPayAbi,
        functionName: "getInvoice",
        args: [invoice.id]
      });
      const [merchant, designatedPayer, value, expiresAt, status, externalRef] = updated;
      setInvoice({ id: invoice.id, merchant, designatedPayer, amount: value, expiresAt, status, externalRef });
      await refreshBalance(account);
      setNotice(`Payment confirmed in block ${receipt.blockNumber.toString()}.`);
    } catch (error) {
      setNotice(displayError(error));
    } finally {
      setBusy(false);
    }
  }

  const statusText = invoice ? ["Unknown", "Open", "Paid", "Cancelled"][invoice.status] || "Unknown" : "";

  return (
    <main className="shell">
      <nav className="topbar">
        <a className="brand" href="#"><span className="brand-mark">A</span><span>AevumPay</span></a>
        <div className="network"><span className="pulse" /> QDay Aevum · Testnet</div>
        <button className="connect" onClick={connect} disabled={busy}>{account ? shortAddress(account) : "Connect wallet"}</button>
      </nav>

      <section className="hero">
        <div className="eyebrow">PROGRAMMABLE STABLECOIN SETTLEMENT</div>
        <h1>Invoices paid.<br /><em>Settlement verified.</em></h1>
        <p>Create a payment request or settle an invoice directly with tUSD8 on QDay Aevum.</p>
        <div className="hero-actions">
          <button className="primary" onClick={addOrSwitchNetwork} disabled={busy}>Connect to QDay Aevum <span>↗</span></button>
          <a className="text-link" href="https://explorer-test.qday.info" target="_blank" rel="noreferrer">Open explorer ↗</a>
        </div>
      </section>

      <section className="metrics">
        <div><span>NETWORK</span><strong>QDay Aevum</strong><small>Chain ID 44005</small></div>
        <div><span>SETTLEMENT ASSET</span><strong>tUSD8</strong><small>6 decimal places</small></div>
        <div><span>YOUR tUSD8 BALANCE</span><strong>{balance}</strong><small>{account ? shortAddress(account) : "Wallet not connected"}</small></div>
      </section>

      {!configured && <div className="warning">Contract not deployed yet. Set <code>NEXT_PUBLIC_AEVUMPAY_ADDRESS</code> after testnet deployment to enable invoice actions.</div>}

      <section className="work-grid">
        <article className="panel">
          <div className="panel-kicker">01 / MERCHANT</div>
          <h2>Create an invoice</h2>
          <p className="muted">Set the exact amount and define who can pay.</p>
          <label>Invoice amount <span>tUSD8</span></label>
          <div className="amount-input"><input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" /><b>tUSD8</b></div>
          <label>Designated payer <span>OPTIONAL</span></label>
          <input className="field" value={payer} onChange={e => setPayer(e.target.value)} placeholder="0x… Any payer if blank" />
          <label>Invoice expiry <span>1–168 HOURS</span></label>
          <select className="field" value={expiryHours} onChange={e => setExpiryHours(e.target.value)}>
            <option value="1">1 hour</option><option value="6">6 hours</option><option value="12">12 hours</option><option value="24">24 hours</option><option value="48">48 hours</option><option value="72">3 days</option><option value="168">7 days</option>
          </select>
          <button className="primary full" onClick={createInvoice} disabled={busy || !configured || !account}>Create on-chain invoice <span>→</span></button>
          {invoiceId && <div className="result"><small>INVOICE ID · COPY FOR PAYER</small><code>{invoiceId}</code><button onClick={() => navigator.clipboard.writeText(invoiceId)}>Copy ID</button></div>}
        </article>

        <article className="panel">
          <div className="panel-kicker">02 / PAYER</div>
          <h2>Pay an invoice</h2>
          <p className="muted">Review invoice details before approving and settling.</p>
          <label>Invoice ID <span>32-BYTE HEX</span></label>
          <input className="field mono" value={invoiceId} onChange={e => setInvoiceId(e.target.value)} placeholder="0x…" />
          <button className="secondary full" onClick={loadInvoice} disabled={busy || !configured}>Fetch invoice details</button>
          {invoice && <div className="invoice-details">
            <div className="detail-row"><span>Merchant</span><strong>{shortAddress(invoice.merchant)}</strong></div>
            <div className="detail-row"><span>Amount</span><strong>{formatUnits(invoice.amount, 6)} tUSD8</strong></div>
            <div className="detail-row"><span>Designated payer</span><strong>{invoice.designatedPayer === ZERO_ADDRESS ? "Anyone" : shortAddress(invoice.designatedPayer)}</strong></div>
            <div className="detail-row"><span>Expires</span><strong>{new Date(Number(invoice.expiresAt) * 1000).toLocaleString()}</strong></div>
            <div className="detail-row"><span>Status</span><strong className={invoice.status === 1 ? "open" : ""}>{statusText}</strong></div>
            <button className="primary full" onClick={settleInvoice} disabled={busy || invoice.status !== 1 || !account}>Approve exact amount & pay <span>→</span></button>
          </div>}
        </article>
      </section>

      <section className="statusbar">
        <div><span className="status-dot" /> TRANSACTION STATUS</div>
        <p>{busy ? "Processing wallet request…" : notice}</p>
        {txHash && <a href={`https://explorer-test.qday.info/tx/${txHash}`} target="_blank" rel="noreferrer">View transaction ↗</a>}
      </section>

      <footer><span>AevumPay</span><span>Testnet only · No real funds · Not audited</span><a href="https://wiki.qday.info/Knowledge/reference/chains" target="_blank" rel="noreferrer">QDay network docs ↗</a></footer>
    </main>
  );
}
