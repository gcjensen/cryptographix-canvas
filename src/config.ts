// class holding an example config file
export class Config {

	getJSON() {
		return {
			nodes: [
		    {
		      	id: "component_one", label: "One",
		      	view: { x: "100px", y: "200px", width: "100px", height: "100px" },
		        ports: [
		            { id: "portOut1", protocol: "apdu", direction: "out", view: { x: 30, y: 0 } },
		            { id: "portIn1", protocol: "iso8583", direction: "in", view: { x: 100, y: 50 } },
		        ],
		        nodeClass: 'Dummy'
		    },
		    {
		        id: "component_two", label: "Two",
		        view: { x: "450px", y: "400px", width: "100px", height: "100px" },
				ports: [
					{ id: "portOut1", protocol: "iso8583", direction: "out", view: { x: 0, y: 50 } },
					{ id: "portOut2", protocol: "iso8583", direction: "out", view: { x: 100, y: 50 } },
					{ id: "portIn1", protocol: "iso8583", direction: "in", view: { x: 100, y: 50 } }
				],
		        nodeClass: 'Dummy'
		    },
		    {
		        id: "component_three", label: "Three",
		        view: { x: "820px", y: "150px", width: "100px", height: "100px" },
		        ports: [
					{ id: "portOut1", protocol: "iso8583", direction: "out", view: { x: 0, y: 50 } },
					{ id: "portIn1", protocol: "iso8583", direction: "in", view: { x: 100, y: 50 } },
		        ],
		     	nodeClass: 'Dummy'
		   	},
		    {
			    id: "component_four", label: "Four",
			    view: { x: "1100px", y: "300px", width: "100px", height: "100px" },
				ports: [
					{ id: "portOut1", protocol: "iso8583", direction: "out", view: { x: 0, y: 50 } },
					{ id: "portIn1", protocol: "iso8583", direction: "in", view: { x: 100, y: 50 } }
				],
		     	nodeClass: 'Dummy'
		   	}
		   	],
		    links: [
				{
					id: 1,
					from: { nodeID: "component_one", portID: "portOut1" },
					to: { nodeID: "component_two", portID: "portIn1" }
				},
				{
					id: 2,
					from: { nodeID: "component_two", portID: "portOut2" },
					to: { nodeID: "component_three", portID: "portIn1" }
				},
				{
					id: 3,
					from: { nodeID: "component_three", portID: "portOut1" },
					to: { nodeID: "component_four", portID: "portIn1" }
				}
			]
		}
	}
}