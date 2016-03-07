import {autoinject, customElement, bindable, containerless, TaskQueue} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {LinkConfigDialog} from './link-config-dialog';
import {AddNodeDialog} from './add-node-dialog';
import {Network, Node, Link, Direction} from 'cryptographix-sim-core';
import {Animation} from './animation';

@autoinject
@containerless()
@customElement('canvas')
@bindable('network')
export class Canvas { 

  network: Network;
  nodes = [];
  taskQueue: TaskQueue;
  dialogService: DialogService;
  isDragging = false;
  nodeStyle = "regular";
  newConnectionSource: string;

  constructor(taskQueue: TaskQueue, dialogService: DialogService) {
    this.taskQueue = taskQueue;
    this.dialogService = dialogService
  }

  attached() {
    // the network object has been bound to canvas in the view
    this.network.loadComponents().then(() => {
      this.network.initialize();
    }).then(() => {
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
    this.nodes = [];
  }

  setUpGraphUI() {
    for (let node of this.nodes) {
      this.configureDomElement(node);
      this.addPortsToNode(node);
    }
    this.connectNodes(this.network.graph.links); 
    this.registerEvents();
    jsPlumb.repaintEverything();
  }

  /* 
   * clicking a node to zoom interferes with clicking the text area
   * of ByteArrayEntry or ByteArrayViewer, so zooming functionality
   * has been temporarily disabled by removing the click register 
   * in the view
   */
  zoom(node: Node) {
    // check to prevent dragging event from causing a zoom
    if (!this.isDragging) {
        if (!this.isZoomedIn(node)) {
          Animation.zoomIn(node, this.nodes, 2);
          node['zoomedIn'] = true;
        } else {
          node['zoomedIn'] = false;
          Animation.zoomOut(this.nodes);
      }
    }
    this.isDragging = false;
  }


  configureDomElement(node: Node) {
    let nodeElement = document.getElementById(node.id);
    nodeElement.style.left = parseInt(node.metadata.view.x) + "px";
    nodeElement.style.top = parseInt(node.metadata.view.y) + "px";
    nodeElement.style.width = parseInt(node.metadata.view.width) + "px";
    nodeElement.style.height = parseInt(node.metadata.view.height) + "px";

    var self = this;
    jsPlumb.draggable(node.id, {
      stop: function(e) {
        node.metadata.view.x = e.pos[0];    
        node.metadata.view.y = e.pos[1];
        self.isDragging = true;
      }
    });
  }

  addPortsToNode(node: Node) {
    var self = this;
    node.ports.forEach(function(port) {
      var endpoint = jsPlumb.addEndpoint(node.id, {
        // id's are combined so connections can be drawn from specific ports on specific nodes
        uuid: node.id + ":" + port.id,
        anchor: "Continuous",
        isSource: true,
        isTarget: true,
        maxConnections: -1, // no limit
        paintStyle: { fillStyle: "#77aca7", radius: 4 },
        hoverPaintStyle: { fillStyle: "#77aca7", radius: 8 },
        connectorStyle: { strokeStyle: "#77aca7", lineWidth: 4 },
        connectorHoverStyle: { lineWidth: 8 }
      });
      self.registerEndpointEvents(endpoint);
    });
  }

  connectNodes(links: Map<string, Link>) {
    links.forEach(function(link) {
      (jsPlumb.connect({
        uuids: [link.fromNode.id + ":" + link.fromPort.id, link.toNode.id + ":" + link.toPort.id],
        endpointStyle: { fillStyle: "#77aca7", radius: 4 },
        hoverPaintStyle: { radius: 8 },
        paintStyle: { strokeStyle: "#77aca7", lineWidth: 4 }
      }) as any).id = link.toObject()["id"]; 
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

    // delete links on double click
    jsPlumb.bind("dblclick", function(conn) {
        jsPlumb.detach(conn);
    });

    /* 
     * beforeDrop doesn't provide information about the source endpoint, therefore
     * beforeStartDetach (when the link is being dragged from a port that already has another link) 
     * and beforeDrag (when the source port does not have another link) are needed so that
     * the source endpoint can be known about
     */
    jsPlumb.bind("beforeStartDetach", function(params) {
      self.newConnectionSource = params.endpoint.getUuid();
      return true;
    });

    jsPlumb.bind("beforeDrag", function(params) {
      self.newConnectionSource = params.endpoint.getUuid();
      return true;
    });

    // used newConnectionSource and the dropEndpoint to determine whether the link can be made
    jsPlumb.bind("beforeDrop", function(params) { 
      return self.arePortsCompatible(self.newConnectionSource, params.dropEndpoint.getUuid());         
    });
  }

  // endpoints can be moused-over to find out their id and direction
  registerEndpointEvents(endpoint: any) {
    var id = endpoint.getUuid().split(":")[1];
    var label: string;
    var self = this;
    this.network.graph.nodes.forEach(function(node) {
      var port = node.getPortByID(id);
      if (port !== undefined) 
        label = id + " - " + self.getDirectionName(Direction, port.direction);
    })
    endpoint.bind("mouseover", function(endpoint) {
      endpoint.addOverlay(["Label", { label: label, location: [-0.5, -0.5], id: "id" }]);
    });
    endpoint.bind("mouseout", function(endpoint) {
      endpoint.removeOverlay("id");
    });
  }

  unregisterEvents() {
    jsPlumb.unbind("connection");
    jsPlumb.unbind("connectionDetached");
    jsPlumb.unbind("connectionMoved");
  }

  removeGraph(graph: any) {
    graph.nodes.forEach(function(node) {
      jsPlumb.remove(node.id);
    });
  }

  addNode() {
    this.network.teardown();
    this.dialogService.open({ viewModel: AddNodeDialog }).then(response => {
      if (!response.wasCancelled) {
        var node = response.output;
        // the node is placed in an arbitrary position
        node.metadata.view.x = "300px";
        node.metadata.view.y = "300px";
        this.network.graph.addNode(node.id, node.toObject()); 
        this.nodes.push(this.network.graph.getNodeByID(node.id));
        this.taskQueue.queueMicroTask({
          call: () => this.configureNewNode(node)
        });
        this.network.loadComponents().then(() => {
          this.network.initialize();
        });
      }
    });
  }

  configureNewNode(node: Node) {
    this.configureDomElement(node);
    this.addPortsToNode(node);
    jsPlumb.repaintEverything();
  }

  createLink(sourceEndPointID: any, targetEndPointID: any, linkID: string) {  
    if (!linkID) {
      this.dialogService.open({ viewModel: LinkConfigDialog }).then(response => {
        if (!response.wasCancelled) {
          // rename the jsPlumb connection instance to the user chosen name
          jsPlumb.getConnections()[jsPlumb.getConnections().length - 1].id = response.output;          
          this.network.teardown();
          // endpoint UUIDs contain information about the node they're on, so we must split this ou 
          this.network.graph.addLink(response.output, {
            from: { nodeID: sourceEndPointID.split(":")[0], portID: sourceEndPointID.split(":")[1] },
            to: { nodeID: targetEndPointID.split(":")[0], portID: targetEndPointID.split(":")[1] }
          });
          this.network.loadComponents().then(() => { this.network.initialize(); });
        } else {
          // if no ID is provided, remove the connection
          var connections = jsPlumb.getConnections();
          jsPlumb.detach(connections[connections.length - 1]);        
        }
      });
    } else {
      // endpoint UUIDs contain information about the node they're on, so we must split this out  
      this.network.graph.addLink(linkID, {
        from: { nodeID: sourceEndPointID.split(":")[0], portID: sourceEndPointID.split(":")[1] },
        to: { nodeID: targetEndPointID.split(":")[0], portID: targetEndPointID.split(":")[1] }
      });
      this.network.loadComponents().then(() => { this.network.initialize(); });
    }
    // repeated code is necessary, otherwise the link would be added before it gets the ID supplied by the user
  }

  removeLink(linkID: string) {  
    this.network.teardown();
    this.network.graph.removeLink(linkID);
    this.network.loadComponents().then(() => {
      this.network.initialize();
    });
  }

  changeLink(data: any) {
    this.removeLink(data.connection.id);
    this.createLink(data.originalSourceEndpoint.getUuid(), data.newTargetEndpoint.getUuid(), data.connection.id);
  }

  arePortsCompatible(sourceID, targetID) {
    var sourceNode = this.network.graph.getNodeByID(sourceID.split(":")[0]);
    var sourcePort = sourceNode.getPortByID(sourceID.split(":")[1]));
    var targetNode = this.network.graph.getNodeByID(targetID.split(":")[0]);
    var targetPort = targetNode.getPortByID(targetID.split(":")[1]));

    if ((sourcePort.direction === Direction.OUT && targetPort.direction === Direction.IN) ||
        (sourcePort.direction === Direction.IN && targetPort.direction === Direction.OUT) ||
        (sourcePort.direction === Direction.INOUT || targetPort.direction === Direction.INOUT))
      return true;
    else
      return false;
  }

  isNewConnection(linkID: any) {
    var isNew = true;
    this.network.graph.links.forEach(link => {  
      isNew = link.toObject()["id"] !== linkID; 
    });
    return isNew;
  }

  getDirectionName(directions, desiredDirection) {
    for (var direction in directions) {
      if (directions.hasOwnProperty(direction)) {
        if(directions[direction] == desiredDirection) {
          return direction;
        }
      }
    }
    return undefined;
  }

  isZoomedIn(node: Node) {
    return document.getElementById(node.id).style.width !== node.metadata.view.width;
  }

}