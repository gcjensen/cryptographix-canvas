import { HexCodec } from './hex-codec';
import { Base64Codec } from './base64-codec';

export class ByteArray //extends Uint8Array
{
  public static BYTES = 0;
  public static HEX = 1;
  public static BASE64 = 2;
  public static UTF8 = 3;

  private byteArray: Uint8Array;
  /**
   * Create a ByteArray
   * @param bytes - initial contents, optional
   *   may be:
   *     an existing ByteArray
   *     an Array of numbers (0..255)
   *     a string, to be converted
   *     an ArrayBuffer
   *     a Uint8Array
   */
  constructor( bytes?: ByteArray | Array<number> | String | ArrayBuffer | Uint8Array, format?: number, opt?: any )
  {
    if ( !bytes )
    {
      // zero-length array
      this.byteArray = new Uint8Array( 0 );
    }
    else if ( !format || format == ByteArray.BYTES )
    {
      if ( bytes instanceof ArrayBuffer )
        this.byteArray = new Uint8Array( <ArrayBuffer>bytes );
      else if ( bytes instanceof Uint8Array )
        this.byteArray = bytes;
      else if ( bytes instanceof ByteArray )
        this.byteArray = bytes.byteArray;
      else if ( bytes instanceof Array )
        this.byteArray = new Uint8Array( bytes );
      //else if ( typeof bytes == "string" )
      //{
//        this.byteArray = new Uint8Array( <string>bytes );
      //}
    }
    else if ( typeof bytes == "string" )
    {
      if ( format == ByteArray.BASE64 )
      {
          this.byteArray = Base64Codec.decode( <string>bytes );
      }
      else if ( format == ByteArray.HEX )
      {
        this.byteArray = HexCodec.decode( <string>bytes );
      }
      else if ( format == ByteArray.UTF8 )
      {
        let l = ( <string>bytes ).length;
        let ba = new Uint8Array( l );
        for( let i = 0; i < l; ++i )
          ba[i] = ( <string>bytes ).charCodeAt( i );

        this.byteArray = ba;
      }
    }

    // Must have exec one of above allocators
    if ( !this.byteArray )
    {
      throw new Error( "Invalid Params for ByteArray()")
    }
  }

  get length(): number
  {
    return this.byteArray.length;
  }

  set length( len: number )
  {
    if ( this.byteArray.length >= len )
    {
      this.byteArray = this.byteArray.slice( 0, len );
    }
    else
    {
      let old = this.byteArray;
      this.byteArray = new Uint8Array( len );
      this.byteArray.set( old, 0 );
    }
  }

  get backingArray(): Uint8Array
  {
    return this.byteArray;
  }

  equals( value: ByteArray ): boolean
  {
    let ba = this.byteArray;
    let vba = value.byteArray;
    var ok = ( ba.length == vba.length );

    if ( ok )
    {
      for( let i = 0; i < ba.length; ++i )
        ok = ok && ( ba[i] == vba[i] );
    }

    return ok;
  }

  /**
    * get byte at offset
    */
  byteAt( offset: number ): number
  {
    return this.byteArray[ offset ];
  }

  wordAt( offset: number ): number
  {
    return ( this.byteArray[ offset     ] <<  8 )
         + ( this.byteArray[ offset + 1 ]       );
  }

  littleEndianWordAt( offset ): number
  {
    return ( this.byteArray[ offset     ] )
         + ( this.byteArray[ offset + 1 ] <<  8 );
  }

  dwordAt( offset: number ): number
  {
    return ( this.byteArray[ offset     ] << 24 )
         + ( this.byteArray[ offset + 1 ] << 16 )
         + ( this.byteArray[ offset + 2 ] <<  8 )
         + ( this.byteArray[ offset + 3 ]       );
  }

  /**
    * set byte at offset
    * @fluent
    */
  setByteAt( offset: number, value: number ): ByteArray
  {
    this.byteArray[ offset ] = value;

    return this;
  }

  setBytesAt( offset: number, value: ByteArray ): ByteArray
  {
    this.byteArray.set( value.byteArray, offset );

    return this;
  }

  clone(): ByteArray
  {
    return new ByteArray( this.byteArray.slice() );
  }

  /**
  * Extract a section (offset, count) from the ByteArray
  * @fluent
  * @returns a new ByteArray containing a section.
  */
  bytesAt( offset: number, count?: number ): ByteArray
  {
    if ( !Number.isInteger( count ) )
      count = ( this.length - offset );

    return new ByteArray( this.byteArray.slice( offset, offset + count ) );
  }

  /**
  * Create a view into the ByteArray
  *
  * @returns a ByteArray referencing a section of original ByteArray.
  */
  viewAt( offset: number, count?: number ): ByteArray
  {
    if ( !Number.isInteger( count ) )
      count = ( this.length - offset );

    return new ByteArray( this.byteArray.subarray( offset, offset + count ) );
  }

  /**
  * Append byte
  * @fluent
  */
  addByte( value: number ): ByteArray
  {
    this.byteArray[ this.byteArray.length ] = value;

    return this;
  }

  setLength( len: number ): ByteArray
  {
    this.length = len;

    return this;
  }

  concat( bytes: ByteArray ): ByteArray
  {
    let ba = this.byteArray;

    this.byteArray = new Uint8Array( ba.length + bytes.length );

    this.byteArray.set( ba );
    this.byteArray.set( bytes.byteArray, ba.length );

    return this;
  }

  not( ): ByteArray
  {
    let ba = this.byteArray;

    for( let i = 0; i < ba.length; ++i )
      ba[i] = ba[i] ^0xFF;

    return this;
  }

  and( value: ByteArray ): ByteArray
  {
    let ba = this.byteArray;
    let vba = value.byteArray;

    for( let i = 0; i < ba.length; ++i )
      ba[i] = ba[i] & vba[ i ];

    return this;
  }

  or( value: ByteArray ): ByteArray
  {
    let ba = this.byteArray;
    let vba = value.byteArray;

    for( let i = 0; i < ba.length; ++i )
      ba[i] = ba[i] | vba[ i ];

    return this;
  }

  xor( value: ByteArray ): ByteArray
  {
    let ba = this.byteArray;
    let vba = value.byteArray;

    for( let i = 0; i < ba.length; ++i )
      ba[i] = ba[i] ^ vba[ i ];

    return this;
  }

  toString( format?: number, opt?: any )
  {
    let s = "";
    for( var i = 0; i < this.length; ++i )
      s += ( "0" + this.byteArray[ i ].toString( 16 )).substring( -2 );

    return s;
  }
}
