// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ConnectButton, RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { QueryClientProvider, QueryClient} from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import UI from './ui/App.js';
import { wagmiConfig } from './ui/rainbow-kit.js';
import { Model } from './model/App.js';
import './index.css';
import { DEBUG_ON, TRACE_ON } from './config.js';

/**
 * Add trace and debug commands to the console. Use `console.stackTrace` to dump the stack.
 */
console.stackTrace = console.trace;
console.trace = TRACE_ON ? Function.prototype.bind.call(console.info, console, "[trace]") : function() {};
console.debug = DEBUG_ON ? Function.prototype.bind.call(console.info, console, "[debug]") : function() {};

/**
 * Construct the model
 */
const model = new Model();

window.addEventListener('beforeunload', () => {
  model.close();
});

const queryClient = new QueryClient();

/**
 * Render the UI
 */

const App = () => {

  useEffect(() => {
    model.initialise(wagmiConfig);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={lightTheme({borderRadius: 'small'})} >
          <div id="body">
            <div id="page">
              <UI />
            </div>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);