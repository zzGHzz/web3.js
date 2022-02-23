'use strict';

import { JsonRpcPayload } from './types';
import { toBlockNumber, toBytes32 } from './utils';
import { Err } from './error';

const emptyPayload: JsonRpcPayload = {
	id: 0,
	method: '',
	params: [],
	jsonrpc: ''
}

export const InputFormatter: Record<string, (payload: JsonRpcPayload) => { payload: JsonRpcPayload, err: TypeError | null }> = {};

InputFormatter.eth_getBlockByNumber = function (payload: JsonRpcPayload) {
	const num = toBlockNumber(payload.params[0]);
	if (num === null) {
		return { payload: emptyPayload, err: Err.BlockNotFound('pending') }
	}
	payload.params[0] = num;
	return { payload: payload, err: null };
}

InputFormatter.eth_getBalance = function (payload: JsonRpcPayload) {
	if (payload.params.length == 2 &&
		!(typeof payload.params[1] === 'string' && payload.params[1] === 'latest')
	) {
		return { payload: emptyPayload, err: Err.MethodParamNotSupported('getBalance', 2) };
	}
	return { payload: payload, err: null };
}

InputFormatter.eth_getCode = function (payload: JsonRpcPayload) {
	if (payload.params.length >= 2 &&
		!(typeof payload.params[1] === 'string' && payload.params[1] === 'latest')
	) {
		return { payload: emptyPayload, err: Err.MethodParamNotSupported('getCode', 2) };
	}
	return { payload: payload, err: null };
}

InputFormatter.eth_getStorageAt = function (payload: JsonRpcPayload) {
	if (payload.params.length >= 3 &&
		!(typeof payload.params[2] === 'string' && payload.params[2] === 'latest')
	) {
		return { payload: emptyPayload, err: Err.MethodParamNotSupported('getStorageAt', 3) };
	}

	payload.params[1] = toBytes32(payload.params[1]);
	return { payload: payload, err: null };
}

// this.methodMap['eth_getBlockByHash'] = this._getBlockByHash;
// this.methodMap['eth_getBlockByNumber'] = this._getBlockByNumber;
// this.methodMap['eth_chainId'] = this._getChainId;
// this.methodMap['eth_getTransactionByHash'] = this._getTransactionByHash;
// this.methodMap['eth_getBalance'] = this._getBalance;
// this.methodMap['eth_blockNumber'] = this._getBlockNumber;
// this.methodMap['eth_getCode'] = this._getCode;
// this.methodMap['eth_syncing'] = this._isSyncing;
// this.methodMap['eth_getTransactionReceipt'] = this._getTransactionReceipt;
// this.methodMap['eth_getStorageAt'] = this._getStorageAt;