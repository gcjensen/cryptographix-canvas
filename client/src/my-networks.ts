import {autoinject} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import 'fetch';
import {Network, Graph, Direction, ComponentFactory, Kind, Node} from 'cryptographix-sim-core';
import { ByteArrayEntry } from './bytearray-entry';
import { ByteArrayViewer } from './bytearray-viewer';
import { CryptoBox } from './crypto-box';


@autoinject
export class MyNetworks {
 
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
    
    this.http = http;
    this.fetchNetworks();
    this.label = "My Networks";
  }

  fetchNetworks() {
    return this.http.fetch('getNetworks', {
        method: 'get'
    }).then(response => response.json())
      .then(data => {
        // if there are no saved networks, add an example one
        if (data.length === 0) {
          this.saveNewGraph(exampleGraph);
        } else {
          for (var network of data)
            this.configureNetwork(network);
        }
      }); 
  }

  configureNetwork(network: any) {
    let graph = new Graph(null, network.graph);
    let factory = new ComponentFactory();
    factory.register( 'ByteArrayEntry', ByteArrayEntry );
    factory.register( 'ByteArrayViewer', ByteArrayViewer );
    factory.register( 'CryptoBox', CryptoBox );
    graph.nodes.forEach(node => { this.configureNode(node, network.graph) });
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
        this.fetchNetworks();  
    });
  }
          
  configureNode(node: Node, graph: any) {
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

var exampleGraph = {
  "id": "Example Graph 2",
  "nodes": {
    "bytearray-entry": {
      "component": "ByteArrayEntry",
      "metadata": { 
        "view": { "x": "100px", "y": "100px", "width": "200px", "height": "200px" },
        "vm": "bytearray-entry" 
      },
      "ports": {
        'out': { "direction": "OUT" },
      }
    },
    "crypto-box": {
      "component": "CryptoBox",
      "metadata": { 
        "view": { "x": "500px", "y": "100px", "width": "100px", "height": "100px" },
        "vm": "crypto-box"
      },
      "ports": {
          'plaintext': { "direction": "IN" },
          'ciphertext': { "direction": "OUT" },
          'key': { "direction": "IN" },
      }
    },
    "bytearray-viewer": {
      "component": "ByteArrayViewer",
      "metadata": { 
        "view": { "x": "900px", "y": "100px", "width": "200px", "height": "200px" },
        "vm": "bytearray-viewer"
      },
      "ports": {
          'in': { "direction": "IN" },
      }
    }  
  },                           
  "links": {
    "link1": { "from": { "nodeID": "bytearray-entry", "portID": 'out' },
            "to": { "nodeID": "crypto-box", "portID": 'plaintext' },
          },
    "link2": { "from": { "nodeID": "crypto-box", "portID": 'ciphertext' },
            "to": { "nodeID": "bytearray-viewer", "portID": 'in' },
          }
  }
}

