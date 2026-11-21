# Initial threat model

| Threat | MVP control | Remaining limitation |
|---|---|---|
| Wrong network | Chain-ID gate and recheck before signing | Wallet/network UX remains a risk |
| Fake token | Immutable token address | Verify official token deployment before deployment |
| Wrong amount | Integer base units and exact receipt delta | UI formatting requires tests |
| Duplicate payment | On-chain invoice state transition | Indexer must be idempotent |
| Unauthorized payer | Optional designated payer enforced on-chain | Open invoices intentionally allow any payer |
| Expired invoice | Contract expiry check | Late-payment/refund policy is out of scope |
| Fee-on-transfer token | Merchant balance-delta check | Rebasing tokens unsupported |
| Reentrancy | OpenZeppelin ReentrancyGuard | Pin and review dependency version |
| Key compromise | Wallet custody and exact approval | Wallet security remains user's responsibility |
| Malicious AI prompt | AI excluded from signing path | Extracted invoice data remains untrusted |
| RPC outage/stale data | Show pending/unknown and retry reads | Resilient indexer still required |

This is an initial threat model, not an audit. Do not use for real funds.
