import { customElement, autoinject } from "aurelia-framework";
import { CommandAPDU, ResponseAPDU, ISO7816, Slot, SlotProtocolProxy } from "cryptographix-se-core";
import { Component, Direction, Kind, EndPoint, ByteArray } from "cryptographix-sim-core";

@customElement("apdu-sender")
@autoinject()
export class APDUSenderVM {

  private component: APDUSender;

  public activate(model: { component: Component }): void {
    this.component = <APDUSender>model.component;
    if (this.component) {
      this.component.bindView(this);
    }
  }

  public sendTriggered(): void {
    let cardSlot = this.component.cardSlot;
    cardSlot.powerOn()
      .then( (atr: ByteArray ) => {
        console.log("Card powered on.");
        let selectAPDU = CommandAPDU.init()
          .setCLA(0x00)
          .setINS(ISO7816.INS_SELECT_FILE)
          .setP1(0x04)
          .setP2(0x00)
          .setData(new ByteArray([0xA0, 0x00, 0x00, 0x01, 0x54, 0x44, 0x42]));
        return cardSlot.executeAPDU( selectAPDU );
    })
    .then( (resp: ResponseAPDU ) => {
      console.log("Got response from card " + resp.data.toString(ByteArray.HEX));
      let gpoAPDU = CommandAPDU.init()
        .setCLA(0x80)
        .setINS(0xA8)
        .setP1(0x00)
        .setP2(0x00)
        .setData(new ByteArray([0x83, 0x00]));

        return cardSlot.executeAPDU( gpoAPDU );
    } )
    .then( (resp: ResponseAPDU ) => {
      console.log("Got response from card " + resp.data.toString(ByteArray.HEX));
    } )
    .catch( err => {
      console.log("Got error " + err );
    } );
  }
}

export class APDUSender implements Component {

  public icon: string = "terminal";

  private _toCard: EndPoint;
  private _cardProxy: SlotProtocolProxy;
  private view: APDUSenderVM;

  public bindView(view: APDUSenderVM) {
   this.view = view;
  }

  public initialize( config: Kind ): Array<EndPoint> {
    this._toCard = new EndPoint("toCard", Direction.INOUT);
    this._cardProxy = new SlotProtocolProxy(this._toCard);
    return [this._toCard];
  }

  public start() {
    this.view.sendTriggered();
  }

  get cardSlot(): Slot {
    return this._cardProxy;
  }
}
