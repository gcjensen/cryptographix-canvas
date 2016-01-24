declare module 'cryptographix-sim-core'
{
  import { Container, autoinject as inject } from 'aurelia-dependency-injection';
  import { EventAggregator, Subscription } from 'aurelia-event-aggregator';

  export class HexCodec {
      private static hexDecodeMap;
      static decode(a: string): Uint8Array;
  }

  export class Base64Codec {
      static decode(b64: string): Uint8Array;
      static encode(uint8: Uint8Array): string;
  }

  export class ByteArray {
      static BYTES: number;
      static HEX: number;
      static BASE64: number;
      static UTF8: number;
      private byteArray;
      constructor(bytes?: ByteArray | Array<number> | String | ArrayBuffer | Uint8Array, format?: number, opt?: any);
      length: number;
      backingArray: Uint8Array;
      equals(value: ByteArray): boolean;
      byteAt(offset: number): number;
      wordAt(offset: number): number;
      littleEndianWordAt(offset: any): number;
      dwordAt(offset: number): number;
      setByteAt(offset: number, value: number): ByteArray;
      setBytesAt(offset: number, value: ByteArray): ByteArray;
      clone(): ByteArray;
      bytesAt(offset: number, count?: number): ByteArray;
      viewAt(offset: number, count?: number): ByteArray;
      addByte(value: number): ByteArray;
      setLength(len: number): ByteArray;
      concat(bytes: ByteArray): ByteArray;
      not(): ByteArray;
      and(value: ByteArray): ByteArray;
      or(value: ByteArray): ByteArray;
      xor(value: ByteArray): ByteArray;
      toString(format?: number, opt?: any): string;
  }


  export class Enum {
  }
  export type DataType = String | Number | Enum | ByteArray | Kind;
  export interface FieldInfo {
      id?: string;
      description: string;
      dataType: DataType;
      enumInfo?: Map<number, string>;
      minLength?: number;
      maxLength?: number;
  }
  export class KindInfo {
      name: string;
      description: string;
      fields: {
          [id: string]: FieldInfo;
      };
  }
  export class KindBuilder {
      private ctor;
      constructor(ctor: KindConstructor, description: string);
      private kindInfo;
      static init(ctor: KindConstructor, description: string): KindBuilder;
      field(name: string, description: string, dataType: DataType, opts?: any): KindBuilder;
  }
  export interface Kind {
  }
  export interface KindConstructor {
      new (...args: any[]): Kind;
      kindInfo?: KindInfo;
  }



  export interface MessageHeader {
      method?: string;
      id?: number;
      description?: string;
      isResponse?: boolean;
      origin?: EndPoint;
      kindName?: string;
  }
  export class Message<T> {
      private _header;
      private _payload;
      constructor(header: MessageHeader, payload: T);
      header: MessageHeader;
      payload: T;
  }
  export class KindMessage<K extends Kind> extends Message<K> {
  }

  export type Task = () => void;
  export type FlushFunc = () => void;
  export class TaskScheduler {
      static makeRequestFlushFromMutationObserver(flush: any): FlushFunc;
      static makeRequestFlushFromTimer(flush: any): FlushFunc;
      static BrowserMutationObserver: any;
      static hasSetImmediate: boolean;
      static taskQueueCapacity: number;
      taskQueue: Task[];
      requestFlushTaskQueue: FlushFunc;
      constructor();
      shutdown(): void;
      queueTask(task: any): void;
      flushTaskQueue(): void;
      onError(error: any, task: any): void;
  }



  export class Channel {
      private _active;
      private _endPoints;
      private _taskScheduler;
      constructor();
      shutdown(): void;
      active: boolean;
      activate(): void;
      deactivate(): void;
      addEndPoint(endPoint: EndPoint): void;
      removeEndPoint(endPoint: EndPoint): void;
      endPoints: EndPoint[];
      sendMessage(origin: EndPoint, message: Message<any>): void;
  }



  export enum Direction {
      IN = 1,
      OUT = 2,
      INOUT = 3,
  }
  export type HandleMessageDelegate = (message: Message<any>, receivingEndPoint?: EndPoint, receivingChannel?: Channel) => void;
  export class EndPoint {
      protected _id: string;
      protected _channels: Channel[];
      protected _messageListeners: HandleMessageDelegate[];
      private _direction;
      constructor(id: string, direction?: Direction);
      shutdown(): void;
      id: string;
      attach(channel: Channel): void;
      detach(channelToDetach: Channel): void;
      detachAll(): void;
      attached: boolean;
      direction: Direction;
      handleMessage(message: Message<any>, fromEndPoint: EndPoint, fromChannel: Channel): void;
      sendMessage(message: Message<any>): void;
      onMessage(messageListener: HandleMessageDelegate): void;
  }
  export type EndPointCollection = {
      [id: string]: EndPoint;
  };

  export enum ProtocolTypeBits {
      PACKET = 0,
      STREAM = 1,
      ONEWAY = 0,
      CLIENTSERVER = 4,
      PEER2PEER = 6,
      UNTYPED = 0,
      TYPED = 8,
  }
  export type ProtocolType = number;
  export class Protocol<T> {
      static protocolType: ProtocolType;
  }



  export class PortInfo {
      direction: Direction;
      protocol: Protocol<any>;
      index: number;
      required: boolean;
  }


  export class ComponentInfo {
      name: string;
      description: string;
      detailLink: string;
      category: string;
      author: string;
      ports: {
          [id: string]: PortInfo;
      };
      stores: {
          [id: string]: PortInfo;
      };
      constructor();
  }

  export class StoreInfo {
  }





  export class ComponentBuilder {
      private ctor;
      constructor(ctor: ComponentConstructor, description: string, category?: string);
      static init(ctor: ComponentConstructor, description: string, category?: string): ComponentBuilder;
      port(id: string, direction: Direction, opts?: {
          protocol?: Protocol<any>;
          index?: number;
          required?: boolean;
      }): ComponentBuilder;
      name(name: string): this;
  }
  export interface Component {
      initialize?(config: Kind): EndPointCollection;
      teardown?(): any;
      start?(): any;
      stop?(): any;
      pause?(): any;
      resume?(): any;
  }
  export interface ComponentConstructor {
      new (...args: any[]): Component;
      componentInfo?: ComponentInfo;
  }

  export class Key {
      protected id: string;
      protected cryptoKey: CryptoKey;
      constructor(id: string, key?: CryptoKey);
      type: string;
      algorithm: KeyAlgorithm;
      extractable: boolean;
      usages: string[];
      innerKey: CryptoKey;
  }


  export class PrivateKey extends Key {
  }


  export class PublicKey extends Key {
  }



  export class KeyPair {
      privateKey: PrivateKey;
      publicKey: PublicKey;
  }




  export class CryptographicService {
      protected crypto: SubtleCrypto;
      constructor();
      decrypt(algorithm: string | Algorithm, key: Key, data: ByteArray): Promise<ByteArray>;
      digest(algorithm: string | Algorithm, data: ByteArray): any;
      encrypt(algorithm: string | Algorithm, key: Key, data: ByteArray): Promise<ByteArray>;
      exportKey(format: string, key: Key): Promise<ByteArray>;
      generateKey(algorithm: string | Algorithm, extractable: boolean, keyUsages: string[]): Promise<Key | KeyPair>;
      importKey(format: string, keyData: ByteArray, algorithm: string | Algorithm, extractable: boolean, keyUsages: string[]): Promise<CryptoKey>;
      sign(algorithm: string | Algorithm, key: Key, data: ByteArray): Promise<ByteArray>;
      verify(algorithm: string | Algorithm, key: Key, signature: ByteArray, data: ByteArray): Promise<ByteArray>;
  }

  export { Container, inject };
  export interface Injectable {
      new (...args: any[]): Object;
  }

  export class EventHub {
      _eventAggregator: EventAggregator;
      constructor();
      publish(event: string, data?: any): void;
      subscribe(event: string, handler: Function): Subscription;
      subscribeOnce(event: string, handler: Function): Subscription;
  }





  export class Port {
      protected _owner: Node;
      protected _protocolID: string;
      protected _endPoint: EndPoint;
      metadata: any;
      constructor(owner: Node, endPoint: EndPoint, attributes?: any);
      endPoint: EndPoint;
      toObject(opts?: any): Object;
      owner: Node;
      protocolID: string;
      id: string;
      direction: Direction;
  }
  export class PublicPort extends Port {
      proxyEndPoint: EndPoint;
      proxyChannel: Channel;
      constructor(owner: Graph, endPoint: EndPoint, attributes: {});
      connectPrivate(channel: Channel): void;
      disconnectPrivate(): void;
      toObject(opts?: any): Object;
  }






  export class Node extends EventHub {
      protected _owner: Graph;
      protected _id: string;
      protected _component: string;
      protected _initialData: Object;
      protected _ports: Map<string, Port>;
      metadata: any;
      protected _context: RuntimeContext;
      constructor(owner: Graph, attributes?: any);
      toObject(opts?: any): Object;
      owner: Graph;
      id: string;
      protected addPlaceholderPort(id: string, attributes: {}): Port;
      ports: Map<string, Port>;
      getPortArray(): Port[];
      getPortByID(id: string): Port;
      identifyPort(id: string, protocolID?: string): Port;
      removePort(id: string): boolean;
      loadComponent(factory: ComponentFactory): Promise<void>;
      context: RuntimeContext;
      unloadComponent(): void;
  }





  export enum RunState {
      NEWBORN = 0,
      LOADING = 1,
      LOADED = 2,
      READY = 3,
      RUNNING = 4,
      PAUSED = 5,
  }
  export class RuntimeContext {
      private _id;
      private _instance;
      private _config;
      private _container;
      private _factory;
      constructor(factory: ComponentFactory, container: Container, id: string, config: {}, deps?: Injectable[]);
      instance: Component;
      container: Container;
      load(): Promise<void>;
      _runState: RunState;
      runState: RunState;
      private inState(states);
      setRunState(runState: RunState): void;
      protected reconcilePorts(endPoints: EndPointCollection): void;
      release(): void;
  }

  export interface ModuleLoader {
      hasModule?(id: string): boolean;
      loadModule(id: string): Promise<any>;
  }
  export class SystemModuleLoader implements ModuleLoader {
      private moduleRegistry;
      constructor();
      private getOrCreateModuleRegistryEntry(address);
      loadModule(id: string): Promise<any>;
  }





  export class ComponentFactory {
      private _loader;
      private _container;
      private _components;
      constructor(container?: Container, loader?: ModuleLoader);
      createContext(id: string, config: {}, deps?: Injectable[]): RuntimeContext;
      getChildContainer(): Container;
      loadComponent(ctx: RuntimeContext, id: string): Promise<Component>;
      get(id: string): ComponentConstructor;
      register(id: string, ctor: ComponentConstructor): void;
  }





  export type EndPointRef = {
      nodeID: string;
      portID: string;
  };
  export class Link {
      protected _owner: Graph;
      protected _id: string;
      protected _channel: Channel;
      protected _from: EndPointRef;
      protected _to: EndPointRef;
      protected _protocolID: string;
      protected metadata: any;
      constructor(owner: Graph, attributes?: any);
      toObject(opts?: any): Object;
      id: string;
      connect(channel: Channel): void;
      disconnect(): Channel;
      fromNode: Node;
      fromPort: Port;
      toNode: Node;
      toPort: Port;
      protocolID: string;
  }





  export class Network extends EventHub {
      static EVENT_STATE_CHANGE: string;
      static EVENT_GRAPH_CHANGE: string;
      private _graph;
      private _factory;
      constructor(factory: ComponentFactory, graph?: Graph);
      graph: Graph;
      loadComponents(): Promise<void>;
      initialize(): void;
      teardown(): void;
      static inState(states: RunState[], runState: RunState): boolean;
      private static setRunState(node, runState);
      private static unwireLink(link);
      private static wireLink(link);
      protected setRunState(runState: RunState): void;
      start(initiallyPaused?: boolean): void;
      step(): void;
      stop(): void;
      pause(): void;
      resume(): void;
  }





  export class Graph extends Node {
      static EVENT_ADD_NODE: string;
      static EVENT_UPD_NODE: string;
      static EVENT_DEL_NODE: string;
      static EVENT_ADD_LINK: string;
      static EVENT_UPD_LINK: string;
      static EVENT_DEL_LINK: string;
      protected _nodes: Map<string, Node>;
      protected _links: Map<string, Link>;
      constructor(owner: Graph, attributes?: any);
      initFromString(jsonString: string): void;
      initFromObject(attributes: any): void;
      toObject(opts: any): Object;
      loadComponent(factory: ComponentFactory): Promise<void>;
      nodes: Map<string, Node>;
      links: Map<string, Link>;
      getNodeByID(id: string): Node;
      addNode(id: string, attributes?: {}): Node;
      renameNode(id: string, newID: string): void;
      removeNode(id: string): boolean;
      getLinkByID(id: string): Link;
      addLink(id: string, attributes?: {}): Link;
      renameLink(id: string, newID: string): void;
      removeLink(id: string): boolean;
      addPublicPort(id: string, attributes: {}): PublicPort;
  }




  export class SimulationEngine {
      loader: ModuleLoader;
      container: Container;
      constructor(loader: ModuleLoader, container: Container);
      getComponentFactory(): ComponentFactory;
  }
}
