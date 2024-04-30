// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

/**
 * Generic class that provides basic event handling
 */
export class EventManager {

  updateListeners = {}

  constructor(events=[]) {
    this.addEvents(events);
  }

  addEvents(events) {
    events.forEach(event => this.updateListeners[event] = []);
  }

  hasEvent(event) {
    return !!this.updateListeners[event];
  }

  on(event, listener) {
    if (this.updateListeners[event] === undefined) throw new Error('invalid event');
    if (!this.updateListeners[event].includes(listener)) this.updateListeners[event].push(listener);
  }

  off(event, listener) {
    if (this.updateListeners[event] === undefined) throw new Error('invalid event');
    this.updateListeners[event] = this.updateListeners[event].filter(l => l !== listener);
  }

  notifyListeners(event, ...payload) {
    if (this.updateListeners[event] === undefined) throw new Error('invalid event');
    this.updateListeners[event].forEach(l => l(...payload));
  }

}