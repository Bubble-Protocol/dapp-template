// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import UI from './ui/App.js';
import { rainbowKitConfig } from './ui/rainbow-kit.js';
import { Model } from './model/App.js';
import './index.css';
import { DEBUG_ON, TRACE_ON } from './config.js';

/**
 * @dev Add trace and debug commands to the console. Use `console.stackTrace` to dump the stack.
 */
console.stackTrace = console.trace;
console.trace = TRACE_ON ? Function.prototype.bind.call(console.info, console, "[trace]") : function() {};
console.debug = DEBUG_ON ? Function.prototype.bind.call(console.info, console, "[debug]") : function() {};

/**
 * @dev Construct the model
 */
new Model();

/**
 * @dev Render the UI
 */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WagmiConfig config={rainbowKitConfig.wagmiConfig}>
      <RainbowKitProvider chains={rainbowKitConfig.chains} theme={lightTheme({borderRadius: 'small'})} >
        <div id="body">
          <div id="page">
            <UI />
          </div>
        </div>
      </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>
);
