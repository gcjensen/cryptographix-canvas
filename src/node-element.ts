import {autoinject, customElement, bindable, containerless} from 'aurelia-framework';
import {Node} from '../libs/sim-core-master/dist/cryptographix-sim-core';

@autoinject
@customElement('node-element')
@bindable('node')
export class NodeElement {
  
  public node: Node;

}