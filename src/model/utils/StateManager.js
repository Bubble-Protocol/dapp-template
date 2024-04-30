// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { useEffect, useState } from "react";
import { EventManager } from "./EventManager";

/**
 * Basic app state management similar to React Redux.
 */
export class StateManager {

  listeners = new EventManager();
  state = {}

  register(name, initialValue) {
    this.state[name] = initialValue;
    this.listeners.addEvents([name]);
  }

  dispatch(name, newValue) {
    if (!this.listeners.hasEvent(name)) throw new Error('non-existent state data: '+name);
    this.state[name] = newValue;
    this.listeners.notifyListeners(name, newValue);
  }

  useStateData(name) {
    if (!this.listeners.hasEvent(name)) throw new Error('non-existent state data: '+name);
    const listeners = this.listeners;
    const initialValue = this.state[name];
    return () => {
      const [data, updateData] = useState(initialValue);
      useEffect(() => {
        listeners.on(name, updateData);
        return () => listeners.off(name, updateData);
      }, [])
      return data;
    }
  }

}