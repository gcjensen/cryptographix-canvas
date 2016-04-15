import { autoinject, customElement, bindable, containerless, TaskQueue, BindingEngine } from "aurelia-framework";
import { DialogService } from "aurelia-dialog";
import { LinkConfigDialog } from "./config-dialogs/link-config-dialog";
import { AddNodeDialog } from "./config-dialogs/add-node-dialog";
import { Network, Node, Link, Direction, RunState, EndPoint, Channel } from "cryptographix-sim-core";
import { Wiretap } from "./wiretap";

@autoinject
@containerless()
@customElement("canvas")
@bindable("network")
export class Canvas {

  public network: Network;
  public nodes: Array<Node> = [];
  public isDragging: boolean = false;
  public nodeStyle: string = "regular";
  public showWiretapPanel: boolean = false;
  public animationSpeed: number = 0.01;
  public wiretap: Wiretap;

  private taskQueue: TaskQueue;
  private dialogService: DialogService;
  private bindingEngine: BindingEngine;
  private newConnectionSource: string;

  constructor(taskQueue: TaskQueue, dialogService: DialogService, bindingEngine: BindingEngine, wiretap: Wiretap) {
    this.taskQueue = taskQueue;
    this.dialogService = dialogService;
    this.bindingEngine = bindingEngine;
    this.wiretap = wiretap;
  }

  public attached(): void {
    this.initialise();
  }

  // jsPlumb stuff is removed before changing views
  public detached(): void {
    this.unregisterEvents();
    jsPlumb.detachEveryConnection();
    this.removeGraph(this.network.graph);
    this.nodes = [];
    this.showWiretapPanel = false;
  }

  public runNetwork(): void {
    this.loadWiretaps();
    this.wiretap.clear();
    this.network.start();
    this.showWiretapPanel = true;
    this.toggleDragging(false);
  }

  public stopNetwork(): void {
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

  public changeSpeed(change: number): void {
    if (this.animationSpeed === 1 && change < 0) {
      this.animationSpeed = 0.02;
    }
    this.animationSpeed += change;
    if (this.animationSpeed < 0.001) {
      this.animationSpeed = 0.001;
    }
    if (this.animationSpeed > 0.02 && change > 0) {
      this.animationSpeed = 1;
    }
  }

  public addNode(): void {
    if (!this.isNetworkRunning()) {
      document.getElementById("addNodeButton").classList.remove("pulse");
      this.dialogService.open({ model: this.getTakenNames(), viewModel: AddNodeDialog }).then(response => {
        if (!response.wasCancelled) {
          this.network.teardown();
          // a proper copy of the node is taken, so that the same reference isn't referred to
          let node = JSON.parse(JSON.stringify(response.output.toObject()));
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

  /******************** Private Implementation ********************/

  private initialise(): void {
    // the network object has been bound to canvas in the view
    this.network.loadComponents().then(() => {
      this.network.initialize();
      this.loadWiretaps();
      this.configurePreMessageHook();
    }).then(() => {
      this.network.graph.nodes.forEach(node => {
        this.nodes.push(node);
      });
      if (this.nodes.length === 0) {
        // pulse the 'add' button to show the user
        document.getElementById("addNodeButton").classList.add("pulse");
      }
      // microtask ensures the work is not done until each node has attached to the view
      this.taskQueue.queueMicroTask({
        call: () => this.setUpGraphUI()
      });
    });
  }

  private setUpGraphUI(): void {
    for (let node of this.nodes) {
      this.configureDomElement(node);
      this.addPortsToNode(node);
    }
    this.connectNodes(this.network.graph.links);
    this.registerEvents();
    jsPlumb.repaintEverything();
  }

  private configureDomElement(node: Node): void {
    let nodeElement = document.getElementById(node.id);
    nodeElement.style.left = parseInt(node.metadata.view.x, 10) + "px";
    nodeElement.style.top = parseInt(node.metadata.view.y, 10) + "px";
    nodeElement.style.width = parseInt(node.metadata.view.width, 10) + "px";
    nodeElement.style.height = parseInt(node.metadata.view.height, 10) + "px";
    this.configureNodeDragging(node);
  }

  private configureNodeDragging(node: Node): void {
    let self = this;
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

  private addPortsToNode(node: Node): void {
    let self = this;
    node.ports.forEach(function(port) {
      let endpoint = jsPlumb.addEndpoint(node.id, {
        anchor: "Continuous",
        connectorHoverStyle: { lineWidth: 8 },
        connectorOverlays: [
          [ "Custom", {
            create: function(component) {
              return $('<div style="width: 15px; height: 15px; border-radius: 25px; background-color:#77aca7"></div>');
            },
            id: "arrow",
            location: 0,
            visible: false
          }]
        ],
        connectorStyle: { lineWidth: 4, strokeStyle: "#77aca7" },
        hoverPaintStyle: { fillStyle: "#77aca7", radius: 8 },
        // id's are combined so connections can be drawn from specific ports on specific nodes
        isSource: true,
        isTarget: true,
        maxConnections: -1, // no limit
        paintStyle: { fillStyle: "#77aca7", radius: 4 },
        uuid: node.id + ":" + port.id
      });
      self.registerEndpointEvents(endpoint);
    });
  }

  private connectNodes(links: Map<string, Link>): void {
    let self = this;
    links.forEach(function(link) {
      let connection = jsPlumb.connect({
        endpointStyle: { fillStyle: "#77aca7", radius: 4 },
        hoverPaintStyle: { radius: 8 },
        paintStyle: { lineWidth: 4, strokeStyle: "#77aca7" },
        uuids: [link.fromNode.id + ":" + link.fromPort.id, link.toNode.id + ":" + link.toPort.id]
      });
      // connection is cast to any, because jsPlumb typescript definitions don't include .id for some reason
      (connection as any).id = link.toObject()["id"];
      self.registerConnectionEvents(connection);
      if ((link as any).metadata.wiretap) {
        self.addWiretapOverlay(connection);
      }
    });
  }

  private registerEvents(): void {
    let self = this;

    jsPlumb.bind("connection", function(data) {
      // check to deal with an idiosyncrasy of jsPlumb where 'connection' gets fired as well as 'connectionMoved'
      if (self.isNewConnection(data.connection.id)) {
        self.createLink(data.connection.endpoints[0].getUuid(), data.connection.endpoints[1].getUuid(), undefined);
      }
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
      this.bindingEngine.propertyObserver(node, "_initialData")
        .subscribe(() => this.reinitialiseNetwork());
    });
  }

  private reinitialiseNetwork(): void {
    this.network.teardown();
    this.network.loadComponents().then(() => {
      this.network.initialize();
      this.loadWiretaps();
    });
  }

  // endpoints can be moused-over to find out their id and direction
  private registerEndpointEvents(endpoint: any): void {
    let id = endpoint.getUuid().split(":")[1];
    let label: string;
    let self = this;
    this.network.graph.nodes.forEach(function(node) {
      let port = node.getPortByID(id);
      if (port !== undefined) {
        label = id + " - " + self.getDirectionName(Direction, port.direction);
      }
    });
    endpoint.bind("mouseover", function() {
      endpoint.addOverlay(["Custom", {
        create: function(component) {
          return $("<div style='color: white; background-color: #77aca7; padding: 3px 10px 3px 10px; border-radius: 10px; text-align: center'>" + label + "</div>");
        },
        id: "id",
        location: [-0.5, -0.5]
      }]);
    });
    endpoint.bind("mouseout", function() {
      endpoint.removeOverlay("id");
    });
  }

  private registerConnectionEvents(connection: any): void {
    let self = this;
    // clicking a link adds a wiretap to it
    connection.bind("click", function(conn) {
      if (!self.isNetworkRunning()) {
        let link = self.network.graph.links.get(conn.id);
        if (!self.hasWiretap(link)) {
          self.addWiretapOverlay(conn);
          (link as any).metadata["wiretap"] = true;
          (link as any)._channel.addEndPoint(new EndPoint("$wiretap", Direction.OUT));
        } else {
          conn.removeOverlay(conn.id);
          self.removeWiretap(link);
        }
      }
    });
  }

  private addWiretapOverlay(conn: any): void {
    conn.addOverlay(["Custom", {
      create: function(component) {
        return $('<div id="wiretap" rel="wiretap" style="color: white; background-color: #77aca7; padding: 3px 4px 2px 6px; border-radius: 10px;"><i style="font-size:20px" class="fa fa-user-secret"></i></div>');
      },
      id: conn.id,
      location: 0.5
    }]);
  }

  private hasWiretap(link: any): boolean {
    let endPoints = link._channel.endPoints;
    for (let endPoint of endPoints) {
      if (endPoint.id === "$wiretap") {
        return true;
      }
    }
    return false;
  }

  private removeWiretap(link): void {
    let endPoints = link._channel.endPoints;
    for (let endPoint of endPoints) {
      if (endPoint.id === "$wiretap") {
        link.metadata.wiretap = false;
        link._channel.removeEndPoint(endPoint);
      }
    }
  }

  private unregisterEvents(): void {
    jsPlumb.unbind("connection");
    jsPlumb.unbind("connectionDetached");
    jsPlumb.unbind("connectionMoved");
  }

  private removeGraph(graph: any): void {
    (jsPlumb as any).deleteEveryEndpoint();
    graph.nodes.forEach(function(node) {
      jsPlumb.remove(node.id);
    });
  }

  private toggleDragging(canDrag: boolean): void {
    this.network.graph.nodes.forEach(node => {
      jsPlumb.setDraggable(node.id, canDrag);
    });
  }

  /* 
   * it seems an issue with Aurelia's repeat.for means a node can't
   * just be spliced out of the 'nodes' array, so everything is 
   * destroyed and then rebuilt without the deleted node
   */
  private deleteNode(node: Node): void {
    this.network.teardown();
    this.network.graph.links.forEach(link => {
      if (link.fromNode.id === node.id || link.toNode.id === node.id) {
        this.network.graph.removeLink((link.toObject() as any).id);
      }
    });
    this.network.graph.removeNode(node.id);
    this.unregisterEvents();
    this.removeGraph(this.network.graph);
    this.nodes = [];
    this.initialise();
  }

  private configureNewNode(node: Node): void {
    // the node is placed in an arbitrary position
    node.metadata.view.x = "50px";
    node.metadata.view.y = "100px";
    this.configureDomElement(node);
    this.addPortsToNode(node);
    jsPlumb.repaintEverything();
    // shake to show the user the new node
    document.getElementById(node.id).classList.add("shake");
  }

  private createLink(sourceEndPointID: any, targetEndPointID: any, linkID: string): void {
    if (!linkID) {
      this.dialogService.open({ viewModel: LinkConfigDialog }).then(response => {
        if (!response.wasCancelled) {
          // rename the jsPlumb connection instance to the user chosen name
          let jsPlumbConnection = jsPlumb.getConnections()[jsPlumb.getConnections().length - 1];
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
          let connections = jsPlumb.getConnections();
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

  private removeLink(linkID: string): void {
    this.network.teardown();
    this.network.graph.removeLink(linkID);
    this.network.loadComponents().then(() => {
      this.network.initialize();
      this.loadWiretaps();
    });
  }

  private changeLink(data: any): void {
    this.removeLink(data.connection.id);
    this.createLink(data.originalSourceEndpoint.getUuid(), data.newTargetEndpoint.getUuid(), data.connection.id);
  }

  private shouldNodeBeDeleted(node: Node): void {
    let trash = document.getElementById("trash").getBoundingClientRect();
    let nodeElement = document.getElementById(node.id).getBoundingClientRect();
    let overlap = !(trash.right < nodeElement.left ||
                    trash.left > nodeElement.right ||
                    trash.bottom < nodeElement.top ||
                    trash.top > nodeElement.bottom);
    if (overlap) {
      this.deleteNode(node);
    }
  }

  private arePortsCompatible(sourceID, targetID): boolean {
    let sourceNode = this.network.graph.getNodeByID(sourceID.split(":")[0]);
    let sourcePort = sourceNode.getPortByID(sourceID.split(":")[1]);
    let targetNode = this.network.graph.getNodeByID(targetID.split(":")[0]);
    let targetPort = targetNode.getPortByID(targetID.split(":")[1]);

    if ((sourcePort.direction === Direction.OUT && targetPort.direction === Direction.IN) ||
      (sourcePort.direction === Direction.IN && targetPort.direction === Direction.OUT) ||
      (sourcePort.direction === Direction.INOUT || targetPort.direction === Direction.INOUT)) {
      return true;
    } else {
      return false;
    }
  }

  private isNewConnection(linkID: any): boolean {
    let isNew = true;
    this.network.graph.links.forEach(link => {
      isNew = link.toObject()["id"] !== linkID;
    });
    return isNew;
  }

  private getDirectionName(directions, desiredDirection): string {
    for (let direction in directions) {
      if (directions.hasOwnProperty(direction)) {
        if (directions[direction] === desiredDirection) {
          return direction;
        }
      }
    }
    return undefined;
  }

  private isNetworkRunning(): boolean {
    return this.network.graph.context.runState === RunState.RUNNING;
  }

  private getTakenNames(): Array<string> {
    let takenNames = [];
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
  private loadWiretaps(): void {
    this.network.graph.links.forEach(link => {
      if ((link as any).metadata["wiretap"] && !this.hasWiretap(link)) {
        (link as any)._channel.addEndPoint(new EndPoint("$wiretap", Direction.OUT));
      }
    });
  }

  private configurePreMessageHook(): void {
    let wiretap = this.wiretap;
    let jsPlumbInstance = jsPlumb;
    let network = this.network;
    let self = this;

    Channel.setDeliveryHook((params) : boolean => {
      for (let connection of jsPlumbInstance.getConnections()) {
        let uuids = connection.getUuids();
        let nodeOne = network.graph.getNodeByID(uuids[0].split(":")[0]);
        let nodeTwo = network.graph.getNodeByID(uuids[1].split(":")[0]);

        self.checkIfConnectionShouldBeAnimated(connection, nodeOne, nodeTwo, params, wiretap);
        // check again with the nodes swapped to check for responses along the same link
        self.checkIfConnectionShouldBeAnimated(connection, nodeTwo, nodeOne, params, wiretap);
      }
      return true;
    });
  }

  private checkIfConnectionShouldBeAnimated(connection, nodeOne, nodeTwo, params, wiretap): void {
    nodeOne.ports.forEach(port => {
      if (port.endPoint === params.origin) {
        nodeTwo.ports.forEach(_port => {
          if (_port.endPoint === params.destination) {
            let arrow = connection.getOverlay("arrow");
            arrow.setVisible(true);
            this.animateOverlay(connection, "arrow", params.channel, params.message, params.sendMessage, wiretap);
          }
        });
      }
    });
  }

  private animateOverlay(connection, id, channel, message, sendMessage, wiretap): void {
    let overlay = connection.getOverlay(id);
    let timerHandle = null;
    let wiretapCaptured = false;
    let start, end, increment;

    if (!message.header.isResponse) {
      start = 0;
      end = 1;
      increment = this.animationSpeed;
    } else {
      start = 1;
      end = 0;
      increment = -this.animationSpeed;
    }

    overlay.setLocation(start);
    connection.repaint();
    timerHandle = window.setInterval(function() {
      overlay.incrementLocation(increment);

      // capture data on wiretap as it passes over it (half way point)
      if ((increment > 0 && overlay.getLocation() > 0.5 || increment < 0 && overlay.getLocation() < 0.5) && !wiretapCaptured) {
        wiretap.checkForWiretaps(channel, message);
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
