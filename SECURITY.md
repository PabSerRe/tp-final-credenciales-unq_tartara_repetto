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

slither src/AcademicCredentials.sol --filter-paths "lib"

Resumen del resultado:

src/AcademicCredentials.sol analyzed (22 contracts with 101 detectors), 2 result(s) found

## Hallazgos

### 1. Detector timestamp

Slither informó advertencias del detector timestamp en las siguientes funciones:

- revoke(uint256)
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

## Conclusión

No se identificaron problemas críticos ni de alto riesgo en la versión actual del contrato.

El hallazgo relacionado con timestamp queda documentado y aceptado porque ese dato no se utiliza para decisiones sensibles de seguridad.
