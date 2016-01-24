import { Kind, EndPoint, EndPointCollection} from 'cryptographix-sim-core';
import { Network, Graph, Node } from 'cryptographix-sim-core';
import { ComponentFactory, RuntimeContext, RunState, Component, Container, inject } from 'cryptographix-sim-core';

@inject()
class StateLogger implements Component {
  public state: string;

  constructor( )
  {
    this.state = "created";
  }

  initialize( initialData: Kind ): EndPointCollection {
    this.state = "initialized";
    return {};
  }

  teardown() {
    this.state = "finalized";
  }

  start() {
    this.state = "started";
  }

  stop() {
    this.state = "stopped";
  }

  pause() {
    this.state = "paused";
  }

  resume() {
    this.state = "resumed";
  }
}

/*    let loader: ModuleLoader = {
      loadModule: function( id: string ): Promise<any> {
        return Promise.resolve( C );
      }
    }*/

describe("A Runtime Context", function() {

  let gr1 = {
    nodes: {
      "n1": {
        component: "c1",
      },
    }
  };

  describe("acts as a proxy for the component", function() {
    let factory = new ComponentFactory();
    let graph = new Graph( null, gr1 );
    let net = new Network( factory, graph );

    // register a test Component
    factory.register( 'c1', StateLogger );

    it( 'controls the component lifecycle', function( done ) {
      let ctx: RuntimeContext;
      let comp: StateLogger;

      // load the components
      net.loadComponents()
        .then( ()=> {
          ctx = graph.nodes.get('n1').context;
          comp = <StateLogger>ctx.instance;

          expect( comp instanceof StateLogger ).toBe( true );
          expect( comp.state ).toEqual( 'created' );
          expect( ctx.runState ).toEqual( RunState.LOADED );
        })
        .then( ()=> {
          net.initialize();
          expect( ctx.runState ).toEqual( RunState.READY );
          expect( comp.state ).toEqual( 'initialized' );

          net.start();
          expect( ctx.runState ).toEqual( RunState.RUNNING );
          expect( comp.state ).toEqual( 'started' );

          net.pause();
          expect( ctx.runState ).toEqual( RunState.PAUSED );
          expect( comp.state ).toEqual( 'paused' );

          net.resume();
          expect( ctx.runState ).toEqual( RunState.RUNNING );
          expect( comp.state ).toEqual( 'resumed' );

          net.stop();
          expect( ctx.runState ).toEqual( RunState.READY );
          expect( comp.state ).toEqual( 'stopped' );

          net.teardown();
          expect( ctx.runState ).toEqual( RunState.LOADED );
          expect( comp.state ).toEqual( 'finalized' );

        })
        .then( () => {
          done();
        });
    } );
  } );

} );
