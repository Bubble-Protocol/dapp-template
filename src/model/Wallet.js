import { getAccount, watchAccount, getWalletClient, getPublicClient, disconnect, switchNetwork, signMessage } from 'wagmi/actions';
import { EventManager } from './utils/EventManager';
import * as assert from './utils/assertions';
import { AppError } from './utils/errors';
import { ContractFunctionExecutionError, TransactionReceiptNotFoundError, encodeDeployData } from 'viem';

const WALLET_STATE = {
  disconnected: 'disconnected',
  connected: 'connected'
}

const DEFAULT_TX_TIMEOUT = 30000;
const DEFAULT_POLLING_INTERVAL = 1000;

export class Wallet {

  state = WALLET_STATE.disconnected;
  appName;
  config;
  account;
  closeWatchers = [];
  listeners = new EventManager(['connected', 'disconnected', 'account-changed']);

  constructor(appName, config) {
    this.appName = appName;
    this.config = config;
    this.on = this.listeners.on.bind(this.listeners);
    this.off = this.listeners.off.bind(this.listeners);
  }

  initialise() {
    const unwatch = watchAccount(this.config, {onChange: this._handleAccountsChanged.bind(this)});
    this.closeWatchers.push(unwatch);
  }

  async isAvailable() {
    const acc = getAccount(this.config);
    return Promise.resolve(!!acc);
  }
  
  async isConnected() {
    const acc = getAccount(this.config);
    return Promise.resolve(assert.isObject(acc) ? acc.isConnected : false);
  }

  async connect() {
    return Promise.resolve();
  }

  async disconnect(config) {
    disconnect(this.config);
    return Promise.resolve();
  }

  getAccount(config) {
    const acc = getAccount(this.config);
    if (acc) return acc.address;
    else return undefined;
  }
  
  getChainId() {
    const { chainId } = getAccount(this.config);
    return chainId;
  }

  async deploy(abi, bytecode, params=[], options={}) {
    if (this.state !== WALLET_STATE.connected) throw {code: 'wallet-unavailable', message: 'wallet is not available'};

    const chainId = this.getChainId();
    const walletClient = await getWalletClient(this.config, {chainId});

    const deployBytecode = encodeDeployData({
      abi,
      bytecode,
      args: params
    });

    const gas = await this.estimateGas(deployBytecode, options);

    const txHash = await walletClient.deployContract({
      account: this.account,
      abi,
      bytecode,
      args: params,
      gas: (gas * 120n) / 100n,
      ...options
    });

    const receipt = await this._waitForConfirmation(txHash, options);
    return receipt.contractAddress;
  }

  async send(contractAddress, abi, method, params=[], options={}) { 
    if (this.state != WALLET_STATE.connected) throw {code: 'wallet-unavailable', message: 'wallet is not available'};

    const chainId = this.getChainId();
    const walletClient = await getWalletClient(this.config, {chainId});

    const gas = await this.estimateContractGas(contractAddress, abi, method, params, options);

    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: abi,
      functionName: method,
      args: params,
      gas: (gas * 120n) / 100n,
      ...options
    })

    return await this._waitForConfirmation(txHash, options);

  }

  async call(contractAddress, abi, method, params=[]) {
    if (this.state !== WALLET_STATE.connected) throw {code: 'wallet-unavailable', message: 'wallet is not available'};

    const chainId = this.getChainId();
    const publicClient = getPublicClient(this.config, {chainId});

    return publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: method,
      args: params
    })
    .catch(parseRevertError);
  }

  async estimateGas(data, options={}) {
    if (this.state !== WALLET_STATE.connected) throw {code: 'wallet-unavailable', message: 'wallet is not available'};

    const chainId = this.getChainId();
    const publicClient = getPublicClient(this.config, {chainId});

    return publicClient.estimateGas({
      account: this.getAccount(this.config),
      data,
      ...options
    })
    .catch(parseRevertError);
  }

  async estimateContractGas(contractAddress, abi, method, params=[], options={}) {
    if (this.state !== WALLET_STATE.connected) throw {code: 'wallet-unavailable', message: 'wallet is not available'};

    const chainId = this.getChainId();
    const publicClient = getPublicClient(this.config, {chainId});

    return publicClient.estimateContractGas({
      account: this.getAccount(this.config),
      address: contractAddress,
      abi: abi,
      functionName: method,
      args: params,
      ...options
    })
    .catch(parseRevertError);
  }

  async switchChain(chainId, chainName) {
    if (assert.isString(chainId)) chainId = parseInt(chainId);
    try {
      const chain = await switchNetwork(this.config, {chainId});
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
    return signMessage(this.config, params);
  }

  _handleAccountsChanged(acc) {
    if (acc && acc.address) {
      if (this.state !== WALLET_STATE.connected) {
        console.trace('wallet connected');
        this.state = WALLET_STATE.connected;
      }
      if (this.connector !== acc.connector) {
        this.connector = acc.connector;
        console.trace('wallet connector updated');
      }
      if (this.account !== acc.address) {
        this.account = acc.address;
        console.trace('wallet account changed to', this.account);
        this.listeners.notifyListeners('account-changed', this.account, this);
      }
    }
    else {
      this.account = undefined;
      this.connector = undefined;
      console.trace('wallet disconnected');
      this.state = WALLET_STATE.disconnected;
      this.listeners.notifyListeners('account-changed', this.account);
    }
  }

  async _waitForConfirmation(hash, options={}) {
    
    const startTime = Date.now();
    const timeout = options.timeout || DEFAULT_TX_TIMEOUT;
    const pollingInterval = options.pollingInterval || DEFAULT_POLLING_INTERVAL;

    console.trace('txHash:', hash);
    console.trace('waiting up to', timeout+'ms', 'for confirmation, polling every', pollingInterval+'ms');

    const chainId = this.getChainId();
    const publicClient = getPublicClient(this.config, {chainId});

    while (Date.now() - startTime < timeout) {
      try {
        const receipt = await publicClient.getTransactionReceipt({hash});
        if (receipt) {
          console.trace('receipt:', receipt);
          return receipt;
        }
      }
      catch (error) {
        if (!(error instanceof TransactionReceiptNotFoundError)) {
          console.warn('error getting receipt, trying again in', pollingInterval+'ms', error);
        }
      }
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
    }
    throw new AppError('Timed out waiting for transaction. The network could just be busy and your transaction may still go through. Check your wallet for more information.', {code: 'timeout'});
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