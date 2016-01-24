//enum KeyType { "public", "private", "secret" };

//enum KeyUsage { "encrypt", "decrypt", "sign", "verify", "deriveKey", "deriveBits", "wrapKey", "unwrapKey" };

export class Key //implements CryptoKey
{
  protected id: string;

  protected cryptoKey: CryptoKey;

  constructor( id: string, key?: CryptoKey )
  {
    this.id = id;

    if ( key )
      this.cryptoKey = key;
    else
    {
      this.cryptoKey =
      {
        type: "",
        algorithm: "",
        extractable: true,
        usages: []
      };
    }

  }

  public get type(): string
  {
    return this.cryptoKey.type;
  }

  public get algorithm(): KeyAlgorithm
  {
    return this.cryptoKey.algorithm;
  }

  public get extractable(): boolean
  {
    return this.cryptoKey.extractable;
  }

  public get usages(): string[]
  {
    return this.cryptoKey.usages;
  }

  public get innerKey(): CryptoKey
  {
    return this.cryptoKey;
  }
/*  getComponent( componentID: string ): any
  {
    return this.keyComponents[ componentID ];
  }

  setComponent( componentID: string, value: any )
  {
    this.keyComponents[ componentID ] = value;
  }*/
}
