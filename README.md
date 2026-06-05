# Clase 3 — Credenciales Académicas (ERC-721 con OpenZeppelin)

Diplomatura Blockchain UNQ — Módulo 3.

## ¿Qué es esto?

Un contrato ERC-721 (NFT) llamado `AcademicCredentials` que permite a la universidad **emitir títulos verificables on-chain**. Cada título es un NFT único, asociado a la wallet del estudiante, con metadata (nombre del título, fecha, hash del PDF) en IPFS.

Este contrato es la **base del TP final** de la materia: vamos a usarlo como punto de partida y le agregaremos roles (`AccessControl`), no-transferibilidad (soulbound) y verificación pública desde un frontend.

## Pre-requisitos

- Foundry (`forge`, `cast`, `anvil`) — si no lo tenés: `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- Cuenta de MetaMask en **Sepolia** con ETH de testnet
- VS Code + extensión `juanblanco.solidity`

## Setup

```bash
git clone https://github.com/dpetrocelli/diplo-unq-blockchain-clase3.git
cd diplo-unq-blockchain-clase3
forge install foundry-rs/forge-std --shallow
forge install OpenZeppelin/openzeppelin-contracts --shallow
forge build
forge test
```

Tienen que ver `14 passed; 0 failed`.

## Comandos clave

```bash
forge build              # compilar
forge test               # tests
forge test -vvv          # con detalle
anvil                    # blockchain local
```

### Deploy local (con anvil corriendo en otra terminal)

```bash
forge create src/AcademicCredentials.sol:AcademicCredentials \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

### Emitir un título a alice (usando cast)

```bash
export ADDR=<dirección del contrato deployado>
export ALICE=0x70997970C51812dc3A010C7d01b50e0d17dc79C8

cast send $ADDR \
  "issueCredential(address,uint256,string)" \
  $ALICE 1 "ipfs://bafy.../titulo-licenciatura-sistemas.json" \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Verificar el título

```bash
# ¿Quién es el dueño del tokenId 1?
cast call $ADDR "ownerOf(uint256)" 1 --rpc-url http://localhost:8545

# ¿Cuál es la metadata?
cast call $ADDR "tokenURI(uint256)" 1 --rpc-url http://localhost:8545

# ¿Es válido?
cast call $ADDR "isValid(uint256)" 1 --rpc-url http://localhost:8545
```

### Deploy a Sepolia

```bash
cast wallet import dev-wallet --interactive  # solo la primera vez

forge create src/AcademicCredentials.sol:AcademicCredentials \
  --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
  --account dev-wallet \
  --broadcast
```

## Estructura

```
.
├── foundry.toml
├── remappings.txt
├── src/
│   └── AcademicCredentials.sol    # ERC-721 + Ownable + issue + revoke
├── test/
│   └── AcademicCredentials.t.sol  # 14 tests (issue, revoke, metadata, fuzz)
└── script/
    └── Deploy.s.sol
```

## Funciones del contrato

| Función | Quién puede llamarla | Qué hace |
|---|---|---|
| `issueCredential(student, tokenId, metadataURI)` | Solo el `owner` (la universidad) | Emite un título nuevo a un estudiante |
| `revoke(tokenId)` | Solo el `owner` | Revoca (quema) un título emitido |
| `ownerOf(tokenId)` | Cualquiera | Devuelve la address del dueño del título |
| `tokenURI(tokenId)` | Cualquiera | Devuelve la URI con la metadata del título |
| `balanceOf(address)` | Cualquiera | Cantidad de títulos que tiene una wallet |
| `isValid(tokenId)` | Cualquiera | `true` si el título existe y no fue revocado |

## Tarea para clase 4

1. Deployar `AcademicCredentials` en Sepolia
2. Emitirle un título a tu propia wallet con un `tokenURI` placeholder
3. Postear en el foro: la dirección del contrato + el `tokenId` del título emitido
4. (Opcional) Subir un JSON de metadata real a Pinata/IPFS y poner el CID en el `tokenURI`

## ¿Y para el TP final?

El TP final es **construir un sistema de certificación de títulos UNQ** sobre este contrato. Vas a agregar:

- `AccessControl` con roles `ISSUER_ROLE` (decanos) y `VERIFIER_ROLE`
- Soulbound: que los títulos NO sean transferibles (sobrescribir `_update`)
- Frontend con dos modos: panel admin (emitir) y verificador público (chequear por DNI hash)
- Metadata real en IPFS con foto + firma digital + hash del PDF

Lo vemos en detalle más adelante.
