import { Message } from './message';
import { Kind, KindInfo } from '../kind/kind';

export enum ProtocolTypeBits
{
  PACKET = 0,         /** Datagram-oriented (always connected...) */
  STREAM = 1,         /** Connection-oriented */

  ONEWAY = 0,         /** Unidirectional OUT (source) -> IN (sink) */
  CLIENTSERVER = 4,   /** Command OUT->IN, Response IN->OUT */
  PEER2PEER = 6,      /** Bidirectional: INOUT <-> INOUT */

  UNTYPED = 0,        /** Untyped data */
  TYPED = 8,          /** Typed data **/
}

export type ProtocolType = number;

export class Protocol<T>
{
  static protocolType: ProtocolType = 0;
}

/**
* A Client-Server Protocol, to be used between
*/
class ClientServerProtocol<T> extends Protocol<T>
{
  static protocolType: ProtocolType = ProtocolTypeBits.CLIENTSERVER | ProtocolTypeBits.TYPED;
}

class APDU implements Kind {
  kindInfo: KindInfo;
  properties;
}

class APDUMessage extends Message<APDU>
{
}

class APDUProtocol extends ClientServerProtocol<APDUMessage>
{

}
