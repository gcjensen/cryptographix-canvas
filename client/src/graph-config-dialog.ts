import {DialogController} from 'aurelia-dialog';
import {autoinject} from 'aurelia-framework';

@autoinject
export class GraphConfigDialog {

  graphID: string;
  controller: DialogController;

  constructor(controller: DialogController) {
    this.controller = controller;
  }
}