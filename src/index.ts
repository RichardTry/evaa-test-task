import { configDotenv } from "dotenv";
import {sleep} from "./helpers";
import {address, Address, storeMessageRelaxed, internal} from "@ton/core";
import {mnemonicToWalletKey, KeyPair, sign} from "@ton/crypto";
import {Slice, Dictionary, beginCell, Cell, TonClient} from "@ton/ton";
import {readFile} from "fs";
import crypto from "crypto";

const rpcEndpoint = 'https://testnet.toncenter.com/api/v2/jsonRPC'
const highloadAddress = 'EQCm6iMpPU-29lHXjIZDc41J7XHXufeKq3zMUSVqC8OvEYcK';
const HIGHLOAD_CODE = Cell.fromBase64('te6ccgECEAEAAigAART/APSkE/S88sgLAQIBIAIDAgFIBAUB9vLUgwjXGNEh+QDtRNDT/9Mf9AT0BNM/0xXR+CMhoVIguY4SM234IySqAKESuZJtMt5Y+CMB3lQWdfkQ8qEG0NMf1NMH0wzTCdM/0xXRUWi68qJRWrrypvgjKqFSULzyowT4I7vyo1MEgA30D2+hmdAk1yHXCgDyZJEw4g4AeNAg10vAAQHAYLCRW+EB0NMDAXGwkVvg+kAw+CjHBbORMODTHwGCEK5C5aS6nYBA1yHXTPgqAe1V+wTgMAIBIAYHAgJzCAkCASAMDQARrc52omhrhf/AAgEgCgsAGqu27UTQgQEi1yHXCz8AGKo77UTQgwfXIdcLHwAbuabu1E0IEBYtch1wsVgA5bi/Ltou37IasJAoQJsO1E0IEBINch9AT0BNM/0xXRBY4b+CMloVIQuZ8ybfgjBaoAFaESuZIwbd6SMDPikjAz4lIwgA30D2+hntAh1yHXCgCVXwN/2zHgkTDiWYAN9A9voZzQAdch1woAk3/bMeCRW+JwgB/lMJgA30D2+hjhPQUATXGNIAAfJkyFjPFs+DAc8WjhAwyCTPQM+DhAlQBaGlFM9A4vgAyUA5gA30FwTIy/8Tyx/0ABL0ABLLPxLLFcntVPgPIdDTAAHyZdMCAXGwkl8D4PpAAdcLAcAA8qX6QDH6ADH0AfoAMfoAMYBg1yHTAAEPACDyZdIAAZPUMdGRMOJysfsA');

const JETTON_WALLET_ADDRESS = address("kQDKtmpUkHYbTOujgOml1_qCS9ugQ6nvMneXJoGJ0vfrjciY")
const OWNER_ADDRESS = address("0QCm6iMpPU-29lHXjIZDc41J7XHXufeKq3zMUSVqC8OvEWFF")
const JETTON_CODE = Cell.fromBase64('te6ccgECEQEAAyMAART/APSkE/S88sgLAQIBYgIDAgLMBAUAG6D2BdqJofQB9IH0gahhAgHUBgcCASAICQDDCDHAJJfBOAB0NMDAXGwlRNfA/AM4PpA+kAx+gAxcdch+gAx+gAwc6m0AALTH4IQD4p+pVIgupUxNFnwCeCCEBeNRRlSILqWMUREA/AK4DWCEFlfB7y6k1nwC+BfBIQP8vCAAET6RDBwuvLhTYAIBIAoLAIPUAQa5D2omh9AH0gfSBqGAJpj8EIC8aijKkQXUEIPe7L7wndCVj5cWLpn5j9ABgJ0CgR5CgCfQEsZ4sA54tmZPaqQB8VA9M/+gD6QCHwAe1E0PoA+kD6QNQwUTahUirHBfLiwSjC//LiwlQ0QnBUIBNUFAPIUAT6AljPFgHPFszJIsjLARL0APQAywDJIPkAcHTIywLKB8v/ydAE+kD0BDH6ACDXScIA8uLEd4AYyMsFUAjPFnD6AhfLaxPMgMAgEgDQ4AnoIQF41FGcjLHxnLP1AH+gIizxZQBs8WJfoCUAPPFslQBcwjkXKRceJQCKgToIIJycOAoBS88uLFBMmAQPsAECPIUAT6AljPFgHPFszJ7VQC9ztRND6APpA+kDUMAjTP/oAUVGgBfpA+kBTW8cFVHNtcFQgE1QUA8hQBPoCWM8WAc8WzMkiyMsBEvQA9ADLAMn5AHB0yMsCygfL/8nQUA3HBRyx8uLDCvoAUaihggiYloBmtgihggiYloCgGKEnlxBJEDg3XwTjDSXXCwGAPEADXO1E0PoA+kD6QNQwB9M/+gD6QDBRUaFSSccF8uLBJ8L/8uLCBYIJMS0AoBa88uLDghB73ZfeyMsfFcs/UAP6AiLPFgHPFslxgBjIywUkzxZw+gLLaszJgED7AEATyFAE+gJYzxYBzxbMye1UgAHBSeaAYoYIQc2LQnMjLH1Iwyz9Y+gJQB88WUAfPFslxgBDIywUkzxZQBvoCFctqFMzJcfsAECQQIwB8wwAjwgCwjiGCENUydttwgBDIywVQCM8WUAT6AhbLahLLHxLLP8ly+wCTNWwh4gPIUAT6AljPFgHPFszJ7VQ=');
const JETTON_MASTER = address("0:d7769f0958602cce023bd0d6efcda84f35cbe3e49189cd3d984d5711f98f7fd7")

function pack_jetton_wallet_data(balance: number, owner_address: Address, jetton_master_address: Address, jetton_wallet_code: Cell): Cell {
    return  beginCell()
            .storeCoins(balance)
            .storeAddress(owner_address)
            .storeAddress(jetton_master_address)
            .storeRef(jetton_wallet_code)
            .endCell();
 }

function calculate_jetton_wallet_state_init(owner_address: Address, jetton_master_address: Address, jetton_wallet_code: any): Cell{
    return beginCell()
           .storeUint(0, 2)
           .storeDict(jetton_wallet_code)
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
    let eligible_map;
    readFile(jsonPath, 'utf-8', (err, data) => {
        if (err) {
          console.error('Error reading the file:', err);
          return;
        }
        try {
          const parsedJson: { [key: string]: any } = JSON.parse(data);
          eligible_map = parsedJson;
        //   for (const key in parsedJson) {
        //     if (parsedJson.hasOwnProperty(key)) {
        //         eligibleBalances.set(address(key), parsedJson[key]);
        //       console.log(`${key}: ${parsedJson[key]}`);
        //     }
        //   }
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      });

    let i = 0;
    const highloadMessages = Dictionary.empty<number, Cell>();
    // for (const task of tasks) {
    for (const eligible_addr in eligible_map) {
    //     let liquidationBody = Cell.EMPTY;
        let full_msg = beginCell()
                .storeUint(0x18, 6)
                .storeAddress(address(eligible_addr))
                .storeCoins(0)
                .storeUint(7, 108)
                .storeRef(calculate_jetton_wallet_state_init(OWNER_ADDRESS,
                                                             JETTON_MASTER,
                                                             JETTON_CODE))
        let transferBody = beginCell()
                .storeUint(0x18, 6)
                .storeUint(i, 64)
                .storeCoins(1.23)
                .storeAddress(JETTON_WALLET_ADDRESS)
                .storeAddress(JETTON_WALLET_ADDRESS)
                .storeRef(Cell.EMPTY)
                .storeCoins(0)
                .storeRef(Cell.EMPTY)
                // .storeUint(0x3, 32) //liquidation opcode
                // .storeUint(task.queryID, 64) // queryID / can be 0
                // .storeAddress(Address.parse(task.walletAddress)) // address of user that you want to liquidate (not user sc address !!! it is just user wallet address based on wich user sc address will be calculated)
                // .storeAddress(highloadAddress)
                // .storeUint(task.collateralAsset, 256) // id of token that you want to recive / id of token it is sha256 HASH from jetton wallet address of evaa master sc
                // .storeUint(task.minCollateralAmount, 64) // minimal amount of tokens that will suttisfy you to recive back 
                // .storeInt(-1, 2) // can be always -1
                // .storeUint(task.liquidationAmount, 64)
                // .storeRef(packedPrices) // cell with prices you can get it from our IOTA nft
                .endCell();
        let totally_full_msg = full_msg.storeRef(transferBody).endCell();
    //         // const fees = toNano('2')
        let amount = 0n;
    //     amount = task.liquidationAmount + toNano(0.5); // amount of TONs to send / based on that number minus 0.33 (for blockchain fees) evaa sc will calculate an amount of collateral tokens to send back to you (if it will be bigger than minCollateralAmount)
        let destAddr = JETTON_WALLET_ADDRESS; //getAddressFriendly(JETTON_WALLET_ADDRESS);
    //     myBalance.ton -= amount;
        highloadMessages.set(i, beginCell()
            .store(storeMessageRelaxed(internal({
                value: amount,
                to: destAddr,
                body: totally_full_msg
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
        i++;
    }

    const queryID = crypto.randomBytes(4).readUint32BE();
    const now = Math.floor(Date.now() / 1000);
    const timeout = 60;
    const finalQueryID = (BigInt(now + timeout) << 32n) + BigInt(queryID);
    const toSign = beginCell()
    // messageInner = beginCell()
    //     .storeUint(opts.subwalletId, 32)
    //     .storeRef(messageCell)
    //     .storeUint(opts.mode, 8)
    //     .storeUint(queryId, 23)
    //     .storeUint(opts.createdAt, TIMESTAMP_SIZE)
    //     .storeUint(opts.timeout, TIMEOUT_SIZE)
    //     .endCell();
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
    let try_num = 1;
    while(true) {
        try {
            await contract.external(highloadMessageBody);
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
    // configDotenv();
    // const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
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
