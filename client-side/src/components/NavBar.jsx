import React from "react";

const NavBar = ({isConnected, connect}) => {
  return (
    <>
      <div className="navBar">
        <div className="navButton">
          Markets
        </div>
        <div className="navButton">
          Assets
        </div>
        {
          isConnected() ? (
            <div className="connectButton">Connected</div>
          ) : (
              <div className="connectButton" onClick={() => connect()}>
                Connect Wallet
              </div>
          )
        }
      </div>
    </>
  )
}

export default NavBar 