import React, {useState} from 'react'



const StakeModal = ({onClose, stakeLength, stakePercent, setAmount, stakeEther}) => {
  return (
    <div className='modal-class' onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-body">
          <h2 className="titleHeader">stake Ether</h2>
          <div className="row">
            <div className="col-md-9 fieldContainer">
              <input
                className='inputField'
                placeholder='0.0'
                onChange={e => setAmount(e.target.value)}
              />
            </div>     
            <div className="col-md-3 inputFielsUnitsContainer">
              <span>Eth</span>
            </div>
          </div>
          <div className="row">
            <h6 className="titleHeader stakingTerms">{stakeLength} days @ {stakePercent} APY</h6>
          </div>
        </div>
        <div className="row">
          <div
            onClick={() => stakeEther()}
          className="orangeButton">Stake</div></div>
      </div>
    </div>
  )
}

export default StakeModal