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

  configureComponent() {
    if (this.node.id === "card") {
      this.dialogService.open({ viewModel: NodeConfigDialog, model: { type: "EMV Card Simulator" } }).then(response => {
        if (!response.wasCancelled) {
          var instance = new (EMVCardSimulator as any).componentInfo.configKind({
            "onlineOnly": response.output.onlineOnly,
            "offlineDataAuth": response.output.offlineDataAuth,
            "profile": response.output.profile
          });
          instance = JSON.parse(JSON.stringify(instance));
          (this.node as any)._initialData = instance;
        }
      });
    }
  }

}