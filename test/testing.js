// const { ethers } = require("hardhat")
const { expect } =require("chai");
const { waffle, ethers } = require("hardhat");


describe("staking", function () {
  beforeEach(async function () {
    [signer1, signer2] = await ethers.getSigners();

    Staking = await ethers.getContractFactory('Staking', signer1);
    staking = await Staking.deploy({
      value: ethers.utils.parseEther("10")
    });
  });

  describe('deploy', () => {
    it("should set owner", async function () {
      expect(await staking.owner()).to.equal(signer1.address)
    })
    it("sets up tiers and lockPeriods",  async function () {
      expect(await staking.lockPeriods(0)).to.equal(30)
      expect(await staking.lockPeriods(1)).to.equal(90)
      expect(await staking.lockPeriods(2)).to.equal(180)
      expect(await staking.tiers(30)).to.equal(700)
      expect(await staking.tiers(90)).to.equal(1000)
      expect(await staking.tiers(120)).to.equal(1200)
    })
  })
  
  describe('stakeEther', () => {
    it("transfers ether", async function () {
      const provider = waffle.provider;
      let contractBalance;
      let signerBalance;
      const transferAmount = ethers.utils.parseEther("2.0")
      
      contractBalance = await provider.getBalance(staking.address)
      // gets the amount of wei owned by the contract
      signerBalance = await signer1.getBalance()

      const data = { value: transferAmount }
      const transaction = await staking.connect(signer1).stakeEther(30, data);
      const receipt = await transaction.wait()
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice)
      // test the change in signer1 ether balance
      expect (await signer1.getBalance()).to.equal(signerBalance.sub(transferAmount).sub(gasUsed))

      // test for the change in contract ether balance
      expect (await provider.getBalance(staking.address)).to.equal(contractBalance.add(transferAmount))
    })
  })

  it("adds a position to positions", async function () {
    const provider = waffle.provider;
    let position;
    const transferAmount = ethers.utils.parseEther("1.0")
    // it is expected that before the first position is created, there should be no positions. calling for the position at id of 0 will return 0
    position = await staking.positions(0)
    console.log(position);
    console.log(position.positionId);
    expect(position.positionId).to.equal(0)

    expect(position.walletAdress).to.equal('0x0000000000000000000000000000000000000000')
    expect(position.createdDate).to.equal(0)
    expect(position.unlockDate).to.equal(0)
    expect(position.percentInterest).to.equal(0)
    expect(position.weiStaked).to.equal(0)
    expect(position.weiInterest).to.equal(0)
    expect(position.open).to.equal(false)


    // checking that the current positionId is zero  and increments as positions are created
    expect(await staking.currenetPositionId()).to.equal(0)

    // create some postions and check if this values have changed
    data = { value: transferAmount }
    const transaction = await staking.connect(signer1).stakeEther(90, data)
    const receipt = await transaction.wait()
    const block = await provider.getBlock(receipt.blockNumber)
    position = await staking.position(0)

    expect(position.positionId).to.equal(0)
    expect(position.walletAdress).to.equal(signer1.address)
    expect(position.createdDate).to.equal(block.timestamp)
    expect(position.unlockDate).to.equal(block.timestamp + (86400 * 90))
    // 86400seconds in a dday
    expect(position.percentInterest).to.equal(1000)
    expect(position.weiStaked).to.equal(transferAmount)
    expect(position.weiInterest).to.equal(ethers.BigNumber.from(transferAmount).mul(1000).div(10000))
    // convert transferamount to a big number, multiply it by 1000 basis points abd divide by 10000.. gives ys the interest 
    expect(position.open).to.equal(true)

    // current position Id should have increased by 1
    expect(await staking.currenetPositionId()).to.equal(1)

  })
  it("adds address and positionId to positionIdsAddress", async function () {
    const transferAmount = ethers.utils.parseEther('0.5')
    const data = {value: transferAmount}
    await staking.connect(signer1).stakeEther(30, data)
    await staking.connect(signer1).stakeEther(30, data)
    await staking.connect(signer2).stakeEther(90, data)

    expect(await staking.positionIdsByAddress(signer1.address, 0)).to.equal(0)
    // gets the first element from thet mapping
    expect(await staking.positionIdsByAddress(signer1.address, 1)).to.equal(1)
    expect(await staking.positionIdsByAddress(signer2.address, 0)).to.equal(2)

  })
})

desi



// questions 
// what is bignumer