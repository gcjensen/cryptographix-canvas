import {DialogController} from 'aurelia-dialog';
import {autoinject} from 'aurelia-framework';

@autoinject
export class NodeConfigDialog {

  controller: DialogController;
  model: any = {};
  fields: any = [];

  constructor(controller: DialogController) {
    this.controller = controller;
  }

  activate(model) {
    this.model = model;
    for (var key in this.model.configKind.kindInfo.fields) {
      if (this.model.configKind.kindInfo.fields.hasOwnProperty(key)) {
        this.fields.push({ "key": key, "value": this.model.configKind.kindInfo.fields[key]});
      }
    }
  }
}

