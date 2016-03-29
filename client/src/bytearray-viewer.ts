import { customElement, autoinject, bindable, inlineView, child } from 'aurelia-framework';
import { ByteArray, Component, Kind, EndPoint, Direction, Message, Channel } from 'cryptographix-sim-core';

@customElement('bytearray-viewer')
@autoinject()
export class ByteArrayViewerVM {

  @bindable text: string = '';
  @bindable encoding: string = 'HEX';

  private _component: Component;
  activate( parent: {} ) {
    this._component = parent.component;

    if ( this._component ) {
      this._component.bindView( this );
    }
  }

  private _bytes: ByteArray;
  setBytes( bytes: ByteArray ) {
    this._bytes = bytes;

    this.text = bytes.toString( ByteArray.stringToEncoding( this.encoding ) );
  }

  encodingChanged( newValue: string ) {
    this.encoding = newValue;
    // refresh
    this.setBytes( this._bytes );
  }
}

export class ByteArrayViewer implements Component {

  private _dataIn: EndPoint;

  view: ByteArrayViewerVM;
  icon: string = "eye";

  bindView( view: ByteArrayViewerVM ) {
    this.view = view;
  }

  initialize( config: Kind): EndPoint[] {
    // it EndPoits
    this._dataIn = new EndPoint( 'in', Direction.IN );

    this._dataIn.onMessage( (msg: Message<ByteArray> ) => {
      console.log( 'ByteArayOutput: got data -> ' + msg.payload.toString( ByteArray.HEX ) );

      // update view ..
       if ( this.view )
          this.view.setBytes( msg.payload );
    });

    // and return collection
    return [ this._dataIn ];
  }

  teardown( ) {
    this._dataIn = null;
  }
 
  start() {}
  stop() {}  
  pause() {}
  resume() {}
}
