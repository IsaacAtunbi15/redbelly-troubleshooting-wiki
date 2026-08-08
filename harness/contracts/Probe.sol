// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @title Probe
/// @notice Minimal contract used by the troubleshooting wiki's verification harness.
///         Deployed to Redbelly Testnet to prove that the documented Hardhat config,
///         deployment flow and Routescan verification flow actually work.
/// @dev Deliberately tiny: the point is to exercise the toolchain, not the contract.
contract Probe {
    /// @notice Set at construction so the harness can prove constructor arguments encode
    ///         and verify correctly on Routescan.
    string public label;

    /// @notice Block timestamp at deployment.
    uint256 public deployedAt;

    uint256 private counter;

    event Bumped(address indexed by, uint256 newValue);

    constructor(string memory _label) {
        label = _label;
        deployedAt = block.timestamp;
    }

    /// @notice State-changing call used to verify that a permissioned address can write.
    function bump() external returns (uint256) {
        counter += 1;
        emit Bumped(msg.sender, counter);
        return counter;
    }

    /// @notice Read-only call used to verify eth_call works before any write is attempted.
    function value() external view returns (uint256) {
        return counter;
    }

    /// @notice Always reverts with a reason string. Used to verify that eth_call surfaces
    ///         revert reasons that eth_estimateGas swallows (wiki entry C3).
    function alwaysReverts() external pure {
        revert("Probe: intentional revert");
    }
}
