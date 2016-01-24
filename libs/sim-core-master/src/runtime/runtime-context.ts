import { Kind } from '../kind/kind';
import { EndPointCollection } from '../messaging/end-point';
import { Node } from '../graph/node';
import { ComponentFactory} from './component-factory';
import { Component } from '../component/component';

import { Container, Injectable } from '../dependency-injection/container';

export enum RunState {
  NEWBORN,      // Not yet loaded
  LOADING,      // Waiting for async load to complete
  LOADED,       // Component loaded, not yet executable
  READY,        // Ready for Execution
  RUNNING,      // Network active, and running
  PAUSED        // Network temporarily paused
}

/**
* The runtime context information for a Component instance
*/
export class RuntimeContext
{
  /**
  * The component id / address
  */
  private _id: string;

  /**
  * The runtime component instance that this node represents
  */
  private _instance: Component;

  /**
  * Initial Data for the component instance
  */
  private _config: {};

  /**
  * The runtime component instance that this node represents
  */
  private _container: Container;

  /**
  * The component factory that created us
  */
  private _factory: ComponentFactory;

  /**
  *
  *
  */
  constructor( factory: ComponentFactory, container: Container, id: string, config: {}, deps: Injectable[] = [] ) {

    this._factory = factory;

    this._id = id;

    this._config = config;

    this._container = container;

    // Register any context dependencies
    for( let i in deps )
    {
      if ( !this._container.hasResolver( deps[i] ) )
        this._container.registerSingleton( deps[i], deps[i] );
    }
  }

  get instance(): Component {
    return this._instance;
  }

  get container(): Container {
    return this._container;
  }

  load( ): Promise<void>
  {
    let me = this;

    this._instance = null;

    return new Promise<void>( (resolve, reject) => {
      // get an instance from the factory
      me._runState = RunState.LOADING;
      this._factory.loadComponent( this, this._id )
        .then( (instance) => {
          // Component (and any dependencies) have been loaded
          me._instance = instance;
          me.setRunState( RunState.LOADED );

          resolve();
        })
        .catch( (err) => {
          // Unable to load
          me._runState = RunState.NEWBORN;

          reject( err );
        });
    } );
  }

  _runState: RunState = RunState.NEWBORN;
  get runState() {
    return this._runState;
  }

  private inState( states: RunState[] ): boolean {
    return new Set<RunState>( states ).has( this._runState );
  }

  /**
  * Transition component to new state
  * Standard transitions, and respective actions, are:
  *   LOADED -> READY      instantiate and initialize component
  *   READY -> LOADED      teardown and destroy component
  *
  *   READY -> RUNNING     start component execution
  *   RUNNING -> READY     stop component execution
  *
  *   RUNNING -> PAUSED    pause component execution
  *   PAUSED -> RUNNING    resume component execution
  *
  */
  setRunState( runState: RunState ) {
    let inst = this.instance;

    switch( runState ) // target state ..
    {
      case RunState.LOADED: // just loaded, or teardown
        if ( this.inState( [ RunState.READY, RunState.RUNNING, RunState.PAUSED ] ) ) {
          // teardown and destroy component
          if ( inst.teardown )
          {
            inst.teardown();

            // and destroy instance
            this._instance = null;
          }
        }
        break;

      case RunState.READY:  // initialize or stop node
        if ( this.inState( [ RunState.LOADED ] ) ) {
          // initialize component
          let endPoints: EndPointCollection = {};

          // TODO:
          if ( inst.initialize )
            endPoints = this.instance.initialize( <Kind>this._config );

          this.reconcilePorts( endPoints );
        }
        else if ( this.inState( [ RunState.RUNNING, RunState.PAUSED ] ) ) {
          // stop component
          if ( inst.stop )
            this.instance.stop();
        }
        else
          throw new Error( 'Component cannot be initialized, not loaded' );
        break;

      case RunState.RUNNING:  // start/resume node
        if ( this.inState( [ RunState.READY, RunState.RUNNING ] ) ) {
          // start component execution
          if ( inst.start )
            this.instance.start();
        }
        else if ( this.inState( [ RunState.PAUSED ] ) ) {
          // resume component execution after pause
          if ( inst.resume )
            this.instance.resume();
        }
        else
          throw new Error( 'Component cannot be started, not ready' );
        break;

      case RunState.PAUSED:  // pause node
        if ( this.inState( [ RunState.RUNNING] ) ) {
          if ( inst.pause )
            this.instance.pause();
        }
        else if ( this.inState( [ RunState.PAUSED ] ) ) {
          // already paused
        }
        else
          throw new Error( 'Component cannot be paused' );
        break;
    }

    this._runState = runState;
  }

  protected reconcilePorts( endPoints: EndPointCollection ) {
    //let ports = this.node.ports;
    //end
  }

  release() {
    // release instance, to avoid memory leaks
    this._instance = null;

    this._factory = null
  }
}
