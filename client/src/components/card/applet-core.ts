import { ByteArray } from 'cryptographix-sim-core';
import { ByteString, ByteBuffer, TLV, Crypto, Key } from 'cryptographix-se-core';
import { ISO7816, CommandAPDU, ResponseAPDU } from 'cryptographix-se-core';
import { CardDataStore } from './card-data-store';
import { EMV } from '../common/EMV';

export class AppletCore
{
  oCrypto: Crypto;
  sPAN: string;
  sPANSequence: string;
  static _wATC = 0;
  _wATC: number;
  _kCardACKey: Key;
  _bsPINBlock: ByteArray;
  _wPTC: number;

  dataStore: CardDataStore;

  constructor( dataStore: CardDataStore )
  {
    this.dataStore = dataStore;

    this.init();
  }

  exchangeAPDU( commandAPDU: CommandAPDU ): Promise<ResponseAPDU>
  {
    return new Promise<ResponseAPDU>( (resolve, reject ) => {

      var cmd = commandAPDU;

      var res = this.dispatchEMV( cmd.CLA, cmd.INS, cmd.P1, cmd.P2, cmd.data, cmd.Le );

      resolve( res );
    });
  }

  init()
  {
    this.oCrypto = new Crypto( );

    let kACMaster: Key = new Key();
    kACMaster.setType( Key.SECRET );
    kACMaster.setComponent( Key.DES, new ByteString( "5B 46 E9 3E D3 B9 23 BC AE 02 A7 CE 70 64 B5 C1", ByteString.HEX ) );

    // defaults
    this.sPAN = "62 71 55 99 00 00 00 13";
    this.sPANSequence = "00";

    this._bsPINBlock = new ByteArray( "241234FFFFFFFFFF", ByteArray.HEX );
    this._wPTC = 3;

    // Init
    this._kCardACKey = this.deriveCardKey( kACMaster, this.sPAN, this.sPANSequence );
  }

  private deriveCardKey( kMasterKey, sPAN, sPANSequence )
  {
    var kCardKey = new Key();
    var baDerivationData, baDerivedKey;
  //  var sDerivationData;

  //  if ( sPAN.length & 1 )
  //    sPAN += sPAN + 'F';

  //  sDerivationData = slice( "00000000000000" + sPAN, -14 )
  //                  + slice( "00" + sPANSequence, -12 )

    baDerivationData = new ByteString( sPAN + sPANSequence, ByteString.HEX );
    baDerivationData = baDerivationData.bytes( baDerivationData.length - 8, 8 );
    baDerivationData = baDerivationData.concat( baDerivationData.not() );

    baDerivedKey = this.oCrypto.encrypt( kMasterKey, Crypto.DES_ECB, baDerivationData );

  //  print( "CardKey:" + baDerivationData.toString() + "=" + baDerivedKey.toString() );

    kCardKey.setType( Key.SECRET );
    kCardKey.setComponent( Key.DES, baDerivedKey );

    return kCardKey;
  }

  private deriveSessionKey( kCardKey, baUN )
  {
    var kSessionKey = new Key();
    var derivedKey; //: ByteArray;
    var derivationData = new ByteArray();

    derivationData.addByte( this._wATC >> 8 ); derivationData.addByte( this._wATC & 0xFF );
    derivationData.addByte( 0xF0 );            derivationData.addByte( 0 );
    derivationData.concat( baUN );

    derivationData.addByte( this._wATC >> 8 ); derivationData.addByte( this._wATC & 0xFF );
    derivationData.addByte( 0x0F );            derivationData.addByte( 0 );
    derivationData.concat( baUN );

    derivedKey = this.oCrypto.encrypt( kCardKey, Crypto.DES_ECB, new ByteString( derivationData ) );
  //  print( "SessionKey:" + bbDerivationData.toString() + '=' + baDerivedKey.toString() );
    kSessionKey.setType( Key.SECRET );
    kSessionKey.setComponent( Key.DES, derivedKey );

    return kSessionKey;
  }

  private computeApplicationCryptogram( baUN, baDataToSign )
  {
    var kSessionACKey = this.deriveSessionKey( this._kCardACKey, baUN );
    var baPaddedData = baDataToSign.pad( Crypto.ISO9797_METHOD_2 );

  //  print( "CryptoToSign: " + baPaddedData.toString() );
    return this.oCrypto.sign( kSessionACKey, Crypto.DES_MAC_EMV, baPaddedData );
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
    var rec = this.dataStore.getDGI(  ( ( bP2 - 0x04 ) << 5 ) | bP1 );

    if ( rec != undefined )
      return ResponseAPDU.init( ISO7816.SW_SUCCESS, rec );
    else
      return ResponseAPDU.init( ISO7816.SW_RECORD_NOT_FOUND );
  }

  doVerify( bP1, bP2, commandData: ByteArray ): ResponseAPDU
  {
    if ( this._wPTC == 0 )
    {
      return new ResponseAPDU().setSW( 0x6983 );
    }
    else if ( !commandData.equals( this._bsPINBlock ) )
    {
      this._wPTC--;

      return new ResponseAPDU().setSW( 0x63C0 + this._wPTC );
    }
    else
    {
      this._wPTC = 3;

      return new ResponseAPDU().setSW( ISO7816.SW_SUCCESS );
    }
  }

  doGenerateAC( bP1: number, bP2: number, commandData: ByteArray ): ResponseAPDU
  {
    // Response: 9F270100
    //           9F36020000
    //           9F10200FA001000000000000000000000000000F000000000000000000000000000000
    //           9F26080000000000000000
    var bCID = EMV.CID_ARQC;  // bP1
  //  var bCID = EMV.CID_AAC;  // bP1
    var baIAPD = new ByteString( "0FA001A00800000000000000000000000F000000000000000000000000000000", ByteString.HEX );
  //GAC1  var baIAPD = new ByteString( "0FA001A83000000000000000000000000F010000000000000000000000000000", HEX );
  //GAC2  var baIAPD = new ByteString( "0FA001203000000000000000000000000F010000000000000000000000000000", HEX );
    var bbResponse;
    var tlvTemp, baTemp, bbTemp;

    // CDOL1 = 9F0206 9F0306 9F1A02 9505 5F2A02 9A03 9C01 9F3704
    bbTemp = new ByteBuffer( commandData.viewAt( 0, 29 ) );

    // Append  8202 - fixed in 1501
    bbTemp.append( new ByteString( this.dataStore.getDGI( 0x1501 ).viewAt( 4, 1 ) ) );

    // Append  9F3602
    bbTemp.append( this._wATC >> 8 );
    bbTemp.append( this._wATC & 0xFF );

    // Append  IAP
    bbTemp.append( baIAPD );

    // UN = 25..28
    var baCryptogram = this.computeApplicationCryptogram( commandData.viewAt( 25, 4 ), bbTemp.toByteString() )
  //  print( "AC=" + baCryptogram.toString() );
    bbResponse = new ByteBuffer();

    tlvTemp = new TLV( EMV.TAG_CRYPTOGRAM_INFORMATION_DATA, new ByteString( bCID.toString( 16 ), ByteString.HEX ), TLV.EMV );
    bbResponse.append( tlvTemp.getTLV() );

    bbTemp = new ByteBuffer();
    bbTemp.append( this._wATC >> 8 );
    bbTemp.append( this._wATC & 0xFF );
    tlvTemp = new TLV( EMV.TAG_ATC, bbTemp.toByteString(), TLV.EMV );
    bbResponse.append( tlvTemp.getTLV() );

    tlvTemp = new TLV( EMV.TAG_ISSUER_APPLICATION_DATA, baIAPD, TLV.EMV );
    bbResponse.append( tlvTemp.getTLV() );

    tlvTemp = new TLV( EMV.TAG_APPLICATION_CRYPTOGRAM, baCryptogram, TLV.EMV );
    bbResponse.append( tlvTemp.getTLV() );

    tlvTemp = new TLV( EMV.TAG_RESPONSE_FORMAT2_TEMPLATE, bbResponse.toByteString(), TLV.EMV );

    return ResponseAPDU.init( ISO7816.SW_SUCCESS, tlvTemp.getTLV() );
  }

  dispatchEMV( bCLA, bINS, bP1, bP2, commandData, wLe ): ResponseAPDU
  {
    switch( bINS )
    {
      case EMV.INS_GET_PROCESSING_OPTIONS:
        return this.doGetProcessingOptions( bP1, bP2, commandData );

      case ISO7816.INS_VERIFY:
        return this.doVerify( bP1, bP2, commandData );

      case ISO7816.INS_READ_RECORD:
        return this.doReadRecord( bP1, bP2, commandData );

      case EMV.INS_GENERATE_AC:
        return this.doGenerateAC( bP1, bP2, commandData );

//      case ISO7816.INS_SELECT_FILE:
//        return this.selectApplication( bP1, bP2, commandData );

      default:
        return new ResponseAPDU().setSW( 0x6D00 );
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
  else if ( !emvApplet.getAPDUResponseData().equals( new ByteString( "77 37 9F 27 01 40 9F 36 02 00 01 9F 10 20 0F A0 01 90 08 00 00 00 00 00 00 00 00 00 00 00 0F 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 9F 26 08 67 E4 7E BD 48 2A 54 29", HEX ) ) )
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
