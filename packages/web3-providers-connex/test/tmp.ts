'use strict';

// import { Framework } from '@vechain/connex-framework';
// import { Driver, SimpleNet, SimpleWallet } from '@vechain/connex-driver';
// const Web3 = require('web3');

// import { ConnexProvider } from '../src/index';
// import { urls } from './settings'
// import { RetTransaction } from '../src/types';
// import { Err } from '../src/error';
// import { rejects } from 'assert';

const ifConnect = false;

if (ifConnect) {
	(async function test() {
		const url = 'wss://mainnet.infura.io/ws/v3/b5ad546d4fd4434e816419034c2cf163';
		const Web3 = require('web3');
		const web3 = new Web3(url);

		let ret: any;

		try {
			ret = await web3.eth.getBlock('test');
		} catch (err) {
			throw new TypeError(err.message);
		}

		console.log(ret);

		return ret;
	})().catch(console.log);
} else {
	const utils = require('web3-utils');
	let ret;
	ret = utils.padLeft('0x'+'1'.repeat(10),5);
	console.log(ret);
}