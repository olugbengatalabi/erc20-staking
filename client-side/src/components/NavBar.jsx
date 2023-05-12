import React from "react";

import React from 'react'

const NavBar = ({isConnected, connectAndLoad}) => {
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
              <div className="connectButton" onClick={() => connectAndLoad()}>
                Connect Wallet
              </div>
          )
        }
      </div>
    </>
  )
}

export default NavBar 