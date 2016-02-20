import {autoinject} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import 'fetch';
import {Network, Graph, Direction, ComponentFactory, Kind, Node} from 'cryptographix-sim-core';

@autoinject
export class MyNetworks {

  private heading: string;
  private network: Network;
  private networks = [];
  private components: {};
  private label: string;
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
        for (var network of data) {
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
        console.log(data)
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

