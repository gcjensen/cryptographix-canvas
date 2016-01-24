import { ModuleLoader } from './module-loader';
import { ComponentFactory } from './component-factory';

import { Container } from '../dependency-injection/container';


export class SimulationEngine
{
  loader: ModuleLoader;
  container: Container;

  /**
  * Creates an instance of SimulationEngine.
  * @param loader The module loader.
  * @param container The root DI container for the simulation.
  */
  constructor( loader: ModuleLoader, container: Container ) {
    this.loader = loader;
    this.container = container;
  }


  /**
  * Return a ComponentFactory facade
  */
  getComponentFactory(): ComponentFactory {
    return new ComponentFactory( this.container, this.loader );
  }

}
