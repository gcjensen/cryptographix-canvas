import {autoinject} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import 'fetch';
import {Network, Graph, Direction, ComponentFactory, Kind, Node} from 'cryptographix-sim-core';

@autoinject
export class MyNetworks {

  heading: string;
  network: Network;
  networks = [];
  components: {};
  label: string;
  graphSelected: boolean;
  
  constructor(private http: HttpClient) {
    http.configure(config => {
      config
        .useStandardConfiguration()
        .withBaseUrl('http://localhost:8080/api/');
    });

    this.components = {
      "A": A,
      "B": B,
      "C": C,
      "D": D
    }
    
    this.http = http;
    this.fetchNetworks();
    this.label = "My Networks";
  }

  fetchNetworks() {
    this.http.fetch('getNetworks', {
        method: 'get'
    }).then(response => response.json())
      .then(data => {
        // if there are no saved networks, add a couple of example ones
        if (data.length === 0) {
            this.saveNewGraph(exampleGraph1);
            this.saveNewGraph(exampleGraph2);
        } else {
            for (var network of data)
              this.configureNetwork(network);
        }
      }); 
  }

  configureNetwork(network: any) {
    let graph = new Graph(null, network.graph);
    let factory = new ComponentFactory();
    graph.nodes.forEach(node => { this.configureNode(node, factory, network.graph) });
    this.networks.push(new Network(factory, graph));
  }

  loadNetwork(network: Network) {
    this.network = network;
    this.label = this.network.graph.id;
    this.graphSelected = true;
    // the created network object is then bound to the canvas custom element in the view
  }

  back() {
    this.graphSelected = false;
    this.label = "My Networks";
  }

  save() {
    this.http.fetch('updateNetwork', {
      method: 'post',
      body: json(this.network.graph.toObject({}))
    }).then(response => response.json())
      .then(data => {
        console.log(data);
      });
  }

  saveNewGraph(graph: {}) {
    this.http.fetch('addNetwork', {
      method: 'post',
      body: json(graph)
    }).then(response => response.json())
      .then(data => {
        console.log(data);
        // ensure the example graphs don't get duplicated
        if (graph["id"] === "Example Graph 2")
          this.fetchNetworks();
    });
  }
          
  configureNode(node: Node, factory: ComponentFactory, graph: any) {
    factory.register((node.toObject() as any).component, this.components[(node.toObject() as any).component]);
    node.metadata["view"] = {
      x: graph.nodes[node.id].metadata.view.x,
      y: graph.nodes[node.id].metadata.view.y,
      width: graph.nodes[node.id].metadata.view.width,
      height: graph.nodes[node.id].metadata.view.height
    }
  }

  // temporary function to enable testing of graph modifications
  printGraphObject() {
    console.log(this.network.graph.toObject({}));
  }

}	

class A {}
class B {}
class C {}
class D {}


var exampleGraph1 = {
  "id": "Example Graph 1",
  "nodes": {
    "node1": {
      "component": "A",
      "metadata": { "view": { "x": "100px", "y": "200px", "width": "100px", "height": "100px" } },
      "ports": {
        "portOut1": { "direction": "out" },
        "portOut2": { "direction": "out" },
        "portIn1": { "direction": "in" }
      }
    },
    "node2": {
      "component": "B",
      "metadata": { "view": { "x": "450px", "y": "400px", "width": "100px", "height": "100px" } },
      "ports": {
        "portOut1": { "direction": "out" },
        "portIn1": { "direction": "in" }
      }
    },
    "node3": {
      "component": "C",
      "metadata": { "view": { "x": "820px", "y": "150px", "width": "100px", "height": "100px" } },
      "ports": {
        "portOut1": { "direction": "out" },
        "portIn1": { "direction": "in" }
      }
    },
    "node4": {
      "component": "D",
      "metadata": { "view": { "x": "1100px", "y": "300px", "width": "100px", "height": "100px" } },
      "ports": {
        "portOut1": { "direction": "out" },
        "portIn1": { "direction": "in" }
      }
    } 
  },  
  "links": {
    "link1": {
      "from": { "nodeID": "node1", "portID": "portOut1" },
      "to": { "nodeID": "node2", "portID": "portIn1" }
    },
    "link2": {
      "from": { "nodeID": "node2", "portID": "portOut1" },
      "to": { "nodeID": "node3", "portID": "portIn1" }
    },
    "link3": {        
      "from": { "nodeID": "node3", "portID": "portOut1" },
      "to": { "nodeID": "node4", "portID": "portIn1" }
    }
  }
}


var exampleGraph2 = {
  "id": "Example Graph 2",
  "nodes": {
    "node1": {
      "component": "A",
      "metadata": { "view": { "x": "100px", "y": "200px", "width": "100px", "height": "100px" } },
      "ports": {
        "portOut1": { "direction": "out" },
        "portOut2": { "direction": "out" },
        "portIn1": { "direction": "in" }
      }
    },
    "node3": {
      "component": "C",
      "metadata": { "view": { "x": "820px", "y": "150px", "width": "100px", "height": "100px" } },
      "ports": {
        "portOut1": { "direction": "out" },
        "portIn1": { "direction": "in" }
      }
    } 
  },  
  "links": {
    "link1": {
      "from": { "nodeID": "node1", "portID": "portOut2" },
      "to": { "nodeID": "node3", "portID": "portIn1" }
    }
  }
}

