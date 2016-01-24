import { EventHub } from '../event-hub/event-hub';
import { ComponentFactory } from '../runtime/component-factory';
import { RuntimeContext, RunState } from '../runtime/runtime-context';
import { EndPoint } from '../messaging/end-point';
import { Channel } from '../messaging/channel';

import { Graph } from './graph';
import { Node } from './node';
import { Link } from './link';
import { Port, PublicPort } from './port';

export class Network extends EventHub
{
  static EVENT_STATE_CHANGE = 'network:state-change';
  static EVENT_GRAPH_CHANGE = 'network:graph-change';

  private _graph: Graph;

  private _factory: ComponentFactory;

  constructor( factory: ComponentFactory, graph?: Graph )
  {
    super();

    this._factory = factory;
    this._graph = graph || new Graph( null, {} );

    let me = this;
    this._graph.subscribe( Graph.EVENT_ADD_NODE, ( data: { node: Node } )=> {
      let runState: RunState = me._graph.context.runState;

      if ( runState != RunState.NEWBORN )
      {
        let { node } = data;

        node.loadComponent( me._factory )
          .then( ()=> {
            if ( Network.inState( [ RunState.RUNNING, RunState.PAUSED, RunState.READY ], runState ) )
              Network.setRunState( node, RunState.READY );

            if ( Network.inState( [ RunState.RUNNING, RunState.PAUSED ], runState ) )
              Network.setRunState( node, runState );

            this.publish( Network.EVENT_GRAPH_CHANGE, { node: node } );
          })
      }
    } );
  }

  get graph(): Graph {
    return this._graph;
  }

  /**
  * Load all components
  */
  loadComponents(): Promise<void>
  {
    let me = this;

    this.publish( Network.EVENT_STATE_CHANGE, { state: RunState.LOADING } );

    return this._graph.loadComponent( this._factory ).then( ()=> {
      this.publish( Network.EVENT_STATE_CHANGE, { state: RunState.LOADED } );
    });
  }

  initialize() {
    this.setRunState( RunState.READY );
  }

  teardown() {
    this.setRunState( RunState.LOADED );
  }

  static inState( states: RunState[], runState: RunState ): boolean {
    return new Set<RunState>( states ).has( runState );
  }

  /**
  * Alter run-state of a Node - LOADED, READY, RUNNING or PAUSED.
  * Triggers Setup or Teardown if transitioning between READY and LOADED
  * Wireup a graph, creating Channel between linked Nodes
  * Acts recursively, wiring up any sub-graphs
  */
  private static setRunState( node: Node, runState: RunState )
  {
    let ctx = node.context;
    let currentState = ctx.runState;

    if ( node instanceof Graph )
    {
      // 1. Preprocess
      //    a. Handle teardown
      //    b. Propagate state change to subnets
      let nodes: Map<string, Node> = node.nodes;

      if ( ( runState == RunState.LOADED ) && ( currentState >= RunState.READY ) ) {
        // tearing down .. unlink graph first
        let links: Map<string, Link> = node.links;

        // unwire (deactivate and destroy ) Channels between linked nodes
        links.forEach( ( link ) =>
        {
          Network.unwireLink( link );
        } );
      }

      // Propagate state change to sub-nets first
      nodes.forEach( function( subNode )
      {
        Network.setRunState( subNode, runState );
      } );

      // 2. Change state ...
      ctx.setRunState( runState );

      // 3. Postprocess
      //    a. Handle setup
      if ( ( runState == RunState.READY ) && ( currentState >= RunState.LOADED ) ) {

        // setting up .. linkup graph first
        let links: Map<string, Link> = node.links;
        // treat graph recursively

        // 2. wireup (create and activate) a Channel between linked nodes
        links.forEach( ( link ) =>
        {
          Network.wireLink( link );
        } );
      }
    } else {
      // Change state ...
      ctx.setRunState( runState );
    }
  }

  /**
  * Unwire a link, removing the Channel between the linked Nodes
  */
  private static unwireLink( link: Link )
  {
    // get linked nodes (Link finds Nodes in parent Graph)
    let fromNode = link.fromNode;
    let toNode = link.toNode;

    let chan: Channel = link.disconnect();

    if ( chan )
      chan.deactivate();
  }

  /**
  * Wireup a link, creating Channel between the linked Nodes
  */
  private static wireLink( link: Link )
  {
    // get linked nodes (Link finds Nodes in parent Graph)
    let fromNode = link.fromNode;
    let toNode = link.toNode;

    //debugMessage( "Link("+link.id+"): " + link.from + " -> " + link.to + " proto="+link.protocol );

    let channel = new Channel();

    link.connect( channel );

    channel.activate();
  }

  protected setRunState( runState: RunState )
  {
    Network.setRunState( this._graph, runState );

    this.publish( Network.EVENT_STATE_CHANGE, { state: runState } );
  }

  start( initiallyPaused: boolean = false ) {
    this.setRunState( initiallyPaused ? RunState.PAUSED : RunState.RUNNING );
  }

  step() {
    // TODO: Single-step
  }

  stop() {
    this.setRunState( RunState.READY );
  }

  pause() {
    this.setRunState( RunState.PAUSED );
  }

  resume() {
    this.setRunState( RunState.RUNNING );
  }
}
