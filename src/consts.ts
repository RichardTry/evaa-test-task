import { address } from "@ton/core";
import { Cell } from "@ton/ton";


export const rpcEndpoint = 'https://testnet.toncenter.com/api/v2/jsonRPC'
export const HIGHLOAD_CODE = Cell.fromBase64('te6ccgECEAEAAigAART/APSkE/S88sgLAQIBIAIDAgFIBAUB9vLUgwjXGNEh+QDtRNDT/9Mf9AT0BNM/0xXR+CMhoVIguY4SM234IySqAKESuZJtMt5Y+CMB3lQWdfkQ8qEG0NMf1NMH0wzTCdM/0xXRUWi68qJRWrrypvgjKqFSULzyowT4I7vyo1MEgA30D2+hmdAk1yHXCgDyZJEw4g4AeNAg10vAAQHAYLCRW+EB0NMDAXGwkVvg+kAw+CjHBbORMODTHwGCEK5C5aS6nYBA1yHXTPgqAe1V+wTgMAIBIAYHAgJzCAkCASAMDQARrc52omhrhf/AAgEgCgsAGqu27UTQgQEi1yHXCz8AGKo77UTQgwfXIdcLHwAbuabu1E0IEBYtch1wsVgA5bi/Ltou37IasJAoQJsO1E0IEBINch9AT0BNM/0xXRBY4b+CMloVIQuZ8ybfgjBaoAFaESuZIwbd6SMDPikjAz4lIwgA30D2+hntAh1yHXCgCVXwN/2zHgkTDiWYAN9A9voZzQAdch1woAk3/bMeCRW+JwgB/lMJgA30D2+hjhPQUATXGNIAAfJkyFjPFs+DAc8WjhAwyCTPQM+DhAlQBaGlFM9A4vgAyUA5gA30FwTIy/8Tyx/0ABL0ABLLPxLLFcntVPgPIdDTAAHyZdMCAXGwkl8D4PpAAdcLAcAA8qX6QDH6ADH0AfoAMfoAMYBg1yHTAAEPACDyZdIAAZPUMdGRMOJysfsA');
export const SUBWALLET_ID = 239;
export const DEFAULT_TIMEOUT = 128;

export const maxKeyCount   = (1 << 13);
export const maxShift      = maxKeyCount - 1;

export const HIGHLOAD_JETTON_WALLET = address("kQA6eZO4J134_wBqD80tkw6-9pjufOkS1XlvA878YxEbeFtt")
export const HIGHLOAD_ADDRESS = address("0QCm6iMpPU-29lHXjIZDc41J7XHXufeKq3zMUSVqC8OvEWFF")
export const JETTON_DECIMALS: number = 9