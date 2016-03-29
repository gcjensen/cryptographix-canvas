import { Channel, ByteArray, ByteEncoding } from 'cryptographix-sim-core';

export class Wiretap {

  public data: string = "";

  // add data to the wiretap
  listen(message: string) {
    if (message !== "") {
      this.data += ">\xa0" + message + "\n";
      this.scrollWiretapPanelToTheBottom();
    }
  }

  checkForWiretaps(channel: Channel, payload: any) {
    for (var endPoint of channel.endPoints) {
      if (endPoint.id === "$wiretap") {
        var data = payload.data ? payload.data.toString(ByteArray.HEX) : payload.toString(ByteArray.HEX);
        this.listen(data);
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
