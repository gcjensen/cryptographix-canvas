// class holding an example config file
export class Config {

  getJSON() {
	return {
	  
	  nodes: {
		"node1": {
		  view: { x: "100px", y: "200px", width: "100px", height: "100px" },
		  ports: {
			"portOut1": { direction: "out" },
			"portIn1": { direction: "in" },
		  },
		},
		"node2": {
		  view: { x: "450px", y: "400px", width: "100px", height: "100px" },
		  ports: {
			"portOut1": { direction: "out" },
			"portIn1": { direction: "in" },
		  },
		},
		"node3": {
		  view: { x: "820px", y: "150px", width: "100px", height: "100px" },
		  ports: {
			"portOut1": { direction: "out" },
			"portIn1": { direction: "in" },
		  },
		},
		"node4": {
		  view: { x: "1100px", y: "300px", width: "100px", height: "100px" },
		  ports: {
			"portOut1": { direction: "out" },
			"portIn1": { direction: "in" },
	      },
		},	
	  },	

      links: {
		"link1": {
   		  from: { nodeID: "node1", portID: "portOut1" },
		  to: { nodeID: "node2", portID: "portIn1" }
		},
		"link2": {
		  from: { nodeID: "node2", portID: "portOut1" },
		  to: { nodeID: "node3", portID: "portIn1" }
		},
		"link3": {				
		  from: { nodeID: "node3", portID: "portOut1" },
		  to: { nodeID: "node4", portID: "portIn1" }
		}
	  }

	}

  }
}