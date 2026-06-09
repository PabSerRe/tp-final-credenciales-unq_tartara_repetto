# TP Final — Credenciales Académicas Verificables en Blockchain

Diplomatura Universitaria en Blockchain — Universidad Nacional de Quilmes.

Este proyecto implementa una prueba de concepto de un sistema de credenciales académicas verificables sobre blockchain. La solución permite emitir, verificar y revocar credenciales académicas asociadas a una wallet, utilizando un contrato inteligente desplegado en Base Sepolia y un frontend web conectado con MetaMask.

---

## 1. Resumen del proyecto

El sistema permite que una institución emisora, representada por una wallet con rol autorizado, emita credenciales académicas en forma de tokens ERC-721 no transferibles.

Cada credencial queda asociada a una wallet de estudiante e incluye información verificable on-chain:

- nombre del título, curso o certificación;
- hash del nombre del estudiante;
- hash del documento respaldatorio;
- fecha de emisión;
- estado de validez;
- URI de metadata.

La solución separa la información on-chain de la información off-chain. En blockchain se guarda la prueba de existencia, integridad, titularidad y estado de la credencial. La metadata o documentación ampliada puede referenciarse externamente mediante una URI, por ejemplo IPFS.

---

## 2. Contrato desplegado

Red: Base Sepolia Testnet

Contrato:

~~~text
0x120e88aF2AE251Af9d8ba1585182c7F8dDb6F130
~~~

Wallet deployer / issuer:

~~~text
0x20D5a59792313fE602b396614213Aca4e1004e9F
~~~

Explorer:

~~~text
https://sepolia.basescan.org/address/0x120e88aF2AE251Af9d8ba1585182c7F8dDb6F130
~~~

---

## 3. Funcionalidades implementadas

### Contrato inteligente

El contrato `AcademicCredentials` implementa:

- estándar ERC-721;
- credenciales no transferibles, tipo soulbound;
- control de acceso mediante `AccessControl`;
- rol administrador `DEFAULT_ADMIN_ROLE`;
- rol emisor `ISSUER_ROLE`;
- emisión de credenciales;
- revocación de credenciales;
- verificación pública de credenciales;
- almacenamiento de hashes para preservar privacidad;
- eventos de emisión y revocación.

### Frontend

El frontend permite:

- conectar MetaMask;
- operar en Base Sepolia;
- detectar si la wallet conectada tiene rol issuer;
- verificar credenciales por `tokenId`;
- emitir nuevas credenciales desde una wallet autorizada;
- revocar credenciales;
- verificar correctamente credenciales revocadas.

---

## 4. Funciones principales del contrato

| Función | Acceso | Descripción |
|---|---|---|
| `grantIssuer(address)` | Admin | Otorga rol de emisor a una wallet |
| `revokeIssuer(address)` | Admin | Revoca el rol de emisor |
| `issueCredential(address,uint256,string,string,bytes32,bytes32)` | Issuer | Emite una nueva credencial |
| `revoke(uint256)` | Issuer | Revoca una credencial existente |
| `verify(uint256)` | Público | Devuelve los datos de la credencial y su estado de validez |
| `isValid(uint256)` | Público | Indica si una credencial está activa |
| `tokenURI(uint256)` | Público | Devuelve la URI de metadata si el token existe |
| `ownerOf(uint256)` | Público | Devuelve la wallet propietaria si el token existe |

---

## 5. Datos de cada credencial

Cada credencial contiene:

~~~text
degreeName: nombre del título, curso o certificación
studentNameHash: hash del nombre del estudiante
issueDate: fecha de emisión
documentHash: hash del documento respaldatorio
active: estado activo / revocado
metadataURI: URI de metadata
~~~

Los datos sensibles no se guardan directamente en blockchain. Se almacenan como hashes para permitir verificación de integridad sin exponer información personal.

---

## 6. Estructura del proyecto

~~~text
.
├── src/
│   └── AcademicCredentials.sol
├── script/
│   └── Deploy.s.sol
├── test/
│   └── AcademicCredentials.t.sol
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── contracts/
│   │   └── credentials.ts
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
├── SECURITY.md
├── slither-output-tp-final.txt
├── foundry.toml
└── README.md
~~~

---

## 7. Instalación y uso del contrato

Instalar dependencias:

~~~bash
forge install
~~~

Compilar:

~~~bash
forge build
~~~

Ejecutar tests:

~~~bash
forge test
~~~

Ejecutar tests con más detalle:

~~~bash
forge test -vvv
~~~

---

## 8. Análisis de seguridad

El proyecto incluye documentación específica de seguridad en:

~~~text
SECURITY.md
~~~

También se ejecutó análisis estático con Slither. El resultado se conserva en:

~~~text
slither-output-tp-final.txt
~~~

---

## 9. Instalación y uso del frontend

Entrar a la carpeta del frontend:

~~~bash
cd frontend
~~~

Instalar dependencias:

~~~bash
npm install
~~~

Ejecutar en modo desarrollo:

~~~bash
npm run dev
~~~

Compilar para producción:

~~~bash
npm run build
~~~

El frontend fue implementado con Next.js y `ethers`.

---

## 10. Configuración de MetaMask

Para usar el frontend, MetaMask debe estar conectado a Base Sepolia.

Datos de red:

~~~text
Nombre de red: Base Sepolia
RPC: https://sepolia.base.org
Chain ID: 84532
Símbolo: ETH
Explorer: https://sepolia.basescan.org
~~~

---

## 11. Flujo de uso del frontend

1. Abrir el frontend.
2. Conectar MetaMask.
3. Seleccionar la red Base Sepolia.
4. Verificar una credencial existente ingresando su `tokenId`.
5. Si la wallet conectada tiene rol issuer, emitir una nueva credencial.
6. Verificar la credencial emitida.
7. Revocar una credencial.
8. Verificar que la credencial revocada figure como inválida e inactiva.

---

## 12. Evidencias funcionales

### Token 1001 — Credencial válida

Credencial emitida previamente y verificada correctamente desde el frontend.

~~~text
Token ID: 1001
Válida: sí
Activa: sí
Título / curso: Diplomatura UNQ Blockchain - Credencial Demo 1
Owner: 0x20D5a59792313fE602b396614213Aca4e1004e9F
Token URI: ipfs://demo-unq/credencial-1001.json
Hash estudiante: 0x3cf97fa3a6ff02e1e22b7ec8d90b718d738d004383dad367ea05731b10a8a331
Hash documento: 0xee7244c4f76aa3633e569bdf3d3caef4684ebefaa0fd2c89a49448645e5d8f0f
~~~

### Token 1004 — Credencial emitida desde el frontend

Credencial emitida desde el frontend y luego verificada correctamente.

~~~text
Token ID: 1004
Válida: sí
Activa: sí
Título / curso: Electricista
Fecha de emisión: 9/6/2026, 15:39:44
Owner: 0x20D5a59792313fE602b396614213Aca4e1004e9F
Token URI: ipfs://demo-unq/credencial-1004.json
Hash estudiante: 0x4389e7d9c515289be28b95a5325c5053181cd5211ea760a944ebd0dffdb31d1e
Hash documento: 0x0bd0a38699b0137470e7c27f9a834c0c3eb35900f74cfb884d45c38d522e15ea
~~~

### Token 1005 — Credencial revocada

Credencial emitida y luego revocada desde el frontend. La verificación posterior muestra que ya no se encuentra activa.

~~~text
Token ID: 1005
Válida: no
Activa: no
Título / curso: Revocación
Fecha de emisión: 9/6/2026, 15:42:20
Owner: No disponible
Token URI: No disponible
Hash estudiante: 0x4389e7d9c515289be28b95a5325c5053181cd5211ea760a944ebd0dffdb31d1e
Hash documento: 0xa1aa2b551193acf23749363f72623561a373c2b9aaf3406b600d76ab42bc1efb
~~~

Transacción de revocación:

~~~text
0xe7bccddec31acff5739bed30aa9b57c6a2caf99a937d9c93ab8cd38e3e67984e
~~~

---

## 13. Decisiones de diseño

### Separación on-chain / off-chain

La blockchain no almacena documentos completos ni datos personales visibles. Guarda hashes, estado de validez, titularidad y referencias a metadata externa.

### Privacidad

El nombre del estudiante y el documento respaldatorio se representan mediante hashes. Esto permite verificar integridad sin publicar información sensible.

### Credenciales no transferibles

Las credenciales académicas no deben poder venderse ni transferirse. Por eso el contrato implementa un comportamiento soulbound.

### Control institucional

La emisión y revocación están restringidas a wallets con rol `ISSUER_ROLE`. La administración de emisores queda bajo el rol `DEFAULT_ADMIN_ROLE`.

### Revocación

Una credencial puede ser revocada por un issuer. Luego de la revocación, la verificación pública devuelve que la credencial no es válida y no está activa.

---

## 14. Estado final del proyecto

El proyecto cuenta con:

- contrato inteligente implementado;
- roles de emisión configurados;
- deploy en Base Sepolia;
- credenciales emitidas;
- credenciales verificadas;
- credencial revocada;
- frontend funcional;
- conexión con MetaMask;
- build del frontend correcto;
- análisis de seguridad documentado;
- repositorio versionado con Git.

---

## 15. Alcance de la prueba de concepto

Este proyecto es una prueba de concepto académica. Las URIs utilizadas son de demostración, por ejemplo:

~~~text
ipfs://demo-unq/credencial-1001.json
ipfs://demo-unq/credencial-1004.json
~~~

En una implementación productiva, esas URIs deberían apuntar a metadata real almacenada en IPFS u otro sistema de almacenamiento confiable.
