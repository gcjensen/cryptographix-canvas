import {autoinject} from 'aurelia-framework';
import {Config} from 'config';
import {Graph, Direction} from '../libs/sim-core-master/dist/cryptographix-sim-core';

@autoinject
export class Builder {

  heading = 'Builder';
  graph: Graph;
  views: {};

  constructor(private config: Config, graph: Graph) {
  	this.graph = new Graph(null, config.getJSON());
	this.views = {
		"node1": { x: "100px", y: "200px", width: "100px", height: "100px" },
		"node2": { x: "450px", y: "400px", width: "100px", height: "100px" },
		"node3": { x: "820px", y: "150px", width: "100px", height: "100px" },
		"node4": { x: "1100px", y: "300px", width: "100px", height: "100px" }
	}
  }

  attached() {
  	this.configureGraph(this.graph);
  }  

  detached() {
  	this.removeGraph(this.graph);
  }

  configureGraph(graph: any) {
  	graph.nodes.forEach(function(node) {
	  this.addNodeToDom(node);
	  this.addPortsToNode(node);
	}.bind(this));
	this.connectNodes(graph.links);
  }

  addNodeToDom(node: any) {
  	var nodeInDOM = document.createElement("div");
	nodeInDOM.setAttribute("id", node.id);
	nodeInDOM.className = "node";
	document.body.appendChild(nodeInDOM);
	nodeInDOM.style.position = "absolute";
	nodeInDOM.style.left = this.views[node.id].x;
	nodeInDOM.style.top = this.views[node.id].y;
	nodeInDOM.style.width = this.views[node.id].width;
	nodeInDOM.style.height = this.views[node.id].height;

	jsPlumb.draggable(node.id);
  }

  addPortsToNode(node: any) {
	var portsArray = this.sortPorts(node.ports);

	// do everything for the inout, in and out ports respectively
	for (let portArray of [portsArray[0], portsArray[1], portsArray[2]]) {
	  if (portArray.length > 0) {
			
	    for (var j = 0; j < portArray.length; j++) {
		  if (portArray[0].direction === Direction.INOUT) 	{
			var x = (1 / (portArray.length + 1)) + ((1 / (portArray.length + 1)) * j);						
			var y = 0;
		  } else {
			var x = portArray[0].direction - 1;
			var y = (1 / (portArray.length + 1)) + ((1 / (portArray.length + 1)) * j);
		  }

		  jsPlumb.addEndpoint(node.id, {
			uuid: node.id + portArray[j].id,
			anchors: [[x, y]],
			isSource: portArray[0].direction === Direction.OUT,
			isTarget:portArray[0].direction === Direction.IN,
			maxConnections: -1,
			paintStyle: { fillStyle: "#77aca7 ", radius: 3 },
			hoverPaintStyle: { fillStyle: "#77aca7", radius: 6 },
			connectorStyle: { strokeStyle: "#77aca7", lineWidth: 2 },
			connectorHoverStyle: { lineWidth: 2 }
		  });
		}
	  }
	}
  }

  connectNodes(links: any) {
	links.forEach(function(link) {
   	  jsPlumb.connect({
		uuids: [link.fromNode.id + link.fromPort.id, link.toNode.id + link.toPort.id],
		endpointStyle: { fillStyle: "#77aca7", radius: 3 },
		hoverPaintStyle: { radius: 6 },
		paintStyle: { strokeStyle: "#77aca7", lineWidth: 2 },
	  });
	});
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
