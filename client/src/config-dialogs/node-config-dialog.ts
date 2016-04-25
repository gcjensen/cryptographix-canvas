import { DialogController } from "aurelia-dialog";
import { autoinject } from "aurelia-framework";

@autoinject
export class NodeConfigDialog {

  public model: any = {};
  public fields: Array<{}> = [];

  private controller: DialogController;

  constructor(controller: DialogController) {
    this.controller = controller;
  }

  public activate(model): void {
    this.model = model;
    for (let key in this.model.info.configKind.kindInfo.fields) {
      if (this.model.info.configKind.kindInfo.fields.hasOwnProperty(key)) {
        // the "fields" can then be looped over in the view
        this.fields.push({ "key": key, "value": this.model.info.configKind.kindInfo.fields[key]});
      }
    }
  }
}

