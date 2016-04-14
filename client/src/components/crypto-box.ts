import { customElement, autoinject, bindable, inlineView, child } from 'aurelia-framework';
import { ByteArray, Component, Kind, EndPoint, Direction, Message, Channel } from 'cryptographix-sim-core';
import { CryptographicServiceProvider } from 'cryptographix-sim-core';

@customElement('crypto-box')
@autoinject()
@bindable('component')
export class CryptoBoxVM {

  private _component: CryptoBox;
  running: boolean = false;

  activate(parent: any) {                                                                        
    this._component = parent.component;

    if (this._component)
      this._component.bindView(this);    

    this.algorithm = 'DES-ECB';
    this.op = 'encrypt';
  }

  attached() {
    ($('[data-toggle="popover"]') as any).popover();   
  }

  @bindable
  sizeIV: number = 0;
  @bindable
  iv: string = "0000000000000000";

  @bindable
  algorithm: string;

  @bindable
  op: string;

  errors: string;
  errorCount: number = 0;

  opChanged(op) { 
    this.op = op;
    this.algorithmChanged(this.algorithm);
  }

  ivChanged(newValue) {
    this.algorithmChanged(this.algorithm);
  }

  algorithmChanged(algorithm: string) {
    this.algorithm = algorithm;
    let iv;

    if (this.algorithm == 'DES-ECB') {
      this.errors = "";
      this.errorCount = 0;
      this.sizeIV = 0;
    }
    else if (this.algorithm == 'DES-CBC') {
      try {
        this.errors = "";
        this.errorCount = 0;
        iv = new ByteArray(this.iv, ByteArray.HEX);
        this.sizeIV = 8;
        if (iv.length !== this.sizeIV) {
          let error = "<p>IV must be 8 bytes</p>";
          // prevent the same error appearing multiple times
          if (this.errors.indexOf(error) === -1) {
            this.errors += error;
            this.errorCount++;
          }
        } else {
          this.errors = "";
          this.errorCount = 0;
        }
      } catch(error) {
        this.errors += error;
        this.errorCount++;
     }
 
    }
    this._component.setAlgorithm( this.op, this.algorithm, iv );
  }
}

export class CryptoBox implements Component {

  private _cryptoProvider: CryptographicServiceProvider;
  private _key: CryptoKey;

  constructor() {
    this._cryptoProvider = new CryptographicServiceProvider();

    this.setAlgorithm( 'encrypt', 'DES-ECB', null );
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

  private _op: string;
  private _algorithm: string;
  private _iv: ByteArray;

  setAlgorithm( op: string, algo: string, iv: ByteArray ) {
    let prevAlgo = this._algorithm;

    this._op = op;
    this._algorithm = algo;
    this._iv = iv;

    if ( prevAlgo != algo ) {
      let me = this;

      this._key = null;

      // import default key
      this._cryptoProvider
        .importKey( 'raw',
          new ByteArray( [ 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07 ] ),
          algo, true, [ 'encrypt' ] )
        .then( key => {
          me._key = key;

          console.log( 'created key: ' + algo );
        } )
        .catch( err => {
          alert( 'oops. importKey failed: ' + err );
        } );
    }

    // redo enc
    this.handleDataIn( this._data );
  }

  handleDataIn(data: ByteArray) {
    let ep = this._dataOut;

    this._data = data;

    if ( this._key && this._data ) {
      // TS need an 'extends Interface' for object literals.
      // For now, we use a 'type-assertion' on call to encrypt, to coerce to 'Algorithm'
      let algo = {
        name: this._algorithm,
        iv: this._iv
      };

      if ( this._op == 'encrypt') {
        this._cryptoProvider.encrypt( algo as Algorithm, this._key, data )
          .then( ( cipherText: ByteArray ) => {
            let msg = new Message<ByteArray>({}, cipherText );
            ep.sendMessage(msg);
          });
      }
      else {
        this._cryptoProvider.decrypt( algo as Algorithm, this._key, data )
          .then( ( plainText: ByteArray ) => {
            let msg = new Message<ByteArray>({}, plainText );
            ep.sendMessage(msg);
          });
      }
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

  start() {}
  stop() {}
  pause() {}
  resume() {}

}
