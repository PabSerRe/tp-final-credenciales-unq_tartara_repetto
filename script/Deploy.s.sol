// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AcademicCredentials} from "../src/AcademicCredentials.sol";

/// @title DeployAcademicCredentials
/// @notice Despliega el registro de credenciales académicas UNQ.
/// @dev El deployer queda configurado como DEFAULT_ADMIN_ROLE e ISSUER_ROLE.
/// @dev Ejemplo de uso en Base Sepolia:
///      forge script script/Deploy.s.sol:DeployAcademicCredentials \
///        --rpc-url $BASE_SEPOLIA_RPC_URL \
///        --broadcast \
///        --account dev-wallet
contract DeployAcademicCredentials is Script {
    function run() external returns (AcademicCredentials) {
        vm.startBroadcast();

        AcademicCredentials credentials = new AcademicCredentials();

        vm.stopBroadcast();

        console.log("AcademicCredentials desplegado en:", address(credentials));
        console.log("El deployer recibe DEFAULT_ADMIN_ROLE e ISSUER_ROLE");

        return credentials;
    }
}
