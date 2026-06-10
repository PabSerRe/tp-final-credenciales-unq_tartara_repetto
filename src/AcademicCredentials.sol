// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title AcademicCredentials
/// @notice ERC-721 soulbound registry to issue and verify UNQ academic credentials on-chain
/// @dev Each tokenId represents a single, unique credential. Metadata can live off-chain
///      and be referenced by tokenURI, while critical verification data is stored on-chain.
contract AcademicCredentials is ERC721URIStorage, AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct Credential {
        string degreeName;
        bytes32 studentNameHash;
        uint256 issueDate;
        bytes32 documentHash;
        bool active;
    }

    mapping(uint256 => Credential) private _credentials;
    mapping(uint256 => bool) private _issuedCredentialIds;

    /// @notice Reverts when someone tries to transfer a soulbound academic credential
    error SoulboundCredential();

    // ==========================================================================
    // EVENTS
    // ==========================================================================

    /// @notice Emitted when an issuer mints a new credential
    /// @param student wallet address of the student that receives the credential
    /// @param tokenId unique credential id assigned by the issuer
    /// @param metadataURI URI pointing to the credential JSON metadata
    /// @param degreeName name of the academic degree or certification
    /// @param studentNameHash hash of the student's identity data
    /// @param documentHash hash of the academic document
    event CredentialIssued(
        address indexed student,
        uint256 indexed tokenId,
        string metadataURI,
        string degreeName,
        bytes32 studentNameHash,
        bytes32 documentHash
    );

    /// @notice Emitted when an issuer revokes a credential
    /// @param tokenId credential id that was revoked
    /// @param by issuer address that revoked the credential
    /// @param reason reason for revocation
    event CredentialRevoked(uint256 indexed tokenId, address indexed by, string reason);

    /// @notice Emitted when an admin grants issuer permissions to an account
    /// @param account address that receives ISSUER_ROLE
    /// @param by admin address that granted the role
    event IssuerGranted(address indexed account, address indexed by);

    /// @notice Emitted when an admin revokes issuer permissions from an account
    /// @param account address that loses ISSUER_ROLE
    /// @param by admin address that revoked the role
    event IssuerRevoked(address indexed account, address indexed by);

    // ==========================================================================
    // CONSTRUCTOR
    // ==========================================================================

    /// @notice Deploys the credential registry. The deployer becomes admin and issuer.
    constructor()
        ERC721("UNQ Academic Credential", "UNQ-CRED")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
    }

    // ==========================================================================
    // EXTERNAL — ADMIN
    // ==========================================================================

    /// @notice Grants issuer permissions to an account
    /// @param account address that will be allowed to issue and revoke credentials
    function grantIssuer(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "Invalid issuer");
        grantRole(ISSUER_ROLE, account);
        emit IssuerGranted(account, msg.sender);
    }

    /// @notice Revokes issuer permissions from an account
    /// @param account address that will no longer be allowed to issue or revoke credentials
    function revokeIssuer(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "Invalid issuer");
        revokeRole(ISSUER_ROLE, account);
        emit IssuerRevoked(account, msg.sender);
    }

    // ==========================================================================
    // EXTERNAL — ISSUER
    // ==========================================================================

    /// @notice Issues a new academic credential to a student
    /// @param student wallet that will own the credential
    /// @param tokenId unique id assigned to this credential
    /// @param metadataURI URI pointing to the credential JSON metadata
    /// @param degreeName name of the academic degree or certification
    /// @param studentNameHash hash of the student's identity data
    /// @param documentHash hash of the academic document
    function issueCredential(
        address student,
        uint256 tokenId,
        string memory metadataURI,
        string memory degreeName,
        bytes32 studentNameHash,
        bytes32 documentHash
    )
        public
        onlyRole(ISSUER_ROLE)
    {
        require(bytes(degreeName).length > 0, "Invalid degree");
        require(studentNameHash != bytes32(0), "Invalid student hash");
        require(documentHash != bytes32(0), "Invalid document hash");
        require(!_issuedCredentialIds[tokenId], "Credential already issued");

        _issuedCredentialIds[tokenId] = true;

        _mint(student, tokenId);
        _setTokenURI(tokenId, metadataURI);

        _credentials[tokenId] = Credential({
            degreeName: degreeName,
            studentNameHash: studentNameHash,
            issueDate: block.timestamp,
            documentHash: documentHash,
            active: true
        });

        emit CredentialIssued(
            student,
            tokenId,
            metadataURI,
            degreeName,
            studentNameHash,
            documentHash
        );
    }

    /// @notice Revokes a previously issued credential
    /// @param tokenId credential id to revoke
    function revoke(uint256 tokenId, string memory reason) public onlyRole(ISSUER_ROLE) {
        require(_credentials[tokenId].active, "Credential not active");

        _credentials[tokenId].active = false;
        _burn(tokenId);

        emit CredentialRevoked(tokenId, msg.sender, reason);
    }

    // ==========================================================================
    // PUBLIC — VERIFIERS
    // ==========================================================================

    /// @notice Returns the credential data and whether it is currently valid
    /// @param tokenId credential id
    /// @return credential stored credential data
    /// @return valid true if the credential exists, is active, and is currently owned
    function verify(uint256 tokenId)
        public
        view
        returns (Credential memory credential, bool valid)
    {
        credential = _credentials[tokenId];
        valid = credential.active && _ownerOf(tokenId) != address(0);
    }

    /// @notice Convenience helper: tells whether a credential is currently valid
    /// @param tokenId credential id
    /// @return true if the credential exists and is active
    function isValid(uint256 tokenId) public view returns (bool) {
        (, bool valid) = verify(tokenId);
        return valid;
    }

    /// @notice Prevents transfers while still allowing minting and burning
    /// @dev Academic credentials are soulbound: they cannot be transferred between wallets.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        address from = _ownerOf(tokenId);

        if (from != address(0) && to != address(0)) {
            revert SoulboundCredential();
        }

        return super._update(to, tokenId, auth);
    }

    /// @notice Required override because both ERC721URIStorage and AccessControl implement supportsInterface
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
