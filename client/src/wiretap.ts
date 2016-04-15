import { Channel, ByteArray } from "cryptographix-sim-core";

export class Wiretap {

  public data: string = "";

  public checkForWiretaps(channel: Channel, message: any): void {
    for (let endPoint of channel.endPoints) {
      if (endPoint.id === "$wiretap") {
        // depending on the type of packet, the data is sometimes in 'data', but sometimes not
        let data = message.payload && (message.payload.data ? message.payload.data.toString(ByteArray.HEX) : message.payload.toString(ByteArray.HEX));
        this.listen(data, message.header.isResponse);
      }
    }
  }

  public clear(): void {
    this.data = "";
  }

  /************* Private Implementation *************/

  private listen(message: string, isResponse: boolean): void {
    if (message !== "") {
      let symbol = !isResponse ? "" : " (response)";
      this.data += ">\xa0" + message + symbol + "\n";
      this.scrollWiretapPanelToTheBottom();
    }
  }

  private scrollWiretapPanelToTheBottom(): void {
    let wiretapTextarea = document.getElementById("wiretap-textarea");
    if (wiretapTextarea) {
      wiretapTextarea.scrollTop = wiretapTextarea.scrollHeight;
    }
  }
}
