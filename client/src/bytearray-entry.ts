import { customElement, autoinject, bindable, inlineView, child } from 'aurelia-framework';
import { ByteArray, Component, Kind, EndPoint, Direction, Message, Channel } from 'cryptographix-sim-core';

/**
* Default view for the 'bytearray-entry' component
*/
@customElement( 'bytearray-entry' )
@autoinject()
@bindable('component')
export class ByteArrayEntryVM {

  component: ByteArrayEntry;
  @bindable text: string = '';
  @bindable encoding: string = 'HEX';

  activate(component) {
    this.component = component;
    if (this.component) {
      this.component.bindView(this);
      this.encodingChanged(this.encoding);
      this.textChanged( this.text );
    }
  }

  encodingChanged( newValue: string ) {
    if ( newValue.toUpperCase() == 'BASE64' )
      this.component.setEncoding( ByteArray.BASE64 );
    else if ( newValue.toUpperCase() == 'UTF8' )
      this.component.setEncoding( ByteArray.UTF8 );
    else if ( newValue.toUpperCase() == 'HEX' )
      this.component.setEncoding( ByteArray.HEX );
    else
      this.component.setEncoding( ByteArray.BYTES );
  }

  textChanged( newValue ) {
    this.component.setText( newValue );
  }
}

export class ByteArrayEntry implements Component {
  constructor() {
  }

  private _config: Kind;
  private _dataOut: EndPoint;
  private _encoding: number;
 
  icon: string = "pencil";
  view: any;

  bindView(view: any) {
   this.view = view;
  }

  initialize( config: Kind ): EndPoint[] {

    this._config = config;
    this._encoding = config['encoding'] || ByteArray.HEX;

    // init EndPoints
    this._dataOut = new EndPoint( 'out', Direction.OUT );

    // and return collection
    return [ this._dataOut ];
  }

  teardown() {
    this._dataOut = null;
  }

  start() {}
  stop() {}
  pause() {}
  resume() {}

  public setEncoding( encoding: number ) {
    this._encoding = encoding;
  }

  public setText( textValue ) {
    this._dataOut.sendMessage( new Message<ByteArray>( {}, new ByteArray( textValue, this._encoding ) ) );
  }
}
