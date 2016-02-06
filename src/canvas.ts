import {autoinject, customElement, bindable, containerless, TaskQueue} from 'aurelia-framework';
import {Network, Node, Link, Direction} from '../libs/sim-core-master/dist/cryptographix-sim-core';
import {NodeElement} from 'node-element';

@autoinject
@containerless()
@customElement('canvas')
@bindable('network')
export class Canvas { 

  private network: Network;
  private nodes = [];
  private taskQueue: TaskQueue;

  constructor(taskQueue: TaskQueue) {
    this.taskQueue = taskQueue;
  }

  attached() {
    // the network object has been bound to canvas in the view
    this.network.loadComponents().then(()=> {
      this.network.initialize();  

      this.network.graph.nodes.forEach(node => {
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
    this.unregisterEvents();
    jsPlumb.detachEveryConnection();
    this.removeGraph(this.network.graph);
  }

  setUpGraphUI() {
    for (let node of this.nodes) {
      this.configureDomElement(node);
      this.addPortsToNode(node);
    }
    this.connectNodes(this.network.graph.links); 
    this.registerEvents();
  }

  configureDomElement(node: Node) {
    let nodeElement = document.getElementById(node.id)
    nodeElement.style.left = node.metadata.view.x;
    nodeElement.style.top = node.metadata.view.y;
    nodeElement.style.width = node.metadata.view.width;
    nodeElement.style.height = node.metadata.view.height;    

    jsPlumb.draggable(node.id, {
      stop: function(e) {
        node.metadata.view.x = e.pos[0];    
        node.metadata.view.y = e.pos[1];
      }
    });
  }


  addPortsToNode(node: Node) {
    var portsArray = this.sortPorts(node.ports);

    // do everything for the inout, in and out ports respectively
    for (let portArray of [portsArray[0], portsArray[1], portsArray[2]]) {
      if (portArray.length > 0) {
      
        /* 
         * ports are spaced out evenly on the node, depending on the number of them
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
            uuid: node.id + "-" + portArray[j].id,
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
      (jsPlumb.connect({
        uuids: [link.fromNode.id + "-" + link.fromPort.id, link.toNode.id + "-" + link.toPort.id],
        endpointStyle: { fillStyle: "#77aca7", radius: 3 },
        hoverPaintStyle: { radius: 6 },
        paintStyle: { strokeStyle: "#77aca7", lineWidth: 2 },
      }) as any).id = link._id; 
      // connection is cast to any, because jsPlumb typescript definitions don't include .id for some reason     
    });
  }

  registerEvents() {
    var self = this;
    
    jsPlumb.bind("connection", function(data) {
        // check to deal with an idiosyncrasy of jsPlumb where 'connection' gets fired as well as 'connectionMoved'
      if (self.isNewConnection(data.connection.id))
        self.createLink(data.connection.endpoints[0].getUuid(), data.connection.endpoints[1].getUuid(), undefined);
    });

    jsPlumb.bind("connectionDetached", function(data) { 
      self.removeLink(data.connection.id);
    });

    jsPlumb.bind("connectionMoved", function(data) {
      self.changeLink(data);
    });
  }

  unregisterEvents() {
    jsPlumb.unbind("connection");
    jsPlumb.unbind("connectionDetached");
    jsPlumb.unbind("connectionMoved");
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

  createLink(sourceEndPointID: any, targetEndPointID: any, linkID: string) {
    
    if (!linkID) {
      // pop up modal to allow user to specify link name and protocol etc.
      linkID = "link4";
    }

    // endpoint UUIDs contain information about the node they're on, so we must split this out  
    this.network.graph.addLink(linkID, {
      from: { nodeID: sourceEndPointID.split("-")[0], portID: sourceEndPointID.split("-")[1] },
      to: { nodeID: targetEndPointID.split("-")[0], portID: targetEndPointID.split("-")[1] }
    });
  }

  removeLink(linkID: string) {  
    this.network.graph.removeLink(linkID);
  }

  changeLink(data: any) { 
    this.removeLink(data.connection.id);
    this.createLink(data.originalSourceEndpoint.getUuid(), data.newTargetEndpoint.getUuid(), data.connection.id);
  }

  isNewConnection(linkID: any) {
    var isNew: Boolean;
    this.network.graph.links.forEach(link => {  
      isNew = link._id !== linkID; 
    });
    return isNew;
  }

}