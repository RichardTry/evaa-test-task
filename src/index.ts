import { configDotenv } from "dotenv";
import { sleep, sendBatch } from "./helpers";
import { HighloadQueryId } from "./HighloadQueryId";
import { address, Address, toNano, SendMode, internal, OutActionSendMsg } from "@ton/core";
import { mnemonicToWalletKey } from "@ton/crypto";
import { Dictionary, beginCell, Cell, TonClient } from "@ton/ton";
import { readFileSync } from "fs";
import { rpcEndpoint, HIGHLOAD_CODE, SUBWALLET_ID, DEFAULT_TIMEOUT, maxShift, HIGHLOAD_JETTON_WALLET, HIGHLOAD_ADDRESS, JETTON_DECIMALS } from "./consts";

const getRandom = (min:number, max:number) => {
    return Math.random() * (max - min) + min;
}

export const getRandomInt = (min: number, max: number) => {
    return Math.round(getRandom(min, max));
}

async function main() {
    configDotenv();

    const tonClient = new TonClient({
        endpoint: rpcEndpoint,
        apiKey: process.env.TONCENTER_API_KEY
    });
    const keys = await mnemonicToWalletKey(process.env.WALLET_PRIVATE_KEY.split(' '));
    const contract = tonClient.provider(HIGHLOAD_ADDRESS, {
        code: HIGHLOAD_CODE,
        data: beginCell()
            .storeUint(698983191, 32)
            .storeUint(0, 64)
            .storeBuffer(keys.publicKey)
            .storeBit(0)
            .endCell()
    });

    const jsonPath: string = 'eligible.json';
    const eligibleBalances = Dictionary.empty<Address, bigint>();
    let readedData: string;
    try {
        readedData = readFileSync(jsonPath, { encoding: 'utf8', flag: 'r' });
    } catch (error) {
        console.error('Error reading the file:', error);
        return;
    }

    let eligible_map: any;
    try {
        const parsedJson: { [key: string]: any } = JSON.parse(readedData);
        eligible_map = parsedJson;
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }

    let eligible_length: number = Object.keys(eligible_map).length;
    let outMsgs: OutActionSendMsg[] = new Array(eligible_length);
    let i: number = 0;

    for (const eligible_addr in eligible_map) {
        console.log(`${i+1}: ${eligible_addr}`);
        let eligible_amount = Math.floor(eligible_map[eligible_addr] * 10**JETTON_DECIMALS)
        let userWallet: Address = address(eligible_addr)

        let transferBody = beginCell()
                .storeUint(0xf8a7ea5, 32)
                .storeUint(i, 64)
                .storeCoins(eligible_amount)
                .storeAddress(userWallet)
                .storeAddress(HIGHLOAD_ADDRESS)
                .storeUint(0, 1)
                .storeCoins(0)
                .storeUint(0, 1)
                .endCell();

        outMsgs[i] = {
            type: 'sendMsg',
            mode: SendMode.NONE,
            outMsg: internal({
                to: HIGHLOAD_JETTON_WALLET,
                value: toNano('0.05'),
                body: transferBody
            }),
        }
        i++;
    }

    const rndShift: number   = getRandomInt(0, maxShift);
    const rndBitNum: number  = getRandomInt(0, 1022);
    const queryId: HighloadQueryId = HighloadQueryId.fromShiftAndBitNumber(BigInt(rndShift), BigInt(rndBitNum));

    let now: number = Math.floor(Date.now() / 1000);
    // message doesn't have time
    // to be emulated on lightserver
    // and crashes with a error created_at > now()
    now -= 10;
    let try_num: number = 1;
    while(true) {
        try {
            await sendBatch(contract, keys.secretKey, outMsgs, SUBWALLET_ID, queryId, DEFAULT_TIMEOUT, now);
        } catch(e) {
            console.log(e)
            console.log(`Try ${try_num}`)
            await sleep(1000);
            try_num++;
            continue;
        }
        break;
    }
}

(() => {
    main()
        .catch(e => {
            console.log(e);
        })
        .finally(() => console.log("Exiting..."));
})()
