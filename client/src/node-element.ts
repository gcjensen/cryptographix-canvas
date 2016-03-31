import {autoinject, customElement, bindable} from 'aurelia-framework';
import {Node} from 'cryptographix-sim-core';
import { DialogService } from 'aurelia-dialog';
import { NodeConfigDialog } from './config-dialogs/node-config-dialog';


@autoinject
@customElement('node-element')
@bindable('node')
@bindable('style')
export class NodeElement {
  
  node: Node;
  style: string;
  dialogService: DialogService;

  constructor(dialogService: DialogService) {
    this.dialogService = dialogService
  }
}