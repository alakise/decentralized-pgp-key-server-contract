// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AdvancedPGPKeyServer
 * @dev A decentralized PGP key server with trust scoring and attestation mechanisms
 */
contract AdvancedPGPKeyServer is ReentrancyGuard, Ownable, Pausable {
    /**
     * @dev Structure to store attestation details
     */
    struct Attestation {
        uint256 timestamp; // When the attestation was made
        uint256 weight; // Weight of the attestation
        bool isRevoked; // Whether the attestation has been revoked
    }

    /**
     * @dev Structure to store PGP key details
     */
    struct PGPKey {
        string publicKey; // The PGP public key
        uint256 registrationTime; // When the key was registered
        bool isRevoked; // Whether the key has been revoked
        uint256 stake; // Amount of stake associated with the key
        mapping(address => Attestation) attestations; // Attestations for this key
        address[] attestors; // List of attestors for this key
    }

    /**
     * @dev Structure to store trust metrics
     */
    struct TrustMetrics {
        uint256 totalWeight; // Total weight of all attestations
        uint256 recentActivityScore; // Score based on recent attestations
        uint256 longevityScore; // Score based on account age
        uint256 diversityScore; // Score based on unique attestors
        uint256 reputationScore; // Score based on overall reputation
    }

    // Mappings to store key, trust metrics, and trust scores
    mapping(address => PGPKey) public keys;
    mapping(address => TrustMetrics) public trustMetrics;
    mapping(address => uint256) public trustScores;
    mapping(address => uint256) public activeAttestations;

    // Constants and configurable parameters
    uint256 public constant MAX_TRUST_SCORE = 1000;
    uint256 public constant ATTESTATION_COOLDOWN = 1 days;
    uint256 public constant REVOCATION_PENALTY = 100;
    uint256 public minStake = 0.1 ether;
    uint256 public trustDecayPeriod = 30 days;
    uint256 public trustDecayPercentage = 5; // 5% decay
    uint256 public constant MAX_ATTESTORS_PER_UPDATE = 100;

    // Events
    event KeyRegistered(address indexed user, string publicKey);
    event AttestationMade(address indexed attester, address indexed keyOwner);
    event AttestationRevoked(
        address indexed attester,
        address indexed keyOwner
    );
    event KeyRevoked(address indexed user);
    event TrustScoreUpdated(address indexed user, uint256 newScore);
    event MinStakeUpdated(uint256 newMinStake);
    event StakeWithdrawn(address indexed user, uint256 amount);
    event TrustDecayUpdated(uint256 newPeriod, uint256 newPercentage);

    /**
     * @dev Modifier to ensure only registered and non-revoked key owners can perform certain actions
     */
    modifier onlyKeyOwner(address _keyOwner) {
        require(
            bytes(keys[_keyOwner].publicKey).length > 0,
            "Key not registered"
        );
        require(!keys[_keyOwner].isRevoked, "Key is revoked");
        _;
    }

    constructor() ReentrancyGuard() Ownable(msg.sender) Pausable() {
        // Initialize contract
    }

    /**
     * @dev Register a new PGP key
     * @param _publicKey The PGP public key to register
     */
    function registerKey(
        string memory _publicKey
    ) public payable nonReentrant whenNotPaused {
        require(
            bytes(keys[msg.sender].publicKey).length == 0,
            "Key already registered"
        );
        require(msg.value >= minStake, "Insufficient stake");

        keys[msg.sender].publicKey = _publicKey;
        keys[msg.sender].registrationTime = block.timestamp;
        keys[msg.sender].stake = msg.value;

        emit KeyRegistered(msg.sender, _publicKey);
    }

    /**
     * @dev Attest to the validity of another user's key
     * @param _keyOwner The address of the key owner to attest
     */
    function attestKey(
        address _keyOwner
    ) public onlyKeyOwner(_keyOwner) nonReentrant whenNotPaused {
        require(msg.sender != _keyOwner, "Cannot attest own key");
        require(
            block.timestamp >=
                keys[_keyOwner].attestations[msg.sender].timestamp +
                    ATTESTATION_COOLDOWN,
            "Attestation on cooldown"
        );

        uint256 attestationWeight = calculateAttestationWeight(msg.sender);
        keys[_keyOwner].attestations[msg.sender] = Attestation(
            block.timestamp,
            attestationWeight,
            false
        );
        keys[_keyOwner].attestors.push(msg.sender);

        // Increment the active attestations count
        activeAttestations[_keyOwner]++;

        updateTrustMetrics(_keyOwner);
        updateTrustScore(_keyOwner);

        emit AttestationMade(msg.sender, _keyOwner);
    }

    /**
     * @dev Revoke an attestation
     * @param _keyOwner The address of the key owner whose attestation is being revoked
     */
    function revokeAttestation(
        address _keyOwner
    ) public nonReentrant whenNotPaused {
        require(
            keys[_keyOwner].attestations[msg.sender].timestamp > 0,
            "No attestation to revoke"
        );
        require(
            !keys[_keyOwner].attestations[msg.sender].isRevoked,
            "Attestation already revoked"
        );

        keys[_keyOwner].attestations[msg.sender].isRevoked = true;

        // Decrement the active attestations count
        if (activeAttestations[_keyOwner] > 0) {
            activeAttestations[_keyOwner]--;
        }

        updateTrustMetrics(_keyOwner);
        updateTrustScore(_keyOwner);

        emit AttestationRevoked(msg.sender, _keyOwner);
    }

    /**
     * @dev Revoke one's own key
     */
    function revokeKey()
        public
        onlyKeyOwner(msg.sender)
        nonReentrant
        whenNotPaused
    {
        keys[msg.sender].isRevoked = true;
        trustScores[msg.sender] = 0;

        emit KeyRevoked(msg.sender);
    }

    /**
     * @dev Withdraw staked funds after key revocation
     */
    function withdrawStake() public nonReentrant whenNotPaused {
        require(
            keys[msg.sender].isRevoked,
            "Can only withdraw stake after key revocation"
        );
        uint256 stakeAmount = keys[msg.sender].stake;
        require(stakeAmount > 0, "No stake to withdraw");

        keys[msg.sender].stake = 0;
        (bool success, ) = payable(msg.sender).call{value: stakeAmount}("");
        require(success, "Transfer failed");

        emit StakeWithdrawn(msg.sender, stakeAmount);
    }

    /**
     * @dev Calculate the weight of an attestation based on the attester's trust score
     * @param _attester The address of the attester
     * @return The calculated attestation weight
     */
    function calculateAttestationWeight(
        address _attester
    ) internal view returns (uint256) {
        uint256 attesterScore = trustScores[_attester];
        uint256 baseWeight = 50;
        return baseWeight - (attesterScore / 10);
    }

    /**
     * @dev Update trust metrics for a key owner
     * @param _keyOwner The address of the key owner
     */
    function updateTrustMetrics(address _keyOwner) internal {
        TrustMetrics storage metrics = trustMetrics[_keyOwner];
        metrics.totalWeight = 0;
        metrics.recentActivityScore = 0;
        metrics.diversityScore = 0;
        metrics.reputationScore = 0; // Reset reputation score initially

        uint256 uniqueAttestors = 0;
        address[] memory processedAttestors = new address[](
            MAX_ATTESTORS_PER_UPDATE
        );

        for (
            uint i = 0;
            i < keys[_keyOwner].attestors.length &&
                i < MAX_ATTESTORS_PER_UPDATE;
            i++
        ) {
            address attestor = keys[_keyOwner].attestors[i];
            Attestation memory att = keys[_keyOwner].attestations[attestor];

            if (!att.isRevoked) {
                metrics.totalWeight += att.weight;

                // Recent activity score
                uint256 ageInDays = (block.timestamp - att.timestamp) / 1 days;
                if (ageInDays < 30) {
                    metrics.recentActivityScore += (30 - ageInDays);
                }

                // Diversity score
                bool isUnique = true;
                for (uint j = 0; j < uniqueAttestors; j++) {
                    if (processedAttestors[j] == attestor) {
                        isUnique = false;
                        break;
                    }
                }
                if (isUnique && uniqueAttestors < MAX_ATTESTORS_PER_UPDATE) {
                    processedAttestors[uniqueAttestors] = attestor;
                    uniqueAttestors++;
                }
            }
        }

        metrics.diversityScore = uniqueAttestors * 10;

        // Longevity score
        uint256 accountAgeInDays = (block.timestamp -
            keys[_keyOwner].registrationTime) / 1 days;
        metrics.longevityScore = accountAgeInDays > 365
            ? 100
            : ((accountAgeInDays * 100) / 365);

        // Recalculate the trust score
        updateTrustScore(_keyOwner);

        // Reputation score (based on updated trust score)
        metrics.reputationScore = trustScores[_keyOwner] / 10;
    }

    /**
     * @dev Update the trust score for a key owner
     * @param _keyOwner The address of the key owner
     */
    function updateTrustScore(address _keyOwner) internal {
        TrustMetrics memory metrics = trustMetrics[_keyOwner];

        uint256 rawScore = metrics.totalWeight +
            (metrics.recentActivityScore * 2) +
            (metrics.longevityScore) +
            (metrics.diversityScore) +
            (metrics.reputationScore);

        uint256 newScore = rawScore > MAX_TRUST_SCORE
            ? MAX_TRUST_SCORE
            : rawScore;

        // Apply trust decay
        uint256 lastUpdateTime = keys[_keyOwner].registrationTime;
        uint256 timeSinceLastUpdate = block.timestamp - lastUpdateTime;
        uint256 decayPeriods = timeSinceLastUpdate / trustDecayPeriod;

        for (uint i = 0; i < decayPeriods; i++) {
            newScore = (newScore * (100 - trustDecayPercentage)) / 100;
        }

        // Set score to 0 if no active attestations, otherwise use the calculated score
        trustScores[_keyOwner] = activeAttestations[_keyOwner] > 0
            ? newScore
            : 0;

        emit TrustScoreUpdated(_keyOwner, trustScores[_keyOwner]);
    }

    /**
     * @dev Get the trust score for a key owner
     * @param _keyOwner The address of the key owner
     * @return The trust score
     */
    function getTrustScore(address _keyOwner) public view returns (uint256) {
        return trustScores[_keyOwner];
    }

    /**
     * @dev Get the public key for a key owner
     * @param _keyOwner The address of the key owner
     * @return The public key
     */
    function getPublicKey(
        address _keyOwner
    ) public view returns (string memory) {
        require(!keys[_keyOwner].isRevoked, "Key is revoked");
        return keys[_keyOwner].publicKey;
    }

    /**
     * @dev Get the trust metrics for a key owner
     * @param _keyOwner The address of the key owner
     * @return The trust metrics
     */
    function getTrustMetrics(
        address _keyOwner
    ) public view returns (TrustMetrics memory) {
        return trustMetrics[_keyOwner];
    }

    // Admin functions

    /**
     * @dev Update the minimum stake required for key registration
     * @param _newMinStake The new minimum stake amount
     */
    function updateMinStake(uint256 _newMinStake) public onlyOwner {
        minStake = _newMinStake;
        emit MinStakeUpdated(_newMinStake);
    }

    /**
     * @dev Update the trust decay parameters
     * @param _newPeriod The new decay period
     * @param _newPercentage The new decay percentage
     */
    function updateTrustDecay(
        uint256 _newPeriod,
        uint256 _newPercentage
    ) public onlyOwner {
        require(_newPeriod > 0, "Invalid decay period");
        require(_newPercentage <= 100, "Decay percentage cannot exceed 100");
        trustDecayPeriod = _newPeriod;
        trustDecayPercentage = _newPercentage;
        emit TrustDecayUpdated(_newPeriod, _newPercentage);
    }

    /**
     * @dev Withdraw accumulated funds to the contract owner
     */
    function withdrawFunds() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Pause the contract
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() public onlyOwner {
        _unpause();
    }
}
