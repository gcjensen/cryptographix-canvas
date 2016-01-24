import { EndPoint, Direction } from '../messaging/end-point';
import { Channel } from '../messaging/channel';

import { Graph } from './graph';
import { Node } from './node';

/**
* A Port is a placeholder for an EndPoint published by the underlying
* component of a Node.
*/
export class Port
{
  protected _owner: Node;
  protected _protocolID: string;

  protected _endPoint: EndPoint;

  public metadata: any;

  constructor( owner: Node, endPoint: EndPoint, attributes: any = {} )
  {
    // Was an EndPoint supplied?
    if ( !endPoint )
    {
      let direction = attributes.direction || Direction.INOUT;

      if ( typeof attributes.direction == "string" )
        direction = Direction[ direction.toUpperCase() ];

      // Create a "dummy" endPoint with correct id + direction
      endPoint = new EndPoint( attributes.id, direction );
    }

    this._owner = owner;
    this._endPoint = endPoint;

    this._protocolID = attributes[ 'protocol' ] || 'any';

    this.metadata = attributes.metadata || { x: 100, y: 100 };
  }

  public get endPoint() {
    return this._endPoint;
  }
  public set endPoint( endPoint: EndPoint ) {
    this._endPoint = endPoint;
  }

  /**
   * Return POJO for serialization
   */
  toObject( opts?: any ): Object
  {
    var port = {
      id: this._endPoint.id,
      direction: this._endPoint.direction,
      protocol: ( this._protocolID != 'any' ) ? this._protocolID : undefined,
      metadata: this.metadata,
    };

    return port;
  }

  /**
   * Get the Port's owner
   */
  get owner(): Node {
    return this._owner
  }

  /**
   * Get the Port's protocol ID
   */
  get protocolID(): string
  {
    return this._protocolID;
  }

  /**
   * Get the Port's EndPoint ID
   */
  get id(): string
  {
    return this._endPoint.id;
  }

  /**
   * Get the Port's EndPoint Direction
   */
  get direction(): Direction
  {
    return this._endPoint.direction;
  }

}

export class PublicPort extends Port
{
  proxyEndPoint: EndPoint;
  proxyChannel: Channel;

  constructor( owner: Graph, endPoint: EndPoint, attributes: {} )
  {
    super( owner, endPoint, attributes );

    let proxyDirection =
      ( this._endPoint.direction == Direction.IN )
        ? Direction.OUT
        : ( this._endPoint.direction == Direction.OUT )
          ? Direction.IN
          : Direction.INOUT;

    // Create an EndPoint to proxy between the Public and Private (internal)
    // sides of the Port.
    this.proxyEndPoint = new EndPoint( this._endPoint.id, proxyDirection );

    // Wire-up proxy -

    // Forward incoming packets (from public interface) to private
    this.proxyEndPoint.onMessage( ( message ) => {
      this._endPoint.handleMessage( message, this.proxyEndPoint, this.proxyChannel );
    });

    // Forward outgoing packets (from private interface) to public
    this._endPoint.onMessage( ( message ) => {
      this.proxyEndPoint.sendMessage( message );
    });

    // not yet connected
    this.proxyChannel = null;
  }

  // Connect to Private (internal) EndPoint. To be called during graph
  // wireUp phase
  public connectPrivate( channel: Channel )
  {
    this.proxyChannel = channel;

    this.proxyEndPoint.attach( channel );
  }

  public disconnectPrivate()
  {
    this.proxyEndPoint.detach( this.proxyChannel );
  }

  toObject( opts?: any ): Object
  {
    var port = super.toObject( opts );

    return port;
  }
}
