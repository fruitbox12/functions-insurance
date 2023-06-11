const fs = require("fs")
require("@chainlink/env-enc").config()

const Location = {
  Inline: 0,
  Remote: 1,
}

const CodeLanguage = {
  JavaScript: 0,
}

const ReturnType = {
  uint: "uint256",
  uint256: "uint256",
  int: "int256",
  int256: "int256",
  string: "string",
  bytes: "Buffer",
  Buffer: "Buffer",
}

const requestConfig = {
  codeLocation: Location.Inline,
  codeLanguage: CodeLanguage.JavaScript,
  source: fs.readFileSync("./Fitness-API-example.js").toString(),
  secrets: {
    googleFitnessToken: process.env.FITNESS_API_TOKEN,
    clientAddress: process.env.CLIENT_ADDR,
  },
  walletPrivateKey: process.env["PRIVATE_KEY"],
  args: ["me"], // In this case, "me" is passed as argument to get user's data
  expectedReturnType: ReturnType.string,
  secretsURLs: [],
}

module.exports = requestConfig
