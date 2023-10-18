// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@zk-email/contracts/DKIMRegistry.sol";

/// @title ECDSAOwnedDKIMRegistry
/// @notice A DKIM Registry that could be updated by predefined ECDSA signer
contract ECDSAOwnedDKIMRegistry is IDKIMRegistry {
    using Strings for *;
    using ECDSA for *;

    uint256 public nonce;
    DKIMRegistry public dkimRegistry;
    address public signer;

    constructor(address _signer) {
        dkimRegistry = new DKIMRegistry();
        signer = _signer;
    }

    function setDKIMPublicKeyHash(
        string memory selector,
        string memory domainName,
        bytes32 publicKeyHash,
        bytes memory signature
    ) public {
        string memory tag = string.concat(address(this).toHexString(), nonce.toHexString(32));
        string memory expectedMsg = string.concat(
            "chain_id=",
            block.chainid.toString(),
            ";selector=",
            selector,
            ";domain=",
            domainName,
            ";tag=",
            tag,
            ";public_key_hash=",
            uint256(publicKeyHash).toHexString(),
            ";"
        );
        bytes32 hash = bytes(expectedMsg).toEthSignedMessageHash();
        address recoveredSigner = hash.recover(signature);
        require(recoveredSigner == signer, "Invalid signature");
        nonce++;
        dkimRegistry.setDKIMPublicKeyHash(domainName, publicKeyHash);
    }

    function getDKIMPublicKeyHash(string memory domainName) public view returns (bytes32) {
        return bytes32(dkimRegistry.getDKIMPublicKeyHash(domainName));
    }
}