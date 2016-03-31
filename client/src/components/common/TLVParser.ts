/******************************************************************************
* TLVParser class
******************************************************************************/
import { ByteString, TLV } from 'cryptographix-se-core';

export class TLVParser
{
  private bsTLV: ByteString;
  private offsetTLV: number;
  private lengthTLV: number;
  private offsetTemp: number;

  constructor( tlvString?: ByteString )
  {
    this.bsTLV = null;
    this.offsetTLV = 0;
    this.lengthTLV = 0;

    this.offsetTemp = 0;

    if ( tlvString != undefined  )
      this.setTLV( tlvString );
  }

  setTLV( tlv: ByteString | TLV )
  {
    if ( tlv instanceof ByteString )
      this.bsTLV = tlv;
    else if ( tlv instanceof TLV )
      this.bsTLV = tlv.getTLV();
//    else
//      this.bsTLV = new ByteString( tlv, ByteString.HEX );

    this.offsetTLV = 0;
    this.lengthTLV = this.bsTLV.length;
  }


  nextByte()
  {
    return this.bsTLV.byteAt( this.offsetTLV++ );
  }

  peekByte()
  {
    return this.bsTLV.byteAt( this.offsetTLV );
  }

  skipPadding()
  {
    while( this.offsetTLV < this.lengthTLV )
    {
      if ( this.peekByte( ) == 0x00 )
      {
         this.offsetTLV++;
      }
      else
        break;
    }
  }

  isEOF( )
  {
    this.skipPadding();

    return ( this.offsetTLV == this.lengthTLV );
  }

  getTag( bGetLengthOfTag? )
  {
    var iTag;

    this.skipPadding();

    iTag = this.nextByte();

    if ( ( iTag & 0x1F ) == 0x1F )
      iTag = ( iTag << 8 ) | this.nextByte();

    return iTag;
  }

  getLength( )
  {
    var iLength;

    iLength = this.nextByte();
    if ( iLength & 0x80 )
    {
      var iLenBytes = iLength & 0x0F;

      iLength = 0;
      while( iLenBytes > 0 )
      {
        iLength = ( iLength << 8 ) | this.nextByte();
        --iLenBytes;
      }
    }

    return iLength;
  }

  getValue( iLength )
  {
    var bsValue = this.bsTLV.bytes( this.offsetTLV, iLength );

    this.offsetTLV += iLength;

    return bsValue;
  }

  getTLV()
  {
    var offsetTLV;
    var iLength;
    var iTLVLength;

    this.skipPadding();

    offsetTLV = this.offsetTLV;

    this.getTag();
    iLength = this.getLength();
    iTLVLength = this.offsetTLV - offsetTLV + iLength;

    this.offsetTLV += iLength;

    return this.bsTLV.bytes( offsetTLV, iTLVLength );
  }
}
