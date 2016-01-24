import { ByteArray } from '../kind/byte-array';
import { Key } from './key';
import { PrivateKey } from './private-key';
import { PublicKey } from './public-key';
import { KeyPair } from './key-pair';

declare var msrcrypto;

export class CryptographicService {
  protected crypto: SubtleCrypto;

  constructor() {
    this.crypto = window.crypto.subtle;

    if ( !this.crypto && msrcrypto )
       this.crypto = msrcrypto;
  }

  decrypt(algorithm: string | Algorithm, key: Key, data: ByteArray): Promise<ByteArray> {
    return new Promise<ByteArray>((resolve, reject) => {
      this.crypto.decrypt(algorithm, key.innerKey, data.backingArray)
        .then((res) => { resolve(new ByteArray(res)); })
        .catch((err) => { reject(err); });
    });
  }

//deriveBits(algorithm: string | Algorithm, baseKey: CryptoKey, length: number): any;
//deriveKey(algorithm: string | Algorithm, baseKey: CryptoKey, derivedKeyType: string | Algorithm, extractable: boolean, keyUsages: string[]): any;
  digest(algorithm: string | Algorithm, data: ByteArray): any {
    return new Promise<ByteArray>((resolve, reject) => {
      this.crypto.digest(algorithm, data.backingArray)
       .then((res) => { resolve(new ByteArray(res)); })
       .catch((err) => { reject(err); });
    });
  }

  encrypt( algorithm: string | Algorithm, key: Key, data: ByteArray ): Promise<ByteArray> {
    return new Promise<ByteArray>((resolve, reject) => {
      this.crypto.encrypt(algorithm, key.innerKey, data.backingArray)
        .then((res) => { resolve(new ByteArray(res)); })
        .catch((err) => { reject(err); });
    });
  }

  exportKey( format: string, key: Key ): Promise<ByteArray> {
    return new Promise<ByteArray>((resolve, reject) => {
      this.crypto.exportKey(format, key.innerKey)
        .then((res) => { resolve(new ByteArray(res)); })
        .catch((err) => { reject(err); });
    });
  }

  generateKey( algorithm: string | Algorithm, extractable: boolean, keyUsages: string[] ): Promise<Key | KeyPair> {
    return new Promise<Key | KeyPair>((resolve, reject) => {

   });
  }

  importKey(format: string, keyData: ByteArray , algorithm: string | Algorithm, extractable: boolean, keyUsages: string[]): Promise<CryptoKey> {
    return new Promise<Key>((resolve, reject) => {
      this.crypto.importKey(format, keyData.backingArray, algorithm, extractable, keyUsages)
        .then((res) => { resolve(res); })
        .catch((err) => { reject(err); });
   });
  }

  sign(algorithm: string | Algorithm, key: Key, data: ByteArray): Promise<ByteArray> {
    return new Promise<ByteArray>((resolve, reject) => {
      this.crypto.sign(algorithm, key.innerKey, data.backingArray)
        .then((res) => { resolve(new ByteArray(res)); })
        .catch((err) => { reject(err); });
    });
  }

//unwrapKey(format: string, wrappedKey: ArrayBufferView, unwrappingKey: CryptoKey, unwrapAlgorithm: string | Algorithm, unwrappedKeyAlgorithm: string | Algorithm, extractable: boolean, keyUsages: string[]): any;
  verify(algorithm: string | Algorithm, key: Key, signature: ByteArray, data: ByteArray): Promise<ByteArray> {
    return new Promise<ByteArray>((resolve, reject) => {
      this.crypto.verify(algorithm, key.innerKey, signature.backingArray, data.backingArray)
        .then((res) => { resolve(new ByteArray(res)); })
        .catch((err) => { reject(err); });
    });
  }

//wrapKey(format: string, key: CryptoKey, wrappingKey: CryptoKey, wrapAlgorithm: string | Algorithm): any;
}
