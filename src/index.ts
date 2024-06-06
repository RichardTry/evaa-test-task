import { configDotenv } from "dotenv";
import {sleep} from "./helpers";
import {Address, storeMessageRelaxed} from "@ton/core";
import {mnemonicToWalletKey, KeyPair, sign} from "@ton/crypto";
import {Dictionary, beginCell, Cell, TonClient} from "@ton/ton";
import {readFile} from "fs";

export const rpcEndpoint = ''
export const highloadAddress = '';
export const HIGHLOAD_CODE = Cell.fromBase64('te6ccgEBCQEA5QABFP8A9KQT9LzyyAsBAgEgAgMCAUgEBQHq8oMI1xgg0x/TP/gjqh9TILnyY+1E0NMf0z/T//QE0VNggED0Dm+hMfJgUXO68qIH+QFUEIf5EPKjAvQE0fgAf44WIYAQ9HhvpSCYAtMH1DAB+wCRMuIBs+ZbgyWhyEA0gED0Q4rmMQHIyx8Tyz/L//QAye1UCAAE0DACASAGBwAXvZznaiaGmvmOuF/8AEG+X5dqJoaY+Y6Z/p/5j6AmipEEAgegc30JjJLb/JXdHxQANCCAQPSWb6VsEiCUMFMDud4gkzM2AZJsIeKz');

async function main() {
    configDotenv();

    const tonClient = new TonClient({
        endpoint: rpcEndpoint,
        apiKey: process.env.TONCENTER_API_KEY
    });
    const keys = await mnemonicToWalletKey(process.env.WALLET_PRIVATE_KEY.split(' '));
    const contract = tonClient.provider(Address.parse(highloadAddress), {
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
    readFile(jsonPath, 'utf-8', (err, data) => {
        if (err) {
          console.error('Error reading the file:', err);
          return;
        }
        try {
          const parsedJson: { [key: string]: any } = JSON.parse(data);
          for (const key in parsedJson) {
            if (parsedJson.hasOwnProperty(key)) {
              console.log(`${key}: ${parsedJson[key]}`);
            }
          }
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      });

    const highloadMessages = Dictionary.empty<number, Cell>();
    let i = 0;
    // for (const task of tasks) {
    for (; i < 3; i++) {
    //     let liquidationBody = Cell.EMPTY;
    //     liquidationBody = beginCell()
    //             .storeUint(0x3, 32) //liquidation opcode
    //             .storeUint(task.queryID, 64) // queryID / can be 0
    //             .storeAddress(Address.parse(task.walletAddress)) // address of user that you want to liquidate (not user sc address !!! it is just user wallet address based on wich user sc address will be calculated)
    //             .storeAddress(highloadAddress)
    //             .storeUint(task.collateralAsset, 256) // id of token that you want to recive / id of token it is sha256 HASH from jetton wallet address of evaa master sc
    //             .storeUint(task.minCollateralAmount, 64) // minimal amount of tokens that will suttisfy you to recive back 
    //             .storeInt(-1, 2) // can be always -1
    //             .storeUint(task.liquidationAmount, 64)
    //             .storeRef(packedPrices) // cell with prices you can get it from our IOTA nft
    //             .endCell();
    //         // const fees = toNano('2')
    //     let amount = 0n;
    //     amount = task.liquidationAmount + toNano(0.5); // amount of TONs to send / based on that number minus 0.33 (for blockchain fees) evaa sc will calculate an amount of collateral tokens to send back to you (if it will be bigger than minCollateralAmount)
    //     destAddr = getAddressFriendly(evaaMaster);
    //     myBalance.ton -= amount;
        highloadMessages.set(i, beginCell()
            .store(storeMessageRelaxed(internal({
                value: amount,
                to: destAddr,
                body: liquidationBody
            })))
            .endCell()
        );
    //     log.push({
    //         id: task.id,
    //         walletAddress: task.walletAddress
    //     });
    //     i++;
    //     if (i == 100) {
    //         break;
    //     }
    }

    const finalQueryID = (BigInt(now + timeout) << 32n) + BigInt(queryID);
    const toSign = beginCell()
        .storeUint(698983191, 32)
        .storeUint(finalQueryID, 64)
        .storeDict(highloadMessages, Dictionary.Keys.Int(16), {
                serialize: (src, buidler) => {
                    buidler.storeUint(3, 8);
                    buidler.storeRef(src);
                },
                parse: (src) => {
                    let cell = beginCell()
                        .storeUint(src.loadUint(8), 8)
                        .storeRef(src.loadRef())
                        .endCell();
                    return cell;
                }
            }
        );
    const signature = sign(toSign.endCell().hash(), keys.secretKey);
    const highloadMessageBody = beginCell()
        .storeBuffer(signature)
        .storeBuilder(toSign)
        .endCell();
    while(true) {
        try {
            await contract.external(highloadMessageBody);
        } catch(e) {
            console.log(e)
            await sleep(1000);
            continue;
        }
        break;
    }
}

(() => {
    // configDotenv();
    // const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
    main()
        .catch(e => {
            console.log(e);
            // if (JSON.stringify(e).length == 2) {
            //     bot.api.sendMessage(serviceChatID, `Fatal error: ${e}`);
            //     return;
            // }
            // bot.api.sendMessage(serviceChatID, `Fatal error: ${JSON.stringify(e).slice(0, 300)} `);
        })
        .finally(() => console.log("Exiting..."));
})()
