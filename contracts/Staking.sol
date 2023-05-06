// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract Staking {
  address public owner;

  struct Position {
    uint PositionId;
    address walletAddress;
    uint createdDate;
    uint unlockDate;
    uint percentIntrest;
    uint weiStaked;
    uint weiInterest;
    bool open;
  }

  
  // a position is an amount of ether staked by a specific address at a particular point in time for some length

  Position position;
  uint public currentPositionId;
    // ID increments after current position is created
  mapping (uint => Position) public positions;
  // mapping of integers to position, every new position will be added to this mapping . 
  // Each position will be quereable by the ID of the key its stored under

  mapping (address=>uint[]) public positionIdsByAddress;
  // this way you can get all the positions created by a specific address

  mapping (uint=>uint) public tiers;
  // this mapping is for number of days to interest rate

  uint[] public lockPeriods;

  constructor() payable {
    owner = msg.sender;
    currentPositionId = 0;
    tiers[30] = 700;
    // 7% APY
    tiers[90] = 1000;
    tiers[120] = 1200;

    lockPeriods.push(30);
    lockPeriods.push(90);
    lockPeriods.push(180);
  }
  function stakeEther(uint numDays) external payable{
    require(tiers[numDays] > 0, "Invalid number of days");
    positions[currentPositionId] = Position (
      currentPositionId,
      msg.sender,
      block.timestamp,
      block.timestamp + (numDays * 1 days),
      tiers[numDays],
      msg.value,
      calculateInterest(tiers[numDays], msg.value),
      true
    );

    positionIdsByAddress[msg.sender].push(currentPositionId);
    currentPositionId += 1;

  }

  function calculateInterest(uint basisPoints, uint weiAmount) private pure returns(uint) {
    return basisPoints * weiAmount / 10000;
    // what's the point of accepting the numdays arguement?
  }
  function  modifyLock(uint numDays, uint basisPoints) external {
    require(owner == msg.sender, "Only owner may modify staking");
    // modifies an existing mapping or creates a new tier if it doesn't already exist
    tiers[numDays] = basisPoints;
    lockPeriods.push(numDays);
  }
  function getLockPeriods() external view returns(uint[] memory) {
    return lockPeriods;
  }

  function getInterestRate(uint numDays) external view returns(uint) {
    return tiers[numDays];
  }
  function getPositionById(uint positionId) external view returns(Position memory){
    return positions[positionId];
  }
  function getPositionIdsForAddress(address walletAddress) external view returns(uint[] memory) {
    return positionIdsByAddress[walletAddress];
  }

  function changeUnlockDate(uint positionId, uint newUnlockDate) external view{
    require(owner == msg.sender, "only owner can call this function");
    // shouldn't you require that the position already exists.. or does it create a new postion if it doesn't
    positions[positionId].unlockDate == newUnlockDate;
  }


  function closePosition(uint positionId) external returns(bool, bytes memory){
    require(positions[positionId].walletAddress == msg.sender, "only position author can change position");
    require(positions[positionId].open == true, "position is closed");
    positions[positionId].open = false;
    if (block.timestamp > positions[positionId].unlockDate) {
      uint amount = positions[positionId].weiStaked + positions[positionId].weiInterest;
      (bool success, bytes memory data) = payable(msg.sender).call{value:amount}("");
      return (success, data);
    } else {
      uint amount = positions[positionId].weiStaked;
      (bool success, bytes memory data) = payable(msg.sender).call{value: amount}(""); 
      return (success, data);
    }
  }
}
// Qestions
// 1. What is memory,
// 2. why bytes
// 3. .call vs .send  