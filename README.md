# Advanced PGP Key Server

A decentralized PGP key server with trust scoring and attestation mechanisms built on Ethereum.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Overview

The Advanced PGP Key Server is a smart contract-based solution for managing PGP keys on the Ethereum blockchain. It provides a decentralized platform for key registration, attestation, and trust scoring, enhancing the security and reliability of PGP key management.

## Features

- PGP key registration with staking mechanism
- Key attestation system
- Trust scoring based on attestations and account activity
- Key revocation functionality
- Stake withdrawal after key revocation
- Trust decay mechanism to encourage active participation
- Admin functions for parameter adjustment

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- An Ethereum wallet with test ETH (for deploying to testnets)
- Infura account (for deploying to public networks)
- Etherscan API key (for contract verification)

## Installation

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

## Usage

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

## Deployment

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

### Deployed Contract

The contract has been deployed to the Holesky testnet at the following address:

```
0x431F968abe3Bf65b5Ac6998513A89E9D5c80CDD1
```

## Testing

To run the test suite, execute:

```
npm run test
```

Current tests:
```
  AdvancedPGPKeyServer
    Deployment
      ✔ Should set the right owner
      ✔ Should initialize with correct default values
    Key Registration
      ✔ Should allow a user to register a key with sufficient stake
    Key Registration
      ✔ Should allow a user to register a key with sufficient stake
      ✔ Should not allow a user to register a key with insufficient stake
      ✔ Should not allow a user to register multiple keys
    Key Attestation
      ✔ Should allow a user to attest another user's key
      ✔ Should not allow a user to attest their own key
      ✔ Should not allow attestation of an unregistered key
      ✔ Should not allow attestation within the cooldown period
    Attestation Revocation
      ✔ Should allow a user to revoke their attestation
      ✔ Should not allow revocation of non-existent attestation
      ✔ Should not allow revocation of already revoked attestation
    Key Revocation
      ✔ Should allow a user to revoke their own key
      ✔ Should not allow revocation of an unregistered key
    Stake Withdrawal
      ✔ Should allow withdrawal of stake after key revocation
      ✔ Should not allow withdrawal of stake without key revocation
      ✔ Should not allow withdrawal of stake twice
    Trust Score and Metrics
      ✔ Should update trust score after attestation
      ✔ Should decrease trust score after attestation revocation
      ✔ Should return correct trust metrics
    Admin Functions
      ✔ Should allow owner to update minimum stake
      ✔ Should not allow non-owner to update minimum stake
      ✔ Should allow owner to update trust decay parameters
      ✔ Should not allow setting trust decay percentage above 100
      ✔ Should allow owner to withdraw funds
      ✔ Should allow owner to pause and unpause the contract
      ✔ Should not allow operations when paused
    Potential Attack Scenarios
      ✔ Should prevent Sybil attacks by requiring minimum stake
      ✔ Should limit the impact of malicious attestations (51ms)
      ✔ Should prevent attestation spamming
      ✔ Should handle potential reentrancy attacks during stake withdrawal
      ✔ Should prevent manipulation of trust decay parameters
    Edge Cases
      ✔ Should handle registration with exact minimum stake
      ✔ Should handle registration with more than minimum stake
      ✔ Should handle trust score calculation for a key with no attestations
      ✔ Should handle trust score calculation after long periods of inactivity
      ✔ Should handle the case when all attestations for a key are revoked
  38 passing (2s)

```

This will run all the tests defined in the `test` directory, covering various scenarios and edge cases for the Advanced PGP Key Server contract.


## Contributing

Contributions to the Advanced PGP Key Server project are welcome. Please follow these steps to contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Commit your changes (`git commit -am 'Add some feature'`)
5. Push to the branch (`git push origin feature/your-feature-name`)
6. Create a new Pull Request

Please make sure to update tests as appropriate and adhere to the existing coding style.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

For more information or support, please open an issue in the GitHub repository.