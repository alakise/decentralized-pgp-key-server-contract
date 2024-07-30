const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);


  // Detect network and set values accordingly
  switch (network.name) {
    case "mainnet":
      console.log("Deploying to Ethereum Mainnet");
      break;
    case "sepolia":
      console.log("Deploying to Sepolia testnet");
      break;
    case "holesky":
      console.log("Deploying to Holesky testnet");
      break;
    case "op-mainnet":
      console.log("Deploying to OP Mainnet");
      break;
    case "op-sepolia":
      console.log("Deploying to OP Sepolia testnet");
      break;
    default:
      console.error("Unsupported network:", network.name);
      process.exit(1);
  }



  const AdvancedPGPKeyServerContract = await ethers.getContractFactory("AdvancedPGPKeyServer");
  const PGPKeyServer = await AdvancedPGPKeyServerContract.deploy();
  await PGPKeyServer.deployed();

  console.log("PGPKeyServer deployed to:", PGPKeyServer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
