import { EndPoint } from '../messaging/end-point';
import { Channel } from '../messaging/channel';

import { Graph } from './graph';
import { Node } from './node';
import { Port } from './port';

export type EndPointRef = { nodeID: string, portID: string };

export class Link
{
  protected _owner: Graph;
  protected _id: string;

  protected _channel: Channel;
  protected _from: EndPointRef;
  protected _to: EndPointRef;

  protected _protocolID: string;
  protected metadata: any;

  constructor( owner: Graph, attributes: any = {} )
  {
    this._owner = owner;
    this._id = attributes.id || "";
    //this._channel = null;
    this._from = attributes[ 'from' ];
    this._to = attributes[ 'to' ];
    this._protocolID = attributes[ 'protocol' ] || 'any';

    this.metadata = attributes.metadata || { x: 100, y: 100 };
  }

  toObject( opts?: any ): Object
  {
    let link = {
      id: this._id,
      protocol: ( this._protocolID != 'any' ) ? this._protocolID : undefined,
      metadata: this.metadata,
      from: this._from,
      to: this._to
    };

    return link;
  }

  set id( id: string )
  {
    this._id = id;
  }

  connect( channel: Channel )
  {
    // identify fromPort in fromNode
    let fromPort: Port = this.fromNode.identifyPort( this._from.portID, this._protocolID );

    // identify toPort in toNode
    let toPort: Port = this.toNode.identifyPort( this._to.portID, this._protocolID );

    this._channel = channel;

    fromPort.endPoint.attach( channel );
    toPort.endPoint.attach( channel );
  }

  disconnect(): Channel
  {
    let chan = this._channel;

    if ( chan )
    {
      this._channel.endPoints.forEach( ( endPoint ) => {
        endPoint.detach( this._channel );
      } );

      this._channel = undefined;
    }

    return chan;
  }

  get fromNode(): Node
  {
    return this._owner.getNodeByID( this._from.nodeID );
  }

  get fromPort(): Port
  {
    let node = this.fromNode;

    return (node) ? node.identifyPort( this._from.portID, this._protocolID ) : undefined;
  }

  set fromPort( port: Port )
  {
    this._from = {
      nodeID: port.owner.id,
      portID: port.id
    };

    this._protocolID = port.protocolID;
  }

  get toNode(): Node
  {
    return this._owner.getNodeByID( this._to.nodeID );
  }

  get toPort(): Port
  {
    let node = this.toNode;

    return (node) ? node.identifyPort( this._to.portID, this._protocolID ) : undefined;
  }

  set toPort( port: Port )
  {
    this._to = {
      nodeID: port.owner.id,
      portID: port.id
    };

    this._protocolID = port.protocolID;
  }

  get protocolID(): string
  {
    return this._protocolID;
  }
}
