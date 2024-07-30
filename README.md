# Advanced PGP Key Server: Technical Documentation

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technical Details](#technical-details)
   - 3.1 [Contract Inheritance](#contract-inheritance)
   - 3.2 [Key Data Structures](#key-data-structures)
   - 3.3 [Core Functionality](#core-functionality)
   - 3.4 [Calculations and Algorithms](#calculations-and-algorithms)
   - 3.5 [Security Measures](#security-measures)
   - 3.6 [Gas Optimization](#gas-optimization)
   - 3.7 [Events](#events)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Usage](#usage)
7. [Deployment](#deployment)
   - 7.1 [Deployed Contract](#deployed-contract)
8. [Testing](#testing)
9. [Contributing](#contributing)
10. [License](#license)

## 1. Overview

The Advanced PGP Key Server is a smart contract-based solution for managing PGP keys on the Ethereum blockchain. It provides a decentralized platform for key registration, attestation, and trust scoring, enhancing the security and reliability of PGP key management.

## 2. Features

- PGP key registration with staking mechanism
- Key attestation system
- Trust scoring based on attestations and account activity
- Key revocation functionality
- Stake withdrawal after key revocation
- Trust decay mechanism to encourage active participation
- Admin functions for parameter adjustment

## 3. Technical Details

### 3.1 Contract Inheritance
The contract inherits from:
- `ReentrancyGuard`: Prevents reentrancy attacks
- `Ownable`: Provides basic access control
- `Pausable`: Allows pausing contract functionality

### 3.2 Key Data Structures

#### PGPKey
Stores information about a registered PGP key:
- `publicKey`: The PGP public key string
- `registrationTime`: Timestamp of key registration
- `isRevoked`: Boolean flag for key revocation status
- `stake`: Amount of ETH staked with the key
- `attestations`: Mapping of attestor addresses to Attestation structs
- `attestors`: Array of attestor addresses

#### Attestation
Represents an attestation made for a PGP key:
- `timestamp`: When the attestation was made
- `weight`: Importance of the attestation
- `isRevoked`: Whether the attestation has been revoked

#### TrustMetrics
Holds various metrics used to calculate trust scores:
- `totalWeight`: Sum of all attestation weights
- `recentActivityScore`: Based on recent attestations
- `longevityScore`: Based on account age
- `diversityScore`: Based on unique attestors
- `reputationScore`: Overall reputation score

### 3.3 Core Functionality

1. Key Registration
2. Attestations
3. Revocations
4. Trust Scoring
5. Stake Management
6. Admin Functions

### 3.4 Calculations and Algorithms

#### Attestation Weight Calculation
Formula: `weight = 50 - (attesterScore / 10)`

#### Trust Metrics Calculation
1. Total Weight
2. Recent Activity Score
3. Diversity Score
4. Longevity Score
5. Reputation Score

#### Trust Score Calculation
1. Raw Score Calculation
2. Score Capping
3. Trust Decay
4. Final Score Assignment

#### Key Algorithms
1. Attestation Process
2. Trust Score Update
3. Revocation Handling
4. Stake Management

### 3.5 Security Measures
- ReentrancyGuard for all state-changing functions
- Pausable functionality for emergency stops
- Access control for admin functions (Ownable)

### 3.6 Gas Optimization
- Limits the number of attestors processed in trust calculations (MAX_ATTESTORS_PER_UPDATE)
- Unique Attestor Tracking
- Selective Updates

### 3.7 Events
- Key registration
- Attestations (made/revoked)
- Key revocation
- Trust score updates
- Admin parameter changes

## 4. Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- An Ethereum wallet with test ETH (for deploying to testnets)
- Infura account (for deploying to public networks)
- Etherscan API key (for contract verification)

## 5. Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/advanced-pgp-key-server.git
   cd advanced-pgp-key-server
   ```

2. Install the dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add the following environment variables:
   ```
   MNEMONIC="your mnemonic phrase"
   INFURA_PROJECT_ID="your infura project id"
   ETHERSCAN_API_KEY="your etherscan api key"
   ```

## 6. Usage

To interact with the contract, you can use Hardhat tasks or write your own scripts. Here are some example commands:

- Compile the contracts:
  ```
  npm run compile
  ```

- Run the tests:
  ```
  npm run test
  ```

- Deploy to local Hardhat network:
  ```
  npm run deploy
  ```

## 7. Deployment

The contract can be deployed to various Ethereum networks. Use the following commands for deployment:

- Deploy to Sepolia testnet:
  ```
  npm run deploy:sepolia
  ```

- Deploy to Holesky testnet:
  ```
  npm run deploy:holesky
  ```

- Deploy to Ethereum mainnet:
  ```
  npm run deploy:mainnet
  ```

Note: Make sure you have sufficient ETH in your wallet to cover the deployment gas costs.

### 7.1 Deployed Contract

The contract has been deployed to the Holesky testnet at the following address:

```
0x431F968abe3Bf65b5Ac6998513A89E9D5c80CDD1
```

## 8. Testing

Test suite contains 38 tests. Currently all of them functioning as expected. To run the test suite, execute:

```
npm run test
```


## 9. Contributing

Contributions to the Advanced PGP Key Server project are welcome. Please follow these steps to contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Commit your changes (`git commit -am 'Add some feature'`)
5. Push to the branch (`git push origin feature/your-feature-name`)
6. Create a new Pull Request

Please make sure to update tests as appropriate and adhere to the existing coding style.

## 10. License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

For more information or support, please open an issue in the GitHub repository.
