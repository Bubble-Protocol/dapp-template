// Copyright (c) 2024 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import '@rainbow-me/rainbowkit/styles.css';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { APP_NAME, SUPPORTED_BLOCKCHAINS } from '../config';

import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet
} from '@rainbow-me/rainbowkit/wallets';


/**
 * Configuration of the RainbowKit wallet
 */

const wallets = [
  metaMaskWallet,
  coinbaseWallet
];

if (process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID) {
  wallets.push(walletConnectWallet);
}

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets
    }
  ],
  {
    appName: APP_NAME,
    projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID
  }
);

const transports = SUPPORTED_BLOCKCHAINS.reduce((obj, chain) => { obj[chain.id] = http(chain.rpcUrls.default.http); return obj }, {});

export const wagmiConfig = createConfig({
  chains: SUPPORTED_BLOCKCHAINS,
  connectors,
  transports
});
