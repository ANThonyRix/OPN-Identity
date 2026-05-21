// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract OPNIdentitySBT {
    struct Identity {
        uint8 score;
        uint256 issuedAt;
        uint256 updatedAt;
        bytes32 dataHash;
        bool exists;
    }

    struct CredentialType {
        uint8 points;
        bool exists;
    }

    address public owner;
    mapping(address => Identity) private _identities;
    mapping(address => mapping(string => bytes32)) private _credentials;
    mapping(address => string[]) private _credentialKeys;
    mapping(string => CredentialType) private _allowedCredentials;
    string[] private _credentialTypeList;
    mapping(address => mapping(bytes32 => bytes32)) private _socialHashes;
    mapping(bytes32 => address) private _handleToAddress;

    event IdentityCreated(address indexed account, uint8 score);
    event IdentityUpdated(address indexed account, uint8 newScore);
    event CredentialAdded(address indexed account, string credentialType, bytes32 dataHash);
    event CredentialUpdated(address indexed account, string credentialType, bytes32 newDataHash);
    event CredentialTypeAdded(string credentialType, uint8 points);
    event SocialLinked(address indexed account, bytes32 platformHash, bytes32 handleHash);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyHolder() {
        require(_identities[msg.sender].exists, "No identity found");
        _;
    }

    constructor() {
        owner = msg.sender;
        _addCredentialType("wallet", 10);
        _addCredentialType("name", 10);
        _addCredentialType("email", 10);
        _addCredentialType("bio", 10);
        _addCredentialType("twitter", 15);
        _addCredentialType("discord", 15);
        _addCredentialType("evmWallet", 10);
        _addCredentialType("solanaWallet", 10);
        _addCredentialType("btcWallet", 10);
    }

    function _addCredentialType(string memory credentialType, uint8 points) internal {
        _allowedCredentials[credentialType] = CredentialType({ points: points, exists: true });
        _credentialTypeList.push(credentialType);
        emit CredentialTypeAdded(credentialType, points);
    }

    function addCredentialType(string calldata credentialType, uint8 points) external onlyOwner {
        require(!_allowedCredentials[credentialType].exists, "Type already exists");
        require(points > 0 && points <= 20, "Invalid points");
        _addCredentialType(credentialType, points);
    }

    function createIdentity(bytes32 dataHash) external {
        require(!_identities[msg.sender].exists, "Identity already exists");
        _identities[msg.sender] = Identity({
            score: 0,
            issuedAt: block.timestamp,
            updatedAt: block.timestamp,
            dataHash: dataHash,
            exists: true
        });
        emit IdentityCreated(msg.sender, 0);
    }

    function addCredential(string calldata credentialType, bytes32 credentialHash) external onlyHolder {
        require(_allowedCredentials[credentialType].exists, "Invalid credential type");
        require(_credentials[msg.sender][credentialType] == bytes32(0), "Credential already added");

        uint8 points = _allowedCredentials[credentialType].points;
        _credentials[msg.sender][credentialType] = credentialHash;
        _credentialKeys[msg.sender].push(credentialType);

        uint16 calculated = uint16(_identities[msg.sender].score) + uint16(points);
        uint8 newScore = calculated > 100 ? 100 : uint8(calculated);
        _identities[msg.sender].score = newScore;
        _identities[msg.sender].updatedAt = block.timestamp;

        emit CredentialAdded(msg.sender, credentialType, credentialHash);
        emit IdentityUpdated(msg.sender, newScore);
    }

    function updateCredential(string calldata credentialType, bytes32 newCredentialHash) external onlyHolder {
        require(_allowedCredentials[credentialType].exists, "Invalid credential type");
        require(_credentials[msg.sender][credentialType] != bytes32(0), "Credential not found");
        require(newCredentialHash != bytes32(0), "Empty hash");

        _credentials[msg.sender][credentialType] = newCredentialHash;
        _identities[msg.sender].updatedAt = block.timestamp;

        emit CredentialUpdated(msg.sender, credentialType, newCredentialHash);
    }

    function getIdentity(address account) external view returns (uint8 score, uint256 issuedAt, uint256 updatedAt, bytes32 dataHash) {
        require(_identities[account].exists, "No identity found");
        Identity memory id = _identities[account];
        return (id.score, id.issuedAt, id.updatedAt, id.dataHash);
    }

    function getScore(address account) external view returns (uint8) {
        if (!_identities[account].exists) return 0;
        return _identities[account].score;
    }

    function isVerified(address account) external view returns (bool) {
        return _identities[account].exists;
    }

    function getCredential(address account, string calldata credentialType) external view returns (bytes32) {
        return _credentials[account][credentialType];
    }

    function getCredentialKeys(address account) external view returns (string[] memory) {
        return _credentialKeys[account];
    }

    function getAllowedCredentialTypes() external view returns (string[] memory) {
        return _credentialTypeList;
    }

    function getCredentialPoints(string calldata credentialType) external view returns (uint8) {
        require(_allowedCredentials[credentialType].exists, "Invalid type");
        return _allowedCredentials[credentialType].points;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setSocial(bytes32 platformHash, bytes32 handleHash) external onlyHolder {
        require(
            platformHash == keccak256("twitter") ||
            platformHash == keccak256("discord") ||
            platformHash == keccak256("email"),
            "Unsupported platform"
        );
        require(handleHash != bytes32(0), "Empty handle");

        bytes32 lookupKey = keccak256(abi.encodePacked(platformHash, handleHash));
        address existing = _handleToAddress[lookupKey];
        require(existing == address(0) || existing == msg.sender, "Handle already claimed");

        bytes32 oldHash = _socialHashes[msg.sender][platformHash];
        if (oldHash != bytes32(0)) {
            bytes32 oldKey = keccak256(abi.encodePacked(platformHash, oldHash));
            delete _handleToAddress[oldKey];
        }

        _socialHashes[msg.sender][platformHash] = handleHash;
        _handleToAddress[lookupKey] = msg.sender;

        emit SocialLinked(msg.sender, platformHash, handleHash);
    }

    function getSocialHash(address account, bytes32 platformHash) external view returns (bytes32) {
        return _socialHashes[account][platformHash];
    }

    function getAddressByHandle(bytes32 platformHash, bytes32 handleHash) external view returns (address) {
        bytes32 lookupKey = keccak256(abi.encodePacked(platformHash, handleHash));
        return _handleToAddress[lookupKey];
    }
}
