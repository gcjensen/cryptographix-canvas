import { DialogController } from "aurelia-dialog";
import { autoinject } from "aurelia-framework";

@autoinject
export class NetworkConfigDialog {

  public graphID: string;

  private controller: DialogController;
  private takenNames: Array<string> = [];

  constructor(controller: DialogController) {
    this.controller = controller;
  }

  public activate(takenNames: Array<string>): void {
    this.takenNames = takenNames;
  }

  public attached(): void {
    (document.getElementById("okButton") as any).disabled = true;
    // the user can only procede if they've their new network an id, so the add
    // button is only enabled if there is text in the "id-input" field
    let self = this;
    ($("#id-input") as any).keyup(function () {
      if (self.graphID !== "" && self.takenNames.indexOf(self.graphID) === -1) {
        (document.getElementById("okButton") as any).disabled = false;
      } else {
        (document.getElementById("okButton") as any).disabled = true;
      }
    });
  }
}
