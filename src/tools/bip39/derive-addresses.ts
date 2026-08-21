import { secp256k1, schnorr } from '@noble/curves/secp256k1.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { base58check, bech32, bech32m } from '@scure/base'
import { HDKey } from '@scure/bip32'

const b58 = base58check(sha256)

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function bytesToNumberBE(bytes: Uint8Array) {
  let n = 0n
  for (const b of bytes) n = (n << 8n) + BigInt(b)
  return n
}

function hash160(data: Uint8Array) {
  return ripemd160(sha256(data))
}

function requirePrivateKey(seed: Uint8Array, path: string) {
  const privateKey = HDKey.fromMasterSeed(seed).derive(path).privateKey
  if (!privateKey) {
    throw new Error(`无法派生私钥：${path}`)
  }
  return privateKey
}

function ethAddressFromPrivateKey(privateKey: Uint8Array) {
  const publicKey = secp256k1.getPublicKey(privateKey, false)
  const hash = keccak_256(publicKey.slice(1))
  return `0x${bytesToHex(hash.slice(-20))}`
}

/** BIP44 P2PKH · 1… */
function btcLegacyFromPrivateKey(privateKey: Uint8Array) {
  const publicKey = secp256k1.getPublicKey(privateKey, true)
  const payload = new Uint8Array(21)
  payload[0] = 0x00
  payload.set(hash160(publicKey), 1)
  return b58.encode(payload)
}

/** BIP49 P2SH-P2WPKH · 3… */
function btcNestedSegwitFromPrivateKey(privateKey: Uint8Array) {
  const publicKey = secp256k1.getPublicKey(privateKey, true)
  const redeem = new Uint8Array(22)
  redeem[0] = 0x00
  redeem[1] = 0x14
  redeem.set(hash160(publicKey), 2)
  const payload = new Uint8Array(21)
  payload[0] = 0x05
  payload.set(hash160(redeem), 1)
  return b58.encode(payload)
}

/** BIP84 P2WPKH · bc1q… */
function btcNativeSegwitFromPrivateKey(privateKey: Uint8Array) {
  const publicKey = secp256k1.getPublicKey(privateKey, true)
  const words = [0, ...bech32.toWords(hash160(publicKey))]
  return bech32.encode('bc', words)
}

/** BIP86 P2TR · bc1p… */
function btcTaprootFromPrivateKey(privateKey: Uint8Array) {
  const internalKey = schnorr.getPublicKey(privateKey)
  const point = schnorr.utils.lift_x(bytesToNumberBE(internalKey))
  const tweak = bytesToNumberBE(schnorr.utils.taggedHash('TapTweak', internalKey))
  const outputKey = schnorr.utils.pointToBytes(
    point.add(secp256k1.Point.BASE.multiply(tweak)),
  )
  return bech32m.encode('bc', [1, ...bech32m.toWords(outputKey)])
}

function tronAddressFromPrivateKey(privateKey: Uint8Array) {
  const publicKey = secp256k1.getPublicKey(privateKey, false)
  const hash = keccak_256(publicKey.slice(1))
  const payload = new Uint8Array(21)
  payload[0] = 0x41
  payload.set(hash.slice(-20), 1)
  return b58.encode(payload)
}

function cosmosAddressFromPrivateKey(privateKey: Uint8Array) {
  const publicKey = secp256k1.getPublicKey(privateKey, true)
  const words = bech32.toWords(hash160(publicKey))
  return bech32.encode('cosmos', words)
}

export type ChainId =
  | 'ethereum'
  | 'bitcoin-legacy'
  | 'bitcoin-nested'
  | 'bitcoin-native'
  | 'bitcoin-taproot'
  | 'tron'
  | 'cosmos'

export interface ChainOption {
  id: ChainId
  name: string
  pathTemplate: string
  note: string
}

export const CHAIN_OPTIONS: ChainOption[] = [
  {
    id: 'ethereum',
    name: 'Ethereum / EVM',
    pathTemplate: "m/44'/60'/0'/0/i",
    note: 'BSC、Polygon 等 EVM 链地址相同',
  },
  {
    id: 'bitcoin-legacy',
    name: 'Bitcoin (Legacy)',
    pathTemplate: "m/44'/0'/0'/0/i",
    note: 'BIP44 · 1… 地址',
  },
  {
    id: 'bitcoin-nested',
    name: 'Bitcoin (Nested SegWit)',
    pathTemplate: "m/49'/0'/0'/0/i",
    note: 'BIP49 · 3… 地址',
  },
  {
    id: 'bitcoin-native',
    name: 'Bitcoin (Native SegWit)',
    pathTemplate: "m/84'/0'/0'/0/i",
    note: 'BIP84 · bc1q… 地址',
  },
  {
    id: 'bitcoin-taproot',
    name: 'Bitcoin (Taproot)',
    pathTemplate: "m/86'/0'/0'/0/i",
    note: 'BIP86 · bc1p… 地址',
  },
  {
    id: 'tron',
    name: 'Tron',
    pathTemplate: "m/44'/195'/0'/0/i",
    note: 'BIP44 coin type 195',
  },
  {
    id: 'cosmos',
    name: 'Cosmos Hub',
    pathTemplate: "m/44'/118'/0'/0/i",
    note: 'cosmos1… 地址',
  },
]

export interface DerivedAddress {
  path: string
  address: string
  privateKey: string
}

function buildEntry(
  path: string,
  privateKey: Uint8Array,
  address: string,
): DerivedAddress {
  return {
    path,
    address,
    privateKey: bytesToHex(privateKey),
  }
}

export function deriveAddresses(
  seed: Uint8Array,
  chainId: ChainId,
  count = 5,
): DerivedAddress[] {
  return Array.from({ length: count }, (_, index) => {
    switch (chainId) {
      case 'ethereum': {
        const path = `m/44'/60'/0'/0/${index}`
        const privateKey = requirePrivateKey(seed, path)
        return buildEntry(
          path,
          privateKey,
          ethAddressFromPrivateKey(privateKey),
        )
      }
      case 'bitcoin-legacy': {
        const path = `m/44'/0'/0'/0/${index}`
        const privateKey = requirePrivateKey(seed, path)
        return buildEntry(path, privateKey, btcLegacyFromPrivateKey(privateKey))
      }
      case 'bitcoin-nested': {
        const path = `m/49'/0'/0'/0/${index}`
        const privateKey = requirePrivateKey(seed, path)
        return buildEntry(
          path,
          privateKey,
          btcNestedSegwitFromPrivateKey(privateKey),
        )
      }
      case 'bitcoin-native': {
        const path = `m/84'/0'/0'/0/${index}`
        const privateKey = requirePrivateKey(seed, path)
        return buildEntry(
          path,
          privateKey,
          btcNativeSegwitFromPrivateKey(privateKey),
        )
      }
      case 'bitcoin-taproot': {
        const path = `m/86'/0'/0'/0/${index}`
        const privateKey = requirePrivateKey(seed, path)
        return buildEntry(
          path,
          privateKey,
          btcTaprootFromPrivateKey(privateKey),
        )
      }
      case 'tron': {
        const path = `m/44'/195'/0'/0/${index}`
        const privateKey = requirePrivateKey(seed, path)
        return buildEntry(
          path,
          privateKey,
          tronAddressFromPrivateKey(privateKey),
        )
      }
      case 'cosmos': {
        const path = `m/44'/118'/0'/0/${index}`
        const privateKey = requirePrivateKey(seed, path)
        return buildEntry(
          path,
          privateKey,
          cosmosAddressFromPrivateKey(privateKey),
        )
      }
    }
  })
}
