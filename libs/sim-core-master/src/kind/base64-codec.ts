type byte = number;

enum BASE64SPECIALS {
  PLUS = '+'.charCodeAt(0),
  SLASH = '/'.charCodeAt(0),
  NUMBER = '0'.charCodeAt(0),
  LOWER = 'a'.charCodeAt(0),
  UPPER = 'A'.charCodeAt(0),
  PLUS_URL_SAFE = '-'.charCodeAt(0),
  SLASH_URL_SAFE = '_'.charCodeAt(0)
}

export class Base64Codec
{
  static decode( b64: string ): Uint8Array
  {
    if (b64.length % 4 > 0) {
      throw new Error('Invalid base64 string. Length must be a multiple of 4');
    }

    function decode( elt: String ): number
    {
      var code = elt.charCodeAt(0);

      if (code === BASE64SPECIALS.PLUS || code === BASE64SPECIALS.PLUS_URL_SAFE)
        return 62; // '+'

      if (code === BASE64SPECIALS.SLASH || code === BASE64SPECIALS.SLASH_URL_SAFE)
        return 63; // '/'

      if (code >= BASE64SPECIALS.NUMBER)
      {
        if (code < BASE64SPECIALS.NUMBER + 10)
          return code - BASE64SPECIALS.NUMBER + 26 + 26;

        if (code < BASE64SPECIALS.UPPER + 26)
          return code - BASE64SPECIALS.UPPER;

        if (code < BASE64SPECIALS.LOWER + 26)
          return code - BASE64SPECIALS.LOWER + 26;
      }

      throw new Error('Invalid base64 string. Character not valid');
    }

    // the number of equal signs (place holders)
    // if there are two placeholders, than the two characters before it
    // represent one byte
    // if there is only one, then the three characters before it represent 2 bytes
    // this is just a cheap hack to not do indexOf twice
    let len = b64.length;
    let placeHolders = b64.charAt(len - 2) === '=' ? 2 : b64.charAt(len - 1) === '=' ? 1 : 0;

    // base64 is 4/3 + up to two characters of the original data
    let arr = new Uint8Array( b64.length * 3 / 4 - placeHolders );

    // if there are placeholders, only get up to the last complete 4 chars
    let l = placeHolders > 0 ? b64.length - 4 : b64.length;

    var L = 0;

    function push (v: byte) {
      arr[L++] = v;
    }

    let i = 0, j = 0;

    for (; i < l; i += 4, j += 3) {
      let tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3));
      push((tmp & 0xFF0000) >> 16);
      push((tmp & 0xFF00) >> 8);
      push(tmp & 0xFF);
    }

    if (placeHolders === 2) {
      let tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4);
      push(tmp & 0xFF);
    } else if (placeHolders === 1) {
      let tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2);
      push((tmp >> 8) & 0xFF);
      push(tmp & 0xFF);
    }

    return arr;
  }

  static encode( uint8: Uint8Array ): string
  {
    var i: number;
    var extraBytes = uint8.length % 3; // if we have 1 byte left, pad 2 bytes
    var output = '';

    const lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    function encode( num: byte ) {
      return lookup.charAt(num);
    }

    function tripletToBase64( num: number ) {
      return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F);
    }

    // go through the array every three bytes, we'll deal with trailing stuff later
    let length = uint8.length - extraBytes;
    for (i = 0; i < length; i += 3) {
      let temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
      output += tripletToBase64(temp);
    }

    // pad the end with zeros, but make sure to not forget the extra bytes
    switch (extraBytes) {
      case 1:
        let temp = uint8[uint8.length - 1];
        output += encode(temp >> 2);
        output += encode((temp << 4) & 0x3F);
        output += '==';
        break
      case 2:
        temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
        output += encode(temp >> 10);
        output += encode((temp >> 4) & 0x3F);
        output += encode((temp << 2) & 0x3F);
        output += '=';
        break
      default:
        break;
    }

    return output;
  }
}
