import {autoinject} from 'aurelia-framework';
import {Network, Graph, Direction, ComponentFactory, Kind, Node} from '../libs/sim-core-master/dist/cryptographix-sim-core';

@autoinject
// currently the work could all be done in Canvas, but Builder may be needed later
export class Builder {

  private heading: string;
  private network: Network;
  private exampleGraph: {};
  
  constructor() {
    this.heading = 'Builder';

    let graph = new Graph(null, exampleGraph);
    graph.nodes.forEach(node => { this.addViewDataToNode(node) });
    let factory = new ComponentFactory();
    factory.register('A', A);
    factory.register('B', B);
    factory.register('C', C);
    factory.register('D', D);
    this.network = new Network(factory, graph);
    // the created network object is then bound to the canvas custom element in the view
  }

  attached() {
    document.getElementById('page-title').style.marginTop = ((screen.height / 2) - 100) + "px";
  }

  addViewDataToNode(node: Node) {
    node.metadata["view"] = {
      x: exampleGraph.nodes[node.id].view.x,
      y: exampleGraph.nodes[node.id].view.y,
      width: exampleGraph.nodes[node.id].view.width,
      height: exampleGraph.nodes[node.id].view.height
    }
  }

  // temporary function to enable testing of graph modifications
  printGraphObject() {
    console.log(this.network.graph.toObject());
  }

}	

class A {}
class B {}
class C {}
class D {}

// an example Graph is JSON format, to give a starting point
var exampleGraph = {
  nodes: {
    "node1": {
      component: "A",
      view: { x: "100px", y: "200px", width: "100px", height: "100px" },
      ports: {
        "portOut1": { direction: "out" },
        "portOut2": { direction: "out" },
        "portIn1": { direction: "in" },
      },
    },
    "node2": {
      component: "B",
      view: { x: "450px", y: "400px", width: "100px", height: "100px" },
      ports: {
        "portOut1": { direction: "out" },
        "portIn1": { direction: "in" },
      },
    },
    "node3": {
      component: "C",
      view: { x: "820px", y: "150px", width: "100px", height: "100px" },
      ports: {
        "portOut1": { direction: "out" },
        "portIn1": { direction: "in" },
      },
    },
    "node4": {
      component: "D",
      view: { x: "1100px", y: "300px", width: "100px", height: "100px" },
      ports: {
        "portOut1": { direction: "out" },
        "portIn1": { direction: "in" },
      },
    },  
  },  
  links: {
    "link1": {
      from: { nodeID: "node1", portID: "portOut1" },
      to: { nodeID: "node2", portID: "portIn1" }
    },
    "link2": {
      from: { nodeID: "node2", portID: "portOut1" },
      to: { nodeID: "node3", portID: "portIn1" }
    },
    "link3": {        
      from: { nodeID: "node3", portID: "portOut1" },
      to: { nodeID: "node4", portID: "portIn1" }
    }
  }
}