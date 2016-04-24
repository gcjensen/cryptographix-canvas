import { ByteArray, CryptographicServiceProvider } from 'cryptographix-sim-core';
import { ByteString, TLV as GPTLV } from 'cryptographix-se-core';
import { ISO7816, CommandAPDU, ResponseAPDU } from 'cryptographix-se-core';
import { CardDataStore } from './card-data-store';
import { EMV } from '../common/EMV';

class TLV {
  xx: GPTLV;

  constructor( tag: number, contents: ByteArray, type: number ) {
    let bs = new ByteString( contents );
    this.xx = new GPTLV( tag, bs, type );
  }

  static EMV = GPTLV.EMV;

  getTLV(): ByteArray {
    return this.xx.getTLV().byteArray;
  }

}
export class AppletCore
{
  _cryptoProvider: CryptographicServiceProvider;
  sPAN: string;
  sPANSequence: string;
  static _wATC = 0;
  _wATC: number;
  _kCardACKey: CryptoKey;
  _bsPINBlock: ByteArray;
  _wPTC: number;

  dataStore: CardDataStore;

  constructor( dataStore: CardDataStore )
  {
    this.dataStore = dataStore;
    this._cryptoProvider = new CryptographicServiceProvider();

    this.init();
  }

  exchangeAPDU( commandAPDU: CommandAPDU ): Promise<ResponseAPDU>
  {
    var cmd = commandAPDU;

    var res = this.dispatchEMV( cmd.CLA, cmd.INS, cmd.P1, cmd.P2, cmd.data, cmd.Le );

    if ( res instanceof Promise )
      return <Promise<ResponseAPDU>>res;

    return new Promise<ResponseAPDU>( (resolve, reject ) => {


      resolve( res );
    });
  }

  init()
  {
    // defaults
    this.sPAN = "62 71 55 99 00 00 00 13";
    this.sPANSequence = "00";

    this._bsPINBlock = new ByteArray( "241234FFFFFFFFFF", ByteArray.HEX );
    this._wPTC = 3;

  }

  private deriveCardKey( kMasterKey, sPAN, sPANSequence ): Promise<any>
  {
    return this._cryptoProvider
      .importKey( "raw",
        new ByteArray( "5B 46 E9 3E D3 B9 23 BC AE 02 A7 CE 70 64 B5 C1", ByteArray.HEX ),
        "DES-ECB", true, [ "encrypt" ] )
      .then( kACMaster => {
        let baDerivationData;

        baDerivationData = new ByteArray( sPAN + sPANSequence, ByteArray.HEX );
        baDerivationData = baDerivationData.bytesAt( baDerivationData.length - 8, 8 );
        baDerivationData = baDerivationData.concat( baDerivationData.clone().not() );

        return this._cryptoProvider.encrypt( "DES-ECB",
            kACMaster, baDerivationData );
      } )
      .then( baDerivedKey => {
        return this._cryptoProvider
          .importKey( "raw",
            baDerivedKey,
            "DES-ECB", true, [ "encrypt" ] )
      })
      .catch( err => {
        alert( "oops. importKey failed: " + err );
      } );
  }

  private deriveSessionKey( kCardKey, baUN ): Promise<CryptoKey>
  {
    return this.deriveCardKey( null, this.sPAN, this.sPANSequence )
      .then( kCardKey => {
        var derivationData = new ByteArray();

        derivationData.addByte( this._wATC >> 8 ); derivationData.addByte( this._wATC & 0xFF );
        derivationData.addByte( 0xF0 );            derivationData.addByte( 0 );
        derivationData.concat( baUN );

        derivationData.addByte( this._wATC >> 8 ); derivationData.addByte( this._wATC & 0xFF );
        derivationData.addByte( 0x0F );            derivationData.addByte( 0 );
        derivationData.concat( baUN );

        return this._cryptoProvider.encrypt( "DES-ECB",
            kCardKey, derivationData );
      } )
      .then( derivedKey => {
        return this._cryptoProvider
          .importKey( "raw",
            derivedKey,
            "DES-ECB", true, [ "encrypt" ] )
      });
  }

  private computeApplicationCryptogram( baUN, baDataToSign: ByteArray ): Promise<ByteArray>
  {
    return this.deriveSessionKey( null, baUN )
      .then( sessionKey => {

        //  var paddedData = baDataToSign.pad( Crypto.ISO9797_METHOD_2 );
        return this._cryptoProvider.encrypt( "DES-ECB",
          sessionKey, baDataToSign.bytesAt( 0, 8 ));
      });
  }

  doGetProcessingOptions( bP1: number, bP2: number, commandData: ByteArray ): ResponseAPDU
  {
    //TODO: Validate APDU Params

    AppletCore._wATC++;
    this._wATC = AppletCore._wATC;

    return ResponseAPDU.init( ISO7816.SW_SUCCESS, this.dataStore.getDGI( 0x1501 ) );
  }

  doReadRecord( bP1: number, bP2: number, commandData: ByteArray ): ResponseAPDU
  {
    // EMVCHECK( ( P2 & 0x07 ) != 0x04, ISO7816.SW_FUNC_NOT_SUPPORTED );
    // Check that SFI in 1..10 and Record not 0
    // EMVCHECK( ( P2 == 0x04 ) || ( P2 > 0x04 + ( 10 << 3 ) ) || ( P1 == 0 ), ISO7816.SW_INCORRECT_P1P2 );

    // The above checks guarantee that P1P2 reference a valid
    // public record. Convert this to DGI format( SFI, Record ),
    // lookup record and return
    var rec = this.dataStore.getDGI( ( ( bP2 - 0x04 ) << 5 ) | bP1 );

    if ( rec != undefined )
      return ResponseAPDU.init( ISO7816.SW_SUCCESS, rec );
    else
      return ResponseAPDU.init( ISO7816.SW_RECORD_NOT_FOUND );
  }

  doVerify( bP1, bP2, commandData: ByteArray ): ResponseAPDU
  {
    if ( this._wPTC == 0 )
    {
      return ResponseAPDU.init( ISO7816.SW_FILE_INVALID );
    }
    else if ( !commandData.equals( this._bsPINBlock ) )
    {
      this._wPTC--;

      return ResponseAPDU.init( 0x63C0 + this._wPTC );
    }
    else
    {
      this._wPTC = 3;

      return ResponseAPDU.init( ISO7816.SW_SUCCESS );
    }
  }

  doGetData( bP1, bP2, commandData: ByteArray ): ResponseAPDU
  {
    let tag = bP1 << 8 | bP2;
    let val = [];

    switch( tag ) {
      case EMV.TAG_PTC:
        val = [ this._wPTC >> 8, this._wPTC & 0xFF ];
        break;

        case EMV.TAG_ATC:
          val = [ this._wATC >> 8, this._wATC & 0xFF ];
          break;

        default:
          return ResponseAPDU.init( ISO7816.SW_REFERENCED_DATA_NOT_FOUND );
    }

    let valBytes = new ByteArray( val );
    return ResponseAPDU.init( ISO7816.SW_SUCCESS,
      new ByteArray( [ bP1, bP2, val.length ]).concat( valBytes )
    );
  }

  doGenerateAC( bP1: number, bP2: number, commandData: ByteArray ): Promise<ResponseAPDU>
  {
    // Response: 9F270100
    //           9F36020000
    //           9F10200FA001000000000000000000000000000F000000000000000000000000000000
    //           9F26080000000000000000
    var bCID = EMV.CID_ARQC;  // bP1
  //  var bCID = EMV.CID_AAC;  // bP1
    var baIAPD = new ByteArray( "0FA001A00800000000000000000000000F000000000000000000000000000000", ByteArray.HEX );
  //GAC1  var baIAPD = new ByteArray( "0FA001A83000000000000000000000000F010000000000000000000000000000", HEX );
  //GAC2  var baIAPD = new ByteArray( "0FA001203000000000000000000000000F010000000000000000000000000000", HEX );
    let bbTemp = new ByteArray();

    bbTemp
      // CDOL1 = 9F0206 9F0306 9F1A02 9505 5F2A02 9A03 9C01 9F3704
      .concat( commandData.viewAt( 0, 29 ) )
      // Append  8202 - fixed in 1501
      .concat( new ByteArray( this.dataStore.getDGI( 0x1501 ).viewAt( 4, 1 ) ) )
      // Append  9F3602
      .addByte( this._wATC >> 8 )
      .addByte( this._wATC & 0xFF )
      // Append  IAP
      .concat( baIAPD );

    // UN = 25..28
    return this.computeApplicationCryptogram( commandData.viewAt( 25, 4 ), bbTemp )
      .then( baCryptogram => {
        //  print( "AC=" + baCryptogram.toString() );
        let bbResponse = new ByteArray();

        let tlvTemp: TLV;

        tlvTemp = new TLV( EMV.TAG_CRYPTOGRAM_INFORMATION_DATA, new ByteArray( bCID.toString( 16 ), ByteArray.HEX ), TLV.EMV );
        bbResponse.concat( tlvTemp.getTLV() );

        bbTemp = new ByteArray( )
          .addByte( this._wATC >> 8 )
          .addByte( this._wATC & 0xFF )

        tlvTemp = new TLV( EMV.TAG_ATC, bbTemp, TLV.EMV );
        bbResponse.concat( tlvTemp.getTLV() );

        tlvTemp = new TLV( EMV.TAG_ISSUER_APPLICATION_DATA, baIAPD, TLV.EMV );
        bbResponse.concat( tlvTemp.getTLV() );

        tlvTemp = new TLV( EMV.TAG_APPLICATION_CRYPTOGRAM, baCryptogram, TLV.EMV );
        bbResponse.concat( tlvTemp.getTLV() );

        tlvTemp = new TLV( EMV.TAG_RESPONSE_FORMAT2_TEMPLATE, bbResponse, TLV.EMV );

        return Promise.resolve<ResponseAPDU>( ResponseAPDU.init( ISO7816.SW_SUCCESS, tlvTemp.getTLV() ) );
      } );
  }

  dispatchEMV( bCLA, bINS, bP1, bP2, commandData, wLe ): ResponseAPDU | Promise<ResponseAPDU>
  {
    switch( bINS )
    {
      case EMV.INS_GET_PROCESSING_OPTIONS:
        return this.doGetProcessingOptions( bP1, bP2, commandData );

      case ISO7816.INS_VERIFY:
        return this.doVerify( bP1, bP2, commandData );

      case ISO7816.INS_READ_RECORD:
        return this.doReadRecord( bP1, bP2, commandData );

      case ISO7816.INS_GET_DATA:
        return this.doGetData( bP1, bP2, commandData );

      case EMV.INS_GENERATE_AC:
        return this.doGenerateAC( bP1, bP2, commandData );

//      case ISO7816.INS_SELECT_FILE:
//        return this.selectApplication( bP1, bP2, commandData );

      default:
        return ResponseAPDU.init( 0x6D00 );
    }
  }

  doStoreData( bP1, bP2, commandData )
  {
    var P1P2 = ( bP1 << 8 ) | bP2;

    switch( P1P2 )
    {
      case 0x5A:
        this.sPAN = commandData;
        break;

      case 0x5F34:
        this.sPANSequence = commandData;
        break;

      default:        return 0x6A80;
    }

    return ISO7816.SW_SUCCESS;
  }

}

/*function TestEMVCardApplication()
{
  print( "Testing EMVCardApplication" );
  print( "-----------------------" );

  var emvApplet = new EMVCardApplication( "6271559900000013", "00", kACMaster );

  print( "Test: GPO + GAC" );
  emvApplet.sendAPDU( EMV.CLA_EMV,
                      EMV.INS_GET_PROCESSING_OPTIONS,
                      0,
                      0,
                      "8300" );
  if ( emvApplet.getSW12() != ISO7816.SW_SUCCESS )
    print( "Failed GPO: SW=" + emvApplet.getSW12().toString( 16 ) );
  else
  {
    print( "GPO OK: SW=" + emvApplet.getSW12().toString( 16 ) );
    print( "APDUResponse: " + emvApplet.getAPDUResponseData() );
  }

  emvApplet.sendAPDU( EMV.CLA_EMV,
                      EMV.INS_GENERATE_AC,
                      0,
                      0,
                      "0000000000000000000000000000000000000000000000000000000000" );
  if ( emvApplet.getSW12() != ISO7816.SW_SUCCESS )
    print( "Failed GAC: SW=" + emvApplet.getSW12().toString( 16 ) );
  else if ( !emvApplet.getAPDUResponseData().equals( new ByteArray( "77 37 9F 27 01 40 9F 36 02 00 01 9F 10 20 0F A0 01 90 08 00 00 00 00 00 00 00 00 00 00 00 0F 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 9F 26 08 67 E4 7E BD 48 2A 54 29", HEX ) ) )
    print( "Failed GAC" );
  else
  {
    print( "GAC OK: SW=" + emvApplet.getSW12().toString( 16 ) );
    print( "APDUResponse: " + emvApplet.getAPDUResponseData() );
  }

  var emvAuth = new BSDSE4X();
  var tlvDE55 = emvApplet.getAPDUResponseData().bytes( 2 );

  emvAuth.Initialize( "4F07A0000001544442" );

  print( emvAuth.ValidateAC( "5A086271559900000013"
                           + "5F340100"
                           + "9A03000000"
                           + "9F0206000000000000"
                           + "5F2A020000"
                           + "9F1A020000"
                           + "8407A0000001544442"
                           + "82021000"
                           + "9F0306000000000000"
                           + "9F370400000000"
                           + "95050000000000"
                           + "9C0100"
                           + tlvDE55.toString() ) );

}
*/
