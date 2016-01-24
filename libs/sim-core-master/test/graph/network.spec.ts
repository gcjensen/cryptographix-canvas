import { Graph, Node, Port, Direction } from 'cryptographix-sim-core';
import { Kind, EndPoint, EndPointCollection} from 'cryptographix-sim-core';
import { Network } from 'cryptographix-sim-core';
import { ComponentFactory, RuntimeContext, RunState, Component, Container, inject } from 'cryptographix-sim-core';

describe("A Network", function() {
  beforeEach( function() {
    // Factory with def. container and no loader
    this.factory = new ComponentFactory();
//    this.factory.register( 'c1', C );
  } );

  it( 'can be instantiated with an empty Graph', function( done ) {
    let net = new Network( this.factory, new Graph( null ) );

    expect( net.graph.nodes.size ).toEqual( 0 );

    // load 'null' component
    net.loadComponents()
      .then( ()=> {
        done();
      } );
  });

  describe("when it has an empty graph", function() {
    let factory = new ComponentFactory();
    let net = new Network( factory, new Graph( null, {} ) );

    beforeAll( function( done ) {

      // load the components
      net.loadComponents()
        .then( ()=> {
          done();
        } );
    });

    it( 'can be initialized (prepared for running)', function() {
      net.initialize();

      expect( net.graph.context.runState ).toEqual( RunState.READY );
    });

    it( 'can be started, paused, resumed and stopped', function() {
      net.start();
      expect( net.graph.context.runState ).toEqual( RunState.RUNNING );

      net.pause();
      expect( net.graph.context.runState ).toEqual( RunState.PAUSED );

      net.resume();
      expect( net.graph.context.runState ).toEqual( RunState.RUNNING );

      net.stop();
      expect( net.graph.context.runState ).toEqual( RunState.READY );
    });

    it( 'detects addition of new nodes', (done)=> {
      net.subscribeOnce( Network.EVENT_STATE_CHANGE, ()=> {
        expect( net.graph.context.runState ).toEqual( RunState.RUNNING );
        console.log( 'state changed' );

        let node;

        // GRAPH_CHANGE event should be emitted
        // and the new/modified node should be send as parameter to event
        net.subscribeOnce( Network.EVENT_GRAPH_CHANGE, ( data: { node: Node } )=> {
          expect( node ).toEqual( data.node );
          expect( node.context.runState ).toEqual( RunState.RUNNING );

          console.log( 'node added' );
          done();
        });

        node = net.graph.addNode( 'n1', {} );
      })

      net.start();
    });
    //

    it( 'can be finalized', function() {
      net.teardown();
      expect( net.graph.context.runState ).toEqual( RunState.LOADED );
    });
  });

  describe('can control execution state', function() {
    this.factory = new ComponentFactory();
    let net = new Network( this.factory, new Graph( null, {} ) );

    beforeAll( function( done ) {
      // load the components
      net.loadComponents()
        .then( ()=> {
          done();
        } );
    });

    //  it( 'controls the component lifecycle', function( done ) {

  });
});
