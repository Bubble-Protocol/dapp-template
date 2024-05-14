// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import React, { useState } from "react";
import './style.css';
import { stateManager } from "../../../state-manager";
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';
import { CheckBox } from "../../components/CheckBox/CheckBox";
import heroImage from "../../images/hero.jpg";

/**
 * The community join screen
 */

export function Home() {

  // RainbowKit hooks
  const { openConnectModal } = useConnectModal();

  // Model state data
  const appState = stateManager.useStateData('state')();
  const sessionState = stateManager.useStateData('session-state')();
  const appError = stateManager.useStateData('error')();
  const { login } = stateManager.useStateData('wallet-functions')();

  // Local state data
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState(false);

  function loginUser() {
    setLocalError();
    login(rememberMe)
    .catch(error => {
      console.warn(error);
      setLocalError(error);
    });
  }

  const error = localError || appError;

  return (
    <>
        <div className="hero-section">
            <div className="titles">
                <span className="title">
                  My <span className="highlight">Amazing</span> App
                </span>
                <span className="subtitle">
                  Welcome to my amazing app
                </span>
            </div>
            <div className="hero-image-frame">
                <img className="hero-image" src={heroImage} alt="hero"/>
            </div>
        </div>

        <div className="page-width-section">
          <span className="section-title">Login</span>

          {appState !== 'closed' && appState !== 'initialising' && <ConnectButton /> }

          {/* Spinner View */}
          {appState === 'initialising' && <div className="loader"></div>}

          {/* Failure Views */}
          {appState === 'failed' && <p>Failed to initialise app</p>}
          {appState === 'initialised' && sessionState === 'logged-in' && <p>Unexpected initialised STATES</p>}

          {/* Connect View */}
          {appState === 'closed' &&
            <>
              <div className="button-row">
                <div className="cta-button-hollow" onClick={openConnectModal}>Connect Wallet</div>
              </div>
            </>
          }

          {/* Login View */}
          {appState === 'initialised' && sessionState !== 'logged-in' &&
            <div className="button-row">
              <div className="cta-button-solid" onClick={loginUser}>Login</div>
              <div className="selector">
                <CheckBox selected={rememberMe} setSelected={setRememberMe} />
                <span>Remember Me</span>
              </div>
            </div>
          }

          {/* Error log */}
          {error && <span className='error-text'>{formatError(error)}</span>}

        </div>

    </>
  );

}


function formatError(error) {
  return error.details || error.message || error;
}

