import { configDotenv } from "dotenv";
import { sleep, sendBatch } from "./helpers";
import { HighloadQueryId } from "./HighloadQueryId";
import { address, Address, toNano, SendMode, internal, OutActionSendMsg } from "@ton/core";
import { mnemonicToWalletKey } from "@ton/crypto";
import { Dictionary, beginCell, Cell, TonClient } from "@ton/ton";
import { readFileSync } from "fs";

const getRandom = (min:number, max:number) => {
    return Math.random() * (max - min) + min;
}

export const getRandomInt = (min: number, max: number) => {
    return Math.round(getRandom(min, max));
}

const rpcEndpoint = 'https://testnet.toncenter.com/api/v2/jsonRPC'
const HIGHLOAD_CODE = Cell.fromBase64('te6ccgECEAEAAigAART/APSkE/S88sgLAQIBIAIDAgFIBAUB9vLUgwjXGNEh+QDtRNDT/9Mf9AT0BNM/0xXR+CMhoVIguY4SM234IySqAKESuZJtMt5Y+CMB3lQWdfkQ8qEG0NMf1NMH0wzTCdM/0xXRUWi68qJRWrrypvgjKqFSULzyowT4I7vyo1MEgA30D2+hmdAk1yHXCgDyZJEw4g4AeNAg10vAAQHAYLCRW+EB0NMDAXGwkVvg+kAw+CjHBbORMODTHwGCEK5C5aS6nYBA1yHXTPgqAe1V+wTgMAIBIAYHAgJzCAkCASAMDQARrc52omhrhf/AAgEgCgsAGqu27UTQgQEi1yHXCz8AGKo77UTQgwfXIdcLHwAbuabu1E0IEBYtch1wsVgA5bi/Ltou37IasJAoQJsO1E0IEBINch9AT0BNM/0xXRBY4b+CMloVIQuZ8ybfgjBaoAFaESuZIwbd6SMDPikjAz4lIwgA30D2+hntAh1yHXCgCVXwN/2zHgkTDiWYAN9A9voZzQAdch1woAk3/bMeCRW+JwgB/lMJgA30D2+hjhPQUATXGNIAAfJkyFjPFs+DAc8WjhAwyCTPQM+DhAlQBaGlFM9A4vgAyUA5gA30FwTIy/8Tyx/0ABL0ABLLPxLLFcntVPgPIdDTAAHyZdMCAXGwkl8D4PpAAdcLAcAA8qX6QDH6ADH0AfoAMfoAMYBg1yHTAAEPACDyZdIAAZPUMdGRMOJysfsA');
const SUBWALLET_ID = 239;
const DEFAULT_TIMEOUT = 128;

const maxKeyCount   = (1 << 13);
const maxShift      = maxKeyCount - 1;

const HIGHLOAD_JETTON_WALLET = address("kQA6eZO4J134_wBqD80tkw6-9pjufOkS1XlvA878YxEbeFtt")
const HIGHLOAD_ADDRESS = address("0QCm6iMpPU-29lHXjIZDc41J7XHXufeKq3zMUSVqC8OvEWFF")
const JETTON_DECIMALS: number = 9

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
