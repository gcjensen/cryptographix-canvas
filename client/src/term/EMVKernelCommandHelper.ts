import { ISO7816 } from 'cryptographix-se-core';
import { EMV } from '../common/EMV';
import { ByteString, ByteBuffer, TLV, Crypto, Key } from 'cryptographix-se-core';
import { TLVParser } from '../common/TLVParser';

export class EMVCommandHelper
{
  cardReader;
  commandID;
  commandName;
  commandBuffer;
  responseBuffer;

  constructor( cardReader )
  {
    this.cardReader = cardReader;
    this.commandID = null;
    this.commandName = "";
    this.commandBuffer = null;
    this.responseBuffer = null;
  }

  private _buildAPDU( byteCLA, byteINS, byteP1, byteP2, commandData, byteLe? )
  {
    var bb = new ByteBuffer();

    bb.append( byteCLA );
    bb.append( byteINS );
    bb.append( byteP1 );
    bb.append( byteP2 );

    if ( commandData != undefined )
    {
      if ( typeof commandData == "string" )
        commandData = new ByteString( commandData, ByteString.HEX );

      if ( commandData.length > 0 )
      {
        bb.append( commandData.length );
        if ( commandData instanceof ByteString )
        {
          bb.append( commandData );
        }
        else
        {
          for( var i = 0; i < commandData.length; ++i )
            bb.append( commandData[i] );
        }
      }
    }

    if ( byteLe != undefined )
      bb.append( byteLe & 0xFF );

    this.commandBuffer = bb.toByteString();

    this.responseBuffer = null;

    return this.commandBuffer;
  };

  buildSelectApplication( aidData )
  {
    this.commandID = EMVCommandHelper.cmdSelectFile;
    this.commandName = "Select File";

    return this._buildAPDU( ISO7816.CLA_ISO, ISO7816.INS_SELECT_FILE, 0x04, 0x00, aidData );
  }

  buildGetProcessingOptions( pdolData )
  {
    this.commandID = EMVCommandHelper.cmdGetProcessingOptions;
    this.commandName = "Get Processing Options";

    return this._buildAPDU(
      EMV.CLA_EMV,
      EMV.INS_GET_PROCESSING_OPTIONS,
      0x00,
      0x00,
      pdolData,
      0 );
  }

  buildReadRecord( shortFileIndicator, recordNum )
  {
    this.commandID = EMVCommandHelper.cmdReadRecord;
    this.commandName = "Read Record";

    return this._buildAPDU(
      ISO7816.CLA_ISO,
      ISO7816.INS_READ_RECORD,
      recordNum,
      ( shortFileIndicator << 3 ) + 0x04,
      null,
      0 );
  }

  buildVerify( pinType, pinData )
  {
    this.commandID = EMVCommandHelper.cmdVerify;
    this.commandName = "Verify";

    return this._buildAPDU(
      ISO7816.CLA_ISO, ISO7816.INS_VERIFY,
      0x00,
      pinType,
      pinData );
  }

  buildGenerateAC( bCID, gacData )
  {
    this.commandID = EMVCommandHelper.cmdGenerateAC;
    this.commandName = "Generate AC";

    return this._buildAPDU(
      EMV.CLA_EMV,
      EMV.INS_GENERATE_AC,
      bCID,
      0x00,
      gacData,
      0x00 );
  }

  apduCommand;
  apduResponse;
  onAPDUResponse;
  tlvArray;

  getAPDUCommand()
  {
    return this.apduCommand;
  }

  executeAPDUCommand( onAPDUResponse )
  {
    var me = this;
    var apdu = this.commandBuffer;
    var apduLc = ( apdu.length > 5 ) ? apdu.byteAt( 4 ) : 0;
    var offsetLe = ( apduLc == 0 ) ? 4 : 5 + apduLc;
    var apduLe = ( offsetLe < apdu.length ) ? apdu.byteAt( offsetLe ) : undefined;
    var cmdData = ( apduLc > 0 ) ? apdu.bytes( 5, apduLc ) : new ByteString( "", ByteString.HEX );

    this.onAPDUResponse = onAPDUResponse;

    this.cardReader.executeAPDUCommand( apdu.byteAt( 0 ), apdu.byteAt( 1 ), apdu.byteAt( 2 ), apdu.byteAt( 3 ),
       cmdData,
       apduLe,
       function( SW12, responseBuffer ) { me.handleAPDUResponse( SW12, responseBuffer ) } );
  }

  setTag( wTag, aValue )
  {
    var bsValue = ( aValue instanceof ByteString ) ? aValue : new ByteString( aValue, ByteString.HEX );
    var newTLV = new TLV( wTag, bsValue, TLV.EMV );

    this.tlvArray[ wTag ] = newTLV;
  }

  storeTemplate( aTemplate )
  {
    var bsTemplate = ( aTemplate instanceof ByteString ) ? aTemplate : new ByteString( aTemplate, ByteString.HEX );
    var tlvInfo = TLV.parseTLV( bsTemplate, TLV.EMV );
    var tlvParser = new TLVParser( <ByteString>(tlvInfo.value) );

    while( !tlvParser.isEOF() )
    {
      var wTag = tlvParser.getTag();
      var iLength = tlvParser.getLength();

      this.setTag( wTag, tlvParser.getValue( iLength ) );
    }
  }

  parseSelectFile( SW12, responseBuffer )
  {
    if ( SW12 == 0x9000 )
      this.storeTemplate( responseBuffer );
  }

  parseGetProcessingOptions( SW12, responseBuffer )
  {
    if ( SW12 == 0x9000 )
    {
      // Process GetProcessingOptions Response
      if ( responseBuffer.byteAt( 0 ) == 0x80 )
      {
        this.setTag( EMV.TAG_AIP, responseBuffer.bytes( 2, 2 ) );
        this.setTag( EMV.TAG_AFL, responseBuffer.bytes( 4 ) );
      }
      else
        this.storeTemplate( responseBuffer );
    }
  }

  parseReadRecord( SW12, responseBuffer )
  {
    if ( SW12 == 0x9000 )
    {
      this.storeTemplate( responseBuffer );
    }
  }

  parseGenerateAC( SW12, responseBuffer )
  {
    if ( SW12 == 0x9000 )
    {
      // Process GenerateAC Response
      if ( responseBuffer.byteAt( 0 ) == 0x80 )
      {
        this.setTag( EMV.TAG_CRYPTOGRAM_INFORMATION_DATA, responseBuffer.bytes( 2, 1 ) );
        this.setTag( EMV.TAG_ATC, responseBuffer.bytes( 3, 2 ) );
        this.setTag( EMV.TAG_APPLICATION_CRYPTOGRAM, responseBuffer.bytes( 5, 8 ) );
        this.setTag( EMV.TAG_ISSUER_APPLICATION_DATA, responseBuffer.bytes( 13 ) );
      }
      else
        this.storeTemplate( this.responseBuffer );
    }
  }

  SW12;
  handleAPDUResponse( SW12, responseBuffer )
  {
    this.responseBuffer = responseBuffer;
    this.SW12 = SW12;

    this.tlvArray = [];

    var responseInfo =
    {
      commandID: this.commandID,
      commandBuffer: this.commandBuffer,
      responseBuffer: this.responseBuffer,
      SW12: this.SW12,
      responseTLVArray: this.tlvArray,
    }

    switch( this.commandID )
    {
      case EMVCommandHelper.cmdSelectFile:
        this.parseSelectFile( SW12, responseBuffer );
        break;

      case EMVCommandHelper.cmdGetProcessingOptions:
        this.parseGetProcessingOptions( SW12, responseBuffer );
        break;

      case EMVCommandHelper.cmdReadRecord:
        this.parseReadRecord( SW12, responseBuffer );
        break;

      case EMVCommandHelper.cmdGenerateAC:
        this.parseGenerateAC( SW12, responseBuffer );
        break;
    }

    this.onAPDUResponse( responseInfo )
  }

  public static cmdSelectFile = "selectFile";
  static cmdGetProcessingOptions = "getProcessingOptions";
  static cmdReadRecord = "readRecord";
  static cmdGetData = "getData";
  static cmdInternalAuthenticate = "internalAuthenticate";
  static cmdVerify = "verifyPIN";
  static cmdGenerateAC = "generateAC";
  static cmdExternalAuthenticate = "externalAuthenticate";
}

/*function testEMV()
{
  try
  {
    // Create and initialize EMV Kernel
    var emvKernel = new EMVApplicationKernel( new EMVCardApplication() );
  //  emvKernel._fDebugAPDUCommands = true;

    emvKernel.setTag( 0x5A, "6271559900000013" );
    emvKernel.setTag( 0x5F34, "00" );

    emvKernel.setTag( 0x9A, "000000" );
    emvKernel.setTag( 0x9F02, "000000000000" );
    emvKernel.setTag( 0x5F2A, "0000" );
    emvKernel.setTag( 0x9F1A, "0000" );
    emvKernel.setTag( 0x84, "A0000000048002" );
    emvKernel.setTag( 0x9F03, "000000000000" );
  //  emvKernel.setTag( 0x9F37, "00000000" );
    emvKernel.setTag( 0x9F37, "69b0e75c" );
    emvKernel.setTag( 0x95, "8000000000" );
    emvKernel.setTag( 0x9C, "00" );
    emvKernel.test();
  }
  catch( e ) { alert( e ); }
}*/
