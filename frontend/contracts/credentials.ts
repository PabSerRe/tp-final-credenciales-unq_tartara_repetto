export const CREDENTIALS_ADDRESS = '0x120e88aF2AE251Af9d8ba1585182c7F8dDb6F130' as const;

export const CREDENTIALS_DEPLOY_BLOCK = 42592906n;

export const BASE_SEPOLIA_TX_URL = 'https://sepolia.basescan.org/tx';

export const CREDENTIALS_ABI = [
  // ---------- Roles ----------
  {
    name: 'DEFAULT_ADMIN_ROLE',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bytes32' }],
  },
  {
    name: 'ISSUER_ROLE',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bytes32' }],
  },
  {
    name: 'hasRole',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    outputs: [{ type: 'bool' }],
  },

  // ---------- Read ----------
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'isValid',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'verify',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        name: 'credential',
        type: 'tuple',
        components: [
          { name: 'degreeName', type: 'string' },
          { name: 'studentNameHash', type: 'bytes32' },
          { name: 'issueDate', type: 'uint256' },
          { name: 'documentHash', type: 'bytes32' },
          { name: 'active', type: 'bool' },
        ],
      },
      { name: 'valid', type: 'bool' },
    ],
  },

  // ---------- Write ----------
  {
    name: 'issueCredential',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'student', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'metadataURI', type: 'string' },
      { name: 'degreeName', type: 'string' },
      { name: 'studentNameHash', type: 'bytes32' },
      { name: 'documentHash', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    name: 'revoke',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
  },

  // ---------- Events ----------
  {
    name: 'CredentialIssued',
    type: 'event',
    inputs: [
      { name: 'student', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'metadataURI', type: 'string', indexed: false },
      { name: 'degreeName', type: 'string', indexed: false },
      { name: 'studentNameHash', type: 'bytes32', indexed: false },
      { name: 'documentHash', type: 'bytes32', indexed: false },
    ],
  },
  {
    name: 'CredentialRevoked',
    type: 'event',
    inputs: [{ name: 'tokenId', type: 'uint256', indexed: true }],
  },
] as const;
