import { customElement, autoinject, bindable, inlineView, child } from 'aurelia-framework';
import { ByteArray, Component, Kind, EndPoint, Direction, Message, Channel } from 'cryptographix-sim-core';

@customElement( 'bytearray-viewer' )
@autoinject()
@bindable('component')
export class ByteArrayViewerVM {

  component: ByteArrayViewer;
  @bindable text: string = '';
  @bindable encoding: string = 'HEX';

  activate(component) {
    this.component = component;
    if (this.component)
      this.component.bindView(this);
  }

  componentChanged( newValue: ByteArrayViewer ) {
    let me = this;
    if (newValue)
      newValue.onDataIn((din: ByteArray) => {
        me.text = din.toString(ByteArray.HEX);
      });
  }
}

export class ByteArrayViewer implements Component {

  private _dataIn: EndPoint;
  cb: any;
  view: any;
  icon: string = "eye";

  bindView(view: any) {
    this.view = view;
  }

  initialize(config: Kind): EndPoint[] {
    let me = this;

    // init EndPoints
    this._dataIn = new EndPoint( 'in', Direction.IN );
    this._dataIn.onMessage( (msg: Message<ByteArray> ) => {
      console.log( 'ByteArrayOutput: got data -> ' + msg.payload.toString( ByteArray.HEX ) );
      this.view.text = msg.payload.toString(ByteArray.HEX);

      if ( me.cb )
        me.cb( msg.payload );
    });

    // and return collection
    return [ this._dataIn ];
  }

  teardown() {
    this._dataIn = null;
  }

  start() {}
  stop() {}
  pause() {}
  resume() {}

  onDataIn( cb ) {
    this.cb = cb;
  }
}
