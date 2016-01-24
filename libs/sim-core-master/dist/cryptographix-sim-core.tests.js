  import { Container, inject, ByteArray, Graph, Node, Port, Direction, Network, ComponentFactory, RunState, Channel, EndPoint, Message } from 'cryptographix-sim-core';

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
class C1 {
}
let C2 = class {
    constructor(c1) {
        this.c1 = c1;
    }
};
C2 = __decorate([
    inject(), 
    __metadata('design:paramtypes', [C1])
], C2);
describe("A DI Container", function () {
    it("injects into the class constructor", () => {
        let jector = new Container();
        let c2 = jector.invoke(C2);
        expect(c2.c1 instanceof C1).toBe(true);
    });
});

describe('A ByteArray', () => {
    it('stores a sequence of bytes', function () {
        let bs = new ByteArray([0, 1, 2, 3, 4]);
        expect(bs.toString()).toBe("0001020304");
    });
    it('can be instanciated from an array of bytes', function () {
        let bs = new ByteArray([0, 1, 2, 3, 4]);
        expect(bs.toString()).toBe("0001020304");
        var bytes = [];
        for (let i = 0; i < 10000; ++i)
            bytes[i] = i & 0xff;
        bs = new ByteArray(bytes);
        expect(bs.length).toBe(10000);
    });
    it('can be compared (equal)', function () {
        let bs1 = new ByteArray([0, 1, 2, 3, 4]);
        let bs2 = new ByteArray("00 01 02 03 04", ByteArray.HEX);
        let bs3 = bs1.clone().setByteAt(1, 0x99);
        //    console.log( bs1.equals( bs1 ) + ':' + bs1.toString() );
        expect(bs1.equals(bs1)).toBe(true);
        //    console.log( bs1.equals( bs2 )  + ':' + bs2.toString() );
        expect(bs1.equals(bs2)).toBe(true);
        expect(bs1.equals(bs3)).not.toBe(true);
    });
});

let jsonGraph1 = {
    id: "Graph1",
    component: "g",
    ports: {
        "pxa": { direction: "inout", type: "PublicPort" },
        "pxb": {},
    },
    nodes: {
        "n1": {
            component: "a",
            ports: {
                "p1a": { direction: "out", },
                "p1b": { direction: "inout", },
                "p1x": { direction: "inout", },
            },
        },
        "n2": {
            component: "b",
            ports: {
                "p2a": { direction: "in", },
                "p2b": { direction: "inout", },
            },
        },
    },
    links: {
        "lx": {
            from: { nodeID: "gr", portID: "pxa" },
            to: { nodeID: "n1", portID: "p1x" },
            protocolID: "data"
        },
        "l1": {
            from: { nodeID: "n1", portID: "p1a" },
            to: { nodeID: "n2", portID: "p2a" },
            protocolID: "data"
        },
        "l2": {
            from: { nodeID: "n1", portID: "p1b" },
            to: { nodeID: "n2", portID: "p2b" },
            protocolID: "data"
        },
    },
};
describe("A Graph", () => {
    it("can be instantiated from a JSON object", () => {
        let graph1 = new Graph(null, jsonGraph1);
        expect(graph1 instanceof Node).toBe(true);
        expect(graph1 instanceof Graph).toBe(true);
        let n1 = graph1.getNodeByID("n1");
        expect(n1 instanceof Node).toBe(true);
        let p1x = n1.getPortByID("p1x");
        expect(p1x instanceof Port).toBe(true);
        expect(p1x.id).toEqual("p1x");
        let p2a = graph1.getNodeByID("n2").getPortByID("p2a");
        expect(p2a instanceof Port).toBe(true);
        expect(p2a.id).toEqual("p2a");
        expect(p1x.direction).toEqual(Direction.INOUT);
        expect(p2a.direction).toEqual(Direction.IN);
    });
});

describe("A Network", function () {
    beforeEach(function () {
        // Factory with def. container and no loader
        this.factory = new ComponentFactory();
        //    this.factory.register( 'c1', C );
    });
    it('can be instantiated with an empty Graph', function (done) {
        let net = new Network(this.factory, new Graph(null));
        expect(net.graph.nodes.size).toEqual(0);
        // load 'null' component
        net.loadComponents()
            .then(() => {
            done();
        });
    });
    describe("when it has an empty graph", function () {
        let factory = new ComponentFactory();
        let net = new Network(factory, new Graph(null, {}));
        beforeAll(function (done) {
            // load the components
            net.loadComponents()
                .then(() => {
                done();
            });
        });
        it('can be initialized (prepared for running)', function () {
            net.initialize();
            expect(net.graph.context.runState).toEqual(RunState.READY);
        });
        it('can be started, paused, resumed and stopped', function () {
            net.start();
            expect(net.graph.context.runState).toEqual(RunState.RUNNING);
            net.pause();
            expect(net.graph.context.runState).toEqual(RunState.PAUSED);
            net.resume();
            expect(net.graph.context.runState).toEqual(RunState.RUNNING);
            net.stop();
            expect(net.graph.context.runState).toEqual(RunState.READY);
        });
        it('detects addition of new nodes', (done) => {
            net.subscribeOnce(Network.EVENT_STATE_CHANGE, () => {
                expect(net.graph.context.runState).toEqual(RunState.RUNNING);
                console.log('state changed');
                let node;
                // GRAPH_CHANGE event should be emitted
                // and the new/modified node should be send as parameter to event
                net.subscribeOnce(Network.EVENT_GRAPH_CHANGE, (data) => {
                    expect(node).toEqual(data.node);
                    expect(node.context.runState).toEqual(RunState.RUNNING);
                    console.log('node added');
                    done();
                });
                node = net.graph.addNode('n1', {});
            });
            net.start();
        });
        //
        it('can be finalized', function () {
            net.teardown();
            expect(net.graph.context.runState).toEqual(RunState.LOADED);
        });
    });
    describe('can control execution state', function () {
        this.factory = new ComponentFactory();
        let net = new Network(this.factory, new Graph(null, {}));
        beforeAll(function (done) {
            // load the components
            net.loadComponents()
                .then(() => {
                done();
            });
        });
        //  it( 'controls the component lifecycle', function( done ) {
    });
});

describe("A Node", function () {
    beforeEach(function () {
        this.graph1 = new Graph(null, {});
        this.node1 = new Node(this.graph1, {
            id: 'node1',
        });
        this.node2 = new Node(this.graph1, {
            id: 'node2',
            component: 'component2',
            ports: {
                "n2p1": {},
                "n2p2": {},
            }
        });
    });
    describe("has a constructor that", function () {
        it("sets the Node's owner", function () {
            expect(this.node1.owner).toEqual(this.graph1);
        });
        it("sets the Node's id", function () {
            expect(this.node1.id).toEqual('node1');
        });
        it("creates the Node's ports collection", function () {
            expect(this.node1.getPortArray().length).toBe(0);
            expect(this.node2.getPortArray().length).toBe(2);
        });
        it("sets the Node's component", function () {
            expect(this.node1.toObject().component).toBeUndefined();
            expect(this.node2.toObject().component).toEqual('component2');
        });
    });
    describe('has a Ports collection', function () {
        it('that can be retrieved as an array', function () {
            let p1 = this.node2.getPortArray()[0];
            let p2 = this.node2.getPortArray()[1];
            expect(p1 instanceof Port).toBe(true);
            expect(p1.id).toEqual('n2p1');
            expect(p2.id).toEqual('n2p2');
        });
        it('that can be searched by port-id', function () {
            let p1 = this.node2.getPortByID('n2p1');
            let p2 = this.node2.getPortByID('n2p2');
            let p3 = this.node2.getPortByID('inexistent');
            expect(p1 instanceof Port).toBe(true);
            expect(p1.id).toEqual('n2p1');
            expect(p2.id).toEqual('n2p2');
            expect(p3).toBeUndefined();
        });
        /*    it( 'can have new Ports added', function() {
              let p1 = this.node1.addPort( 'n1p1', {} );
        
              expect( p1 instanceof Port ).toBe( true );
              expect( p1.id ).toEqual( 'n1p1' );
        
              let p1x = this.node1.getPortByID( 'n1p1' );
              expect( p1x ).toEqual( p1 );
            });
        
            it( 'can have ports removed', function() {
              let p1 = this.node2.getPortByID('n2p1');
        
              expect( p1.id ).toEqual( 'n2p1' );
              let res1 = this.node2.removePort( 'n2p1' );
              expect( res1 ).toBe( true );
        
              let p1x = this.node2.getPortByID('n2p1');
              expect( p1x ).toBeUndefined();
        
              expect( this.node2.getPorts().length ).toEqual( 1 );
        
              let res2 = this.node2.removePort( 'n2p1' );
              expect( res2 ).toBe( false );
            });*/
    });
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
let gr1 = {
    nodes: {
        "n1": {
            component: "c1",
        },
    }
};
let C = class {
    constructor(node) {
        console.log('C1 got node: ' + node.id);
    }
    initialize(initialData) {
        console.log('C1 created with init data' + JSON.stringify(initialData));
        return {};
    }
    start() {
        console.log('C1 started ');
    }
    stop() {
        console.log('C1 stopped');
    }
};
C = __decorate([
    inject(), 
    __metadata('design:paramtypes', [Node])
], C);
/*    let loader: ModuleLoader = {
      loadModule: function( id: string ): Promise<any> {
        return Promise.resolve( C );
      }
    }*/
describe("A ComponentFactory", function () {
    describe("without a loader", function () {
        beforeEach(function () {
            // Factory with def. container and no loader
            this.factory = new ComponentFactory();
            // register a test Component
            this.factory.register('c1', C);
        });
        it('can be used to *load* components', function (done) {
            let graph = new Graph(null, gr1);
            let net = new Network(this.factory, graph);
            // 'load' the components and initialize them
            net.loadComponents()
                .then(() => {
                expect(graph.nodes.get('n1').context.instance).toBeDefined();
                net.initialize();
            })
                .then(() => {
                done();
            });
        });
        /*it( "loads and registers Components", function(done) {
          let graph = new Graph( null, gr1 );
          let net = new Network( this.factory, graph );
      
          net.loadComponents()
            .then( ()=> {
              expect( net.graph.nodes.get('n1').context ).toBeDefined();
      
              net.initialize();
            })
            .then( () => {
              done();
            })
      
        } );*/
    });
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
let StateLogger = class {
    constructor() {
        this.state = "created";
    }
    initialize(initialData) {
        this.state = "initialized";
        return {};
    }
    teardown() {
        this.state = "finalized";
    }
    start() {
        this.state = "started";
    }
    stop() {
        this.state = "stopped";
    }
    pause() {
        this.state = "paused";
    }
    resume() {
        this.state = "resumed";
    }
};
StateLogger = __decorate([
    inject(), 
    __metadata('design:paramtypes', [])
], StateLogger);
/*    let loader: ModuleLoader = {
      loadModule: function( id: string ): Promise<any> {
        return Promise.resolve( C );
      }
    }*/
describe("A Runtime Context", function () {
    let gr1 = {
        nodes: {
            "n1": {
                component: "c1",
            },
        }
    };
    describe("acts as a proxy for the component", function () {
        let factory = new ComponentFactory();
        let graph = new Graph(null, gr1);
        let net = new Network(factory, graph);
        // register a test Component
        factory.register('c1', StateLogger);
        it('controls the component lifecycle', function (done) {
            let ctx;
            let comp;
            // load the components
            net.loadComponents()
                .then(() => {
                ctx = graph.nodes.get('n1').context;
                comp = ctx.instance;
                expect(comp instanceof StateLogger).toBe(true);
                expect(comp.state).toEqual('created');
                expect(ctx.runState).toEqual(RunState.LOADED);
            })
                .then(() => {
                net.initialize();
                expect(ctx.runState).toEqual(RunState.READY);
                expect(comp.state).toEqual('initialized');
                net.start();
                expect(ctx.runState).toEqual(RunState.RUNNING);
                expect(comp.state).toEqual('started');
                net.pause();
                expect(ctx.runState).toEqual(RunState.PAUSED);
                expect(comp.state).toEqual('paused');
                net.resume();
                expect(ctx.runState).toEqual(RunState.RUNNING);
                expect(comp.state).toEqual('resumed');
                net.stop();
                expect(ctx.runState).toEqual(RunState.READY);
                expect(comp.state).toEqual('stopped');
                net.teardown();
                expect(ctx.runState).toEqual(RunState.LOADED);
                expect(comp.state).toEqual('finalized');
            })
                .then(() => {
                done();
            });
        });
    });
});

class IntegerMessage extends Message {
    constructor(value) {
        super(undefined, value);
    }
}
describe('A Channel', function () {
    describe('can be active or inactive', function () {
        let ch = new Channel();
        it('is initially inactive', function () {
            expect(ch.active).toBe(false);
        });
        it('can be activated', function () {
            expect(ch.active).toBe(false);
            ch.activate();
            expect(ch.active).toBe(true);
            ch.activate();
            expect(ch.active).toBe(true);
        });
        it('can be deactivated', function () {
            expect(ch.active).toBe(true);
            ch.deactivate();
            expect(ch.active).toBe(false);
            ch.deactivate();
            expect(ch.active).toBe(false);
        });
    });
    describe('has a registry of EndPoints', function () {
        let ch = new Channel();
        var ep1 = new EndPoint('ep1');
        var ep2 = new EndPoint('ep2');
        it('to which EndPoints can be added', function () {
            // add an EndPoint
            ch.addEndPoint(ep1);
            expect(ch.endPoints.length).toBe(1);
            // add another
            ch.addEndPoint(ep2);
            expect(ch.endPoints.length).toBe(2);
        });
        it('... and removed', function () {
            // remove first EndPoint
            ch.removeEndPoint(ep1);
            expect(ch.endPoints).toContain(ep2);
            ch.removeEndPoint(ep2);
            expect(ch.endPoints.length).toBe(0);
        });
        it('... even when Channel is activated', function () {
            ch.activate();
            expect(ch.active).toBe(true);
            ch.addEndPoint(new EndPoint('epx'));
            ch.addEndPoint(new EndPoint('epx'));
            ch.addEndPoint(ep1);
            expect(ch.endPoints).toContain(ep1);
            expect(ch.endPoints.length).toBe(3);
            ch.removeEndPoint(ep1);
            expect(ch.endPoints).not.toContain(ep1);
            ch.shutdown();
            expect(ch.endPoints.length).toBe(0);
        });
    });
    describe('communicates between INOUT endpoints', function () {
        let ch = new Channel();
        var ep1 = new EndPoint('ep1', Direction.INOUT);
        var ep2 = new EndPoint('ep2', Direction.INOUT);
        ep1.attach(ch);
        ep2.attach(ch);
        ch.activate();
        it('can send messages from 1(IO) to 2(IO)', function (done) {
            ep2.onMessage((m) => { expect(m).toBeDefined(); done(); });
            ep1.sendMessage(new IntegerMessage(101));
        });
        it('can send messages from 2(IO) to 1(IO)', (done) => {
            ep1.onMessage((m) => { expect(m).toBeDefined(); done(); });
            ep2.sendMessage(new IntegerMessage(102));
        });
        it('can send messages from 1(IO) to 2(IO) and back to 1(IO)', (done) => {
            ep2.onMessage((m, ep) => { ep2.sendMessage(m); });
            ep1.sendMessage(new IntegerMessage(100));
            ep1.onMessage((m) => { expect(m).toBeDefined(); done(); });
        });
    });
    describe('communicates from OUT to IN', function () {
        let ch = new Channel();
        var ep1 = new EndPoint('ep1', Direction.OUT);
        var ep2 = new EndPoint('ep2', Direction.IN);
        ep1.attach(ch);
        ep2.attach(ch);
        ch.activate();
        it('can send messages from (OUT) to (IN)', (done) => {
            ep2.onMessage((m) => { expect(m).toBeDefined(); done(); });
            ep1.sendMessage(new IntegerMessage(101));
        });
        it('cannot send messages from (IN) to (OUT)', function () {
            expect(() => { ep2.sendMessage(new IntegerMessage(102)); }).toThrow();
        });
        it('can reply, messages from (OUT) to (IN) and respond to (OUT)', (done) => {
            ep2.onMessage((m, ep) => { m.header.isResponse = true; ep2.sendMessage(m); });
            ep1.sendMessage(new IntegerMessage(100));
            ep1.onMessage((m) => { expect(m).toBeDefined(); done(); });
        });
    });
    describe('can distribute to multiple endpoints', function () {
        let ch = new Channel();
        var ep1 = new EndPoint('ep1', Direction.OUT);
        var ep2 = new EndPoint('ep2', Direction.IN);
        var ep3 = new EndPoint('ep3', Direction.IN);
        ep1.attach(ch);
        ep2.attach(ch);
        ep3.attach(ch);
        ch.activate();
        it('can send messages from 1 to 2', (done) => {
            var rcv = 0;
            ep2.onMessage((m) => { expect(m).toBeDefined(); if (++rcv == 2)
                done(); });
            ep3.onMessage((m) => { expect(m).toBeDefined(); if (++rcv == 2)
                done(); });
            ep1.sendMessage(new IntegerMessage(120));
        });
    });
});
