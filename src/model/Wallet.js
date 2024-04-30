import { getAccount, getNetwork, watchAccount, getWalletClient, getPublicClient, disconnect, switchNetwork, signMessage } from 'wagmi/actions';
import { EventManager } from './utils/EventManager';
import * as assert from './utils/assertions';
import { AppError } from './utils/errors';
import { ContractFunctionExecutionError } from 'viem';

const WALLET_STATE = {
  disconnected: 'disconnected',
  connected: 'connected'
}

export class Wallet {

  state = WALLET_STATE.disconnected;
  appName;
  account;
  closeWatchers = [];
  listeners = new EventManager(['connected', 'disconnected', 'account-changed']);

  constructor(appName) {
    this.appName = appName;
    this.closeWatchers.push(watchAccount(this._handleAccountsChanged.bind(this)));
    this.on = this.listeners.on.bind(this.listeners);
    this.off = this.listeners.off.bind(this.listeners);
  }

  async isAvailable() {
    const acc = getAccount();
    return Promise.resolve(!!acc);
  }
  
  async isConnected() {
    const acc = getAccount();
    return Promise.resolve(assert.isObject(acc) ? acc.isConnected : false);
  }

  async connect() {
    return Promise.resolve();
  }

  async disconnect() {
    disconnect();
    return Promise.resolve();
  }

  getAccount() {
    const acc = getAccount();
    if (acc) return acc.address;
    else return undefined;
  }
  
  getChain() {
    const { chain } = getNetwork();
    if (chain) return chain.id;
    else return undefined;
  }

  async deploy(sourceCode, params=[], options={}) {
    if (this.state !== WALLET_STATE.connected) throw {code: 'wallet-unavailable', message: 'wallet is not available'};

    const chainId = this.getChain();
    const walletClient = await getWalletClient({chainId});
    const publicClient = getPublicClient({chainId});

    const txHash = await walletClient.deployContract({
      account: this.account,
      abi: sourceCode.abi,
      bytecode: sourceCode.bytecode || sourceCode.bin,
      args: params,
      ...options
    });

    console.trace('txHash', txHash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    console.trace('receipt', receipt);

    return receipt.contractAddress;
  }

  async send(contractAddress, abi, method, params=[], options={}) { 
    if (this.state != WALLET_STATE.connected) throw {code: 'wallet-unavailable', message: 'wallet is not available'};

    const chainId = this.getChain();
    const walletClient = await getWalletClient({chainId});
    const publicClient = getPublicClient({chainId});

    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: abi,
      functionName: method,
      args: params,
      ...options
    })

    console.trace('txHash', txHash);

    const receipt = 
      await publicClient.waitForTransactionReceipt({ hash: txHash, retryCount: 30 })
      .catch(error => {
        console.warn(error);
        throw new AppError('Timed out waiting for transaction. The network could just be busy and your transaction may still go through. Check your wallet for more information.', {code: 'timeout', cause: error});
      });

    console.trace('receipt', receipt);

    return receipt;
  }

  async call(contractAddress, abi, method, params=[]) {
    if (this.state !== WALLET_STATE.connected) throw {code: 'wallet-unavailable', message: 'wallet is not available'};

    const chainId = this.getChain();
    const publicClient = getPublicClient({chainId});

    return publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: method,
      args: params
    })
    .catch(parseRevertError);
  }

  async estimateGas(contractAddress, abi, method, params=[]) {
    if (this.state !== WALLET_STATE.connected) throw {code: 'wallet-unavailable', message: 'wallet is not available'};

    const chainId = this.getChain();
    const publicClient = getPublicClient({chainId});

    return publicClient.estimateContractGas({
      account: this.getAccount(),
      address: contractAddress,
      abi: abi,
      functionName: method,
      args: params
    })
    .catch(parseRevertError);
  }

  async estimateAndSend(contractAddress, abi, method, params=[]) {
    return this.estimateGas(contractAddress, abi, method, params)
    .then(() => this.send(contractAddress, abi, method, params));
  }

  async switchChain(chainId, chainName) {
    if (assert.isString(chainId)) chainId = parseInt(chainId);
    try {
      const chain = await switchNetwork({chainId});
    } catch (error) {
      if (error.code === 4902) {
        throw {code: 'chain-missing', message: 'Add the chain to Metamask and try again', chain: {id: parseInt(chainId), name: chainName}};
      }
      else console.warn('switchChain error:', error);
      throw error;
    }
  }

  async login(account) {
    const params = {
      account: account || this.account,
      message: "Login to "+this.appName
    };
    return signMessage(params);
  }

  _handleAccountsChanged(acc) {
    if (acc && acc.address) {
      this.account = acc.address;
      this.connector = acc.connector;
      console.trace('wallet connected with account', this.account);
      this.state = WALLET_STATE.connected;
    }
    else {
      this.account = undefined;
      this.connector = undefined;
      console.trace('wallet disconnected');
      this.state = WALLET_STATE.disconnected;
    }
    this.listeners.notifyListeners('account-changed', this.account);
  }

}


function parseRevertError(error) {
  if (!error || !error.message) throw error;
  console.warn(error);
  const revertMatch = error.message.match(/reverted with the following reason:\s*(.*)\s/);
  if ((!revertMatch || !revertMatch[1]) && error instanceof ContractFunctionExecutionError) {
    throw new AppError("Cannot access the blockchain. Are you online?", {code: 'timeout', cause: error.message});
  }
  else if (revertMatch && revertMatch[1]) {
    const code =
      revertMatch[1] === 'username already registered' ? 'username-registered' :
      'contract-reverted';
    throw new AppError(revertMatch[1], {code: code, cause: error.message});
  }
  throw error;
}