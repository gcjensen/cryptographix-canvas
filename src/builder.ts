import {autoinject} from 'aurelia-framework';
import {Config} from 'config';

@autoinject
export class Builder {

	heading = 'Builder';
	graph: any;

    constructor(private config: Config) {
		this.graph = config.getJSON();
  	}

  	attached() {
		this.configureGraph(this.graph);
  	}  

	detached() {
		this.removeGraph(this.graph);
	}

    configureGraph(graph: any) {
		for (let node of this.graph.nodes) {
			this.addNodeToDom(node);
			this.addPortsToNode(node);		
		}
		this.connectNodes(graph.links);
	}

	addNodeToDom(node: any) {
		var nodeInDOM = document.createElement("div");
		nodeInDOM.setAttribute("id", node.id);
		nodeInDOM.className = "node";
		document.body.appendChild(nodeInDOM);
		nodeInDOM.style.position = "absolute";
		nodeInDOM.style.left = node.view.x;
		nodeInDOM.style.top = node.view.y;
		nodeInDOM.style.width = node.view.width;
		nodeInDOM.style.height = node.view.height;

		jsPlumb.draggable(node.id);
	}

	addPortsToNode(node: any) {
	
		var portsArray = this.sortPorts(node.ports);
	
		// do everything for the out ports, then for the in ports
		for (let portArray of [portsArray[0], portsArray[1]]) {
			if (portArray.length > 0) {
				var isOut = portArray[0].direction === 'out';
				for (var j = 0; j < portArray.length; j++) {
					var y = (1 / (portArray.length + 1)) + ((1 / (portArray.length + 1)) * j);

					jsPlumb.addEndpoint(node.id, 
					{
						uuid: node.id + portArray[j].id,
						anchors: [[isOut ? 1 : 0, y]],
						isSource: isOut,
						isTarget: !isOut,
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
   		// loop through the links in the config file connecting the appropriate nodes
   		for (let link of links) {
	    //for (var i = 0; i < this.graph.links.length; i++) {    
			jsPlumb.connect({
				uuids: [link.from.nodeID + link.from.portID, link.to.nodeID + link.to.portID],
				endpointStyle: { fillStyle: "#77aca7", radius: 3 },
				hoverPaintStyle: { radius: 6 },
				paintStyle: { strokeStyle: "#77aca7", lineWidth: 2 },
			});
		}
	}

	sortPorts(ports: any) {
		var outPorts = [];
		var inPorts = [];
		for (let port of ports) {
			if (port.direction === 'out') {
				outPorts.push(port);
			} else {
				inPorts.push(port);
			}
		}
		return [outPorts, inPorts];
	}

	removeGraph(graph: any) {
		for (let node of graph.nodes) 
	    	jsPlumb.remove(node.id);
	}
}	
