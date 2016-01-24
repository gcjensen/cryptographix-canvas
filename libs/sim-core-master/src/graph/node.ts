import { RuntimeContext } from '../runtime/runtime-context';
import { ComponentFactory} from '../runtime/component-factory';
import { EventHub } from '../event-hub/event-hub';

import { Graph } from './graph';
import { Port } from './port';

export class Node extends EventHub
{
  protected _owner: Graph;
  protected _id: string;

  protected _component: string;
  protected _initialData: Object;

  protected _ports: Map<string, Port>;

  public metadata: any;

  /**
   * Runtime and component instance that this node represents
   */
  protected _context: RuntimeContext;

  constructor( owner: Graph, attributes: any = {} )
  {
    super();

    this._owner = owner;
    this._id = attributes.id || '';
    this._component = attributes.component;
    this._initialData = attributes.initialData || {};

    this._ports = new Map<string, Port>();

    this.metadata = attributes.metadata || { };

    // Initially create 'placeholder' ports. Once component has been
    // loaded and instantiated, they will be connected connected to
    // the component's communication end-points
    Object.keys( attributes.ports || {} ).forEach( (id) => {
      this.addPlaceholderPort( id, attributes.ports[ id ] );
    } );
  }

  /**
   * Return POJO for serialization
   */
  toObject( opts?: any ): Object
  {
    var node = {
      id: this.id,
      component: this._component,
      initialData: this._initialData,
      ports: {},
      metadata: this.metadata
    };

    this._ports.forEach( ( port, id ) => {
      node.ports[ id ] = port.toObject();
    } );

    return node;
  }

  /**
   * Get the Node's owner
   */
  public get owner(): Graph {
    return this._owner
  }

  /**
   * Get the Node's id
   */
  get id(): string
  {
    return this._id;
  }
  /**
   * Set the Node's id
   * @param id - new identifier
   */
  set id( id: string )
  {
    this._id = id;
  }

  /**
   * Add a placeholder Port
   */
  protected addPlaceholderPort( id: string, attributes: {} ): Port
  {
    attributes["id"] = id;

    let port = new Port( this, null, attributes );

    this._ports.set( id, port );

    return port;
  }

  /**
   * Return ports as an array of Ports
   *
   * @return Port[]
   */
  get ports(): Map<string, Port>
  {
    return this._ports;
  }

  getPortArray(): Port[] {
    let xports: Port[] = [];

    this._ports.forEach( ( port, id ) => {
      xports.push( port );
    } );

    return xports;
  }

  /**
   * Lookup a Port by it's ID
   * @param id - port identifier
   *
   * @return Port or undefined
   */
  getPortByID( id: string ): Port
  {
    return this._ports.get( id );
  }

  identifyPort( id: string, protocolID?: string ): Port
  {
    var port: Port;

    if ( id )
      port = this._ports.get( id );
    else if ( protocolID )
    {
      this._ports.forEach( ( p, id ) => {
        if ( p.protocolID == protocolID )
          port = p;
      }, this );
    }

    return port;
  }

  /**
   * Remove a Port from this Node
   * @param id - identifier of Port to be removed
   * @return true - port removed
   *         false - port inexistent
   */
  removePort( id: string ): boolean
  {
    return this._ports.delete( id );
  }

  loadComponent( factory: ComponentFactory ): Promise<void> {
    this.unloadComponent();

    // Get a ComponentContext responsable for Component's life-cycle control
    let ctx = this._context = factory.createContext( this._component, this._initialData );

    // Make Node visible to instance
    ctx.container.registerInstance( Node, this );

    let me = this;

    // Load component
    return ctx.load();
  }

  public get context(): RuntimeContext {
    return this._context;
  }

  unloadComponent()
  {
    if ( this._context )
    {
      this._context.release();

      this._context = null;
    }
  }

}
