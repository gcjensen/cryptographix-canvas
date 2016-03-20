import { customElement, autoinject, bindable, inlineView, child } from 'aurelia-framework';
import { ByteArray, Component, Kind, KindBuilder,ComponentBuilder, EndPoint, Direction, Message, Channel } from 'cryptographix-sim-core';
import { CommandAPDU, ResponseAPDU, JSIMSlot, JSIMScriptCard, SlotProtocolHandler } from 'cryptographix-se-core';
import { JSIMEMVApplet } from './card/jsim-emv-applet';
import {DialogService} from 'aurelia-dialog';
import {NodeConfigDialog} from './node-config-dialog';

/**
* Default view for the 'emv-card-simulator' component
*/
@customElement('emv-card-simulator')
@autoinject()
export class EMVCardSimulatorVM {

  running: boolean = false;
  errors: string;
  errorCount: number = 0;
  dialogService: DialogService;

  private _component: any;

  constructor(dialogService: DialogService) {
    this.dialogService = dialogService
  }

  activate(component: any) {
    this._component = component;

    if (component) {
      component.bindView(this);
    }
  }

  attached() {
    $('#errorPopover').popover({ trigger: "hover" });
  }

  startComponent() {
    this.running = true;
  }

  stopComponent() {
    this.running = false;
    this.errors = "";
    this.errorCount = 0;
  }

  configure() {
    this.dialogService.open({ viewModel: NodeConfigDialog, model: {type: "EMV Card Simulator"} }).then(response => {
      if (!response.wasCancelled) {

      }
    });
  }
}

export class EMVCardSimulator implements Component
{
  _config: {};

  _slot: JSIMSlot;
  _card: JSIMScriptCard;
  _cardHandler: SlotProtocolHandler;
  _apduIn: EndPoint;

  private _node: Node;
  constructor( node: Node ) {
    this._node = node;
  }

  view: EMVCardSimulatorVM;
  icon: string = "credit-card";

  bindView(view: EMVCardSimulatorVM) {
    this.view = view;
  }

  initialize( config: {} ): EndPoint[]
  {
    this._config = config;

    this._apduIn = new EndPoint( 'iso7816', Direction.IN );

    this._slot = new JSIMSlot();

    this._card = new JSIMScriptCard();

    this._slot.insertCard( this._card );

    let emvApp = new JSIMEMVApplet();

    this._card.loadApplication( new ByteArray( [ 0xA0, 0x00, 0x00, 0x01, 0x54, 0x44, 0x42 ] ), emvApp )

    return [ this._apduIn ];
  }

  teardown() {
    if ( this._slot )
      this._slot.ejectCard();

    this._slot = null;

//    if ( this._card )
//      this._card.deleteAllApplications();

    this._card = null;

    this._apduIn = null;
    this._cardHandler = null;
  }

  start(  )
  {
    // The SlotProtocolHandler will process incoming ISO7816 slot-protocol
    // packets, redirecting them to the linked Slot
    this._cardHandler = new SlotProtocolHandler();

    this._cardHandler.linkSlot( this._slot, this._apduIn );
  }

  stop()
  {
    // Stop processing slot packets ...
    this._cardHandler.unlinkSlot( );
    this._cardHandler = null;

    // reset card
    this._slot.powerOff();
  }
}

export class CardConfig implements Kind {
  onlineOnly: boolean;
  offlineDataAuth: OfflineDataAuthentication;
  profile: string;
}

export enum OfflineDataAuthentication {
  NOODA,
  SDA,
  DDA,
  CDA
}

KindBuilder.init( CardConfig, 'EMV Card Simulator Configuration')
  .boolField( 'onlineOnly', 'Online Line')
  .enumField( 'offlineDataAuth', 'Offline Authentication', OfflineDataAuthentication )
  .stringField( 'profile', 'Card Profile' );

ComponentBuilder
  .init( EMVCardSimulator, 'EMV Card Simulator', 'A pure-js simulator for EMV Payment Cards', 'emv-payments' )
  .config( CardConfig, { onlineOnly: true, offlineDataAuth: OfflineDataAuthentication.NOODA, profile: 'default' } )
  .port( 'iso7816', 'Smartcard Commands', Direction.IN, { protocol: SlotProtocolHandler, required: true } );

