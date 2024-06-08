import { configDotenv } from "dotenv";
import { sleep, sendBatch } from "./helpers";
import {HighloadQueryId} from "./HighloadQueryId";
import {address, StateInit, Address, toNano, SendMode, storeMessageRelaxed, internal, OutActionSendMsg} from "@ton/core";
import {mnemonicToWalletKey, KeyPair, sign} from "@ton/crypto";
import {Slice, Dictionary, beginCell, Cell, TonClient} from "@ton/ton";
import {readFile, readFileSync} from "fs";
import crypto from "crypto";

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
const JETTON_CODE = Cell.fromBase64('te6ccgECEQEAAyMAART/APSkE/S88sgLAQIBYgIDAgLMBAUAG6D2BdqJofQB9IH0gahhAgHUBgcCASAICQDDCDHAJJfBOAB0NMDAXGwlRNfA/AM4PpA+kAx+gAxcdch+gAx+gAwc6m0AALTH4IQD4p+pVIgupUxNFnwCeCCEBeNRRlSILqWMUREA/AK4DWCEFlfB7y6k1nwC+BfBIQP8vCAAET6RDBwuvLhTYAIBIAoLAIPUAQa5D2omh9AH0gfSBqGAJpj8EIC8aijKkQXUEIPe7L7wndCVj5cWLpn5j9ABgJ0CgR5CgCfQEsZ4sA54tmZPaqQB8VA9M/+gD6QCHwAe1E0PoA+kD6QNQwUTahUirHBfLiwSjC//LiwlQ0QnBUIBNUFAPIUAT6AljPFgHPFszJIsjLARL0APQAywDJIPkAcHTIywLKB8v/ydAE+kD0BDH6ACDXScIA8uLEd4AYyMsFUAjPFnD6AhfLaxPMgMAgEgDQ4AnoIQF41FGcjLHxnLP1AH+gIizxZQBs8WJfoCUAPPFslQBcwjkXKRceJQCKgToIIJycOAoBS88uLFBMmAQPsAECPIUAT6AljPFgHPFszJ7VQC9ztRND6APpA+kDUMAjTP/oAUVGgBfpA+kBTW8cFVHNtcFQgE1QUA8hQBPoCWM8WAc8WzMkiyMsBEvQA9ADLAMn5AHB0yMsCygfL/8nQUA3HBRyx8uLDCvoAUaihggiYloBmtgihggiYloCgGKEnlxBJEDg3XwTjDSXXCwGAPEADXO1E0PoA+kD6QNQwB9M/+gD6QDBRUaFSSccF8uLBJ8L/8uLCBYIJMS0AoBa88uLDghB73ZfeyMsfFcs/UAP6AiLPFgHPFslxgBjIywUkzxZw+gLLaszJgED7AEATyFAE+gJYzxYBzxbMye1UgAHBSeaAYoYIQc2LQnMjLH1Iwyz9Y+gJQB88WUAfPFslxgBDIywUkzxZQBvoCFctqFMzJcfsAECQQIwB8wwAjwgCwjiGCENUydttwgBDIywVQCM8WUAT6AhbLahLLHxLLP8ly+wCTNWwh4gPIUAT6AljPFgHPFszJ7VQ=');
const JETTON_MASTER = address("0:d7769f0958602cce023bd0d6efcda84f35cbe3e49189cd3d984d5711f98f7fd7")

function pack_jetton_wallet_data(balance: number,
                                 owner_address: Address,
                                 jetton_master_address: Address,
                                 jetton_wallet_code: Cell): Cell {
    return  beginCell()
            .storeCoins(balance)
            .storeAddress(owner_address)
            .storeAddress(jetton_master_address)
            .storeRef(jetton_wallet_code)
            .endCell();
 }

//  function calculate_jetton_wallet_address(state_init: Cell): Address {
//     return address(beginCell().storeUint(4, 3)
//                        .storeInt(workchain(), 8)
//                        .storeUint(cell_hash(state_init), 256)
//                        .endCell())
// }

function calculate_jetton_wallet_state_init(owner_address: Address, jetton_master_address: Address, jetton_wallet_code: Cell): Cell{
    return beginCell()
           .storeUint(0, 2)
           .storeRef(jetton_wallet_code)
           .storeRef(pack_jetton_wallet_data(0, owner_address, jetton_master_address, jetton_wallet_code))
           .storeUint(0, 1)
           .endCell();
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
        console.log(`${i}: ${eligible_addr}`);
        let eligible_amount = Math.floor(eligible_map[eligible_addr] * 10**JETTON_DECIMALS)
        //console.log(`Amount: ${eligible_amount}`)
        let userWallet: Address = address(eligible_addr)

        //console.log('Building transfer body ')
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
        //console.log('...built!')
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
    console.log('Packaging finished.');

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
            //console.log(e);
            // if (JSON.stringify(e).length == 2) {
            //     bot.api.sendMessage(serviceChatID, `Fatal error: ${e}`);
            //     return;
            // }
            // bot.api.sendMessage(serviceChatID, `Fatal error: ${JSON.stringify(e).slice(0, 300)} `);
        })
        .finally(() => console.log("Exiting..."));
})()
