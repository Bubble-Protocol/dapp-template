// Copyright (c) 2024 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { APP_NAME, SUPPORTED_BLOCKCHAINS } from './config';


/**
 * @dev Configuration of the RainbowKit wallet
 */

const { chains, publicClient } = configureChains(
  SUPPORTED_BLOCKCHAINS,
  [
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: APP_NAME,
  projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID,
  chains
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
});

export const rainbowKitConfig = {
  wagmiConfig,
  chains
};