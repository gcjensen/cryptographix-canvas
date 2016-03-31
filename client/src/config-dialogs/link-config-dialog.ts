import {DialogController} from 'aurelia-dialog';
import {autoinject} from 'aurelia-framework';

@autoinject
export class LinkConfigDialog {

  linkID: string;
  controller: DialogController;

  constructor(controller: DialogController) {
    this.controller = controller;
  }
}