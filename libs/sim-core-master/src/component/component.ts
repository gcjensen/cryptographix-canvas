import { PortInfo } from './port-info';
import { StoreInfo } from './store-info';
import { ComponentInfo } from './component-info';
import { EndPointCollection, Direction } from '../messaging/end-point';
import { Protocol } from '../messaging/protocol';
import { Kind } from '../kind/kind';

/**
* Builder for 'Component' metadata (static componentInfo)
*/
export class ComponentBuilder
{
  private ctor: ComponentConstructor;

  constructor( ctor: ComponentConstructor, description: string, category?: string ) {

    this.ctor = ctor;

    ctor.componentInfo = {
      name: ctor.name,
      description: description,
      detailLink: '',
      category: category,
      author: '',
      ports: {},
      stores: {}
    };
  }

  public static init( ctor: ComponentConstructor, description: string, category?: string ): ComponentBuilder
  {
    let builder = new ComponentBuilder( ctor, description, category );

    return builder;
  }

  public port( id: string, direction: Direction, opts?: { protocol?: Protocol<any>; index?: number; required?: boolean } ): ComponentBuilder
  {
    opts = opts || {};

    this.ctor.componentInfo.ports[ id ] = {
      direction: direction,
      protocol: opts.protocol,
      index: opts.index,
      required: opts.required
    };

    return this;
  }

  public name( name: string ) {
    this.ctor.componentInfo.name = name;
    return this;
  }

}

/**
* Components are runtime objects that execute within a Graph.
* A graph Node is a placeholder for the actual Component what
* will execute.
* This interface defines the standard methods and properties that a Component
* can optionally implement.
*/
export interface Component
{
  initialize?( config: Kind ): EndPointCollection;
  teardown?();

  start?();
  stop?();

  pause?();
  resume?();
}

export interface ComponentConstructor
{
  new ( ...args ): Component;

  componentInfo?: ComponentInfo;
}

/**
* Example usage ....
*/
class C implements Component {

}

ComponentBuilder.init( C, 'Test Component' )
                .port( 'p1', Direction.IN )
                ;
