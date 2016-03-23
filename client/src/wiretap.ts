export class Wiretap {

  public data: string = "";

  // add data to the wiretap
  listen(message: string) {
    if (message !== "") {
      this.data += "> " + message + "\n";
      this.scrollWiretapPanelToTheBottom();
    }
  }

  checkForWiretaps(endpoint: Endpoint, message: string) {
    var channels = (endpoint as any)._channels;
    for (var channel of channels) {
      for (var endPoint of channel.endPoints) {
        if (endPoint.id === "$wiretap")
          this.listen(message);
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
