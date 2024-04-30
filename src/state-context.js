// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { StateManager } from "./model/utils/StateManager";


/**
 * @dev The global state manager used to dispatch events from the model to the UI.
 */

export const stateManager = new StateManager();
