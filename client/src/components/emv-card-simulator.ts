import { customElement, autoinject } from "aurelia-framework";
import { Node, ByteArray, Component, Kind, KindBuilder, ComponentBuilder, EndPoint, Direction } from "cryptographix-sim-core";
import { JSIMSlot, JSIMScriptCard, SlotProtocolHandler } from "cryptographix-se-core";
import { JSIMEMVApplet } from "./card/jsim-emv-applet";
import { DialogService } from "aurelia-dialog";
import { NodeConfigDialog } from "../config-dialogs/node-config-dialog";

const AID_EMV_TEST = [0xF0, 0x00, 0x00, 0x17, 0x11, 0x31, 0x12];

@customElement("emv-card-simulator")
@autoinject()
export class EMVCardSimulatorVM {

  private dialogService: DialogService;
  private component: EMVCardSimulator;
  private node: Node;

  constructor(dialogService: DialogService) {
    this.dialogService = dialogService;
  }

  public activate(model: { node: Node, component: Component }): void {
    this.node = model.node;
    this.component = <EMVCardSimulator>model.component;
    if (this.component) {
      this.component.bindView(this);
    }
  }

  public configure(): void {
    let model = { "info": (EMVCardSimulator as any).componentInfo, "data": (this.node as any)._initialData };
    this.dialogService.open({ model: model, viewModel: NodeConfigDialog}).then(response => {
      if (!response.wasCancelled) {
        let instance = new (EMVCardSimulator as any).componentInfo.configKind(response.output.data);
        (this.node as any)._initialData = JSON.parse(JSON.stringify(instance));
      }
    });
  }
}

export class EMVCardSimulator implements Component {

  public icon: string = "credit-card";

  private _config: {};
  private _slot: JSIMSlot;
  private _card: JSIMScriptCard;
  private _cardHandler: SlotProtocolHandler;
  private _apduIn: EndPoint;
  private view: EMVCardSimulatorVM;

  public bindView(view: EMVCardSimulatorVM) {
    this.view = view;
  }

  public initialize( config: { pin?: string; } ): Array<EndPoint> {
    this._config = config;

    this._apduIn = new EndPoint( "iso7816", Direction.INOUT );

    this._slot = new JSIMSlot();

    this._card = new JSIMScriptCard();

    this._slot.insertCard( this._card );

    let emvApp = new JSIMEMVApplet();

    // Use AID 'F0....' (sort of private, no need to register)
    this._card.loadApplication(new ByteArray(AID_EMV_TEST), emvApp);

    emvApp.pin = config.pin || "1234";

    return [ this._apduIn ];
  }

  public teardown() {
    if (this._slot) {
      this._slot.ejectCard();
    }
    this._slot = null;
    this._card = null;
    this._apduIn = null;
    this._cardHandler = null;
  }

  public start() {
    // The SlotProtocolHandler will process incoming ISO7816 slot-protocol
    // packets, redirecting them to the linked Slot
    this._cardHandler = new SlotProtocolHandler();
    this._cardHandler.linkSlot( this._slot, this._apduIn );
  }

  public stop() {
    // Stop processing slot packets ...
    this._cardHandler.unlinkSlot( );
    this._cardHandler = null;
    // reset card
    this._slot.powerOff();
  }
}

export class CardConfig implements Kind {

  private onlineOnly: boolean;
  private offlineDataAuth: OfflineDataAuthentication;
  private pin: string;

  constructor( attributes: {} = {} ) {
    this.onlineOnly = attributes[ "onlineOnly" ];
    this.offlineDataAuth = attributes[ "offlineDataAuth" ];
    this.pin = attributes[ "pin" ];
  }
}

export enum OfflineDataAuthentication {
  NOODA,
  SDA,
  DDA,
  CDA
}

KindBuilder.init( CardConfig, "EMV Card Simulator Configuration")
  .boolField( "onlineOnly", "Online Line")
  .enumField( "offlineDataAuth", "Offline Authentication", OfflineDataAuthentication )
  .stringField( "pin", "Card PIN" );

ComponentBuilder
  .init( EMVCardSimulator, "EMV Card Simulator", "A pure-js simulator for EMV Payment Cards", "emv-payments" )
  .config(CardConfig, new CardConfig({ offlineDataAuth: OfflineDataAuthentication.NOODA, onlineOnly: true, pin: "0000" } ) )
  .port("iso7816", "Smartcard Commands", Direction.IN, { protocol: SlotProtocolHandler, required: true } );
