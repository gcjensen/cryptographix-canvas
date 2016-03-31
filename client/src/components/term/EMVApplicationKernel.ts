import { EMV } from '../common/EMV';
import { TLVParser } from '../common/TLVParser';
import { EMVCommandHelper } from './EMVKernelCommandHelper';
import { ByteString, ByteBuffer, TLV } from 'cryptographix-se-core';

var KernelPhases =
{
  EMV_PHASE_NONE: 0x0000,                           /// No phase defined.
  EMV_PHASE_SELECTION: 0x1000,                      /// Selection phase.
  EMV_PHASE_INITIATION: 0x2000,                     /// Initiation phase.
  EMV_PHASE_OFFLINE_PROCESSING: 0x3000,             /// Offline processing phase.
  EMV_PHASE_ONLINE_PROCESSING: 0x4000,              /// Online processing phase.
  EMV_PHASE_FINALIZATION: 0x5000                    /// Finalization phase.
};

var KernelStep =
{
  /// Reset step.
  EMV_STEP_RESET: 0x0000,
  /// Candidate List step.
  EMV_STEP_CANDIDATE_LIST: 0x1100,
  /// Application Menu step.
  EMV_STEP_APPLICATION_MENU: 0x1200,
  /// Application Select step.
  EMV_STEP_APPLICATION_SELECTED: 0x1300,
  /// Application initiation step.
  EMV_STEP_APPLICATION_INITIATION: 0x2100,
  /// Read Application Data step.
  EMV_STEP_READ_APPLICATION_DATA: 0x2200,
  /// Offline Data Authentication step.
  EMV_STEP_OFFLINE_DATA_AUTHENTICATION: 0x3100,
  /// Processing Restrictions step.
  EMV_STEP_PROCESSING_RESTRICTIONS: 0x3200,
  /// Card Holder Verification step.
  EMV_STEP_CARDHOLDER_VERIFICATION: 0x3300,
  /// Card Holder Verification Done step.
  EMV_STEP_CARDHOLDER_VERIFICATION_DONE: 0x3400,
  /// Terminal Risk Management step.
  EMV_STEP_TERMINAL_RISK_MANAGEMENT: 0x3500,
  /// Terminal Action Analysis step.
  EMV_STEP_TERMINAL_ACTION_ANALYSIS: 0x3600,
  /// First Card Action Analysis step.
  EMV_STEP_FIRST_CARD_ACTION_ANALYSIS: 0x3700,
  /// Online Authorization step.
  EMV_STEP_ONLINE_AUTHORIZATION: 0x4100,
  /// Issuer Authentication step.
  EMV_STEP_ISSUER_AUTHENTICATION: 0x4200,
  /// High Priority Script Execution step.
  EMV_STEP_HIGH_PRIORITY_SCRIPT_EXECUTION: 0x4300,
  /// Terminal Action Analysis Default step.
  EMV_STEP_TERMINAL_ACTION_ANALYSIS_DEFAULT: 0x5100,
  /// Second Card Action Analysis step.
  EMV_STEP_SECOND_CARD_ACTION_ANALYSIS: 0x5200,
  /// Low Priority Script Execution Analysis step.
  EMV_STEP_LOW_PRIORITY_SCRIPT_EXECUTION: 0x5300,
  /// Finalized Approved step.
  EMV_STEP_FINALIZED_APPROVED: 0x5400,
  /// Finalized Denied step.
  EMV_STEP_FINALIZED_DENIED: 0x5500
};

export class EMVApplicationKernel
{
  cardReader;
  commandHelper = new EMVCommandHelper( null );
  kernelParams = {};

  initKernel( reader )
  {
    this.cardReader = reader;
    this.commandHelper.cardReader = reader;
    this.kernelParams = {};
  }

  getParam( paramName )
  {
    return this.kernelParams[ paramName ];
  }

  setParam( paramName, newValue )
  {
    this.kernelParams[ paramName ] = newValue;
  }

  tlvArray = [];
  setTLV( aTLV, doRecursive )
  {
    var tlvParser = new TLVParser( aTLV );
    var wTemplateTag = tlvParser.getTag();
    var iTemplateLength = tlvParser.getLength();
    var aTemplateValue = tlvParser.getValue( iTemplateLength );

    function isTemplate( wTag )
    {
      return ( ( wTag > 0xFF ) ? ( wTag & 0x2000 ) : ( wTag & 0x20 ) ) != 0;
    }

    if ( doRecursive == undefined )
      doRecursive = false;

    this.setTag( wTemplateTag, aTemplateValue );

    if ( isTemplate( wTemplateTag ) && doRecursive )
    {
      tlvParser = new TLVParser( aTemplateValue );

      while( !tlvParser.isEOF() )
      {
        var wTag = tlvParser.getTag();
        var iLength = tlvParser.getLength();

        this.setTag( wTag, tlvParser.getValue( iLength ) );
        if ( isTemplate( wTag ) && doRecursive )
        {
          this.setTLV( this.getTag( wTag ), true );
        }
      }
    }
  }

  clearTags( )
  {
    this.tlvArray = [];
  }

  getTag( wTag, wDefaultLen? )
  {
    var obj = this.tlvArray[ wTag ];

    if ( obj != undefined )
      return obj;
    else
    {
      if ( wDefaultLen != undefined )
      {
        var bb = new ByteBuffer();

        while( wDefaultLen > 0 )
        {
          bb.append( 0 ); --wDefaultLen;
        }

        return new TLV( wTag, bb.toByteString(), TLV.EMV );
      }
      else
        return null;
    }
  }

  setTag( wTag, sValue )
  {
    var bs = ( sValue instanceof ByteString ) ? sValue : new ByteString( sValue, ByteString.HEX );
    var newTLV = new TLV( wTag, bs, TLV.EMV );

    this.tlvArray[ wTag ] = newTLV;
  //  print( "setTag: " + newTLV.getTLV() );
  }

  formatDOL( sDOLSpec )
  {
    var tlvParser = new TLVParser( new ByteString( sDOLSpec, ByteString.HEX ) );
    var bbResult = new ByteBuffer();

    while( !tlvParser.isEOF() )
    {
      var wTag = tlvParser.getTag();
      var wLen = tlvParser.getLength();
      var bsValue = this.getTag( wTag, wLen ).getValue();

      if ( bsValue.length > wLen )
        bsValue = bsValue.bytes( 0, wLen );

      while( bsValue.length < wLen )
        bsValue.concat( new ByteString( "00", ByteString.HEX ) );

      bbResult.append( bsValue );
    }

    return bbResult.toByteString();
  }

  getTLVList( sTagList )
  {
    var tlvParser = new TLVParser( new ByteString( sTagList, ByteString.HEX ) );
    var bbResult = new ByteBuffer();

    while( !tlvParser.isEOF() )
    {
      var wTag = tlvParser.getTag();

      var tlv = this.getTag( wTag );
      if ( tlv != null )
        bbResult.append( tlv.getTLV() );
    }

    return bbResult.toByteString();
  }

  doGenerateAC( onAPDUResponse )
  {
    var bCID = EMV.CID_ARQC;
    var gacData = this.formatDOL( "9F0206 9F0306 9F1A02 9505 5F2A02 9A03 9C01 9F3704 9F3501" );
           ; // = "00000000 00000000 00000000 00000000 00000000 00000000 00000000 0034";

    this.commandHelper.buildGenerateAC( bCID, gacData );
    if ( onAPDUResponse != null )
      this.commandHelper.executeAPDUCommand( onAPDUResponse );
  }

/*this.getOTP = function( sBitmap, bFlags )
{
  var bsBitmap = new ByteString( sBitmap, HEX );
  var bbTemp = new ByteBuffer();
  var bsResult = null;
  var byteIndex, bitIndex;
  var iOTP;

  bbTemp.append( this.getTag( EMV.TAG_CRYPTOGRAM_INFORMATION_DATA, 1 ).getValue() );
  bbTemp.append( this.getTag( EMV.TAG_ATC, 2 ).getValue() );
  bbTemp.append( this.getTag( EMV.TAG_APPLICATION_CRYPTOGRAM, 8 ).getValue() );
  bbTemp.append( this.getTag( EMV.TAG_ISSUER_APPLICATION_DATA, 16 ).getValue() );

  while( bsBitmap.length < bbTemp.length )
  {
    bsBitmap = bsBitmap.concat( new ByteString( "00", HEX ) );
  }

  bsResult = bbTemp.toByteString().and( bsBitmap );

  iOTP = 0;
//    if ( this.fDebugAPDUCommands )
  {
    log( "---------- Calculating OTP ----------" );
    log( "Vector: " + bbTemp.toByteString().toString() );
    log( "Bitmap: " + bsBitmap.toString() );
    log( "Masked: " + bsBitmap.and( bbTemp.toByteString() ).toString() );
  }

  for( byteIndex = 0; byteIndex < bsResult.length; ++byteIndex )
  {
    var bMaskByte = bsBitmap.byteAt( byteIndex );
    var bResultByte = bsResult.byteAt( byteIndex );

    for( bitIndex = 7; bitIndex >= 0; --bitIndex )
    {
      if ( bMaskByte & ( 1 << bitIndex ) )
      {
        iOTP = iOTP * 2;

        if ( bResultByte & ( 1 << bitIndex ) )
          iOTP = iOTP + 1;
      }
    }
  }

//    if ( this.fDebugAPDUCommands )
  {
    log( "OTP:    " + iOTP );
  }

  return iOTP + '';
}*/

  onAPDUResponse( apduResponse )
  {
    {
      if ( apduResponse.SW12 == 0x9000 )
      {
        for( var tag in apduResponse.responseTLVArray )
          this.tlvArray[ tag ] = apduResponse.responseTLVArray[tag];
      }
      else
        alert( "SW Error: 0x" + apduResponse.SW12.toString( 16 ).toUpperCase() );
    }
  }

/*this.test = function( )
{
  var me = this;
  function onAPDUResponse( r )
  {
    if ( r.SW12 == 0x9000 )
    {
      for( var tag in r.responseTLVArray )
        me.tlvArray[ tag ] = r.responseTLVArray[tag];
    }
    else
      alert( "SW Error: 0x" + r.SW12.toString( 16 ).toUpperCase() );
  }

  this.commandHelper.buildSelectApplication( [ 0xA0, 0x00, 0x00, 0x01, 0x54, 0x44, 0x42 ] );
  this.commandHelper.executeAPDUCommand( onAPDUResponse );

  this.commandHelper.buildGetProcessingOptions( [ 0x80, 0x00 ] );
  this.commandHelper.executeAPDUCommand( onAPDUResponse );

  this.doGenerateAC( onAPDUResponse );

  var sOTP = this.getOTP( "80007FFFFF0000000000000000000008" );
//16977545    sOTP = emvKernel.getOTP( "80007FFFFF0000000000000000" );
  log( "OTP: " + sOTP + ' (ATC=' + this.getTLVList( "9F36" ).toString().slice( 9,14 ) + ')' );

// 1000000110110100110000101 : Calc
// 1000000101000100100101010

  sDE55 = this.getTLVList( "5A 5F34 5F2A 9F02 84 9F37" ).toString()
        + "9F3602" + ( "0000" + this.getTag( EMV.TAG_ATC, 2 ).getValue().toString( 16 ).toUpperCase() ).slice( -4 )
        + "C006" + ( "000000000000" + sOTP ).slice( -12 )
        + "C10100"
        + "C200";
//    log( "BaseATC = " + ( "0000" + wATC.toString( 16 ).toUpperCase() ).slice( -4 ) );

//    log( "Auth.ValidateOTP.IN : " + sDE55.replace( / /g, "" ) );
  //sAuthOut = emvAuth.ValidateOTP( sDE55.replace( / /g, "" ) );

//    if ( getSW12() == 0x9000 )
//      setTLV( getAPDUResponseData(), true );
}*/
}
