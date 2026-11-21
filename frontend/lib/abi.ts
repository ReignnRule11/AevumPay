export const aevumPayAbi = [
  {
    type: "function",
    name: "createInvoice",
    stateMutability: "nonpayable",
    inputs: [
      { name: "designatedPayer", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "expiresAt", type: "uint64" },
      { name: "externalRef", type: "bytes32" }
    ],
    outputs: [{ name: "invoiceId", type: "bytes32" }]
  },
  {
    type: "function",
    name: "pay",
    stateMutability: "nonpayable",
    inputs: [{ name: "invoiceId", type: "bytes32" }],
    outputs: []
  },
  {
    type: "function",
    name: "getInvoice",
    stateMutability: "view",
    inputs: [{ name: "invoiceId", type: "bytes32" }],
    outputs: [{
      name: "invoice",
      type: "tuple",
      components: [
        { name: "merchant", type: "address" },
        { name: "designatedPayer", type: "address" },
        { name: "amount", type: "uint128" },
        { name: "expiresAt", type: "uint64" },
        { name: "status", type: "uint8" },
        { name: "externalRef", type: "bytes32" }
      ]
    }]
  },
  {
    type: "event",
    name: "InvoiceCreated",
    anonymous: false,
    inputs: [
      { indexed: true, name: "invoiceId", type: "bytes32" },
      { indexed: true, name: "merchant", type: "address" },
      { indexed: true, name: "designatedPayer", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "expiresAt", type: "uint64" },
      { indexed: false, name: "externalRef", type: "bytes32" }
    ]
  }
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  }
] as const;
