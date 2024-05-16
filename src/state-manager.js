// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { useEffect, useState } from "react";
import { StateManager } from "./model/utils/StateManager";


/**
 * The global state manager used to dispatch events from the model to the UI.
 */

export const stateManager = new StateManager();


/**
 * Hook to access a specific model state data value.
 */
export function useModelStateData(name) {
  const [data, setData] = useState(stateManager.getState(name));

  useEffect(() => {
    const updateData = (newValue) => {
      setData(newValue);
    };

    stateManager.subscribe(name, updateData);

    return () => {
      stateManager.unsubscribe(name, updateData);
    };
  }, [name]);

  return data;
}