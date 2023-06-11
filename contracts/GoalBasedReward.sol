// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import {Functions, FunctionsClient} from "./dev/functions/FunctionsClient.sol";

contract GoalBasedReward is FunctionsClient {
  using Functions for Functions.Request;

  bytes32 public latestRequestId;
  bytes public latestResponse;
  bytes public latestError;
  event OCRResponse(bytes32 indexed requestId, bytes result, bytes err);

  address public insurer;
  address public immutable client;

  // Check if the contract active or end
  bool public contractActive;

  // Check if the client has reached the goal
  bool public goalReached;

  // Staked amount by insurer
  uint256 public stakedAmount;

  // Goal to be reached
  uint256 public goal;

  // Current progress towards the goal
  uint256 public currentProgress;

  constructor(address oracle, address _client, uint256 _goal) payable FunctionsClient(oracle) {
    insurer = msg.sender;
    client = _client;
    goalReached = false;
    contractActive = true;
    goal = _goal;
    currentProgress = 0;
  }

  /**
   * @notice Stake ether in the contract
   */
  function stake() public payable {
    require(msg.sender == insurer, "Only insurer can stake");
    stakedAmount += msg.value;
  }

  /**
   * @notice Send a simple request
   * @param source JavaScript source code
   * @param secrets Encrypted secrets payload
   * @param args List of arguments accessible from within the source code
   * @param subscriptionId Billing ID
   */
  function executeRequest(
    string calldata source,
    bytes calldata secrets,
    string[] calldata args,
    uint64 subscriptionId,
    uint32 gasLimit
  ) public returns (bytes32) {
    require(contractActive, "Contract has ended");
    Functions.Request memory req;
    req.initializeRequest(Functions.Location.Inline, Functions.CodeLanguage.JavaScript, source);
    if (secrets.length > 0) {
      req.addRemoteSecrets(secrets);
    }
    if (args.length > 0) req.addArgs(args);

    bytes32 assignedReqID = sendRequest(req, subscriptionId, gasLimit);
    latestRequestId = assignedReqID;
    return assignedReqID;
  }

  /**
   * @notice Callback that is invoked once the DON has resolved the request or hit an error
   *
   * @param requestId The request ID, returned by sendRequest()
   * @param response Aggregated response from the user code
   * @param err Aggregated error from the user code or from the execution pipeline
   * Either response or error parameter will be set, but never both
   */
  function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
    latestResponse = response;
    latestError = err;
    emit OCRResponse(requestId, response, err);

    currentProgress = uint256(bytes32(response));

    // pay the client and shut down the contract
    if (currentProgress >= goal) {
      payoutContract();
    }
  }

  /**
   * @dev Goal conditions have been met, do payout of total staked amount to client
   */
  function payoutContract() internal {
    require(contractActive, "Contract has ended");
    (bool sent /*bytes memory data*/, ) = client.call{value: stakedAmount}("");
    contractActive = !sent;
    goalReached = sent;
  }

  /**
   * @dev Receive function so contract can receive ether when required
   */
  receive() external payable {}
}
