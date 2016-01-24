import { EndPointCollection, Direction } from '../messaging/end-point';
import { Protocol } from '../messaging/protocol';

/**
* @class PortInfo
*
* Metadata about a component's Port
*/
export class PortInfo
{
  /**
  * Direction: IN, OUT, or INOUT
  *   for client-server, OUT=Client, IN=Server
  *   for socket
  */
  direction: Direction;

  /**
  * Protocol implemented by the port
  */
  protocol: Protocol<any>;

  /**
  * RFU - indexable ports
  */
  index: number = 0;

  /**
  * true is port must be connected for component to execute
  */
  required: boolean = false;
}
