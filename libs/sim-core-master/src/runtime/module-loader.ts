export interface ModuleLoader {
  hasModule?( id: string ): boolean;

  loadModule( id: string ): Promise<any>;
}

declare interface System {
  normalizeSync( id );
  import( id );
};
declare var System: System;

class ModuleRegistryEntry {
  constructor( address: string ) {

  }
}

export class SystemModuleLoader implements ModuleLoader {

  private moduleRegistry: Map<string, ModuleRegistryEntry>;

  constructor() {
    this.moduleRegistry = new Map<string, ModuleRegistryEntry>();
  }

  private getOrCreateModuleRegistryEntry(address: string): ModuleRegistryEntry {
    return this.moduleRegistry[address] || (this.moduleRegistry[address] = new ModuleRegistryEntry(address));
  }

  loadModule( id: string ): Promise<any> {
    let newId = System.normalizeSync(id);
    let existing = this.moduleRegistry[newId];

    if (existing) {
      return Promise.resolve(existing);
    }

    return System.import(newId).then(m => {
      this.moduleRegistry[newId] = m;
      return m; //ensureOriginOnExports(m, newId);
    });
  }

}
