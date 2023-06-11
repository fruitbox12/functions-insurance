require("@chainlink/env-enc").config()
require("@nomicfoundation/hardhat-toolbox")
require("hardhat-contract-sizer")
require("@openzeppelin/hardhat-upgrades")
require("./tasks")

const npmCommand = process.env.npm_lifecycle_event
const isTestEnvironment = npmCommand == "test" || npmCommand == "test:unit"

// Set one of the following RPC endpoints (required)

let MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL
let MAINNET_RPC_URL = process.env.MUMBAI_RPC_URL

// Ensure one of the RPC endpoints has been set
if (!isTestEnvironment && !MAINNET_RPC_URL && !POLYGON_MAINNET_RPC_URL && !MUMBAI_RPC_URL && !SEPOLIA_RPC_URL) {
  throw Error(
    "One of the following environment variables must be set: MAINNET_RPC_URL, SEPOLIA_RPC_URL, POLYGON_MAINNET_RPC_URL, or MUMBAI_RPC_URL"
  )
}

// Set EVM private key (required)
const PRIVATE_KEY = process.env.PRIVATE_KEY
if (!isTestEnvironment && !PRIVATE_KEY) {
  throw Error("Set the PRIVATE_KEY environment variable with your EVM wallet private key")
}

// Set a specific block number to fork (optional)
const FORKING_BLOCK_NUMBER = isNaN(process.env.FORKING_BLOCK_NUMBER)
  ? undefined
  : parseInt(process.env.FORKING_BLOCK_NUMBER)

// Your API key for Etherscan, obtain one at https://etherscan.io/ (optional)
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY

// Enable gas reporting (optional)
const REPORT_GAS = process.env.REPORT_GAS?.toLowerCase() === "true" ? true : false

const SOLC_SETTINGS = {
  optimizer: {
    enabled: true,
    runs: 1_000,
  },
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      {
        version: "0.8.7",
        settings: SOLC_SETTINGS,
      },
      {
        version: "0.7.0",
        settings: SOLC_SETTINGS,
      },
      {
        version: "0.6.6",
        settings: SOLC_SETTINGS,
      },
      {
        version: "0.4.24",
        settings: SOLC_SETTINGS,
      },
    ],
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      accounts: process.env.PRIVATE_KEY
        ? [
            {
              privateKey: process.env.PRIVATE_KEY,
              balance: "10000000000000000000000",
            },
          ]
        : {},
    },
  
    mumbai: {
      url: MUMBAI_RPC_URL ?? "UNSET",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 80001,
      nativeCurrencySymbol: "MATIC",
      nativeCurrencyDecimals: 18,
      nativePriceFeed: "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada",
      mainnet: false,
    },
  
  },
  etherscan: {
    // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
    },
  },
  gasReporter: {
    enabled: REPORT_GAS,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
  },
  contractSizer: {
    runOnCompile: false,
    only: ["FunctionsConsumer", "AutomatedFunctionsConsumer", "FunctionsBillingRegistry"],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./build/cache",
    artifacts: "./build/artifacts",
  },
  mocha: {
    timeout: 200000, // 200 seconds max for running tests
  },
}
