import {autoinject, customElement, bindable, containerless} from 'aurelia-framework';
import {Node} from 'cryptographix-sim-core';

@autoinject
@customElement('node-element')
@bindable('node')
@bindable('style')
export class NodeElement {
  
  node: Node;
  style: string;

}