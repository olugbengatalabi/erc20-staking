// const { ethers } = require("hardhat")
const { expect } =require("chai");
const { waffle, ethers } = require("hardhat");
// const { time } = require('@openzeppelin/test-helpers');

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
      expect(await staking.lockPeriods(2)).to.equal(120)
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


describe('modifyLockPeriods', () => { 
  describe("owner", () => {
    it("should create a new lock period", async function () {
      await staking.connect(signer1).modifyLock(100, 999);
      expect(await staking.tiers(100)).to.equal(999)
      expect(await staking.lockPeriods(3)).to.equal(100)
    })
    it("should modify a new lock period", async function () {
      await staking.connect(signer1).modifyLock(30, 150);
      expect(await staking.tiers(30)).to.equal(150)
    })

  })
  describe("non-owner", () => {
    it("reverts", async function () {
      expect(staking.connect(signer2).modifyLock(100, 999)).to.be.revertedWith(
        "Only owner may modify staking"
      )
      // no await in this expect function
    })
  })
 })


describe("getLockPeriods", () => {
  it("returns all lock Periods", async () => {
    const lockPeriods = await staking.getLockPeriods()
    expect(
      lockPeriods.map (v => Number(v._hex))
    ).to.eql([
      30, 90, 120
      // eql checks nested equality father than just equality
    ])
  })
})


describe('getInterestRate', () => {
  it("returns the interest rate for a specific lock period", async () => {
    const interestRate = await staking.getInterestRate(30)
    expect(interestRate).to.equal(700)
  })
})
 

describe('getPositionById', () => { 
  it("returns data about a specific position", async () => {
    const provider = waffle.provider;
    // await time.increase(3600);
    // const provider = new ethers.providers.Web3Provider(hre.waffle.provider.provider);
    const transferAmount = ethers.utils.parseEther("5.0")
    const data = { value: transferAmount }
    const transaction = await staking.connect(signer1).stakeEther(90, data)
    const receipt = transaction.wait()
    await transaction.wait();
    // await time.increase(time.duration.days(90));
    const block = await provider.getBlock(receipt.blockNumber)
    const position = await staking.connect(signer1.address).getPositionById(0)
    console.log(position);



    // expect(position.positionId).to.equal(0)
    // expect(position.walletAdress).to.equal(signer1.address)
    // expect(position.createdDate).to.equal(block.timestamp)
    // expect(position.unlockDate).to.equal(block.timestamp + (86400 * 90))
    // expect(position.percentInterest).to.equal(1000)
    // expect(position.weiStaked).to.equal(transferAmount)
    // expect(position.weiInterest).to.equal(ethers.BigNumber.from(transferAmount).mul(1000).div(10000))
    // expect(position.open).to.equal(true)



    expect(position[0].toString()).to.equal("0");
    expect(position[1]).to.equal(signer1.address);
    expect(position[2]).to.equal(block.timestamp);
    expect(position[3]).to.equal(block.timestamp + (86400 * 90));
    expect(position[4].toString()).to.equal("1000");
    expect(position[5].toString()).to.equal(transferAmount.toString());
    expect(position[6].toString()).to.equal(ethers.BigNumber.from(transferAmount).mul(1000).div(10000).toString());
    expect(position[7]).to.equal(true);

  })
})
  
  describe("getPositionIdsForAddress", () => {
    it("returns a list of positionIds created by a specific address", async () => {
      let data;
      let transaction;
      data = { value: ethers.utils.parseEther('5') }
      transaction = await staking.connect(signer1).stakeEther(90, data);
      data = { value: ethers.utils.parseEther("10") }
      transaction = await staking.connect(signer1).stakeEther(90, data);

      const positionIds = await staking.getPositionIdsForAddress(signer1.address)
      expect(
        positionIds.map(p => Number(p))
      ).to.eql(
        [0,1]
      )
    })
  })

  describe("changeUnlockDate", function () {
    describe("owner", function () {
      it('changes the unlock Date', async () => {
        const data = { value: ethers.utils.parseEther("8") }
        transaction = await staking.connect(signer2).stakeEther(90, data)
        const positionOld = await staking.getPositionById(0)
        const oldUnlockDate = positionOld.unlockDate
        console.log(oldUnlockDate - (86400 * 20));
        const newUnlockDate = positionOld.unlockDate - (86400 * 20)
        console.log(newUnlockDate);
        await staking.connect(signer1).changeUnlockDate(0, newUnlockDate)
        positionNew = await staking.getPositionById(0)

        expect(
          positionNew.unlockDate
        ).to.be.equal(
          oldUnlockDate - (86400 * 20)
        )
        
      })
    })
    describe("non-owner", function () {
      it("reverts", async () => {
        const data = { value: ethers.utils.parseEther("8") }
        transaction = await staking.connect(signer2).stakeEther(90, data)
        const positionOld = await staking.getPositionById(0)
        const newUnlockDate = positionOld.unlockDate - (86400 * 500)
        expect(
          staking.connect(signer2).changeUnlockDate(0, newUnlockDate)).to.be.revertedWith("only owner can call this function")
        
      })
    })
  })

  describe("closePosition", () => {
    describe('after Unlock date', () => {
      it("transfers principal and interest", async () => {
        let transaction
        let block
        const provider = waffle.provider;
        const data = { value: ethers.utils.parseEther("8") }
        transaction = await staking.connect(signer2).stakeEther(90, data)
        receipt = transaction.wait()
        block = await provider.getBlock(receipt.blockNumber)
        const newUnlockDate = block.timestamp - (86400 * 100)
        await staking.connect(signer1).changeUnlockDate(0, newUnlockDate)
        const position = await staking.getPositionById(0)
        const signerBalanceBefore = await signer2.getBalance()
        transaction = await staking.connect(signer2).closePosition(0)
        receipt = await transaction.wait()

        const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice)
        const signerBalanceAfter = await signer2.getBalance()
        expect(
          signerBalanceAfter
        ).to.equal(signerBalanceBefore.sub(gasUsed).add(position.weiStaked).add(position.weiInterest)
        )
      })
     })
    describe('before Unlock date', () => {
      it("transfers only principal ", async () => {
        let transaction
        let block
        const provider = waffle.provider;
        const data = { value: ethers.utils.parseEther("5") }
        transaction = await staking.connect(signer2).stakeEther(90, data)
        receipt = transaction.wait()
        block = await provider.getBlock(receipt.blockNumber)

        const position = await staking.getPositionById(0)
        const signerBalanceBefore = await signer2.getBalance()
        transaction = await staking.connect(signer2).closePosition(0)
        receipt = await transaction.wait()

        const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice)
        const signerBalanceAfter = await signer2.getBalance()
        expect(
          signerBalanceAfter
        ).to.equal(signerBalanceBefore.sub(gasUsed).add(position.weiStaked)
        )
      })
     })
  })
  
})
// questions 
// what is bignumer
// why does map return a ._hex