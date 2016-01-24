import { EndPointCollection, Direction } from '../messaging/end-point';
import { Protocol } from '../messaging/protocol';

import { PortInfo } from './port-info';

/**
* @class ComponentInfo
*
* Metadata about a Component
*/
export class ComponentInfo
{
  /**
  * Component Name
  */
  name: string;

  /**
  * Brief description for the component, to appear in 'hint'
  */
  description: string;

  /**
  * Link to detailed information for the component
  */
  detailLink: string = '';

  /**
  * Category name for the component, groups same categories together
  */
  category: string = '';

  /**
  * Author's name
  */
  author: string = '';

  /**
  * Array of Port descriptors. When active, the component will communicate
  * through corresponding EndPoints
  */
  ports: { [id: string]: PortInfo } = {};
  stores: { [id: string]: PortInfo } = {};

  constructor()
  {
  }
}
