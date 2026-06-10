// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AcademicCredentials} from "../src/AcademicCredentials.sol";

/// @title AcademicCredentialsTest
/// @notice Unit + fuzz tests for the credential registry
contract AcademicCredentialsTest is Test {
    AcademicCredentials public credentials;

    address public issuer;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    string public constant METADATA_URI = "ipfs://bafy.../credential-1.json";
    string public constant DEGREE_NAME = "Licenciatura en Informatica";

    bytes32 public constant STUDENT_NAME_HASH = keccak256("Alice Example");
    bytes32 public constant DOCUMENT_HASH = keccak256("UNQ credential PDF");

    function setUp() public {
        issuer = address(this);
        credentials = new AcademicCredentials();
    }

    function issueDefault(address student, uint256 tokenId) internal {
        credentials.issueCredential(
            student,
            tokenId,
            DEGREE_NAME,
            STUDENT_NAME_HASH,
            DOCUMENT_HASH,
            METADATA_URI
        );
    }

    // ==========================================================================
    // DEPLOYMENT
    // ==========================================================================

    function test_NameAndSymbol() public view {
        assertEq(credentials.name(), "UNQ Academic Credential");
        assertEq(credentials.symbol(), "UNQ-CRED");
    }

    function test_DeployerHasAdminAndIssuerRoles() public view {
        assertTrue(credentials.hasRole(credentials.DEFAULT_ADMIN_ROLE(), issuer));
        assertTrue(credentials.hasRole(credentials.ISSUER_ROLE(), issuer));
    }

    // ==========================================================================
    // ISSUER MANAGEMENT
    // ==========================================================================

    function test_AdminCanGrantIssuerRole() public {
        vm.expectEmit(true, true, false, false);
        emit AcademicCredentials.IssuerGranted(alice, address(this));

        credentials.grantIssuer(alice);

        assertTrue(credentials.hasRole(credentials.ISSUER_ROLE(), alice));
    }

    function test_AdminCanRevokeIssuerRole() public {
        credentials.grantIssuer(alice);
        assertTrue(credentials.hasRole(credentials.ISSUER_ROLE(), alice));

        vm.expectEmit(true, true, false, false);
        emit AcademicCredentials.IssuerRevoked(alice, address(this));

        credentials.revokeIssuer(alice);

        assertFalse(credentials.hasRole(credentials.ISSUER_ROLE(), alice));
    }

    function test_GrantedIssuerCanIssueCredential() public {
        credentials.grantIssuer(alice);

        vm.prank(alice);
        credentials.issueCredential(
            bob,
            10,
            DEGREE_NAME,
            STUDENT_NAME_HASH,
            DOCUMENT_HASH,
            METADATA_URI
        );

        assertEq(credentials.ownerOf(10), bob);
        assertTrue(credentials.isValid(10));
    }

    function test_RevokedIssuerCannotIssueCredential() public {
        credentials.grantIssuer(alice);
        vm.expectEmit(true, true, false, false);
        emit AcademicCredentials.IssuerRevoked(alice, address(this));

        credentials.revokeIssuer(alice);

        vm.prank(alice);
        vm.expectRevert();
        credentials.issueCredential(
            bob,
            11,
            DEGREE_NAME,
            STUDENT_NAME_HASH,
            DOCUMENT_HASH,
            METADATA_URI
        );
    }

    // ==========================================================================
    // ISSUE
    // ==========================================================================

    function test_IssuerCanIssue() public {
        issueDefault(alice, 1);

        assertEq(credentials.ownerOf(1), alice);
        assertEq(credentials.balanceOf(alice), 1);
        assertEq(credentials.tokenURI(1), METADATA_URI);
        assertTrue(credentials.isValid(1));
    }

    function test_NonIssuerCannotIssue() public {
        vm.prank(alice);
        vm.expectRevert();
        credentials.issueCredential(
            bob,
            2,
            DEGREE_NAME,
            STUDENT_NAME_HASH,
            DOCUMENT_HASH,
            METADATA_URI
        );
    }

    function test_CannotIssueDuplicateTokenId() public {
        issueDefault(alice, 1);

        vm.expectRevert("Credential already issued");
        credentials.issueCredential(
            bob,
            1,
            DEGREE_NAME,
            STUDENT_NAME_HASH,
            DOCUMENT_HASH,
            METADATA_URI
        );
    }

    function test_CannotIssueWithEmptyDegreeName() public {
        vm.expectRevert("Invalid degree");
        credentials.issueCredential(
            alice,
            3,
            "",
            STUDENT_NAME_HASH,
            DOCUMENT_HASH,
            METADATA_URI
        );
    }

    function test_CannotIssueWithEmptyStudentNameHash() public {
        vm.expectRevert("Invalid student hash");
        credentials.issueCredential(
            alice,
            4,
            DEGREE_NAME,
            bytes32(0),
            DOCUMENT_HASH,
            METADATA_URI
        );
    }

    function test_CannotIssueWithEmptyDocumentHash() public {
        vm.expectRevert("Invalid document hash");
        credentials.issueCredential(
            alice,
            5,
            DEGREE_NAME,
            STUDENT_NAME_HASH,
            bytes32(0),
            METADATA_URI
        );
    }

    function test_IssuingEmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit AcademicCredentials.CredentialIssued(
            alice,
            42,
            DEGREE_NAME,
            STUDENT_NAME_HASH
        );

        credentials.issueCredential(
            alice,
            42,
            DEGREE_NAME,
            STUDENT_NAME_HASH,
            DOCUMENT_HASH,
            METADATA_URI
        );
    }

    function test_CredentialCannotBeTransferred() public {
        issueDefault(alice, 20);

        vm.prank(alice);
        vm.expectRevert(AcademicCredentials.SoulboundCredential.selector);
        credentials.transferFrom(alice, bob, 20);
    }

    // ==========================================================================
    // REVOKE
    // ==========================================================================

    function test_IssuerCanRevoke() public {
        issueDefault(alice, 1);
        assertTrue(credentials.isValid(1));

        credentials.revoke(1, "Error administrativo");

        assertFalse(credentials.isValid(1));
        assertEq(credentials.balanceOf(alice), 0);
    }

    function test_NonIssuerCannotRevoke() public {
        issueDefault(alice, 1);

        vm.prank(alice);
        vm.expectRevert();
        credentials.revoke(1, "Error administrativo");
    }

    function test_CannotRevokeNonExistent() public {
        vm.expectRevert("Credential not active");
        credentials.revoke(999, "Token inexistente");
    }

    function test_RevokingEmitsEvent() public {
        issueDefault(alice, 7);

        string memory reason = "Error administrativo";

        vm.expectEmit(true, true, false, true);
        emit AcademicCredentials.CredentialRevoked(7, address(this), reason);

        credentials.revoke(7, reason);
    }

    // ==========================================================================
    // VERIFICATION
    // ==========================================================================

    function test_IsValidReturnsFalseForNonExistent() public view {
        assertFalse(credentials.isValid(123));
    }

    function test_TokenURIReturnsMetadataURI() public {
        credentials.issueCredential(
            alice,
            5,
            DEGREE_NAME,
            STUDENT_NAME_HASH,
            DOCUMENT_HASH,
            "ipfs://bafy.../degree-systems-2025.json"
        );

        assertEq(credentials.tokenURI(5), "ipfs://bafy.../degree-systems-2025.json");
    }

    function test_VerifyReturnsCredentialData() public {
        issueDefault(alice, 1);

        (AcademicCredentials.Credential memory credential, bool valid) = credentials.verify(1);

        assertTrue(valid);
        assertEq(credential.degreeName, DEGREE_NAME);
        assertEq(credential.studentNameHash, STUDENT_NAME_HASH);
        assertEq(credential.issueDate, block.timestamp);
        assertEq(credential.documentHash, DOCUMENT_HASH);
        assertTrue(credential.active);
    }

    function test_VerifyReturnsInvalidAfterRevocation() public {
        issueDefault(alice, 1);

        credentials.revoke(1, "Error administrativo");

        (AcademicCredentials.Credential memory credential, bool valid) = credentials.verify(1);

        assertFalse(valid);
        assertFalse(credential.active);
    }

    function test_SupportsExpectedInterfaces() public view {
        assertTrue(credentials.supportsInterface(0x80ac58cd)); // ERC721
        assertTrue(credentials.supportsInterface(0x5b5e139f)); // ERC721Metadata
        assertTrue(credentials.supportsInterface(0x7965db0b)); // AccessControl
        assertFalse(credentials.supportsInterface(0xffffffff));
    }

    // ==========================================================================
    // FUZZ
    // ==========================================================================

    function testFuzz_IssueToAnyAddress(address student, uint256 tokenId) public {
        vm.assume(student != address(0));

        issueDefault(student, tokenId);

        assertEq(credentials.ownerOf(tokenId), student);
        assertTrue(credentials.isValid(tokenId));
    }

    function testFuzz_IssuerCannotIssueToZeroAddress(uint256 tokenId) public {
        vm.expectRevert();
        credentials.issueCredential(
            address(0),
            tokenId,
            DEGREE_NAME,
            STUDENT_NAME_HASH,
            DOCUMENT_HASH,
            METADATA_URI
        );
    }
}
