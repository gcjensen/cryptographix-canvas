import {DialogController} from 'aurelia-dialog';
import {autoinject} from 'aurelia-framework';

@autoinject
export class NodeConfigDialog {

  controller: DialogController;
  component: any;

  constructor(controller: DialogController) {
    this.controller = controller;
  }

  activate(component) {
    this.component = component;
  }
}