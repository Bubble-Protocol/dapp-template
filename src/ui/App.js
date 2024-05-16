// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import React from "react";
import './App.css';
import { useModelStateData } from "../state-manager";
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/Dashboard";


/**
 * The main application screen
 */

function App() {

  const appState = useModelStateData('state');
  const sessionState = useModelStateData('session-state');

  const loggedIn = appState === 'initialised' && sessionState === 'logged-in';

  return (
    <>
      {!loggedIn && <Home />}
      {loggedIn && <Dashboard />}
    </>
  );

}

export default App;
