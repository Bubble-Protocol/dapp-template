// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import * as assert from './utils/assertions';
import { ecdsa } from '@bubble-protocol/crypto';
import { Key } from '@bubble-protocol/crypto/src/ecdsa';
import { stateManager } from '../state-manager';

/**
 * @dev Application state enum. @See the `state` property below.
 */
const STATES = {
  open: 'open',
  loggedIn: 'logged-in'
}

/**
 * A Session is an instance of the app with a locally saved state. The local device can support
 * multiple sessions allowing the user to have different accounts for different wallet accounts.
 * 
 * The Session is identified by its ID, passed in the constructor. The state is saved to 
 * localStorage with the Session ID as the key name.
 * 
 * The Session is responsible for initialising any account data, including deploying any smart 
 * contracts and constructing any bubbles if they haven't been created before.
 */
export class Session {

  /**
   * @dev Session current state
   */
  state = STATES.open;

  /**
   * @dev The session's unique id derived from appId, chainId and account
   */
  id;

  /**
   * @dev The wallet object
   */
  wallet;

  /**
   * @dev The externally owned account address selected by the user's wallet
   */
  account;

  /**
   * @dev The chain id selected by the user's wallet
   */
  chainId;

  /**
   * @dev The session private key, optionally held in local storage and read on construction.
   */
  loginKey;

  /**
   * @dev Constructs this Session from the locally saved state.
   */
  constructor(appId, wallet) {
    console.trace('Constructing session');
    assert.isNotEmpty(appId, 'appId');
    assert.isObject(wallet, 'wallet');
    this.wallet = wallet;
    this.account = wallet.account;
    this.chainId = wallet.getChain();
    assert.isNotEmpty(this.chainId, 'wallet chain id');
    assert.isNotEmpty(this.account, 'wallet account');
    this.id = appId+'-'+this.chainId+'-'+this.account.slice(2).toLowerCase();
    console.trace('session id:', this.id);
    this._loadState();
  }

  /**
   * @dev Initialises the Session. The state of construction is determined by the properties read  
   * from the local saved state during construction.
   */
  async initialise() {
    console.trace('Initialising session');
    // TODO: Add any app-specific session initialisation here
    console.trace('Session initialised');
    return this.getSessionData();
  }

  /**
   * @dev Returns an object containing the public data for this session
   */
  getSessionData() {
    return {
      account: this.account,
      chainId: this.chainId,
      login: {
        address: this.loginKey ? this.loginKey.address : undefined,
        publicKey: this.loginKey ? '0x'+this.loginKey.cPublicKey : undefined
      }
    }
  }

  /**
   * @dev Logs in by requesting a login message signature from the user's wallet.
   * If `rememberMe` is set, the login will be saved indefinitely, or until `logout` is called.
   */
  async login(rememberMe = false) {
    if (this.state === STATES.loggedIn) return Promise.resolve();
    return this.wallet.login(this.account)
    .then(signature => {
      this.loginKey = new Key(ecdsa.hash(signature));
      if (rememberMe) this._saveState();
      else this._calculateState();
    })
  }

  /**
   * @dev Logs out of the session, deleting any saved login details
   */
  logout() {
    this.loginKey = undefined;
    // TODO: Clear any app-specific session data on logout
    this._saveState();
  }

  /**
   * @dev Loads the Session state from localStorage
   */
  _loadState() {
    const stateJSON = window.localStorage.getItem(this.id);
    const stateData = stateJSON ? JSON.parse(stateJSON) : {};
    console.trace('loaded session state', stateData);
    try {
      this.loginKey = stateData.key ? new Key(stateData.key) : undefined;
    }
    catch(_){}
    // TODO: load any app-specific session data
    this._calculateState();
  }

  /**
   * @dev Saves the Session state to localStorage
   */
  _saveState() {
    console.trace('saving session state');
    const stateData = {
      key: this.loginKey ? this.loginKey.privateKey : undefined
      // TODO: add any app-specific session data to be saved
  };
    window.localStorage.setItem(this.id, JSON.stringify(stateData));
    this._calculateState();
  }

  /**
   * @dev Determines the value of this.state
   */
  _calculateState() {
    const oldState = this.state;
    this.state = this.loginKey ? STATES.loggedIn : STATES.open;
    if (this.state !== oldState) {
      console.trace("session state:", this.state);
      stateManager.dispatch('session-state', this.state);
    }
  }

}