import './App.css';
import react, { useEffect, useState } from "react"
import { ethers } from "ethers"
import artifact from "./artifacts/contracts/Staking.sol/Staking.json"
import NavBar from './components/NavBar';
import StakeModal from './components/StakeModal';
import { Coin, Bank, PiggyBank } from 'react-bootstrap-icons';

const CONTRACT_ADDRESS = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0"


function App() {
  // general 
  const [provider, setProvider] = useState(undefined)
  const [signer, setSigner] = useState(undefined)
  const [contract, setContract] = useState(undefined)
  const [signerAddress, setSignerAddress] = useState(undefined)


  // specific for the assets
  const [assetIds, setAssetIds] = useState([])
  // positions will be called assets on the fronend
  const [assets, setAssets] = useState([])


  // staking
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [stakeLength, setStakeLength] = useState(undefined)
  const [stakePercent, setStakePercent] = useState(undefined)
  const [amount, setAmount] = useState(0)


  // helper functions
  const toString = bytes32 => ethers.utils.parseBytes32String(bytes32)
  const toWei = ether => ethers.utils.parseEther(ether)
  const toEther = wei => ethers.utils.formatEther(wei)


  useEffect(() => {
    const onLoad = async () => {
      const provider = await new ethers.providers.Web3Provider(window.ethereum)
      setProvider(provider);

      const contract = await new ethers.Contract(CONTRACT_ADDRESS, artifact.abi)
      setContract(contract)
    }
    onLoad()
  }, [])

  const isConnected = () => signer !== undefined


  const getSigner = async () => {
    provider.send("eth_requestAccounts", [])
    const signer = provider.getSigner()
    // setSigner(signer)
    return signer
  }

  const getAssetsIds = async (address, signer) => {
    const assetIds = await contract.connect(signer).getPositionIdsForAddress(address)
    return assetIds
  }
  const calcDaysRemaining = (unlockDate) => {
    const timeNow = Date.now() / 1000
    // comes in milliseconds.. dividing by 1k converts it to seconds
    const secondsRemaining = unlockDate - timeNow
    return Math.max((secondsRemaining / 60 / 60 / 24).toFixed(0), 0)
    // toFixed removes decimals
    //, 0 ensures that it returns zero if the value is a negaive it just returns 0
  }

  const getAssets = async (ids, signer) => {
    const queriedAssets = await Promise.all(
      // waits until you get all the data you're querying.
      // resolves with an array of results if all the promises resolves, if any fails then its rejected
      ids.map(id => contract.connect(signer).getPositionById(id))
    )
    queriedAssets.map(async asset => {
      const parsedAsset = {
        positionId: asset.positionId,
        percentInterest: Number(asset.percentInterest) / 100,
        daysRemaining: calcDaysRemaining(Number(asset.unlockDate)),
        etherInterest: toEther(asset.weiInterest),
        etherStaked: toEther(asset.weiStaked),
        open: asset.open,

      }
      setAssetIds(prev => [...prev, parsedAsset])
      // ? ask gpt to explain
    })
  }

  const connectAndLoad = async () => {
    const signer = await getSigner(provider)
    setSigner(signer)

    const signerAddress = await signer.getAddress()
    setSignerAddress(signerAddress)

    const assetIds = await getAssetsIds(signerAddress, signer)
    setAssetIds(assetIds)
    getAssets(assetIds, signer)
  }

  const openStakingModal = (stakingLength, stakingPercent) => {
    setShowStakeModal(true)
    setStakeLength(stakingLength)
    setStakePercent(stakingPercent)
  }

  const stakeEther = () => {
    const wei = toWei(amount)
    const data = { value: wei }
    contract.connect(signer).stakeEther(stakeLength, data)
  }

  const withdraw = positionId => {
    contract.connect(signer).closePosition(positionId)
  }
  return (
    <div className="App">
      <div className="">
        <NavBar isConnected={isConnected} connect={connectAndLoad} />    
      </div>
      <div className="appBody">
        <div className="marketContainer">
          <div className="subContainer">
            <span>
              <img className='logoImg' src='eth-logo.webp'/>  
            </span>
            <span className='marketHeader'>Ethereum Market</span>
          </div>
        </div>
        <div className="row">
          <div className="col-md-4">
            <div className="marketOption" onClick={() => openStakingModal(30, '7%')}>
              <div className="glyphContainer hoverButton">
                <span className="glyph">
                  <Coin />
                </span>
              </div>
            </div>
            <div className="optionData">
              <span>1 month</span>
              <span className='optionPercent'>7%</span>
            </div>
          </div>
          <div className="col-md-4">
            <div className="marketOption" onClick={() => openStakingModal(90, '10%')}>
              <div className="glyphContainer hoverButton">
                <span className="glyph">
                  <Coin />
                </span>
              </div>
            </div>
            <div className="optionData">
              <span>3 months</span>
              <span className='optionPercent'>10%</span>
            </div>
          </div>
          <div className="col-md-4">
            <div className="marketOption" onClick={() => openStakingModal(120, '12%')}>
              <div className="glyphContainer hoverButton">
                <span className="glyph">
                  <Coin />
                </span>
              </div>
            </div>
            <div className="optionData">
              <span>4 months</span>
              <span className='optionPercent'>12%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="assetContainer">
        <div className="subContainer">
          <span className="marketHeader">Staked Assets</span>
        </div>
              <div className="row columnHeaders">
        <div className="col-md-2">Assets</div>
        <div className="col-md-2">Percent Interest</div>
        <div className="col-md-2">Staked</div>
        <div className="col-md-2">Interest</div>
        <div className="col-md-2">Days Remaining</div>
        <div className="col-md-2"></div>
      </div>
      </div>
        <br />
        {assetIds.length > 0 && assetIds.map((a, idx) => (
          <div className="row">
            <div className="col-md-2">
              <span>
                <img src="eth-logo.webp" alt="" className="stakedLogoImg" />
              </span>
            </div>
            <div className="col-md-2">
              {a.percentInterest} %
            </div>
            <div className="col-md-2">
              {a.etherStaked} 
            </div>
            <div className="col-md-2">
              {a.daysRemaining} 
            </div>
            <div className="col-md-2">
              {a.open ? (
                <div className="orangeMiniButton" onClick={() => withdraw(a.positionId)}>withdraw</div>
              ) : (
                  <span>closed</span>
              )}
            </div>
          </div>
        ))}
      
      {showStakeModal && (
        <StakeModal onClose={() => setShowStakeModal(false)}
          stakingLength={stakeLength}
          stakePercent={ stakePercent}
          amount={amount}
          setAmount={setAmount}
          stakeEther={stakeEther}
        />
      )}
    </div>
  );
}

export default App;
