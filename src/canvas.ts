import {autoinject, customElement, bindable, containerless, TaskQueue} from 'aurelia-framework';
import {Network, Node, Link, Direction} from '../libs/sim-core-master/dist/cryptographix-sim-core';
import {Config} from 'config';
import {NodeElement} from 'node-element';

@autoinject
@containerless()
@customElement('canvas')
@bindable('network')
export class Canvas { 

  private network: Network;
  private nodes = [];
  private json: {};
  private taskQueue: TaskQueue;

  constructor(taskQueue: TaskQueue) {
    this.taskQueue = taskQueue;
  }

  attached() {
    // the network object has been bound to canvas in the view
    this.network.loadComponents().then(()=> {
      this.network.initialize();  

      // network object is now ready, so view can be rendered
      this.network.graph.nodes.forEach(node => {
        this.addViewDataToNode(node);
        this.nodes.push(node);
      });

      // microtask ensures the work is not done until each node has attached to the view
      this.taskQueue.queueMicroTask({
        call: () => this.setUpGraphUI()
      });
    });
  }

  // jsPlumb stuff is removed before changing views
  detached() {
    this.removeGraph(this.network.graph);
  }

  setUpGraphUI() {
    for (let node of this.nodes) {
        this.configureDomElement(node);
        this.addPortsToNode(node);
    }
    this.connectNodes(this.network.graph.links); 
  }

  configureDomElement(node: Node) {
    let nodeElement = document.getElementById(node.id)
    nodeElement.style.left = node.metadata.view.x;
    nodeElement.style.top = node.metadata.view.y;
    nodeElement.style.width = node.metadata.view.width;
    nodeElement.style.height = node.metadata.view.height;    
    jsPlumb.draggable(node.id);
  }
      

  addPortsToNode(node: Node) {
    var portsArray = this.sortPorts(node.ports);

    // do everything for the inout, in and out ports respectively
    for (let portArray of [portsArray[0], portsArray[1], portsArray[2]]) {
      if (portArray.length > 0) {
      
        /* ports are spaced out evenly on the node, depending on the number of them
         * INOUT - top of node
         * IN - left of node
         * OUT - right of node
         */
        for (var j = 0; j < portArray.length; j++) {
          if (portArray[0].direction === Direction.INOUT) {
            var x = (1 / (portArray.length + 1)) + ((1 / (portArray.length + 1)) * j);            
            var y = 0;
          } else {
            var x = portArray[0].direction - 1;
            var y = (1 / (portArray.length + 1)) + ((1 / (portArray.length + 1)) * j);
          }

          jsPlumb.addEndpoint(node.id, {
            // id's are combined so connections can be drawn from specific ports on specific nodes
            uuid: node.id + portArray[j].id,
            anchors: [[x, y]],
            isSource: portArray[0].direction === Direction.OUT,
            isTarget:portArray[0].direction === Direction.IN,           
            maxConnections: -1, // no limit
            paintStyle: { fillStyle: "#77aca7 ", radius: 3 },
            hoverPaintStyle: { fillStyle: "#77aca7", radius: 6 },
            connectorStyle: { strokeStyle: "#77aca7", lineWidth: 2 },
            connectorHoverStyle: { lineWidth: 4 }
          });
        }
      }
    }
  }

  connectNodes(links: Link[]) {
    links.forEach(function(link) {
      jsPlumb.connect({
          uuids: [link.fromNode.id + link.fromPort.id, link.toNode.id + link.toPort.id],
          endpointStyle: { fillStyle: "#77aca7", radius: 3 },
          hoverPaintStyle: { radius: 6 },
          paintStyle: { strokeStyle: "#77aca7", lineWidth: 2 },
        });
      });
  }

  addViewDataToNode(node: Node) {
    node.metadata["view"] = {
      x: Config.json().nodes[node.id].view.x,
      y: Config.json().nodes[node.id].view.y,
      width: Config.json().nodes[node.id].view.width,
      height: Config.json().nodes[node.id].view.height
    }
  }

  sortPorts(ports: any) {
    var inOutPorts = [];
    var inPorts = [];
    var outPorts = [];

    ports.forEach(function(port) {
      if (port.direction === Direction.INOUT) {
        inOutPorts.push(port);
      } else if (port.direction === Direction.IN) {
        inPorts.push(port);
      } else {
        outPorts.push(port);
      }
    });
    return [inOutPorts, inPorts, outPorts];
  }

  removeGraph(graph: any) {
    graph.nodes.forEach(function(node) {
      jsPlumb.remove(node.id);
    });
  }

}