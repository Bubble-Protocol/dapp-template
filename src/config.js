// Copyright (c) 2024 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

/**
 * See also .env.example. You must copy that file to .env.local and set your secret keys
 */


/**
 * @dev Imported chains. See `SUPPORTED_BLOCKCHAINS` below.
 */
import { polygon } from 'wagmi/chains';

/**
 * Enable or disable trace and debug logging
 */
export const TRACE_ON = true;
export const DEBUG_ON = true;

/**
 * @dev The unique id of your application. 
 * 
 * Is used by the Session class to label any data saved to local storage. Must be unique for each application hosted on the same domain.
 * 
 * Example: "my_amazing_app"
 */
export const APP_ID = "";

/**
 * @dev The user-facing name of your application. 
 * 
 * Is used in the login message to be signed by the user when they first log in.
 * Is also used by RainbowKit (see `rainbow-kit.js`).
 * 
 * Example: "My Amazing App"
 */
export const APP_NAME = "";

/**
 * @dev Set the list of blockchains your dapp supports. Import each from `wagmi/chains`.
 * 
 * Used by RainbowKit (see `rainbow-kit.js`).
 */
export const SUPPORTED_BLOCKCHAINS = [polygon];

