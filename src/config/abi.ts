export const IDENTITY_SBT_ABI = [
  {
    inputs: [{ name: "dataHash", type: "bytes32" }],
    name: "createIdentity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "credentialType", type: "string" },
      { name: "credentialHash", type: "bytes32" },
    ],
    name: "addCredential",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "credentialType", type: "string" },
      { name: "newCredentialHash", type: "bytes32" },
    ],
    name: "updateCredential",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "getIdentity",
    outputs: [
      { name: "score", type: "uint8" },
      { name: "issuedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "dataHash", type: "bytes32" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "getScore",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "isVerified",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "getCredentialKeys",
    outputs: [{ name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "credentialType", type: "string" },
    ],
    name: "getCredential",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "account", type: "address" },
      { indexed: false, name: "score", type: "uint8" },
    ],
    name: "IdentityCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "account", type: "address" },
      { indexed: false, name: "newScore", type: "uint8" },
    ],
    name: "IdentityUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "account", type: "address" },
      { indexed: false, name: "credentialType", type: "string" },
      { indexed: false, name: "dataHash", type: "bytes32" },
    ],
    name: "CredentialAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "account", type: "address" },
      { indexed: false, name: "platformHash", type: "bytes32" },
      { indexed: false, name: "handleHash", type: "bytes32" },
    ],
    name: "SocialLinked",
    type: "event",
  },
  {
    inputs: [
      { name: "platformHash", type: "bytes32" },
      { name: "handleHash", type: "bytes32" },
    ],
    name: "setSocial",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "platformHash", type: "bytes32" },
    ],
    name: "getSocialHash",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "platformHash", type: "bytes32" },
      { name: "handleHash", type: "bytes32" },
    ],
    name: "getAddressByHandle",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
