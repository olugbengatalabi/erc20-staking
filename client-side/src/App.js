import './App.css';
import react, { useEffect, useState } from "react"
import { ethers } from "ehters"
import artifact from "./artifacts/contracts/Staking.sol/Staking.json"
import NavBar from './components/NavBar';

const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"


function App() {
  // general 
  const [providerm, setProvider] = useState(undefined)
  const [signer, setSigner] = useState(undefined)
  const [contract, setContract] = useState(undefined)
  const [signerAddress, setSignerAddress] = useState(undefined)


  // specific for the assets
  const [assetIds, setAssetIds] = useState(undefined)
  // positions will be called assets on the fronend
  const [asset, setAsset] = useState([])


  // staking
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [stakeLength, setStakeLength] = useState(undefined)
  const [stakePercent, setStakePercent] = useState(undefined)
  const [stakeAmount, setStakeAmount] = useState(0)


  // helper functions
  const toString = bytes32 => ethers.utils.parseBytes32String(bytes32)
  const toWei = ether => ethers.utils.parseEther(ether)
  const toEther = ether => ethers.utils.formatEther(wei)


  useEffect(() => {
    const onLoad = async () => {
      const provider = await new ethers.provider.Web3Provider(window.ethereum)
      setProvider(provider);

      const contract = await new ethers.Contract(CONTRACT_ADDRESS, artifact.abi)
      setContract(contract)
    }
    onLoad()
  }, [])

  const isConnected = () => signer != undefined


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
    const seconsRemaining = unlockDate - timeNow
    return Math.max((seconsRemaining / 60 / 60 / 24).toFixed(0), 0)
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
    setStakingLength(stakingLength)
    setStakingPercent(stakingPercent)
  }

  const stakeEther = () => {
    const wei = toWei(amount)
    const data = { value: wei }
    contract.connect(signer).stakeEther(stakingLength, data)
  }

  const withdaw = positionId => {
    contract.connect(signer).closePosition(positionId)
  }
  return (
    <div className="App">
      <div className="">
        <NavBar isConnected={isConnected} connect={ connectAndLoad} />    
      </div>
    </div>
  );
}

export default App;
