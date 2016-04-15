import { customElement, autoinject, bindable } from "aurelia-framework";
import { ByteArray, Component, Kind, EndPoint, Direction, Message } from "cryptographix-sim-core";

@customElement("bytearray-entry")
@autoinject()
export class ByteArrayEntryVM {

  @bindable public text: string = "";
  @bindable public encoding: string = "HEX";
  public errors: string;
  public errorCount: number = 0;

  private component: ByteArrayEntry;
  private running: boolean = false;

  public activate(model: { component: Component }): void {
    this.component = <ByteArrayEntry>model.component;
    if (this.component) {
      this.component.bindView(this);
      this.encodingChanged(this.encoding);
      this.textChanged(this.text);
    }
  }

  public attached(): void {
    ($("[data-toggle='popover']") as any).popover();
  }

  public startComponent(): void {
    this.running = true;
    this.textChanged(this.text);
  }

  public stopComponent(): void {
    this.running = false;
    this.errors = "";
    this.errorCount = 0;
  }

  public encodingChanged(newValue: string): void {
    this.encoding = newValue;
    this.component.setEncoding(ByteArray.stringToEncoding(newValue));
  }

  public textChanged(newValue): void {
    if (this.running) {
      try {
        this.errors = "";
        this.errorCount = 0;
        this.component.setText(newValue);
      } catch (error) {
        this.errors += "<p>" + error + "</p>";
        this.errorCount++;
      }
    }
  }
}

export class ByteArrayEntry implements Component {

  public icon: string = "pencil";

  private _config: Kind;
  private _dataOut: EndPoint;
  private _encoding: number;
  private view: ByteArrayEntryVM;

  public bindView(view: any) {
    this.view = view;
  }

  public initialize(config: Kind): EndPoint[] {
    this._config = config;
    this._encoding = config["encoding"] || ByteArray.HEX;
    // init EndPoints
    this._dataOut = new EndPoint("out", Direction.OUT);
    // and return collection
    return [this._dataOut];
  }

  public teardown() {
    this._dataOut = null;
  }

  public start() {
    this.view.startComponent();
  }

  public stop() {
    this.view.stopComponent();
  }

  public setEncoding(encoding: number) {
    this._encoding = encoding;
  }

  public setText(textValue) {
    this._dataOut.sendMessage(new Message<ByteArray>({}, new ByteArray(textValue, this._encoding)));
  }
}
