// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { LoginSession } from './utils/LoginSession';

/**
 * A Session is an instance of the app with a locally saved state. The local device can support
 * multiple sessions allowing the user to have different accounts for different wallet accounts.
 * 
 * The `LoginSession` base class provides the basic session management functions, including
 * loading and saving the session state to local storage and providing login and logout functions.
 * 
 * Implement this class to manage any app-specific session data and functions.
 */
export class Session extends LoginSession {

  /**
   * Returns an object containing the public data for this session
   */
  getSessionData() {
    return {
      ...super.getSessionData(),
      // TODO: Add any app-specific session data here
    }
  }
  
  /**
   * Closes the session
   */
  async close() {
    // TODO: Add any app-specific session close tasks here
  }
  
  /**
   * Called after a successful login.
   */ 
  async _onLogin() {
    // TODO: Add any app-specific login tasks here
  }

  /**
   * Called when logging out and before saving the session state to localStorage.
   */ 
  async _onLogout() {
    // TODO: Add any app-specific logout tasks here, such as clearing state data
  }

  /**
   * Handle state data loaded from localStorage. Override this method to handle any app-specific
   * session data.
   * 
   * @param {Object} stateData 
   */
  _parseLoadedStateData(stateData) {
    // TODO: Parse any app-specific session data here
  }
  
  /**
   * Called when saving the session state to localStorage. Override this method to return any
   * app-specific session data to be saved.
   * 
   * @returns {Object} Any app-specific state data to be saved to localStorage. Empty by default.
   */
  _getStateDataForSaving() {
    return {
      // TODO: Add any app-specific session data here
    };
  }
    
}