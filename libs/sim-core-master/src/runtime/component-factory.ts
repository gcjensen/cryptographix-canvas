import { Component, ComponentConstructor } from '../component/component';
import { RuntimeContext } from './runtime-context';
import { ModuleLoader } from './module-loader';

import { Container, Injectable } from '../dependency-injection/container';
import { EndPointCollection } from '../messaging/end-point';

export class ComponentFactory {
  private _loader: ModuleLoader;
  private _container: Container;
  private _components: Map<string, ComponentConstructor>;

  constructor( container?: Container, loader?: ModuleLoader ) {
    this._loader = loader;
    this._container = container || new Container();
    this._components = new Map<string, ComponentConstructor>();

    this._components.set( undefined, Object );
    this._components.set( "", Object );
  }

  createContext( id: string, config: {}, deps: Injectable[] = [] ): RuntimeContext
  {
    let childContainer: Container = this._container.createChild();

    return new RuntimeContext( this, childContainer, id, config, deps );
  }

  getChildContainer(): Container {
    return ;
  }

  loadComponent( ctx: RuntimeContext, id: string ): Promise<Component>
  {
    let createComponent = function( ctor: ComponentConstructor ): Component
    {
      let newInstance: Component = ctx.container.invoke( ctor );

      return newInstance;
    }

    let me = this;

    return new Promise<Component>( (resolve, reject) => {
      // Check cache
      let ctor: ComponentConstructor = this.get( id );

      if ( ctor ) {
        // use cached constructor
        resolve( createComponent( ctor ) );
      }
      else if ( this._loader ) {
        // got a loaded, so try to load the module ...
        this._loader.loadModule( id )
          .then( ( ctor: ComponentConstructor ) => {

            // register loaded component
            me._components.set( id, ctor );

            // instantiate and resolve
            resolve( createComponent( ctor ) );
          })
          .catch( ( e ) => {
            reject( 'ComponentFactory: Unable to load component "' + id + '" - ' + e );
          } );
      }
      else {
        // oops. no loader .. no component
        reject( 'ComponentFactory: Component "' + id + '" not registered, and Loader not available' );
      }
    });
  }

  get( id: string ): ComponentConstructor {
    return this._components.get( id );
  }
  register( id: string, ctor: ComponentConstructor ) {
    this._components.set( id, ctor );
  }
}
