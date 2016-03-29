import {autoinject, customElement, bindable} from 'aurelia-framework';
import {Node} from 'cryptographix-sim-core';
import { DialogService } from 'aurelia-dialog';
import { NodeConfigDialog } from './node-config-dialog';
import { EMVCardSimulator } from './emv-card-simulator';


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