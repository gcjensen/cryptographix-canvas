import { customElement, autoinject, bindable } from "aurelia-framework";
import { ByteArray, Component, Kind, EndPoint, Direction, Message } from "cryptographix-sim-core";

@customElement("bytearray-viewer")
@autoinject()
export class ByteArrayViewerVM {

  @bindable public text: string = "";
  @bindable public encoding: string = "HEX";

  private _bytes: ByteArray;
  private component: ByteArrayViewer;

  public activate(model: { component: Component }): void {
    this.component = <ByteArrayViewer>model.component;
    if (this.component) {
      this.component.bindView(this);
    }
  }

  public setBytes(bytes: ByteArray): void {
    this._bytes = bytes;
    this.text = bytes.toString( ByteArray.stringToEncoding( this.encoding ) );
  }

  public encodingChanged(newValue: string): void {
    this.encoding = newValue;
    this.setBytes( this._bytes );
  }
}

export class ByteArrayViewer implements Component {

  public icon: string = "eye";

  private _dataIn: EndPoint;
  private view: ByteArrayViewerVM;

  public bindView(view: ByteArrayViewerVM) {
    this.view = view;
  }

  public initialize( config: Kind): EndPoint[] {
    // it EndPoits
    this._dataIn = new EndPoint( "in", Direction.IN );
    this._dataIn.onMessage( (msg: Message<ByteArray> ) => {
      console.log( "ByteArayOutput: got data -> " + msg.payload.toString( ByteArray.HEX ) );
      // update view ..
      if (this.view) {
        this.view.setBytes(msg.payload);
      }
    });
    // and return collection
    return [ this._dataIn ];
  }

  public teardown( ) {
    this._dataIn = null;
  }
}
