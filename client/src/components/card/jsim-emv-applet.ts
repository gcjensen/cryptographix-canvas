import { ByteArray } from 'cryptographix-sim-core';
import { ISO7816, CommandAPDU, ResponseAPDU } from 'cryptographix-se-core';
import { JSIMScriptApplet } from 'cryptographix-se-core';
import { AppletCore } from './applet-core';
import { CardDataStore } from './card-data-store';

class JSIMDataStore implements CardDataStore
{
  _bsPublicRecords: ByteArray[];

  constructor()
  {
    this._bsPublicRecords = [];

    this._bsPublicRecords[ 0x1501 ]  = new ByteArray( "77 0E 82 02 10 00 94 08 08 01 03 00 10 01 01 00", ByteArray.HEX );

    this._bsPublicRecords[ 0x0101 ] = new ByteArray( "70 3E 57 13 62 71 55 99 00 00 43 79 D1 10 22 06 26 80 00 90 60 22 3F 5F 20 12 43 41 52 54 41 4F 20 43 49 41 42 20 4D 20 4F 49 54 4F 5F 28 02 00 76 9F 42 02 09 86 5F 30 02 02 01 9F 08 02 20 00", ByteArray.HEX );
    this._bsPublicRecords[ 0x0102 ] = new ByteArray( "70 33 8C 18 9F 02 06 9F 03 06 9F 1A 02 95 05 5F 2A 02 9A 03 9C 01 9F 37 04 9F 35 01 8D 09 91 08 8A 02 9F 37 04 95 05 8E 0C 00 00 00 00 00 00 00 00 41 03 00 00", ByteArray.HEX );
    this._bsPublicRecords[ 0x0103 ] = new ByteArray( "70 16 9F 56 0F 80 00 7F FF FF 00 00 00 00 00 00 00 00 00 00 9F 55 01 B0", ByteArray.HEX );
    this._bsPublicRecords[ 0x0201  ] = new ByteArray( "70 37 5F 25 03 06 02 23 5F 24 03 11 02 28 5A 08 62 71 55 99 00 00 00 13 5F 34 01 00 9F 07 02 FF 00 9F 0D 05 F8 40 64 20 00 9F 0E 05 00 10 00 00 00 9F 0F 05 F8 60 64 F8 00", ByteArray.HEX );
   }

   getDGI( tag: number ): ByteArray
   {
      return this._bsPublicRecords[ tag ];
   }
}

export class JSIMEMVApplet extends JSIMScriptApplet
{
  core: AppletCore;

  constructor()
  {
    super();
  }

  selectApplication( commandAPDU: CommandAPDU ): Promise<ResponseAPDU>
  {
    return new Promise<ResponseAPDU>( (resolve, reject ) => {
      let fci = new ByteArray( "6F3C 8407A0000001544442 A531 500F42616E726973756C2044656269746F 870108 9F120F42616E726973756C2044656269746F 9F110101 5F2D047074656E", ByteArray.HEX );

      this.core = new AppletCore( new JSIMDataStore() );

      resolve( ResponseAPDU.init( ISO7816.SW_SUCCESS, fci ) );
    });
  }

  executeAPDU( commandAPDU: CommandAPDU ): Promise<ResponseAPDU>
  {
    if ( this.core )
      return this.core.exchangeAPDU( commandAPDU );
    else
      return Promise.resolve<ResponseAPDU>( new ResponseAPDU( { sw: 0x6D00 } ) );
  }

  deselectAppication()
  {
    if ( this.core )
      this.core = undefined;
  }
}
