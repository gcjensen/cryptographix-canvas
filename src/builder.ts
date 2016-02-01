import {autoinject} from 'aurelia-framework';
import {Config} from 'config';
import {Network, Graph, Direction, ComponentFactory} from '../libs/sim-core-master/dist/cryptographix-sim-core';

@autoinject
// currently the work could all be done in Canvas, but Builder may be needed later
export class Builder {

  private heading: string;
  private network: Network;

  constructor() {
    this.heading = 'Builder';

    let graph = new Graph(null, Config.json());
    let factory = new ComponentFactory();
    this.network = new Network(factory, graph);
    // the created network object is then bound to the canvas custom element in the view
  }

}	
