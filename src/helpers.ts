import {
    beginCell,
    Cell,
    ContractProvider,
    internal as internal_relaxed,
    MessageRelaxed,
    OutAction,
    OutActionSendMsg,
    SendMode,
    storeMessageRelaxed,
    storeOutList,
    toNano
} from '@ton/core';
import {sign} from "@ton/crypto";

enum OP {
    InternalTransfer = 0xae42e5a4
}

import {HighloadQueryId} from "./HighloadQueryId";

const TIMESTAMP_SIZE = 64;
const TIMEOUT_SIZE = 22;

export const highloadAddress = '0QCm6iMpPU-29lHXjIZDc41J7XHXufeKq3zMUSVqC8OvEWFF';

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendExternalMessage(
    provider: ContractProvider,
    secretKey: Buffer,
    opts: {
        message: MessageRelaxed | Cell,
        mode: number,
        query_id: bigint | HighloadQueryId,
        createdAt: number,
        subwalletId: number,
        timeout: number,
    }
) {
    let messageCell: Cell;

    if (opts.message instanceof Cell) {
        messageCell = opts.message
    } else {
        const messageBuilder = beginCell();
        messageBuilder.store(storeMessageRelaxed(opts.message))
        messageCell = messageBuilder.endCell();
    }

    const queryId =  (opts.query_id instanceof HighloadQueryId) ? opts.query_id.getQueryId() : opts.query_id;

    const messageInner = beginCell()
        .storeUint(opts.subwalletId, 32)
        .storeRef(messageCell)
        .storeUint(opts.mode, 8)
        .storeUint(queryId, 23)
        .storeUint(opts.createdAt, TIMESTAMP_SIZE)
        .storeUint(opts.timeout, TIMEOUT_SIZE)
        .endCell();

    await provider.external(
        beginCell()
            .storeBuffer(sign(messageInner.hash(), secretKey))
            .storeRef(messageInner)
            .endCell()
    );
}

export async function sendBatch(provider: ContractProvider, secretKey: Buffer, messages: OutActionSendMsg[], subwallet: number, query_id: HighloadQueryId, timeout: number, createdAt?: number, value: bigint = 0n) {
    if (createdAt == undefined) {
        createdAt = Math.floor(Date.now() / 1000);
    }
    return await sendExternalMessage(provider, secretKey, {
        message: packActions(messages, value, query_id),
        mode: value > 0n ? SendMode.PAY_GAS_SEPARATELY : SendMode.CARRY_ALL_REMAINING_BALANCE,
        query_id: query_id,
        createdAt: createdAt,
        subwalletId: subwallet,
        timeout: timeout
    });
}

function createInternalTransferBody(opts: {
    actions: OutAction[] | Cell,
    queryId: HighloadQueryId,
}) {
    let actionsCell: Cell;
    if (opts.actions instanceof Cell) {
        actionsCell = opts.actions;
    } else {
        if (opts.actions.length > 254) {
            throw TypeError("Max allowed action count is 254. Use packActions instead.");
        }
        const actionsBuilder = beginCell();
        storeOutList(opts.actions)(actionsBuilder);
        actionsCell = actionsBuilder.endCell();
    }
    return beginCell().storeUint(OP.InternalTransfer, 32)
        .storeUint(opts.queryId.getQueryId(), 64)
        .storeRef(actionsCell)
        .endCell();


}

function createInternalTransfer(opts: {
    actions: OutAction[] | Cell
    queryId: HighloadQueryId,
    value: bigint
}) {

    return internal_relaxed({
        to: highloadAddress,
        value: opts.value,
        body: createInternalTransferBody(opts)
    });
}

function packActions(messages: OutAction[], value: bigint = toNano('1'), query_id: HighloadQueryId) {
    let batch: OutAction[];
    if (messages.length > 254) {
        batch = messages.slice(0, 253);
        batch.push({
            type: 'sendMsg',
            mode: value > 0n ? SendMode.PAY_GAS_SEPARATELY : SendMode.CARRY_ALL_REMAINING_BALANCE,
            outMsg: packActions(messages.slice(253), value, query_id)
        });
    } else {
        batch = messages;
    }
    return createInternalTransfer({
        actions: batch,
        queryId: query_id,
        value
    });
}