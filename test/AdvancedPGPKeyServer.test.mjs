import hre from 'hardhat';
const { ethers } = hre;
import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
import chaiAsPromised from 'chai-as-promised';
use(solidity);
use(chaiAsPromised);


describe("AdvancedPGPKeyServer", function () {
  let AdvancedPGPKeyServer;
  let ReentrancyAttacker;
  let advancedPGPKeyServer;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const AdvancedPGPKeyServerFactory = await ethers.getContractFactory("AdvancedPGPKeyServer");
    advancedPGPKeyServer = await AdvancedPGPKeyServerFactory.deploy();
    await advancedPGPKeyServer.deployed();

    const ReentrancyAttackerFactory = await ethers.getContractFactory("ReentrancyAttacker");
    ReentrancyAttacker = await ReentrancyAttackerFactory.deploy(advancedPGPKeyServer.address);
    await ReentrancyAttacker.deployed();

    // Reset contract state
    await advancedPGPKeyServer.connect(owner).updateMinStake(ethers.utils.parseEther("0.1"));
    await advancedPGPKeyServer.connect(owner).updateTrustDecay(30 * 24 * 60 * 60, 5);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await advancedPGPKeyServer.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct default values", async function () {
      expect(await advancedPGPKeyServer.minStake()).to.equal(ethers.utils.parseEther("0.1"));
      expect(await advancedPGPKeyServer.trustDecayPeriod()).to.equal(30 * 24 * 60 * 60); // 30 days
      expect(await advancedPGPKeyServer.trustDecayPercentage()).to.equal(5);
    });
  });

  describe("Key Registration", function () {
    it("Should allow a user to register a key with sufficient stake", async function () {
      const publicKey = "test-public-key";
      await expect(advancedPGPKeyServer.connect(addr1).registerKey(publicKey, { value: ethers.utils.parseEther("0.1") }))
        .to.emit(advancedPGPKeyServer, "KeyRegistered")
        .withArgs(addr1.address, publicKey);
    });

  });

  describe("Key Registration", function () {
    it("Should allow a user to register a key with sufficient stake", async function () {
      const publicKey = "test-public-key";
      await expect(advancedPGPKeyServer.connect(addr1).registerKey(publicKey, { value: ethers.utils.parseEther("0.1") }))
        .to.emit(advancedPGPKeyServer, "KeyRegistered")
        .withArgs(addr1.address, publicKey);
    });

    it("Should not allow a user to register a key with insufficient stake", async function () {
      await expect(advancedPGPKeyServer.connect(addr1).registerKey("test-public-key", { value: ethers.utils.parseEther("0.05") }))
        .to.be.revertedWith("Insufficient stake");
    });

    it("Should not allow a user to register multiple keys", async function () {
      await advancedPGPKeyServer.connect(addr1).registerKey("test-public-key-1", { value: ethers.utils.parseEther("0.1") });
      await expect(advancedPGPKeyServer.connect(addr1).registerKey("test-public-key-2", { value: ethers.utils.parseEther("0.1") }))
        .to.be.revertedWith("Key already registered");
    });
  });

  describe("Key Attestation", function () {
    beforeEach(async function () {
      await advancedPGPKeyServer.connect(addr1).registerKey("test-public-key-1", { value: ethers.utils.parseEther("0.1") });
      await advancedPGPKeyServer.connect(addr2).registerKey("test-public-key-2", { value: ethers.utils.parseEther("0.1") });
    });

    it("Should allow a user to attest another user's key", async function () {
      await expect(advancedPGPKeyServer.connect(addr2).attestKey(addr1.address))
        .to.emit(advancedPGPKeyServer, "AttestationMade")
        .withArgs(addr2.address, addr1.address);
    });

    it("Should not allow a user to attest their own key", async function () {
      await expect(advancedPGPKeyServer.connect(addr1).attestKey(addr1.address))
        .to.be.revertedWith("Cannot attest own key");
    });

    it("Should not allow attestation of an unregistered key", async function () {
      await expect(advancedPGPKeyServer.connect(addr1).attestKey(addrs[0].address))
        .to.be.revertedWith("Key not registered");
    });

    it("Should not allow attestation within the cooldown period", async function () {
      await advancedPGPKeyServer.connect(addr2).attestKey(addr1.address);
      await expect(advancedPGPKeyServer.connect(addr2).attestKey(addr1.address))
        .to.be.revertedWith("Attestation on cooldown");

      // Fast forward time just shy of the cooldown period
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 - 10]);
      await ethers.provider.send("evm_mine");

      // Should still be on cooldown
      await expect(advancedPGPKeyServer.connect(addr2).attestKey(addr1.address))
        .to.be.revertedWith("Attestation on cooldown");

      // Fast forward the remaining time
      await ethers.provider.send("evm_increaseTime", [10]);
      await ethers.provider.send("evm_mine");

      // Now it should work
      await expect(advancedPGPKeyServer.connect(addr2).attestKey(addr1.address))
        .to.not.be.reverted;
    });
  });

  describe("Attestation Revocation", function () {
    beforeEach(async function () {
      await advancedPGPKeyServer.connect(addr1).registerKey("test-public-key-1", { value: ethers.utils.parseEther("0.1") });
      await advancedPGPKeyServer.connect(addr2).registerKey("test-public-key-2", { value: ethers.utils.parseEther("0.1") });
      await advancedPGPKeyServer.connect(addr2).attestKey(addr1.address);
    });

    it("Should allow a user to revoke their attestation", async function () {
      await expect(advancedPGPKeyServer.connect(addr2).revokeAttestation(addr1.address))
        .to.emit(advancedPGPKeyServer, "AttestationRevoked")
        .withArgs(addr2.address, addr1.address);
    });

    it("Should not allow revocation of non-existent attestation", async function () {
      await expect(advancedPGPKeyServer.connect(addr1).revokeAttestation(addr2.address))
        .to.be.revertedWith("No attestation to revoke");
    });

    it("Should not allow revocation of already revoked attestation", async function () {
      await advancedPGPKeyServer.connect(addr2).revokeAttestation(addr1.address);
      await expect(advancedPGPKeyServer.connect(addr2).revokeAttestation(addr1.address))
        .to.be.revertedWith("Attestation already revoked");
    });
  });

  describe("Key Revocation", function () {
    beforeEach(async function () {
      await advancedPGPKeyServer.connect(addr1).registerKey("test-public-key-1", { value: ethers.utils.parseEther("0.1") });
    });

    it("Should allow a user to revoke their own key", async function () {
      await expect(advancedPGPKeyServer.connect(addr1).revokeKey())
        .to.emit(advancedPGPKeyServer, "KeyRevoked")
        .withArgs(addr1.address);
    });

    it("Should not allow revocation of an unregistered key", async function () {
      await expect(advancedPGPKeyServer.connect(addr2).revokeKey())
        .to.be.revertedWith("Key not registered");
    });
  });

  describe("Stake Withdrawal", function () {
    beforeEach(async function () {
      await advancedPGPKeyServer.connect(addr1).registerKey("test-public-key-1", { value: ethers.utils.parseEther("0.1") });
    });

    it("Should allow withdrawal of stake after key revocation", async function () {
      await advancedPGPKeyServer.connect(addr1).revokeKey();
      await expect(advancedPGPKeyServer.connect(addr1).withdrawStake())
        .to.emit(advancedPGPKeyServer, "StakeWithdrawn")
        .withArgs(addr1.address, ethers.utils.parseEther("0.1"));
    });

    it("Should not allow withdrawal of stake without key revocation", async function () {
      await expect(advancedPGPKeyServer.connect(addr1).withdrawStake())
        .to.be.revertedWith("Can only withdraw stake after key revocation");
    });

    it("Should not allow withdrawal of stake twice", async function () {
      await advancedPGPKeyServer.connect(addr1).revokeKey();
      await advancedPGPKeyServer.connect(addr1).withdrawStake();
      await expect(advancedPGPKeyServer.connect(addr1).withdrawStake())
        .to.be.revertedWith("No stake to withdraw");
    });
  });

  describe("Trust Score and Metrics", function () {
    beforeEach(async function () {
      await advancedPGPKeyServer.connect(addr1).registerKey("test-public-key-1", { value: ethers.utils.parseEther("0.1") });
      await advancedPGPKeyServer.connect(addr2).registerKey("test-public-key-2", { value: ethers.utils.parseEther("0.1") });
    });

    it("Should update trust score after attestation", async function () {
      await advancedPGPKeyServer.connect(addr2).attestKey(addr1.address);
      const trustScore = await advancedPGPKeyServer.getTrustScore(addr1.address);
      expect(trustScore).to.be.gt(0);
    });

    it("Should decrease trust score after attestation revocation", async function () {
      await advancedPGPKeyServer.connect(addr2).attestKey(addr1.address);
      const scoreBefore = await advancedPGPKeyServer.getTrustScore(addr1.address);
      await advancedPGPKeyServer.connect(addr2).revokeAttestation(addr1.address);
      const scoreAfter = await advancedPGPKeyServer.getTrustScore(addr1.address);
      expect(scoreAfter).to.be.lt(scoreBefore);
    });

    it("Should return correct trust metrics", async function () {
      await advancedPGPKeyServer.connect(addr2).attestKey(addr1.address);
      const metrics = await advancedPGPKeyServer.getTrustMetrics(addr1.address);
      expect(metrics.totalWeight).to.be.gt(0);
      expect(metrics.recentActivityScore).to.be.gt(0);
      expect(metrics.longevityScore).to.be.gte(0);
      expect(metrics.diversityScore).to.be.gt(0);
      expect(metrics.reputationScore).to.be.gte(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update minimum stake", async function () {
      const newMinStake = ethers.utils.parseEther("0.2");
      await expect(advancedPGPKeyServer.connect(owner).updateMinStake(newMinStake))
        .to.emit(advancedPGPKeyServer, "MinStakeUpdated")
        .withArgs(newMinStake);
      expect(await advancedPGPKeyServer.minStake()).to.equal(newMinStake);
    });

    it("Should not allow non-owner to update minimum stake", async function () {
      await expect(advancedPGPKeyServer.connect(addr1).updateMinStake(ethers.utils.parseEther("0.2")))
        .to.be.revertedWith("OwnableUnauthorizedAccount");
    });

    it("Should allow owner to update trust decay parameters", async function () {
      const newPeriod = 60 * 24 * 60 * 60; // 60 days
      const newPercentage = 10;
      await expect(advancedPGPKeyServer.connect(owner).updateTrustDecay(newPeriod, newPercentage))
        .to.emit(advancedPGPKeyServer, "TrustDecayUpdated")
        .withArgs(newPeriod, newPercentage);
      expect(await advancedPGPKeyServer.trustDecayPeriod()).to.equal(newPeriod);
      expect(await advancedPGPKeyServer.trustDecayPercentage()).to.equal(newPercentage);
    });

    it("Should not allow setting trust decay percentage above 100", async function () {
      await expect(advancedPGPKeyServer.connect(owner).updateTrustDecay(30 * 24 * 60 * 60, 101))
        .to.be.revertedWith("Decay percentage cannot exceed 100");
    });

    it("Should allow owner to withdraw funds", async function () {
      await advancedPGPKeyServer.connect(addr1).registerKey("test-public-key-1", { value: ethers.utils.parseEther("0.1") });
      const initialBalance = await ethers.provider.getBalance(owner.address);
      await advancedPGPKeyServer.connect(owner).withdrawFunds();
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should allow owner to pause and unpause the contract", async function () {
      await advancedPGPKeyServer.connect(owner).pause();
      expect(await advancedPGPKeyServer.paused()).to.be.true;
      await advancedPGPKeyServer.connect(owner).unpause();
      expect(await advancedPGPKeyServer.paused()).to.be.false;
    });

    it("Should not allow operations when paused", async function () {
      await advancedPGPKeyServer.connect(owner).pause();
      await expect(advancedPGPKeyServer.connect(addr1).registerKey("test-public-key-1", { value: ethers.utils.parseEther("0.1") }))
        .to.be.revertedWith("EnforcedPause");
    });
  });

  describe("Potential Attack Scenarios", function () {
    it("Should prevent Sybil attacks by requiring minimum stake", async function () {
      for (let i = 0; i < 5; i++) {
        await expect(advancedPGPKeyServer.connect(addrs[i]).registerKey(`test-public-key-${i}`, { value: ethers.utils.parseEther("0.05") }))
          .to.be.revertedWith("Insufficient stake");
      }
    });

    it("Should limit the impact of malicious attestations", async function () {
      await advancedPGPKeyServer.connect(addr1).registerKey("test-public-key-1", { value: ethers.utils.parseEther("0.1") });
      await advancedPGPKeyServer.connect(addr2).registerKey("test-public-key-2", { value: ethers.utils.parseEther("0.1") });

      // Simulate multiple attestations from different addresses
      for (let i = 0; i < 5; i++) {
        await advancedPGPKeyServer.connect(addrs[i]).registerKey(`test-public-key-${i + 3}`, { value: ethers.utils.parseEther("0.1") });
        await advancedPGPKeyServer.connect(addrs[i]).attestKey(addr1.address);
      }

      const trustScore = await advancedPGPKeyServer.getTrustScore(addr1.address);
      expect(trustScore).to.be.lte(ethers.BigNumber.from(1000)); // Ensure trust score doesn't exceed max
    });

    it("Should prevent attestation spamming", async function () {
      await advancedPGPKeyServer.connect(addr1).registerKey("test-public-key-1", { value: ethers.utils.parseEther("0.1") });
      await advancedPGPKeyServer.connect(addr2).registerKey("test-public-key-2", { value: ethers.utils.parseEther("0.1") });

      await advancedPGPKeyServer.connect(addr2).attestKey(addr1.address);

      // Try to attest again immediately
      await expect(advancedPGPKeyServer.connect(addr2).attestKey(addr1.address))
        .to.be.revertedWith("Attestation on cooldown");

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // 1 day
      await ethers.provider.send("evm_mine");

      // Now attestation should be possible
      await expect(advancedPGPKeyServer.connect(addr2).attestKey(addr1.address))
        .to.not.be.reverted;
    });


    it("Should handle potential reentrancy attacks during stake withdrawal", async function () {
      // Register key and revoke it
      await ReentrancyAttacker.registerKey({ value: ethers.utils.parseEther("0.1") });
      await ReentrancyAttacker.revokeKey();

      // Attempt reentrancy attack
      await expect(ReentrancyAttacker.attack()).to.be.revertedWith("Transfer failed");
    });


    it("Should prevent manipulation of trust decay parameters", async function () {
      await expect(advancedPGPKeyServer.connect(owner).updateTrustDecay(0, 100))
        .to.be.revertedWith("Invalid decay period");

      await expect(advancedPGPKeyServer.connect(owner).updateTrustDecay(30 * 24 * 60 * 60, 101))
        .to.be.revertedWith("Decay percentage cannot exceed 100");
    });

  });

  describe("Edge Cases", function () {
    it("Should handle registration with exact minimum stake", async function () {
      await expect(advancedPGPKeyServer.connect(addr1).registerKey("test-public-key-1", { value: ethers.utils.parseEther("0.1") }))
        .to.not.be.reverted;
    });

    it("Should handle registration with more than minimum stake", async function () {
      await expect(advancedPGPKeyServer.connect(addr1).registerKey("test-public-key-1", { value: ethers.utils.parseEther("0.2") }))
        .to.not.be.reverted;
    });

    it("Should handle trust score calculation for a key with no attestations", async function () {
      await advancedPGPKeyServer.connect(addr1).registerKey("test-public-key-1", { value: ethers.utils.parseEther("0.1") });
      const trustScore = await advancedPGPKeyServer.getTrustScore(addr1.address);
      expect(trustScore).to.equal(0);
    });

    it("Should handle trust score calculation after long periods of inactivity", async function () {
      await advancedPGPKeyServer.connect(addr1).registerKey("test-public-key-1", { value: ethers.utils.parseEther("0.1") });
      await advancedPGPKeyServer.connect(addr2).registerKey("test-public-key-2", { value: ethers.utils.parseEther("0.1") });
      await advancedPGPKeyServer.connect(addr2).attestKey(addr1.address);

      // Fast forward a year
      await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const trustScore = await advancedPGPKeyServer.getTrustScore(addr1.address);
      expect(trustScore).to.be.lt(await advancedPGPKeyServer.MAX_TRUST_SCORE());
    });

    it("Should handle the case when all attestations for a key are revoked", async function () {

      let metrics = await advancedPGPKeyServer.getTrustMetrics(addr1.address);
      expect(metrics.totalWeight).to.equal(0);
      expect(metrics.recentActivityScore).to.equal(0);
      expect(metrics.diversityScore).to.equal(0);
      expect(metrics.reputationScore).to.equal(0);
      await advancedPGPKeyServer.connect(addr1).registerKey("test-public-key-1", { value: ethers.utils.parseEther("0.1") });
      await advancedPGPKeyServer.connect(addr2).registerKey("test-public-key-2", { value: ethers.utils.parseEther("0.1") });


      // Check initial trust score and active attestations
      let trustScore = await advancedPGPKeyServer.getTrustScore(addr1.address);
      let activeAttestations = await advancedPGPKeyServer.activeAttestations(addr1.address);
      expect(trustScore).to.equal(0);
      expect(activeAttestations).to.equal(0);

      // Make attestation
      await advancedPGPKeyServer.connect(addr2).attestKey(addr1.address);

      trustScore = await advancedPGPKeyServer.getTrustScore(addr1.address);
      activeAttestations = await advancedPGPKeyServer.activeAttestations(addr1.address);
      expect(trustScore).to.be.gt(0);
      expect(activeAttestations).to.equal(1);

      // Revoke attestation
      await advancedPGPKeyServer.connect(addr2).revokeAttestation(addr1.address);

      metrics = await advancedPGPKeyServer.getTrustMetrics(addr1.address);
      expect(metrics.totalWeight).to.equal(0);
      expect(metrics.recentActivityScore).to.equal(0);
      expect(metrics.diversityScore).to.equal(0);
      expect(metrics.reputationScore).to.equal(0);

      trustScore = await advancedPGPKeyServer.getTrustScore(addr1.address);
      activeAttestations = await advancedPGPKeyServer.activeAttestations(addr1.address);
      expect(trustScore).to.equal(0);
      expect(activeAttestations).to.equal(0);

      // Check trust metrics

    });
  });
});
