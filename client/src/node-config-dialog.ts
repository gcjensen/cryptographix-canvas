import {DialogController} from 'aurelia-dialog';
import {autoinject} from 'aurelia-framework';

@autoinject
export class NodeConfigDialog {

  controller: DialogController;
  component: any;

  // return hardcoded config for now
  config = {
      "onlineOnly": true,
      "offlineDataAuth": 1,
      "profile": "hello"
  };

  constructor(controller: DialogController) {
    this.controller = controller;
  }

  activate(component) {
    this.component = component;
  }
}