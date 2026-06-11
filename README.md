# TP Final — Credenciales Académicas Verificables en Blockchain

Diplomatura Universitaria en Blockchain — Universidad Nacional de Quilmes.

Este proyecto implementa una prueba de concepto de un sistema de credenciales académicas verificables sobre blockchain. La solución permite emitir, verificar y revocar credenciales académicas asociadas a una wallet, utilizando un contrato inteligente desplegado y verificado en Base Sepolia y un frontend web conectado con MetaMask.

---

## 0. Hook

La verificación de títulos finales y credenciales académicas suele depender de circuitos administrativos internos, archivos PDF, constancias impresas, consultas manuales o sistemas centralizados a los que un tercero no siempre puede acceder de manera directa. El área responsable de títulos, certificaciones y gestión académica podría operar este sistema como una capa complementaria al registro institucional existente: no reemplaza los circuitos oficiales de emisión, legalización o archivo, sino que agrega una forma pública, rápida y verificable de comprobar que una credencial fue emitida por una autoridad autorizada y que continúa vigente.

El sistema beneficia a tres actores principales. Para la persona egresada, permite demostrar la existencia y validez de su título sin depender de una nueva consulta administrativa cada vez que lo necesita. Para quien verifica —por ejemplo, una institución, empleador, organismo externo o plataforma de postulación— permite comprobar una credencial en segundos a partir de un tokenId. Para la institución emisora, reduce intermediaciones, mejora la trazabilidad de emisión y revocación, y ofrece una prueba pública de autenticidad sin exponer datos personales sensibles.

La elección de blockchain se justifica porque el problema no es solo guardar datos, sino permitir verificación pública, trazable e independiente de una base cerrada. Una base de datos firmada podría ser suficiente para la administración interna, pero seguiría dependiendo de un servidor, una autoridad central y permisos de acceso. En cambio, un contrato inteligente permite registrar hashes, titularidad, fecha de emisión, estado de validez y eventos de emisión o revocación en una red pública. Así, la institución mantiene el control sobre quién puede emitir o revocar, mientras cualquier persona puede verificar la credencial sin modificar datos ni acceder a información privada.

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

## 2. Arquitectura

Flujo general:

~~~text
Usuario / Verificador
        |
        v
Frontend Next.js + RainbowKit + wagmi + viem
        |
        v
MetaMask / Wallet
        |
        v
Base Sepolia
        |
        v
Contrato AcademicCredentials
~~~

Componentes:

~~~text
src/AcademicCredentials.sol
  Contrato ERC-721 soulbound con roles, emisión, revocación y verificación.

frontend/app/page.tsx
  Interfaz web para verificar credenciales, emitir, revocar y administrar issuers.

frontend/contracts/credentials.ts
  Dirección del contrato y ABI usado por el frontend.

SECURITY.md
  Análisis de seguridad, Slither y riesgos aceptados.

test/AcademicCredentials.t.sol
  Suite de tests unitarios y de fuzzing.
~~~

---

## 3. Contrato desplegado

Red:

~~~text
Base Sepolia Testnet
Chain ID: 84532
~~~

Contrato final verificado:

~~~text
0x096409A7C94F88CE2BEE8aE153c5902674083763
~~~

Explorer:

~~~text
https://sepolia.basescan.org/address/0x096409A7C94F88CE2BEE8aE153c5902674083763
~~~

Transacción de deploy:

~~~text
0x54a9846f346775dc8633646df1e6907e60eef509c81c896f86b07c888ce347fb
~~~

Wallet deployer / admin inicial / issuer inicial:

~~~text
0x20D5a59792313fE602b396614213Aca4e1004e9F
~~~

---

## 4. Stack utilizado

Contrato:

- Solidity `^0.8.20`
- Foundry
- OpenZeppelin Contracts
- Slither

Frontend:

- Next.js 14
- React
- wagmi v2
- viem
- RainbowKit
- TanStack React Query
- MetaMask
- Base Sepolia

---

## 5. Funcionalidades implementadas

### Contrato inteligente

El contrato `AcademicCredentials` implementa:

- estándar ERC-721;
- credenciales no transferibles, tipo soulbound;
- control de acceso mediante `AccessControl`;
- rol administrador `DEFAULT_ADMIN_ROLE`;
- rol emisor `ISSUER_ROLE`;
- alta de issuers mediante `grantIssuer`;
- baja de issuers mediante `revokeIssuer`;
- emisión de credenciales;
- revocación de credenciales con motivo;
- verificación pública de credenciales;
- almacenamiento de hashes para preservar privacidad;
- eventos de emisión, revocación y administración de issuers.

### Frontend

El frontend permite:

- conectar wallet con RainbowKit;
- operar en Base Sepolia;
- detectar si la wallet conectada tiene `DEFAULT_ADMIN_ROLE`;
- detectar si la wallet conectada tiene `ISSUER_ROLE`;
- verificar credenciales por `tokenId`;
- emitir nuevas credenciales desde una wallet autorizada;
- revocar credenciales indicando motivo;
- administrar issuers desde una wallet admin;
- abrir transacciones y contrato en BaseScan.

---

## 6. Funciones principales del contrato

| Función | Acceso | Descripción |
|---|---|---|
| `grantIssuer(address)` | Admin | Otorga rol de emisor a una wallet |
| `revokeIssuer(address)` | Admin | Revoca el rol de emisor |
| `issueCredential(address,uint256,string,bytes32,bytes32,string)` | Issuer | Emite una nueva credencial |
| `revoke(uint256,string)` | Issuer | Revoca una credencial existente e informa el motivo |
| `verify(uint256)` | Público | Devuelve los datos de la credencial y su estado de validez |
| `isValid(uint256)` | Público | Indica si una credencial está activa |
| `tokenURI(uint256)` | Público | Devuelve la URI de metadata si el token existe |
| `ownerOf(uint256)` | Público | Devuelve la wallet propietaria si el token existe |

---

## 7. Datos de cada credencial

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

## 8. Estructura del proyecto

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
│   │   ├── page.tsx
│   │   ├── providers.tsx
│   │   └── rainbowkit-css.d.ts
│   ├── contracts/
│   │   └── credentials.ts
│   ├── next.config.js
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
├── SECURITY.md
├── slither-output-tp-final.txt
├── foundry.toml
└── README.md
~~~

---

## 9. Instalación y uso del contrato

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

Ejecutar coverage:

~~~bash
forge coverage --report summary
~~~

Deploy en Base Sepolia:

~~~bash
forge script script/Deploy.s.sol:DeployAcademicCredentials \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --account dev-wallet \
  --sender 0x20D5a59792313fE602b396614213Aca4e1004e9F \
  --broadcast \
  --verify \
  --chain 84532 \
  --etherscan-api-key $BASESCAN_API_KEY
~~~

---

## 10. Testing y coverage

La suite de tests incluye pruebas sobre:

- deploy inicial;
- roles `DEFAULT_ADMIN_ROLE` e `ISSUER_ROLE`;
- alta y baja de issuers;
- emisión de credenciales;
- validaciones de emisión;
- revocación de credenciales;
- eventos;
- verificación pública;
- tokenURI;
- soulbound / bloqueo de transferencias;
- fuzzing.

Resultado:

~~~text
25 tests PASS
~~~

Coverage del contrato principal:

~~~text
AcademicCredentials.sol
Lines:      100%
Statements: 100%
Branches:   86.67%
Functions: 100%
~~~

---

## 11. Análisis de seguridad

El proyecto incluye documentación específica de seguridad en:

~~~text
SECURITY.md
~~~

También se ejecutó análisis estático con Slither. El resultado se conserva en:

~~~text
slither-output-tp-final.txt
~~~

Comando utilizado:

~~~bash
slither . 2>&1 | tee slither-output-tp-final.txt
~~~

Los findings fueron documentados en `SECURITY.md`. No quedaron findings High/Medium propios sin justificar.

---

## 12. Instalación y uso del frontend

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

También puede ejecutarse desde la raíz del proyecto:

~~~bash
npm --prefix frontend run dev
npm --prefix frontend run build
~~~

---

## 13. Configuración de MetaMask

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

## 14. Flujo de uso del frontend

1. Abrir el frontend.
2. Conectar MetaMask mediante RainbowKit.
3. Seleccionar Base Sepolia.
4. Verificar una credencial existente ingresando su `tokenId`.
5. Si la wallet conectada tiene `DEFAULT_ADMIN_ROLE`, agregar o revocar issuers.
6. Si la wallet conectada tiene `ISSUER_ROLE`, emitir una nueva credencial.
7. Verificar la credencial emitida.
8. Revocar una credencial indicando motivo.
9. Verificar que la credencial revocada figure como inválida e inactiva.
10. Intentar transferir una credencial y comprobar que falla por ser soulbound.

---

## 15. Evidencias funcionales

### 15.1 Verificación pública — Token 1001

Credencial emitida y verificada públicamente desde el frontend.

~~~text
Token ID: 1001
Válida: sí
Activa: sí
Título: Diplomatura Blockchain UNQ - Trabajo Final
Fecha de emisión: 10/6/2026, 18:28:06
Owner: 0x20D5a59792313fE602b396614213Aca4e1004e9F
Token URI: ipfs://demo-unq/credencial-1001.json
Hash estudiante: 0x6176cdc07b6edab0aa26cf7916b78019ee66034fa2a93586124a8b6098d1c37a
Hash documento: 0x17bd6b81b7b6cea035d43d06451ac690b9b4b56ad039700e5f52d3447086ce2a
~~~

Transacción de emisión:

~~~text
https://sepolia.basescan.org/tx/0x3dd39180171bf8f931a1f23cb4bb053847edab601789b48d40710986641a2add
~~~

---

### 15.2 Admin agrega issuer

Wallet admin:

~~~text
0x20D5a59792313fE602b396614213Aca4e1004e9F
~~~

Wallet agregada como issuer:

~~~text
0x23de0743F68BAdA9f4db49E836Db37c6aD7365Cd
~~~

Antes de agregarla:

~~~text
DEFAULT_ADMIN_ROLE: false
ISSUER_ROLE: false
~~~

Después de agregarla:

~~~text
DEFAULT_ADMIN_ROLE: false
ISSUER_ROLE: true
~~~

Transacción:

~~~text
https://sepolia.basescan.org/tx/0x5f3dcefb93efab23694440a8287ceeb5a9b671144c3349774ae650708f9a4abc
~~~

---

### 15.3 Issuer emite credencial — Token 1002

La wallet `0x23de...65Cd`, luego de recibir `ISSUER_ROLE`, emitió una credencial.

~~~text
Token ID: 1002
Válida: sí
Activa: sí
Título: Diplomatura Blockchain UNQ - Credencial emitida por issuer
Owner: 0x23de0743F68BAdA9f4db49E836Db37c6aD7365Cd
Token URI: ipfs://demo-unq/credencial-1002.json
~~~

Transacción de emisión:

~~~text
https://sepolia.basescan.org/tx/0x97bc9a89baa4975e21dacc30d57bac1e40730873b572905d8e7f4841adaaffa7
~~~

---

### 15.4 Tercera credencial emitida — Token 1003

Se emitió una tercera credencial para demostrar el flujo de revocación.

~~~text
Token ID: 1003
Título: Diplomatura Blockchain UNQ - Credencial para revocación
Owner inicial: 0x20D5a59792313fE602b396614213Aca4e1004e9F
Token URI: ipfs://demo-unq/credencial-1003.json
~~~

Transacción de emisión:

~~~text
https://sepolia.basescan.org/tx/0xfbd41b83435c09be21a4d12dfcff3feb9ad29f064fac206ed331df970616339d
~~~

---

### 15.5 Revocación — Token 1003

La credencial `1003` fue revocada desde una wallet con `ISSUER_ROLE`.

Motivo:

~~~text
Prueba de revocación para demo TP Final UNQ
~~~

Transacción de revocación:

~~~text
https://sepolia.basescan.org/tx/0x3c2184f261c02163d65282d24a1a2ebbc4681cd4fe1bfbd318fd21135264e4f8
~~~

Verificación posterior:

~~~text
Token ID: 1003
Válida: no
Activa: no
Owner: No disponible
Token URI: No disponible
~~~

---

### 15.6 Intento de transferencia fallido por soulbound

Se intentó transferir el token `1001` desde su owner hacia otra wallet.

Comando:

~~~bash
cast send $CONTRACT \
  "transferFrom(address,address,uint256)" \
  $WALLET_OWNER \
  $WALLET_DESTINO \
  1001 \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --account dev-wallet
~~~

Resultado esperado y obtenido:

~~~text
Error: Failed to estimate gas: server returned an error response:
execution reverted
SoulboundCredential
~~~

Esto demuestra que las credenciales son no transferibles.

---

## 16. Demo / App deployada

Para la Parte 5 se eligió la opción B: app deployada con flujo end-to-end documentado.

URL pública del frontend:

~~~text
https://tp-final-credenciales-unq.vercel.app
~~~

Desde esa URL se pueden verificar públicamente las credenciales emitidas en Base Sepolia:

~~~text
Token 1001: credencial válida y activa
Token 1002: credencial válida y activa
Token 1003: credencial revocada, inválida e inactiva
~~~

El resto del flujo end-to-end queda documentado en las evidencias funcionales de este README:

1. verificación pública de un token;
2. wallet admin agregando issuer;
3. wallet issuer emitiendo credencial;
4. credencial visible/verificable;
5. intento de transferencia fallido por soulbound;
6. revocación;
7. verificación posterior inválida.

---

## 17. Decisiones de diseño

### Separación on-chain / off-chain

La blockchain no almacena documentos completos ni datos personales visibles. Guarda hashes, estado de validez, titularidad y referencias a metadata externa.

### Privacidad

El nombre del estudiante y el documento respaldatorio se representan mediante hashes. Esto permite verificar integridad sin publicar información sensible.

### Credenciales no transferibles

Las credenciales académicas no deben poder venderse ni transferirse. Por eso el contrato implementa un comportamiento soulbound.

### Control institucional

La emisión y revocación están restringidas a wallets con rol `ISSUER_ROLE`. La administración de emisores queda bajo el rol `DEFAULT_ADMIN_ROLE`.

### Revocación

Una credencial puede ser revocada por un issuer indicando un motivo. Luego de la revocación, la verificación pública devuelve que la credencial no es válida y no está activa.

---

## 18. Alcance de la prueba de concepto

Este proyecto es una prueba de concepto académica. Las URIs utilizadas son de demostración, por ejemplo:

~~~text
ipfs://demo-unq/credencial-1001.json
ipfs://demo-unq/credencial-1002.json
ipfs://demo-unq/credencial-1003.json
~~~

En una implementación productiva, esas URIs deberían apuntar a metadata real almacenada en IPFS u otro sistema de almacenamiento confiable.

---

## 19. Estado final del proyecto

El proyecto cuenta con:

- contrato inteligente implementado;
- contrato desplegado y verificado en Base Sepolia;
- roles de emisión configurados;
- tres credenciales emitidas;
- credenciales verificadas públicamente;
- credencial revocada;
- verificación posterior inválida;
- bloqueo de transferencias soulbound probado;
- frontend funcional;
- conexión con MetaMask mediante RainbowKit;
- stack frontend Next.js 14 + wagmi + viem + RainbowKit;
- build del frontend correcto;
- tests Foundry correctos;
- coverage documentado;
- análisis de seguridad documentado;
- repositorio versionado con Git.
