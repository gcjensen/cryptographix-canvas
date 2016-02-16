import {DialogController} from 'aurelia-dialog';
import {autoinject} from 'aurelia-framework';

@autoinject
export class AddNodeDialog {

  controller: DialogController;

  constructor(controller: DialogController) {
    this.controller = controller;
  }
}