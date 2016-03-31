import { ByteArray } from 'cryptographix-sim-core';

export interface CardDataStore
{
  getDGI( tag: number ): ByteArray;
}
