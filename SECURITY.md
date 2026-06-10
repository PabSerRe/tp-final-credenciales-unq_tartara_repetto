# Revisión de seguridad

## Proyecto

Credenciales Académicas UNQ - Registro de credenciales académicas ERC-721 no transferibles.

El contrato permite que cuentas autorizadas emitan, verifiquen y revoquen credenciales académicas. Cada credencial está representada por un token ERC-721 no transferible y guarda datos mínimos de verificación en la blockchain.

## Herramientas utilizadas

- Foundry para pruebas automatizadas.
- Foundry coverage para cobertura de tests.
- Slither para análisis estático de seguridad.

## Cobertura de pruebas

El último reporte de cobertura arrojó los siguientes resultados:

Contrato principal: src/AcademicCredentials.sol

- Líneas: 100.00%
- Sentencias: 100.00%
- Ramas: 86.67%
- Funciones: 100.00%

Cobertura total del proyecto:

- Líneas: 84.78%
- Sentencias: 83.72%
- Ramas: 86.67%
- Funciones: 90.00%

La cobertura total es menor que la cobertura específica del contrato porque el reporte incluye también script/Deploy.s.sol.

## Resultado de Slither

Slither se ejecutó con el siguiente comando:

slither . 2>&1 | tee slither-output-tp-final.txt

Resumen del resultado:

22 contratos analizados con 101 detectores. Slither informó hallazgos principalmente en dependencias de OpenZeppelin/lib y una advertencia aceptable de timestamp sobre el contrato propio.

## Findings de Slither documentados

| Detector                 | Origen                                | Evaluación                                                                                                |
| ------------------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `incorrect-exp`          | OpenZeppelin `Math.sol`               | No corresponde a lógica propia. Se documenta como hallazgo en dependencia.                                |
| `divide-before-multiply` | OpenZeppelin `Math.sol`               | No corresponde a lógica propia. Se acepta por uso de librería estándar.                                   |
| `timestamp`              | Contrato propio                       | Riesgo aceptado. `block.timestamp` solo registra `issueDate`; no define permisos, vencimientos ni fondos. |
| `assembly`               | OpenZeppelin                          | No corresponde a lógica propia. Uso interno de librerías auditadas.                                       |
| `pragma`                 | OpenZeppelin + contrato propio        | Aviso por múltiples pragmas en dependencias. El contrato propio usa Solidity `^0.8.20`.                   |
| `solc-version`           | OpenZeppelin + contrato propio        | Aviso genérico de Slither sobre rangos de compilador. El proyecto compila con Solidity 0.8.28.            |
| `too-many-digits`        | OpenZeppelin `Bytes.sol` / `Math.sol` | No corresponde a lógica propia. Se documenta como hallazgo en dependencia.                                |

No se detectaron findings High/Medium propios sin justificar. Los hallazgos relevantes quedan documentados y no requieren modificar el contrato.

## Hallazgos

### 1. Detector timestamp

Slither informó advertencias del detector timestamp en las siguientes funciones:

- revoke(uint256,string)
- verify(uint256)

La advertencia está relacionada con el uso de block.timestamp para guardar el campo issueDate.

## Evaluación del hallazgo

El hallazgo se considera aceptable para este proyecto.

El timestamp se utiliza únicamente como dato informativo para registrar una fecha aproximada de emisión de la credencial académica. No se utiliza para:

- controles de autorización;
- transferencias de fondos;
- generación de aleatoriedad;
- reglas de vencimiento;
- permisos de emisores;
- propiedad de credenciales;
- permisos de revocación.

La validez de una credencial depende de que la credencial esté activa y de que el token exista actualmente.

Por lo tanto, una eventual manipulación menor del timestamp por parte de un validador no permitiría emitir, revocar, transferir, validar o invalidar credenciales de manera indebida.

## Mitigación / justificación

No se requiere modificar el contrato en esta etapa. El uso de block.timestamp está limitado al registro de una fecha aproximada de emisión con fines de auditoría y visualización.

Si en una versión futura el sistema necesitara fechas legalmente precisas o reglas de vencimiento, esas fechas deberían ser provistas y firmadas por un sistema institucional externo, en lugar de depender exclusivamente de block.timestamp.

## Propiedades de seguridad ya probadas

La suite de pruebas verifica que:

- solo las cuentas con ISSUER_ROLE pueden emitir credenciales;
- solo las cuentas con ISSUER_ROLE pueden revocar credenciales;
- las cuentas administradoras pueden otorgar permisos de emisión;
- las cuentas administradoras pueden revocar permisos de emisión;
- un emisor revocado no puede emitir credenciales;
- no se pueden emitir credenciales a la dirección cero;
- no se pueden emitir identificadores de token duplicados;
- se rechazan credenciales sin nombre de título o certificación;
- se rechazan credenciales sin hash de identidad del estudiante;
- se rechazan credenciales sin hash del documento académico;
- las credenciales son no transferibles;
- las credenciales revocadas dejan de ser válidas;
- verify(tokenId) devuelve los datos de la credencial y su estado de validez;
- el contrato declara correctamente las interfaces esperadas.

## Checklist de seguridad

* Solidity `^0.8.20`.
* Uso de `AccessControl`.
* `DEFAULT_ADMIN_ROLE` administra altas y bajas de issuers.
* `ISSUER_ROLE` emite y revoca credenciales.
* Validación de `address(0)` en gestión de issuers.
* Validación de título no vacío.
* Validación de `studentNameHash` no vacío.
* Validación de `documentHash` no vacío.
* Prevención de `tokenId` duplicado.
* Credenciales soulbound: no transferibles.
* Revocación con motivo mediante `revoke(tokenId, reason)`.
* Eventos en emisión, revocación y gestión de issuers.
* Sin `tx.origin`.
* Sin `delegatecall`.
* Sin `selfdestruct`.
* Sin manejo de fondos.
* Sin lógica de aleatoriedad.
* Sin decisiones críticas basadas en `block.timestamp`.

## Análisis propio de riesgos

Si se pierde la wallet con `DEFAULT_ADMIN_ROLE`, no se podrían agregar ni quitar issuers. En una versión productiva debería usarse una multisig institucional.

Si se compromete una wallet con `ISSUER_ROLE`, podría emitir o revocar credenciales indebidamente. La mitigación prevista es que el admin pueda revocar ese rol y que los eventos permitan auditar lo ocurrido.

Si se emite una credencial con datos incorrectos, la solución es revocarla con motivo y emitir una nueva credencial corregida. La blockchain conserva la trazabilidad del error y de la revocación.

El front-running no representa un riesgo crítico en este diseño porque no hay fondos, subastas ni beneficios económicos asociados al orden de transacciones.

El `studentNameHash` puede ser vulnerable a ataques de diccionario si se hashean datos simples. En una versión institucional debería usarse un esquema con sal o datos combinados no públicos.


## Conclusión

No se identificaron problemas críticos ni de alto riesgo en la versión actual del contrato.

El hallazgo relacionado con timestamp queda documentado y aceptado porque ese dato no se utiliza para decisiones sensibles de seguridad.
