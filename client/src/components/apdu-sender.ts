import { customElement, autoinject } from "aurelia-framework";
import { CommandAPDU, ResponseAPDU, ISO7816, Slot, SlotProtocolProxy } from "cryptographix-se-core";
import { Component, Direction, Kind, EndPoint, ByteArray } from "cryptographix-sim-core";
import { EMV } from './common/EMV';

const AID_EMV_TEST = [0xF0, 0x00, 0x00, 0x17, 0x11, 0x31, 0x12];

@customElement("apdu-sender")
@autoinject()
export class APDUSenderVM {

  public errors: string;
  public errorCount: number = 0;

  private component: APDUSender;


  public attached(): void {
    ($("[data-toggle='popover']") as any).popover();
  }

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
          .setCLA(ISO7816.CLA_ISO)
          .setINS(ISO7816.INS_SELECT_FILE)
          .setP1(0x04)
          .setP2(0x00)
          .setData(new ByteArray(AID_EMV_TEST));
        return cardSlot.executeAPDU( selectAPDU );
    })
    .then( (resp: ResponseAPDU ) => {
      console.log("Got SELECT response from card " + resp.data.toString(ByteArray.HEX));
      let gpoAPDU = CommandAPDU.init()
        .setCLA(EMV.CLA_EMV)
        .setINS(EMV.INS_GET_PROCESSING_OPTIONS)
        .setP1(0x00)
        .setP2(0x00)
        .setData(new ByteArray([0x83, 0x00]));

        return cardSlot.executeAPDU( gpoAPDU );
    } )
    .then( (resp: ResponseAPDU ) => {
      console.log("Got GPO response from card: " + resp.encodeBytes().toString(ByteArray.HEX));

      // Send VERIFY for PIN 1234
      // TODO: Get PIN from UX
      let verifyAPDU = CommandAPDU.init()
        .setCLA(ISO7816.CLA_ISO)
        .setINS(ISO7816.INS_VERIFY)
        .setP1(0x00)
        .setP2(0x00)
        .setData(new ByteArray([0x24, 0x12, 0x34, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]));

        return cardSlot.executeAPDU( verifyAPDU );
    } )
    .then( (resp: ResponseAPDU ) => {
      console.log("Got VERIFY response from card: " + resp.encodeBytes().toString(ByteArray.HEX));

      if (resp.encodeBytes().toString(ByteArray.HEX) === "9000") {
        this.errorCount = 0;
      } else {
        this.errors = "PIN incorrect.";
        this.errorCount++;
      }

      let getdataAPDU = CommandAPDU.init()
        .setCLA(EMV.CLA_EMV)
        .setINS(ISO7816.INS_GET_DATA)
        .setP1(0x9F)
        .setP2(0x17)
        .setLe( 5 );

        return cardSlot.executeAPDU( getdataAPDU );
    } )
    .then( (resp: ResponseAPDU ) => {
      console.log("Got GET_DATA response from card: " + resp.encodeBytes().toString(ByteArray.HEX));
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
