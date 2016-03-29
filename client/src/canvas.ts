import {autoinject, customElement, bindable, containerless, TaskQueue, BindingEngine} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {LinkConfigDialog} from './link-config-dialog';
import {AddNodeDialog} from './add-node-dialog';
import { Network, Node, Link, Direction, RunState, EndPoint, Channel } from 'cryptographix-sim-core';
import { Animation } from './animation';
import { Wiretap } from './wiretap';

@autoinject
@containerless()
@customElement('canvas')
@bindable('network')
export class Canvas { 

  network: Network;
  nodes = [];
  taskQueue: TaskQueue;
  dialogService: DialogService;
  bindingEngine: BindingEngine;
  isDragging = false;
  nodeStyle = "regular";
  newConnectionSource: string;
  wiretap: Wiretap;
  showWiretapPanel: boolean = false;

  constructor(taskQueue: TaskQueue, dialogService: DialogService, bindingEngine: BindingEngine, wiretap: Wiretap) {
    this.taskQueue = taskQueue;
    this.dialogService = dialogService;
    this.bindingEngine = bindingEngine;
    this.wiretap = wiretap;
  }

  attached() {
    this.initialise();
  }

  // jsPlumb stuff is removed before changing views
  detached() {
    this.unregisterEvents();
    jsPlumb.detachEveryConnection();
    this.removeGraph(this.network.graph);
    this.nodes = [];
    this.showWiretapPanel = false;
  }

  initialise() {
    // the network object has been bound to canvas in the view
    this.network.loadComponents().then(() => {
      this.network.initialize();
      this.loadWiretaps();
      this.configurePreMessageHook();
    }).then(() => {
      this.network.graph.nodes.forEach(node => {
        this.nodes.push(node);
      });
      if (this.nodes.length === 0)
        // pulse the 'add' button to show the user
        document.getElementById("addNodeButton").classList.add("pulse");
      
      // microtask ensures the work is not done until each node has attached to the view
      this.taskQueue.queueMicroTask({
       call: () => this.setUpGraphUI()
      });
    });
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
    this.configureNodeDragging(node);
  }

  configureNodeDragging(node: Node) {
    var self = this;
    jsPlumb.draggable([node.id], {
      start: function(e) {
        self.isDragging = true;
      },
      stop: function(e) {        
        node.metadata.view.x = e.pos[0];
        node.metadata.view.y = e.pos[1];   
        self.isDragging = false;
        self.shouldNodeBeDeleted(node);
        jsPlumb.repaintEverything();
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
        connectorHoverStyle: { lineWidth: 8 },
        connectorOverlays:[ 
          [ "Custom", {
            create: function(component) {
              return $('<div style="width: 15px; height: 15px; border-radius: 25px; background-color:#77aca7"></div>');
            },
            location: 0,
            id: "arrow",
            visible: false
          }] 
        ]
      });
      self.registerEndpointEvents(endpoint);
    });
  }

  connectNodes(links: Map<string, Link>) {
    var self = this;
    links.forEach(function(link) {
      var connection = jsPlumb.connect({
        uuids: [link.fromNode.id + ":" + link.fromPort.id, link.toNode.id + ":" + link.toPort.id],
        endpointStyle: { fillStyle: "#77aca7", radius: 4 },
        hoverPaintStyle: { radius: 8 },
        paintStyle: { strokeStyle: "#77aca7", lineWidth: 4 }
      });
      // connection is cast to any, because jsPlumb typescript definitions don't include .id for some reason
      (connection as any).id = link.toObject()["id"];
      self.registerConnectionEvents(connection);
      if ((link as any).metadata.wiretap) self.addWiretapOverlay(connection);
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

    jsPlumb.bind("dblclick", function(conn) {
        jsPlumb.detach(conn);
    });

    jsPlumb.bind("beforeDetach", function(params) {
      return !self.isNetworkRunning();
    });

    /* 
     * beforeDrop doesn't provide information about the source endpoint, therefore
     * beforeStartDetach (when the link is being dragged from a port that already has another link) 
     * and beforeDrag (when the source port does not have another link) are needed so that
     * the source endpoint can be known about
     */
    jsPlumb.bind("beforeStartDetach", function(params) {
      self.newConnectionSource = params.endpoint.getUuid();
      return !self.isNetworkRunning();
    });

    jsPlumb.bind("beforeDrag", function(params) {
      self.newConnectionSource = params.endpoint.getUuid();
      return !self.isNetworkRunning();
    });

    // used newConnectionSource and the dropEndpoint to determine whether the link can be made
    jsPlumb.bind("beforeDrop", function(params) { 
      return self.arePortsCompatible(self.newConnectionSource, params.dropEndpoint.getUuid());         
    });

    // reinitialise the network if initialData changes on a node
    this.network.graph.nodes.forEach(node => {
      this.bindingEngine.propertyObserver(node, '_initialData')
        .subscribe(() => this.reinitialiseNetwork());
    });
  }

  reinitialiseNetwork() {
    this.network.teardown();
    this.network.loadComponents().then(() => {
      this.network.initialize();
      this.loadWiretaps();
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
      endpoint.addOverlay(["Custom", {
        create: function(component) {
          return $('<div style="color: white; background-color: #77aca7; padding: 3px 10px 3px 10px; border-radius: 10px; text-align: center">' + label + '</div>');
        },
        location: [-0.5, -0.5],
        id: "id"
      }])
    });
    endpoint.bind("mouseout", function(endpoint) {
      endpoint.removeOverlay("id");
    });
  }

  registerConnectionEvents(connection: any) {
    var self = this;
    // clicking a link adds a wiretap to it
    connection.bind("click", function(conn) {
      if (!self.isNetworkRunning()) {
        var link = self.network.graph.links.get(conn.id);
        if (!self.hasWiretap(link)) {
          self.addWiretapOverlay(conn);         
          (link as any).metadata["wiretap"] = true;
          (link as any)._channel.addEndPoint(new EndPoint('$wiretap', Direction.OUT));
        } else {
          conn.removeOverlay(conn.id);
          self.removeWiretap(link);
        }
      }
    });
  }

  addWiretapOverlay(conn: any) {
    conn.addOverlay(["Custom", {
      create: function(component) {
        return $('<div id="wiretap" rel="wiretap" style="color: white; background-color: #77aca7; padding: 3px 4px 2px 6px; border-radius: 10px;"><i style="font-size:20px" class="fa fa-user-secret"></i></div>');
      },
      location: 0.5,
      id: conn.id
    }]);
  }

  hasWiretap(link) {
    var endPoints = link._channel.endPoints;
    for (var endPoint of endPoints) {
      if (endPoint.id === "$wiretap") {
        return true;
      }
    }
    return false;
  }

  removeWiretap(link) {
    var endPoints = link._channel.endPoints;
    for (var endPoint of endPoints) {
      if (endPoint.id === "$wiretap") {
        link.metadata.wiretap = false;
        link._channel.removeEndPoint(endPoint);
      }
    }
  }

  unregisterEvents() {
    jsPlumb.unbind("connection");
    jsPlumb.unbind("connectionDetached");
    jsPlumb.unbind("connectionMoved");
  }

  removeGraph(graph: any) {
    (jsPlumb as any).deleteEveryEndpoint();
    graph.nodes.forEach(function(node) {
      jsPlumb.remove(node.id);
    });
  }

  runNetwork() {
    this.loadWiretaps();
    this.wiretap.clear();
    this.network.start();
    this.showWiretapPanel = true;
    this.toggleDragging(false);
  }

  stopNetwork() {
    this.network.stop();
    this.showWiretapPanel = false;
    this.toggleDragging(true);
    this.wiretap.clear();
    this.network.teardown();
    this.network.loadComponents().then(() => {
      this.network.initialize();
      this.loadWiretaps();
    });
  }

  toggleDragging(canDrag: boolean) {
    this.network.graph.nodes.forEach(node => {
      jsPlumb.setDraggable(node.id, canDrag);
    });
  }

  addNode() {
    if (!this.isNetworkRunning()) {
      document.getElementById("addNodeButton").classList.remove("pulse");
      this.dialogService.open({ viewModel: AddNodeDialog, model: this.getTakenNames() }).then(response => {
        if (!response.wasCancelled) {
          this.network.teardown();
          // a proper copy of the node is taken, so that the same reference isn't referred to
          var node = JSON.parse(JSON.stringify(response.output.toObject()));
          this.network.graph.addNode(node.id, node);
          node = this.network.graph.getNodeByID(node.id);
          this.nodes.push(node);
          this.taskQueue.queueMicroTask({
            call: () => this.configureNewNode(node)
          });
          this.network.loadComponents().then(() => {
            this.network.initialize();
            this.loadWiretaps();
          });
        }
      });
    }
  }

  /* 
   * as far as I can tell, an issue with Aurelia's repeat.for means 
   * I can't splice out of the 'nodes' array, so I have to destroy 
   * everything and then rebuild without the deleted node
   */
  deleteNode(node: Node) {
    this.network.teardown();
    this.network.graph.links.forEach(link => {
      if (link.fromNode.id === node.id || link.toNode.id === node.id) {
        this.network.graph.removeLink((link.toObject() as any).id);
      }
    })
    this.network.graph.removeNode(node.id);
    this.unregisterEvents();
    this.removeGraph(this.network.graph);
    this.nodes = [];
    this.initialise();
  }

  configureNewNode(node: Node) {
    // the node is placed in an arbitrary position
    node.metadata.view.x = "50px";
    node.metadata.view.y = "100px";
    this.configureDomElement(node);
    this.addPortsToNode(node);
    jsPlumb.repaintEverything();
    // shake to show the user the new node
    document.getElementById(node.id).classList.add("shake");
  }

  createLink(sourceEndPointID: any, targetEndPointID: any, linkID: string) {  
    if (!linkID) {
      this.dialogService.open({ viewModel: LinkConfigDialog }).then(response => {
        if (!response.wasCancelled) {
          // rename the jsPlumb connection instance to the user chosen name
          var jsPlumbConnection = jsPlumb.getConnections()[jsPlumb.getConnections().length - 1];
          jsPlumbConnection.id = response.output;
          this.registerConnectionEvents(jsPlumbConnection); 
          this.network.teardown();
          // endpoint UUIDs contain information about the node they're on, so we must split this ou 
          this.network.graph.addLink(response.output, {
            from: { nodeID: sourceEndPointID.split(":")[0], portID: sourceEndPointID.split(":")[1] },
            to: { nodeID: targetEndPointID.split(":")[0], portID: targetEndPointID.split(":")[1] }
          });
          this.network.loadComponents().then(() => { 
            this.network.initialize();
            this.loadWiretaps();
          });
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
      this.network.loadComponents().then(() => { 
        this.network.initialize(); 
        this.loadWiretaps();
      });
    }
    // repeated code is necessary, otherwise the link would be added before it gets the ID supplied by the user
  }

  removeLink(linkID: string) {
    this.network.teardown();
    this.network.graph.removeLink(linkID);
    this.network.loadComponents().then(() => {
      this.network.initialize();
      this.loadWiretaps();
    });
  }

  changeLink(data: any) {
    this.removeLink(data.connection.id);
    this.createLink(data.originalSourceEndpoint.getUuid(), data.newTargetEndpoint.getUuid(), data.connection.id);
  }

  shouldNodeBeDeleted(node: Node) {
    var trash = document.getElementById("trash").getBoundingClientRect();
    var nodeElement = document.getElementById(node.id).getBoundingClientRect();

    var overlap = !(trash.right < nodeElement.left ||
                    trash.left > nodeElement.right ||
                    trash.bottom < nodeElement.top ||
                    trash.top > nodeElement.bottom);
    
    if (overlap)
      this.deleteNode(node);
  }

  arePortsCompatible(sourceID, targetID) {
    var sourceNode = this.network.graph.getNodeByID(sourceID.split(":")[0]);
    var sourcePort = sourceNode.getPortByID(sourceID.split(":")[1]);
    var targetNode = this.network.graph.getNodeByID(targetID.split(":")[0]);
    var targetPort = targetNode.getPortByID(targetID.split(":")[1]);

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

  isNetworkRunning() {
    return this.network.graph.context.runState === RunState.RUNNING;
  }

  getTakenNames() {
    var takenNames = [];
    this.network.graph.nodes.forEach(node => {
      takenNames.push(node.id);
    });
    return takenNames;
  }

  /*
   * the new EndPoint added to the channel is lost when the network state
   * is changed, so a wiretap property is added to the link metadata for 
   * permanence. This functions re adds the wiretaps to the channels from
   * the link properties
   */
  loadWiretaps() {
    this.network.graph.links.forEach(link => {
      if ((link as any).metadata["wiretap"] && !this.hasWiretap(link)) 
        (link as any)._channel.addEndPoint(new EndPoint('$wiretap', Direction.OUT));
    });
  }

  configurePreMessageHook() {
    var wiretap = this.wiretap;
    var jsPlumbInstance = jsPlumb;
    var network = this.network;
    var self = this;

    Channel.setDeliveryHook((params) : boolean => {
      for (var connection of jsPlumbInstance.getConnections()) {
        var uuids = connection.getUuids();
        var nodeOne = network.graph.getNodeByID(uuids[0].split(":")[0]);
        var nodeTwo = network.graph.getNodeByID(uuids[1].split(":")[0]);

        self.checkIfConnectionShouldBeAnimated(connection, nodeOne, nodeTwo, params, wiretap);
        // check again with the nodes swapped to check for responses along the same link
        self.checkIfConnectionShouldBeAnimated(connection, nodeTwo, nodeOne, params, wiretap);
      }
      return true;
    });
  }

  checkIfConnectionShouldBeAnimated(connection, nodeOne, nodeTwo, params, wiretap) {
    nodeOne.ports.forEach(port => {
      if (port.endPoint === params.origin) {
        nodeTwo.ports.forEach(port => {
          if (port.endPoint === params.destination) {
            var arrow = connection.getOverlay("arrow");
            arrow.setVisible(true);
            this.animateOverlay(connection, "arrow", params.channel, params.message, params.sendMessage, wiretap);
            return true;
          }
        });
      }
    });    
  }

  animateOverlay(connection, id, channel, message, sendMessage, wiretap) {
    var overlay = connection.getOverlay(id);
    var timerHandle = null;
    var wiretapCaptured = false;
    var start, end, increment;

    if (!message.header.isResponse) {
      start = 0;
      end = 1;
      increment = 0.005;
    } else {
      start = 1;
      end = 0;
      increment = -0.005;
    }

    overlay.setLocation(start);
    connection.repaint();    
    timerHandle = window.setInterval(function() {
      overlay.incrementLocation(increment);

      // capture data on wiretap as it passes over it (half way point)
      if ((increment > 0 && overlay.getLocation() > 0.5 || increment < 0 && overlay.getLocation() < 0.5) && !wiretapCaptured) {
        wiretap.checkForWiretaps(channel, message.payload);
        wiretapCaptured = true;
      }

      if ((increment > 0 && overlay.getLocation() > end) || (increment < 0 && overlay.getLocation() < end)) {
        overlay.setLocation(end);
        window.clearInterval(timerHandle);
        overlay.setVisible(false); 
        sendMessage();        
      }

      connection.repaint();
    }, 5);
  }
}