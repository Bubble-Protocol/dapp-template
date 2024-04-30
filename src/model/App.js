// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import * as assert from './utils/assertions';
import { stateManager } from '../state-context';
import { Wallet } from './Wallet';
import { Session } from './Session';
import { APP_ID, APP_NAME } from '../config';
import { AppError } from './utils/errors';

/**
 * @dev Application state enum. @See the `state` property below.
 */
const STATES = {
  closed: 'closed',
  initialising: 'initialising',
  initialised: 'initialised',
  failed: 'failed'
}


/**
 * The CommunityApp class is the entry point for the model. It provides all UI-facing functions
 * and keeps the UI informed of the application state, task list and any errors via the 
 * `stateManager`.
 */
export class Model {

  /**
   * @dev Combined initialisation state of the application and session made available to the UI.
   * 
   *   - closed => wallet not connected
   *   - initialising => session is being initialised
   *   - initialised => session has been successfully initialised
   *   - failed => session or application failed to initialise (cause given in the `error` event)
   */
  state = STATES.closed;

  /**
   * @dev The current 'logged in' session. When the user connects their wallet or switches
   * wallet account a new session is constructed. (@see _accountChanged).
   */
  session;

  /**
   * @dev The wallet handler that listens to the user's wallet state (via wagmi).
   */
  wallet;

  /**
   * @dev Constructs the wallet handler and sets up the initial UI state.
   */
  constructor() {
    console.trace('Constructing the model');

    // Validate configuration data
    if (!assert.isNotEmpty(APP_ID)) throw new AppError('You must configure APP_ID within config.js', {code: 'configuration-error'});
    if (!assert.isNotEmpty(APP_NAME)) throw new AppError('You must configure APP_NAME within config.js', {code: 'configuration-error'});

    // Construct the wallet and listen for changes to the selected account
    this.wallet = new Wallet(APP_NAME);
    this.wallet.on('account-changed', this._accountChanged.bind(this));

    // Register UI state data
    stateManager.register('state', this.state);
    stateManager.register('error');
    stateManager.register('session-state', 'closed');
    stateManager.register('session-data', {});

    // Register UI functions
    stateManager.register('wallet-functions', {
      login: this.login.bind(this),
      logout: this.logout.bind(this)
    });

    console.trace('Model constructed');
  }

  /**
   * @dev Logs in to the connected session. Rejects if wallet is not connected.
   */
  async login(...args) {
    if (!this.session) return Promise.reject('Connect wallet before logging in');
    return this.session.login(...args);
  }

  /**
   * @dev Logs out of the connected session. Rejects if wallet is not connected.
   */
  async logout() {
    if (!this.session) return Promise.reject('Connect wallet before logging out');
    return this.session.logout();
  }

  /**
   * @dev Called by the wallet whenever the user switches accounts or disconnects their wallet.
   * Closes any existing session first, clearing the UI state.
   */
  _accountChanged(account) {
    this._closeSession();
    if (account) {
      this._openSession();
    }
    else this._setState(STATES.closed);
  }

  /**
   * @dev Starts a new session on first connect or whenever the wallet account is changed. 
   */
  _openSession() {
    this.session = new Session(APP_ID, this.wallet);
    this._initialiseSession();
  }

  /**
   * @dev Initialises the Session. Keeps the UI up-to-date on the state of the app as the 
   * Session is initialised.
   */
  async _initialiseSession() {
    this._setState(STATES.initialising);
    return this.session.initialise()
      .then(sessionData => {
        stateManager.dispatch('session-data', sessionData);
        this._setState(STATES.initialised);
      })
      .catch(error => {
        console.warn(error);
        this._setState(STATES.failed);
        stateManager.dispatch('error', error)
      });
  }

  /**
   * @dev Closes any existing session and clears the UI state
   */
  _closeSession() {
    if (this.session) {
      stateManager.dispatch('error');
      this.session = undefined;
      stateManager.dispatch('session-data', {});
      stateManager.dispatch('session-state', 'closed');
    }
  }

  /**
   * @dev Sets the app state and informs the UI
   */
  _setState(state) {
    this.state = state;
    stateManager.dispatch('state', this.state);
  }

}