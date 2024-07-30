require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: { mnemonic: process.env.MNEMONIC },
    },
    holesky: {
      url: `https://holesky.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: { mnemonic: process.env.MNEMONIC },
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: { mnemonic: process.env.MNEMONIC },
    },
    "op-mainnet": {
      url: "https://mainnet.optimism.io", // Public RPC URL
      chainId: 10,
      accounts: { mnemonic: process.env.MNEMONIC },
      // Additional OP Mainnet info:
      // Network Name: OP Mainnet
      // Currency Symbol: ETH
      // Explorer: https://optimistic.etherscan.io
      // Sequencer URL (write only): https://mainnet-sequencer.optimism.io
    },
    "op-sepolia": {
      url: "https://sepolia.optimism.io", // Public RPC URL
      chainId: 11155420,
      accounts: { mnemonic: process.env.MNEMONIC },
      // Additional OP Sepolia info:
      // Network Name: OP Sepolia
      // Currency Symbol: ETH
      // Explorer: https://sepolia-optimistic.etherscan.io
      // Sequencer URL (write only): https://sepolia-sequencer.optimism.io
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha: {
    extension: ['js', 'cjs', 'mjs'],
  },
};
