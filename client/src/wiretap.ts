import { Channel, ByteArray, ByteEncoding } from 'cryptographix-sim-core';

export class Wiretap {

  public data: string = "";

  // add data to the wiretap
  listen(message: string, isResponse: boolean) {
    if (message !== "") {
      var symbol = !isResponse ? "" : " (response)";
      this.data += ">\xa0" + message + symbol + "\n";
      this.scrollWiretapPanelToTheBottom();
    }
  }

  checkForWiretaps(channel: Channel, message: any) {
    for (var endPoint of channel.endPoints) {
      if (endPoint.id === "$wiretap") {
        var data = message.payload.data ? message.payload.data.toString(ByteArray.HEX) : message.payload.toString(ByteArray.HEX);
        this.listen(data, message.header.isResponse);
      }
    }
  }

  clear() {
    this.data = "";
  }

  scrollWiretapPanelToTheBottom() {
    var wiretapTextarea = document.getElementById("wiretap-textarea");
    if (wiretapTextarea)
      wiretapTextarea.scrollTop = wiretapTextarea.scrollHeight;
  }
}
