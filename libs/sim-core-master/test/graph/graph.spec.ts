import { Graph, Node, Port, Direction } from 'cryptographix-sim-core';

let jsonGraph1 = {
  id: "Graph1",
  component: "g",

  ports: {
    "pxa": { direction: "inout", type: "PublicPort" },
    "pxb": {},
  },

  nodes: {
    "n1": {
      component: "a",
      ports: {
        "p1a": { direction: "out", },
        "p1b": { direction: "inout", },
        "p1x": { direction: "inout", },
      },
    },
    "n2": {
      component: "b",
      ports: {
        "p2a": { direction: "in", },
        "p2b": { direction: "inout", },
      },
    },

  },

  links: {
    "lx": {
      from: { nodeID: "gr", portID: "pxa" },
      to: { nodeID: "n1", portID: "p1x" },
      protocolID: "data"
    },
    "l1": {
      from: { nodeID: "n1", portID: "p1a" },
      to: { nodeID: "n2", portID: "p2a" },
      protocolID: "data"
    },
    "l2": {
      from: { nodeID: "n1", portID: "p1b" },
      to: { nodeID: "n2", portID: "p2b" },
      protocolID: "data"
    },
  },
};

describe("A Graph", ()=> {
  it( "can be instantiated from a JSON object", ()=> {
    let graph1: Graph = new Graph( null, jsonGraph1 );

    expect( graph1 instanceof Node ).toBe( true );
    expect( graph1 instanceof Graph ).toBe( true );

    let n1: Node = graph1.getNodeByID( "n1" );
    expect( n1 instanceof Node ).toBe( true );

    let p1x = n1.getPortByID( "p1x" );
    expect( p1x instanceof Port ).toBe( true );
    expect( p1x.id ).toEqual( "p1x" );

    let p2a = graph1.getNodeByID( "n2" ).getPortByID( "p2a" );
    expect( p2a instanceof Port ).toBe( true );
    expect( p2a.id ).toEqual( "p2a" );

    expect( p1x.direction ).toEqual( Direction.INOUT );
    expect( p2a.direction ).toEqual( Direction.IN );

  } );
} );
