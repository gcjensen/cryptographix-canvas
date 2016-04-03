import { customElement, autoinject, bindable } from 'aurelia-framework';
import { CommandAPDU, ResponseAPDU, ISO7816, Slot, SlotProtocolProxy } from 'cryptographix-se-core';
import { Component, ComponentBuilder, Direction, Kind, EndPoint, ByteArray, Message } from 'cryptographix-sim-core';

/**
* Default view for the 'apdu-sender' component
*/
@customElement( 'apdu-sender' )
//@autoinject()
export class APDUSenderVM {

  bind() {
  }

  activate(parent: any) {
    this.component = parent.component;

    if (this.component) {
      this.component.bindView(this);
    }
  }

  @bindable component: APDUSender;

  @bindable cla: string = 'C0';
  @bindable ins: string = '20';
  @bindable p1: string = '00';
  @bindable p2: string = '01';
  @bindable data: string = '3030303030303030';

  sendTriggered() {
//    function hex( s ) { return Number.parseInt( s, 16 );  }

//    this.component.sendAPDU(selectAPDU, "powerOn");
    let cardSlot = this.component.cardSlot;

    cardSlot.powerOn()
      .then( (atr: ByteArray ) => {
        console.log("Card powered on.");

        var selectAPDU = CommandAPDU.init()
          .setCLA(0x00)
          .setINS(ISO7816.INS_SELECT_FILE)
          .setP1(0x04)
          .setP2(0x00)
          .setData(new ByteArray([0xA0, 0x00, 0x00, 0x01, 0x54, 0x44, 0x42]));

        return cardSlot.executeAPDU( selectAPDU );
    })
    .then( (resp: ResponseAPDU ) => {
      console.log('Got response from card ' + resp.data.toString(ByteArray.HEX));
      var gpoAPDU = CommandAPDU.init()
        .setCLA(0x80)
        .setINS(0xA8)
        .setP1(0x00)
        .setP2(0x00)
        .setData(new ByteArray([0x83, 0x00]));

        return cardSlot.executeAPDU( gpoAPDU );
    } )
    .then( (resp: ResponseAPDU ) => {
      console.log('Got response from card ' + resp.data.toString(ByteArray.HEX));
    } )
    .catch( err => {
      console.log('Got error ' + err );
    } );
  }
}

export class APDUSender implements Component
{
  private _toCard: EndPoint;
  private _cardProxy: SlotProtocolProxy;

  icon: string = "terminal";
  view: any;

  bindView(view: any) {
   this.view = view;
  }

  initialize( config: Kind ): EndPoint[] {

    this._toCard = new EndPoint( 'toCard', Direction.INOUT );
    this._cardProxy = new SlotProtocolProxy( this._toCard );

/*    this._toCard.onMessage((msg: Message<ByteArray>) => {
      if (msg.header.method === "powerOn") {
        console.log("Card powered on.");
        var gpoAPDU = CommandAPDU
          .init()
          .setCLA(0x00)
          .setINS(0xA4)
          .setP1(0x04)
          .setP2(0x00)
          .setData(new ByteArray([0x83, 0x00]));
        this.sendAPDU(gpoAPDU, "executeAPDU");
      }
      else if (msg.header.method === "executeAPDU")
        console.log('Got response from card ' + (msg.payload as any).data.toString(ByteArray.HEX));
    });
*/
    return [this._toCard];
  }

  get cardSlot(): Slot {
    return this._cardProxy;
  }


  onResponseAPDU( response: ResponseAPDU ) {
    // send response to VM
    // vm.onResponse( response )
  }
  sendAPDU( apdu: CommandAPDU, _method: string ): Promise<ResponseAPDU> {
/*    let cmd = new Message<CommandAPDU>( { method: _method }, apdu );
    this._toCard.sendMessage( cmd );*/

    return this._cardProxy.executeAPDU( apdu );
  }

  start() {
    this.view.sendTriggered();
  }
}
