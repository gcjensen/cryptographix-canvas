import { customElement, autoinject, bindable, inlineView, child } from 'aurelia-framework';
import { ByteArray, Component, Kind, EndPoint, Direction, Message, Channel } from 'cryptographix-sim-core';
import { CryptographicServiceProvider } from 'cryptographix-sim-core';

@customElement( 'crypto-box' )
@autoinject()
@bindable('component')
export class CryptoBoxVM {

  private _component: CryptoBox;

  activate(component) {
    this._component = component;

    if ( component )
      component.bindView( this );
  }
}

export class CryptoBox implements Component {

  private _cryptoProvider: CryptographicServiceProvider;
  private _key: CryptoKey;

  constructor() {
    this._cryptoProvider = new CryptographicServiceProvider();
    let me = this;

    // import default key
    this._cryptoProvider
      .importKey( 'raw',
        new ByteArray( [ 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07 ] ),
        "DES-ECB", true, [ 'encrypt' ] )
      .then( key => { me._key = key; } );
  }

  private _dataIn: EndPoint;
  private _dataOut: EndPoint;
  private _keyIn: EndPoint;

  private _data;

  view: any;
  icon: string = "lock";

  bindView( view: any ) {
    this.view = view;
  }

  handleDataIn(data: ByteArray) {
    let ep = this._dataOut;

    this._data = data;

    if ( this._key && this._data ) {
      this._cryptoProvider.encrypt( 'DES-ECB', this._key, data )
        .then( ( cipherText: ByteArray ) => {
          let msg = new Message<ByteArray>({}, cipherText );

          ep.sendMessage(msg);
        });
    }
  }

  initialize(config: Kind): EndPoint[] {

    let me = this;

    // init EndPoints
    this._dataIn = new EndPoint('plaintext', Direction.IN);
    this._dataIn.onMessage((msg: Message<ByteArray>) => {
      console.log('got data')
      me.handleDataIn(msg.payload);
    });

    this._keyIn = new EndPoint('key', Direction.IN);
    this._keyIn.onMessage((msg: Message<CryptoKey>) => {
      console.log('got key')
      me._key = msg.payload;
      me.handleDataIn(me._data);
    });
    this._dataOut = new EndPoint('ciphertext', Direction.OUT);

    // and return collection
    return [this._dataIn, this._keyIn, this._dataOut];
  }

  teardown() {
    this._dataIn = null;
    this._keyIn = null;
    this._dataOut = null;
  }

  start() { }
  stop() { }
  pause() { }
  resume() { }
}
