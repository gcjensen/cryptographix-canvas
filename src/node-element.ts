import {autoinject, customElement, bindable, containerless} from 'aurelia-framework';
import {Node} from 'cryptographix-sim-core';

@autoinject
@customElement('node-element')
@bindable('node')
export class NodeElement {
  
  public node: Node;

}