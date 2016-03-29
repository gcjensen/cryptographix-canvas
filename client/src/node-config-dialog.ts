import {DialogController} from 'aurelia-dialog';
import {autoinject} from 'aurelia-framework';

@autoinject
export class NodeConfigDialog {

  controller: DialogController;
  params: any = [];

  constructor(controller: DialogController) {
    this.controller = controller;
  }

  activate(params) {
    this.params = params;
  }
}