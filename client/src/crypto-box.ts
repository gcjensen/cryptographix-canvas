import { customElement, autoinject, bindable, inlineView, child } from 'aurelia-framework';
import { ByteArray, Component, Kind, EndPoint, Direction, Message, Channel } from 'cryptographix-sim-core';

@customElement( 'crypto-box' )
@autoinject()
@bindable('component')
export class CryptoBoxVM {

  component: CryptoBox;

  activate(component) {
    this.component = component;
    if (this.component)
      this.component.bindView(this);
  }
}

export class CryptoBox implements Component {
  constructor() {
  }

  private _dataIn: EndPoint;
  private _dataOut: EndPoint;
  private _keyIn: EndPoint;

  private _key;
  private _data;

  view: any;
  icon: string = "lock";

  bindView(view: any) {
    this.view = view;
  }

  handleDataIn(data: ByteArray) {
    this._data = data;

    if (this._key && this._data) {
      //
      let msg = new Message<ByteArray>({}, this._data);

      this._dataOut.sendMessage(msg);
    }
  }

  initialize(config: Kind): EndPoint[] {

    let me = this;

    me._key = {};

    // init EndPoints
    this._dataIn = new EndPoint('plaintext', Direction.IN);
    this._dataIn.onMessage((msg: Message<ByteArray>) => {
      console.log('got data')
      me.handleDataIn(msg.payload);
    });

    this._keyIn = new EndPoint('key', Direction.IN);
    this._keyIn.onMessage((msg: Message<ByteArray>) => {
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