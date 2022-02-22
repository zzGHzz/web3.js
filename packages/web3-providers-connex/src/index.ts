'use strict';

import Connex from '@vechain/connex';
import { JsonRpcPayload, Callback } from './types';
import {
	toRetBlock,
	toRpcResponse,
	toRetTransaction,
	toRetReceipt,
	toBlockNumber,
	toBytes32,
	hexToNumber,
} from './utils';
import { Err } from './error';

type MethodHandler = (rpcPayload: JsonRpcPayload, callback: Callback) => void;

export class ConnexProvider {
	readonly connex: Connex;
	readonly chainTag: number;

	private readonly methodMap: Record<string, MethodHandler> = {};

	constructor(connex: Connex) {
		this.connex = connex;
		const id = connex.thor.genesis.id;
		this.chainTag = hexToNumber('0x' + id.substring(id.length - 2));

		this.methodMap['eth_getBlockByHash'] = this._getBlockByHash;
		this.methodMap['eth_getBlockByNumber'] = this._getBlockByNumber;
		this.methodMap['eth_chainId'] = this._getChainId;
		this.methodMap['eth_getTransactionByHash'] = this._getTransactionByHash;
		this.methodMap['eth_getBalance'] = this._getBalance;
		this.methodMap['eth_blockNumber'] = this._getBlockNumber;
		this.methodMap['eth_getCode'] = this._getCode;
		this.methodMap['eth_syncing'] = this._isSyncing;
		this.methodMap['eth_getTransactionReceipt'] = this._getTransactionReceipt;
		this.methodMap['eth_getStorageAt'] = this._getStorageAt;
	}

	/**
	 * Function [send] defined in interface [AbstractProvider]
	 * @param {JsonRpcPayload} rpcPayload 
	 * @param {Callback} callback 
	 * @returns 
	 */
	public sendAsync(rpcPayload: JsonRpcPayload, callback: Callback) {
		const exec = this.methodMap[rpcPayload.method];
		if (!exec) {
			callback(Err.MethodNotFound(rpcPayload.method));
			return;
		}
		exec(rpcPayload, callback);
	}

	private _getStorageAt = (rpcPayload: JsonRpcPayload, callback: Callback) => {
		if (rpcPayload.params.length == 3 &&
			!(typeof rpcPayload.params[2] === 'string' && rpcPayload.params[2] === 'latest')
		) {
			callback(Err.MethodOptNotSupported('getStorageAt', 'defaultBlock'));
			return;
		}

		const k: string = toBytes32(rpcPayload.params[1]);
		this.connex.thor.account(rpcPayload.params[0]).getStorage(k)
			.then(storage => {
				callback(null, toRpcResponse(storage.value, rpcPayload.id));
			})
			.catch(err => {
				callback(err);
			});
	}

	private _getTransactionReceipt = (rpcPayload: JsonRpcPayload, callback: Callback) => {
		this.connex.thor.transaction(rpcPayload.params[0]).getReceipt()
			.then(receipt => {
				if (!receipt) {
					callback(null, toRpcResponse(null, rpcPayload.id));
				} else {
					callback(null, toRpcResponse(
						toRetReceipt(receipt),
						rpcPayload.id,
					));
				}
			})
			.catch(err => {
				callback(err);
			});
	}

	private _isSyncing = (rpcPayload: JsonRpcPayload, callback: Callback) => {
		if (this.connex.thor.status.progress == 1) {
			callback(null, toRpcResponse(false, rpcPayload.id));
		} else {
			const highestBlock = Math.floor(
				(Date.now() - this.connex.thor.genesis.timestamp) / 10000
			);
			callback(null, toRpcResponse(
				{
					currentBlock: this.connex.thor.status.head.number,
					highestBlock: highestBlock,
					head: this.connex.thor.status.head,
				},
				rpcPayload.id,
			));
		}
	}

	private _getCode = (rpcPayload: JsonRpcPayload, callback: Callback) => {
		if (rpcPayload.params.length == 2 &&
			!(typeof rpcPayload.params[1] === 'string' && rpcPayload.params[1] === 'latest')
		) {
			callback(Err.MethodOptNotSupported('getCode', 'defaultBlock'));
			return;
		}

		this.connex.thor.account(rpcPayload.params[0]).getCode()
			.then(code => {
				callback(null, toRpcResponse(code.code, rpcPayload.id));
			})
			.catch(err => {
				callback(err);
			})
	}

	private _getBlockNumber = (rpcPayload: JsonRpcPayload, callback: Callback) => {
		this.connex.thor.block().get()
			.then(blk => {
				if (!blk) {
					callback(Err.BlockNotFound('latest'));
				} else {
					callback(null, toRpcResponse(
						blk.number,
						rpcPayload.id
					));
				}
			})
			.catch(err => {
				callback(err);
			})
	}

	private _getBalance = (rpcPayload: JsonRpcPayload, callback: Callback) => {
		if (rpcPayload.params.length == 2 &&
			!(typeof rpcPayload.params[1] === 'string' && rpcPayload.params[1] === 'latest')
		) {
			callback(Err.MethodOptNotSupported('getBalance', 'defaultBlock'));
			return;
		}

		this.connex.thor.account(rpcPayload.params[0]).get()
			.then(acc => {
				callback(null, toRpcResponse(
					acc.balance,
					rpcPayload.id,
				))
			})
			.catch(err => {
				callback(err);
			})
	}

	private _getTransactionByHash = (rpcPayload: JsonRpcPayload, callback: Callback) => {
		const hash: string = rpcPayload.params[0];
		this.connex.thor.transaction(hash).get()
			.then(tx => {
				if (!tx) {
					callback(Err.TransactionNotFound(hash));
				} else {
					callback(null, toRpcResponse(
						toRetTransaction(tx),
						rpcPayload.id,
					));
				}
			})
			.catch(err => {
				callback(err);
			})
	}

	private _getChainId = (rpcPayload: JsonRpcPayload, callback: Callback) => {
		callback(null, toRpcResponse(
			this.chainTag,
			rpcPayload.id,
		));
	}

	private _getBlockByNumber = (rpcPayload: JsonRpcPayload, callback: Callback) => {
		const num = toBlockNumber(rpcPayload.params[0]);
		if (num === null) {
			callback(Err.BlockNotFound('pending'));
			return;
		}

		this.connex.thor.block(num).get()
			.then(blk => {
				if (!blk) {
					callback(Err.BlockNotFound(num? num : 'lastest'));
				} else {
					callback(null, toRpcResponse(
						toRetBlock(blk),
						rpcPayload.id,
					));
				}
			})
			.catch(err => {
				callback(err);
			})
	}

	private _getBlockByHash = (rpcPayload: JsonRpcPayload, callback: Callback) => {
		const hash: string = rpcPayload.params[0];
		this.connex.thor.block(hash).get()
			.then(blk => {
				if (!blk) {
					callback(Err.BlockNotFound(hash));
				} else {
					callback(null, toRpcResponse(
						toRetBlock(blk),
						rpcPayload.id,
					));
				}
			})
			.catch(err => {
				callback(err);
			})
	}
}