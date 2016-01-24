export class HexCodec
{
  private static hexDecodeMap: number[];

  static decode( a: string ): Uint8Array
  {
    if ( HexCodec.hexDecodeMap == undefined )
    {
      var hex = "0123456789ABCDEF";
      var allow = " \f\n\r\t\u00A0\u2028\u2029";
      var dec: number[] = [];
      for (var i = 0; i < 16; ++i)
          dec[hex.charAt(i)] = i;
      hex = hex.toLowerCase();
      for (var i = 10; i < 16; ++i)
          dec[hex.charAt(i)] = i;
      for (var i = 0; i < allow.length; ++i)
          dec[allow.charAt(i)] = -1;
      HexCodec.hexDecodeMap = dec;
    }

    var out: number[] = [];
    var bits = 0, char_count = 0;
    for (var i = 0; i < a.length; ++i)
    {
      var c = a.charAt(i);
      if (c == '=')
          break;
      var b = HexCodec.hexDecodeMap[c];
      if (b == -1)
          continue;
      if (b == undefined)
          throw 'Illegal character at offset ' + i;
      bits |= b;
      if (++char_count >= 2) {
          out.push( bits );
          bits = 0;
          char_count = 0;
      } else {
          bits <<= 4;
      }
    }

    if (char_count)
      throw "Hex encoding incomplete: 4 bits missing";

    return Uint8Array.from( out );
  }
}
