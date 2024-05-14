// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import React, { useState } from "react";
import './style.css';
import { stateManager } from "../../../state-manager";

export function Dashboard() {

  // Model state data
  const session = stateManager.useStateData('session')();
  const { logout } = stateManager.useStateData('wallet-functions')();

  // Local state data
  const [localError, setLocalError] = useState(false);
  
  function logoutUser() {
    setLocalError();
    logout()
    .catch(error => {
      console.warn(error);
      setLocalError(error);
    });
  }

  return (
    <div className="dashboard">

      <div className="page-width-section title-section">
          <span className="page-title">
            Your Dashboard
          </span>
        <p className="page-summary">
          Welcome to your dashboard.
        </p>
        <table>
          <tbody>
            <tr><td><b>Chain</b></td><td>{session.chainId}</td></tr>
            <tr><td><b>Wallet Account</b></td><td className="break">{session.account}</td></tr>
            <tr><td><b>Login Address</b></td><td className="break">{session.login.address}</td></tr>
            <tr><td><b>Login Public Key</b></td><td className="break">{session.login.publicKey}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="button-row">
        <div className="cta-button-hollow" onClick={logoutUser}>Logout</div>
      </div>

      {/* Error log */}
      {localError && <span className='error-text'>{formatError(localError)}</span>}

    </div>
  );

}


function formatError(error) {
  return error.details || error.message || error;
}