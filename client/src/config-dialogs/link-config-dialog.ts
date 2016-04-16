import { DialogController } from "aurelia-dialog";
import { autoinject } from "aurelia-framework";

@autoinject
export class LinkConfigDialog {

  public linkID: string;

  private controller: DialogController;

  constructor(controller: DialogController) {
    this.controller = controller;
  }
}
