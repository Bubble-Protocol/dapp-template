// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import * as assert from './assertions';
import { ecdsa } from '@bubble-protocol/crypto';
import { Key } from '@bubble-protocol/crypto/src/ecdsa';

/**
 * Application state enum. @See the `state` property below.
 */
const STATES = {
  open: 'open',
  loggedIn: 'logged-in'
}

/**
 * A LoginSession is an instance of the app with a locally saved state. The local device can support
 * multiple sessions allowing the user to have different accounts for different wallet accounts.
 * 
 * The LoginSession is identified by its ID, passed in the constructor. The state is saved to 
 * localStorage with the Session ID as the key name.
 */
export class LoginSession {

  /**
   * Session current state
   */
  state = STATES.open;

  /**
   * The session's unique id derived from appId, chainId and account
   */
  id;

  /**
   * The wallet object
   */
  wallet;

  /**
   * The externally owned account address selected by the user's wallet
   */
  account;

  /**
   * The chain id selected by the user's wallet
   */
  chainId;

  /**
   * The session private key, optionally held in local storage and read on construction.
   */
  loginKey;

  /**
   * Constructs this Session. Each session has a unique deterministic ID based on the appId, chainId
   * and account address. The session state is saved to localStorage with this ID as the key.
   * 
   * @param {string} appId A unique application-specific ID used to prefix the session data saved to localStorage
   * @param {Wallet} wallet - Wallet for contract interactions. Requires `account` field and `login` and `getChainId` functions.
   */
  constructor(appId, wallet) {
    assert.isNotEmpty(appId, 'appId');
    assert.isObject(wallet, 'wallet');
    this.wallet = wallet;
    this.account = wallet.account;
    this.chainId = wallet.getChainId();
    assert.isNotEmpty(this.chainId, 'wallet chain id');
    assert.isNotEmpty(this.account, 'wallet account');
    this.id = appId+'-'+this.chainId+'-'+this.account.slice(2).toLowerCase();
    console.trace('session id:', this.id);
  }

  /**
   * Initialises the Session by loading the state from localStorage
   */
  async initialise() {
    this._loadState();
    return this.getSessionData();
  }

  
  /**
   * Returns an object containing the public data for this session
   */
  getSessionData() {
    return {
      state: this.state,
      account: this.account,
      chainId: this.chainId,
      login: {
        address: this.loginKey ? this.loginKey.address : undefined,
        publicKey: this.loginKey ? '0x'+this.loginKey.cPublicKey : undefined
      }
    }
  }

  /**
   * Logs in by requesting a login message signature from the user's wallet.
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
    .then(this._onLogin.bind(this));
  }

  /**
   * Called when logging out and before saving the session state to localStorage. Override this method
   * to handle any app-specific session data clearing or other logout tasks.
   */ 
  async _onLogin() {
  }

  /**
   * Logs out of the session, deleting any saved login details
   */
  async logout() {
    await this._onLogout();
    this.loginKey = undefined;
    this._saveState();
  }

  /**
   * Called when logging out and before saving the session state to localStorage. Override this method
   * to handle any app-specific session data clearing or other logout tasks.
   */ 
  async _onLogout() {
  }

  /**
   * Loads the Session state from localStorage
   */
  _loadState() {
    const stateJSON = window.localStorage.getItem(this.id);
    const stateData = stateJSON ? JSON.parse(stateJSON) : {};
    console.trace('loaded session state', stateData);
    try {
      this.loginKey = stateData.key ? new Key(stateData.key) : undefined;
    }
    catch(_){}
    this._parseLoadedStateData(stateData);
    this._calculateState();
  }

  /**
   * Handle state data loaded from localStorage. Override this method to handle any app-specific
   * session data.
   * 
   * @param {Object} stateData 
   */
  _parseLoadedStateData(stateData) {
  }

  /**
   * Saves the Session state to localStorage
   */
  _saveState() {
    console.trace('saving session state');
    const stateData = {
      key: this.loginKey ? this.loginKey.privateKey : undefined,
      ...this._getStateDataForSaving()
  };
    window.localStorage.setItem(this.id, JSON.stringify(stateData));
    this._calculateState();
  }

  /**
   * Called when saving the session state to localStorage. Override this method to return any
   * app-specific session data to be saved.
   * 
   * @returns {Object} Any app-specific state data to be saved to localStorage. Empty by default.
   */
  _getStateDataForSaving() {
    return {};
  }

  /**
   * Determines the value of this.state
   */
  _calculateState() {
    const oldState = this.state;
    this.state = this.loginKey ? STATES.loggedIn : STATES.open;
    if (this.state !== oldState) {
      console.trace("session state:", this.state);
    }
  }

}