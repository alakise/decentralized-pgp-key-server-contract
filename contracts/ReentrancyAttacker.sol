// SPDX-License-Identifier: MIT
// Mock contract for testing reentrancy attacks
pragma solidity ^0.8.0;
import "./AdvancedPGPKeyServer.sol";

interface IAdvancedPGPKeyServer {
    function registerKey(string memory publicKey) external payable;
    function revokeKey() external;
    function withdrawStake() external;
}

contract ReentrancyAttacker {
    IAdvancedPGPKeyServer public target;
    bool public attackMode = false;

    constructor(address _target) {
        target = IAdvancedPGPKeyServer(_target);
    }

    function registerKey() external payable {
        require(msg.value >= 0.1 ether, "Insufficient stake");
        target.registerKey{value: msg.value}("attacker-public-key");
    }

    function revokeKey() external {
        target.revokeKey();
    }

    function attack() external {
        attackMode = true;
        target.withdrawStake();
    }

    receive() external payable {
        if (attackMode) {
            target.withdrawStake();
        }
    }
}