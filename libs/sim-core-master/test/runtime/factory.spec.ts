import { Kind, EndPoint, EndPointCollection} from 'cryptographix-sim-core';
import { Network, Graph, Node } from 'cryptographix-sim-core';
import { ComponentFactory, ModuleLoader, Container, inject } from 'cryptographix-sim-core';

let gr1 = {
  nodes: {
    "n1": {
      component: "c1",
    },
  }
};

@inject()
class C {

  constructor( node: Node )
  {
    console.log( 'C1 got node: ' + node.id );
  }

  initialize( initialData: Kind ): EndPointCollection {
    console.log( 'C1 created with init data' + JSON.stringify( initialData ) );

    return {};
  }

  start() {
    console.log( 'C1 started ' );
  }

  stop() {
    console.log( 'C1 stopped' );
  }
}

/*    let loader: ModuleLoader = {
      loadModule: function( id: string ): Promise<any> {
        return Promise.resolve( C );
      }
    }*/

describe("A ComponentFactory", function() {
  describe("without a loader", function() {
    beforeEach( function() {
      // Factory with def. container and no loader
      this.factory = new ComponentFactory();

      // register a test Component
      this.factory.register( 'c1', C );
    } );

    it( 'can be used to *load* components', function(done) {
      let graph = new Graph( null, gr1 );
      let net = new Network( this.factory, graph );

      // 'load' the components and initialize them
      net.loadComponents()
        .then( ()=> {
          expect( graph.nodes.get('n1').context.instance ).toBeDefined();

          net.initialize();
        })
        .then( () => {
          done();
        });
    } );

  /*it( "loads and registers Components", function(done) {
    let graph = new Graph( null, gr1 );
    let net = new Network( this.factory, graph );

    net.loadComponents()
      .then( ()=> {
        expect( net.graph.nodes.get('n1').context ).toBeDefined();

        net.initialize();
      })
      .then( () => {
        done();
      })

  } );*/
  } );
} );
