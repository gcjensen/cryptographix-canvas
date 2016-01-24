import { ComponentFactory} from '../runtime/component-factory';
import { EventHub } from '../event-hub/event-hub';

import { Network } from './network';
import { Node } from './node';
import { Link } from './link';
import { Port, PublicPort } from './port';

/**
 * A Graph is a collection of Nodes interconnected via Links.
 * A Graph is itself a Node, whose Ports act as published EndPoints, to the Graph.
 */
export class Graph extends Node
{
  static EVENT_ADD_NODE = 'graph:add-node';
  static EVENT_UPD_NODE = 'graph:upd-node';
  static EVENT_DEL_NODE = 'graph:del-node';

  static EVENT_ADD_LINK = 'graph:add-link';
  static EVENT_UPD_LINK = 'graph:upd-link';
  static EVENT_DEL_LINK = 'graph:del-link';

  /**
  * Nodes in this graph. Each node may be:
  *   1. A Component
  *   2. A sub-graph
  */
  protected _nodes: Map<string, Node>;

  // Links in this graph. Each node may be:
  protected _links: Map<string, Link>;

  // Public Ports in this graph. Inherited from Node
  // private Ports;
  constructor( owner: Graph, attributes: any = {} )
  {
    super( owner, attributes );

    this.initFromObject( attributes );
  }

  initFromString( jsonString: string )
  {
    this.initFromObject( JSON.parse( jsonString ) );
  }

  initFromObject( attributes: any ) {

    this.id = attributes.id || "$graph";

    this._nodes = new Map<string, Node>();
    this._links = new Map<string, Link>();

    Object.keys( attributes.nodes || {} ).forEach( (id) => {
      this.addNode( id, attributes.nodes[ id ] );
    });

    Object.keys( attributes.links || {} ).forEach( (id) => {
      this.addLink( id, attributes.links[ id ] );
    });
  }

  toObject( opts: any ): Object
  {
    var graph = super.toObject();

    let nodes = graph[ "nodes" ] = {};
    this._nodes.forEach( ( node, id ) => {
//      if ( node != this )
        nodes[ id ] = node.toObject();
    });

    let links = graph[ "links" ] = {};
    this._links.forEach( ( link, id ) => {
      links[ id ] = link.toObject();
    });

    return graph;
  }

  loadComponent( factory: ComponentFactory ): Promise<void>
  {
    return new Promise<void>( (resolve, reject) => {
      let pendingCount = 0;

      let nodes = new Map<string, Node>( this._nodes );
      nodes.set( '$graph', this );

      nodes.forEach( ( node, id ) => {
        let done: Promise<void>;

        pendingCount++;

        if ( node == this ) {
          done = super.loadComponent( factory );
        }
        else {
          done = node.loadComponent( factory );
        }

        done.then( () => {
          --pendingCount;
          if ( pendingCount == 0 )
            resolve();
        })
        .catch( ( reason ) => {
          reject( reason );
        } );
      } );
    } );
  }

  public get nodes(): Map<string, Node>
  {
    return this._nodes;
  }

/*  public getAllNodes(): Node[]
  {
    let nodes: Node[] = [];

    this._nodes.forEach( ( node, id ) => {
      // Don't recurse on graph's pseudo-node
      if ( ( node != this ) && ( node instanceof Graph ) )
        nodes = nodes.concat( node.getAllNodes() );

      nodes.push( node );
    } );

    return nodes;
  }*/

  public get links(): Map<string, Link>
  {
    return this._links;
  }

/*  public getAllLinks(): Link[]
  {
    let links: Link[] = [];

    this._nodes.forEach( ( node, id ) => {
      if ( ( node != this ) && ( node instanceof Graph ) )
        links = links.concat( node.getAllLinks() );
    } )

    this._links.forEach( ( link, id ) => {
      links.push( link );
    } );

    return links;
  }*/

/*  public getAllPorts(): Port[]
  {
    let ports: Port[] = super.getPortArray();

    this._nodes.forEach( ( node, id ) => {
      if ( ( node != this ) && ( node instanceof Graph ) )
        ports = ports.concat( node.getAllPorts() );
      else
        ports = ports.concat( node.getPortArray() );
    } );

    return ports;
  }*/

  public getNodeByID( id: string ): Node
  {
    if ( id == '$graph' )
      return this;

    return this._nodes.get( id );
  }

  public addNode( id: string, attributes?: {} ): Node {

    let node = new Node( this, attributes );

    node.id = id;

    this._nodes.set( id, node );

    this.publish( Graph.EVENT_ADD_NODE, { node: node } );

    return node;
  }

  public renameNode( id: string, newID: string ) {

    let node = this._nodes.get( id );

    if ( id != newID )
    {
      let eventData = { node: node, attrs: { id: node.id } };

      this._nodes.delete( id );

      node.id = newID;

      this._nodes.set( newID, node );

      this.publish( Graph.EVENT_UPD_NODE, eventData );
    }
  }

  public removeNode( id: string ): boolean {

    let node = this._nodes.get( id );
    if ( node )
      this.publish( Graph.EVENT_DEL_NODE, { node: node } );

    return this._nodes.delete( id );
  }

  public getLinkByID( id: string ): Link {

    return this._links[ id ];
  }

  public addLink( id: string, attributes?: {} ): Link {

    let link = new Link( this, attributes );

    link.id = id;

    this._links.set( id, link );

    this.publish( Graph.EVENT_ADD_LINK, { link: link } );

    return link;
  }

  public renameLink( id: string, newID: string ) {

    let link = this._links.get( id );

    this._links.delete( id );

    let eventData = { link: link, attrs: { id: link.id } };

    link.id = newID;

    this.publish( Graph.EVENT_UPD_NODE, eventData );

    this._links.set( newID, link );
  }

  public removeLink( id: string ): boolean {

    let link = this._links.get( id );
    if ( link )
      this.publish( Graph.EVENT_DEL_LINK, { link: link } );

    return this._links.delete( id );
  }

  public addPublicPort( id: string, attributes: {} ): PublicPort
  {
    attributes["id"] = id;

    let port = new PublicPort( this, null, attributes );

    this._ports.set( id, port );

    return port;
  }
}
