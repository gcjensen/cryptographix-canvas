import { ByteArray } from './byte-array';

export class Enum {};

export type DataType = String | Number | Enum | ByteArray | Kind;

export interface FieldInfo {
  id?: string;

  description: string;

  dataType: DataType;

  enumInfo?: Map<number, string>;

  minLength?: number;

  maxLength?: number;
}

/**
* Metadata about a Kind. Contains name, description and a map of
* property-descriptors that describe the serializable fields of
* an object of that Kind.
*/
export class KindInfo
{
  name: string;

  description: string;

  fields: { [id: string]: FieldInfo } = {};
}


/**
* Builder for 'Kind' metadata
*/
export class KindBuilder
{
  private ctor: KindConstructor;

  constructor( ctor: KindConstructor, description: string ) {
    this.ctor = ctor;

    ctor.kindInfo = {
      name: ctor.name,
      description: description,
      fields: {}
    }
  }


  private kindInfo: KindInfo;

  public static init( ctor: KindConstructor, description: string ): KindBuilder
  {
    let builder = new KindBuilder( ctor, description );

    return builder;
  }

  public field( name: string, description: string, dataType: DataType, opts? ): KindBuilder
  {
    this.ctor.kindInfo.fields[ name ] = {
      description: description,
      dataType: dataType
    };

    return this;
  }

}

/*  makeKind( kindConstructor, kindOptions )
  {
    var $kindInfo = kindOptions.kindInfo;

    kindConstructor.$kindName = $kindInfo.title;

    var keys = Object.keys( kindOptions.kindMethods );

    for ( var j = 0, jj = keys.length; j < jj; j++ ) {
      var key = keys[j];
      kindConstructor[key] = kindOptions.kindMethods[key];
    }

    kindConstructor.getKindInfo = kindConstructor.prototype.getKindInfo = function getKindInfo() {
      return $kindInfo;
    }

    return kindConstructor;
  }
*/

/**
* Represents a serializable and inspectable data-type
* implemented as a hash-map containing key-value pairs,
* along with metadata that describes each field using a json-scheme like
*/
export interface Kind
{
}

export interface KindConstructor
{
  new ( ...args ): Kind;

  kindInfo?: KindInfo;
}

enum Oranges {
  BLOOD,
  SEVILLE,
  SATSUMA,
  NAVEL
}

/**
* Example
*/
class FruityKind implements Kind
{
  banana: String;
  apple: Number;
  orange: Oranges;
}

KindBuilder.init( FruityKind, 'a Collection of fruit' )
  .field('banana', 'a banana', String )
  .field('apple', 'an apple or pear', Number )
  .field('orange', 'some sort of orange', Enum )
  ;
