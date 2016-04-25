import { Channel, ByteArray, Kind, KindConstructor } from "cryptographix-sim-core";

// Quick and Nasty helper for Kinds
// TODO: Add to sim-core as static methods
function isKind(kind: Kind): boolean {
  // !! transforms objects into boolean
  return !!(kind && kind.constructor && (<KindConstructor>(kind.constructor)).kindInfo);
}

export class Wiretap {

  public data: string = "";

  public checkForWiretaps(channel: Channel, message: any): void {
    for (let endPoint of channel.endPoints) {
      if (endPoint.id === "$wiretap") {
        let payload = message.payload;
        let data = null;

        if (payload) {
          if (payload instanceof ByteArray) {
            data = payload.toString(ByteArray.HEX);
          } else if (payload.toString instanceof Function) {
            data = payload.toString();
          } else if (isKind( message.payload)) {
            data = <Kind>(message.payload).encodeBytes().toString(ByteArray.HEX);
          } else {
            data = payload.toString();
          }
        }

        let method = message.header && message.header.method;
        this.listen(method, data, message.header.isResponse);
      }
    }
  }

  public clear(): void {
    this.data = "";
  }

  /************* Private Implementation *************/

  private listen(method: string, data: string, isResponse: boolean): void {
    let message = "";

    message += (method || "") + ":" + (data || "");
    message += (!isResponse ? "" : " (response)");
    this.data += ">\xa0" + message + "\n";
    this.scrollWiretapPanelToTheBottom();
  }

  private scrollWiretapPanelToTheBottom(): void {
    let wiretapTextarea = document.getElementById("wiretap-textarea");
    if (wiretapTextarea) {
      wiretapTextarea.scrollTop = wiretapTextarea.scrollHeight;
    }
  }
}
