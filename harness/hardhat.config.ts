import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import { configVariable, defineConfig } from "hardhat/config";

/**
 * Hardhat 3 configuration for Redbelly Network.
 *
 * This file is the reference config the wiki points developers at (entry E3). Redbelly
 * publishes no Hardhat config of its own — the Vine portal recommends Hardhat and links to
 * hardhat.org without giving network settings — so everything here is derived from the
 * environment values on vine.redbelly.network/environments/ and verified against the live
 * chain by the harness.
 *
 * Two things here are Redbelly-specific and are the reason a generic config does not work:
 *
 *  1. `evmVersion: "prague"`. Redbelly's SEVM implements Prague and its docs pin Solidity
 *     0.8.30. Solidity 0.8.31 and later default to `osaka`, so a modern toolchain left on
 *     defaults compiles for an EVM revision newer than the chain implements. See wiki E1.
 *
 *  2. `chainDescriptors`. Hardhat 3 replaced hardhat-verify's `customChains` array with a
 *     top-level `chainDescriptors` map. Redbelly is not on Etherscan's multichain list, so
 *     without these entries `hardhat verify` fails with
 *     'The network "..." with chain id "153" is not supported.' See wiki F1.
 *
 * No `gasPrice` is set anywhere. Redbelly prices gas in USD terms and eth_gasPrice returns
 * roughly 165,000 gwei; any hardcoded value is wrong within days. See wiki C1.
 */

const ROUTESCAN_MAINNET_API =
  "https://api.routescan.io/v2/network/mainnet/evm/151/etherscan";
const ROUTESCAN_TESTNET_API =
  "https://api.routescan.io/v2/network/testnet/evm/153/etherscan";

export default defineConfig({
  plugins: [hardhatEthers, hardhatVerify],

  solidity: {
    profiles: {
      // The profile that matches the chain.
      default: {
        version: "0.8.30",
        settings: {
          evmVersion: "prague",
          optimizer: { enabled: true, runs: 200 },
        },
      },
      // Deliberately mismatched profile, used by the harness to reproduce E1's failure
      // condition rather than only assert its fix. Never deploy with this.
      osakaMismatch: {
        version: "0.8.31",
        settings: {
          evmVersion: "osaka",
          optimizer: { enabled: true, runs: 200 },
        },
      },
    },
  },

  chainDescriptors: {
    151: {
      name: "Redbelly Network Mainnet",
      blockExplorers: {
        etherscan: {
          name: "Routescan",
          url: "https://redbelly.routescan.io",
          apiUrl: ROUTESCAN_MAINNET_API,
        },
      },
    },
    153: {
      name: "Redbelly Testnet",
      blockExplorers: {
        etherscan: {
          name: "Routescan",
          url: "https://redbelly.testnet.routescan.io",
          apiUrl: ROUTESCAN_TESTNET_API,
        },
      },
    },
  },

  // Routescan's Etherscan-compatible API accepts verification without a key, but
  // hardhat-verify errors on an empty apiKey, so a placeholder is supplied.
  verify: {
    etherscan: {
      apiKey: "routescan",
    },
  },

  networks: {
    redbellyTestnet: {
      type: "http",
      chainType: "l1",
      url: "https://governors.testnet.redbelly.network",
      chainId: 153,
      accounts: [configVariable("REDBELLY_PRIVATE_KEY")],
    },
    redbellyMainnet: {
      type: "http",
      chainType: "l1",
      url: "https://governors.mainnet.redbelly.network",
      chainId: 151,
      accounts: [configVariable("REDBELLY_PRIVATE_KEY")],
    },
  },
});
