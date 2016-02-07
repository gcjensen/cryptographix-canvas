System.register(["cryptographix-sim-core"], function (_export) {
    "use strict";

    var Container, inject, Graph, Node, Port, Direction, Network, ComponentFactory, RunState, Channel, EndPoint, Message, ByteArray, __decorate, __metadata, C1, C2, jsonGraph1, IntegerMessage, __decorate, __metadata, gr1, C, __decorate, __metadata, StateLogger;

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    return {
        setters: [function (_cryptographixSimCore) {
            Container = _cryptographixSimCore.Container;
            inject = _cryptographixSimCore.inject;
            Graph = _cryptographixSimCore.Graph;
            Node = _cryptographixSimCore.Node;
            Port = _cryptographixSimCore.Port;
            Direction = _cryptographixSimCore.Direction;
            Network = _cryptographixSimCore.Network;
            ComponentFactory = _cryptographixSimCore.ComponentFactory;
            RunState = _cryptographixSimCore.RunState;
            Channel = _cryptographixSimCore.Channel;
            EndPoint = _cryptographixSimCore.EndPoint;
            Message = _cryptographixSimCore.Message;
            ByteArray = _cryptographixSimCore.ByteArray;
        }],
        execute: function () {
            __decorate = undefined && undefined.__decorate || function (decorators, target, key, desc) {
                var c = arguments.length,
                    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
                    d;
                if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
                return c > 3 && r && Object.defineProperty(target, key, r), r;
            };

            __metadata = undefined && undefined.__metadata || function (k, v) {
                if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
            };

            C1 = function C1() {
                _classCallCheck(this, C1);
            };

            C2 = function C2(c1) {
                _classCallCheck(this, C2);

                this.c1 = c1;
            };

            C2 = __decorate([inject(), __metadata('design:paramtypes', [C1])], C2);
            describe("A DI Container", function () {
                it("injects into the class constructor", function () {
                    var jector = new Container();
                    var c2 = jector.invoke(C2);
                    expect(c2.c1 instanceof C1).toBe(true);
                });
            });

            jsonGraph1 = {
                id: "Graph1",
                component: "g",
                ports: {
                    "pxa": { direction: "inout", type: "PublicPort" },
                    "pxb": {}
                },
                nodes: {
                    "n1": {
                        component: "a",
                        ports: {
                            "p1a": { direction: "out" },
                            "p1b": { direction: "inout" },
                            "p1x": { direction: "inout" }
                        }
                    },
                    "n2": {
                        component: "b",
                        ports: {
                            "p2a": { direction: "in" },
                            "p2b": { direction: "inout" }
                        }
                    }
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
                    }
                }
            };

            describe("A Graph", function () {
                it("can be instantiated from a JSON object", function () {
                    var graph1 = new Graph(null, jsonGraph1);
                    expect(graph1 instanceof Node).toBe(true);
                    expect(graph1 instanceof Graph).toBe(true);
                    var n1 = graph1.getNodeByID("n1");
                    expect(n1 instanceof Node).toBe(true);
                    var p1x = n1.getPortByID("p1x");
                    expect(p1x instanceof Port).toBe(true);
                    expect(p1x.id).toEqual("p1x");
                    var p2a = graph1.getNodeByID("n2").getPortByID("p2a");
                    expect(p2a instanceof Port).toBe(true);
                    expect(p2a.id).toEqual("p2a");
                    expect(p1x.direction).toEqual(Direction.INOUT);
                    expect(p2a.direction).toEqual(Direction.IN);
                });
            });

            describe("A Network", function () {
                beforeEach(function () {
                    this.factory = new ComponentFactory();
                });
                it('can be instantiated with an empty Graph', function (done) {
                    var net = new Network(this.factory, new Graph(null));
                    expect(net.graph.nodes.size).toEqual(0);

                    net.loadComponents().then(function () {
                        done();
                    });
                });
                describe("when it has an empty graph", function () {
                    var factory = new ComponentFactory();
                    var net = new Network(factory, new Graph(null, {}));
                    beforeAll(function (done) {
                        net.loadComponents().then(function () {
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
                    it('detects addition of new nodes', function (done) {
                        net.subscribeOnce(Network.EVENT_STATE_CHANGE, function () {
                            expect(net.graph.context.runState).toEqual(RunState.RUNNING);
                            console.log('state changed');
                            var node = undefined;

                            net.subscribeOnce(Network.EVENT_GRAPH_CHANGE, function (data) {
                                expect(node).toEqual(data.node);
                                expect(node.context.runState).toEqual(RunState.RUNNING);
                                console.log('node added');
                                done();
                            });
                            node = net.graph.addNode('n1', {});
                        });
                        net.start();
                    });

                    it('can be finalized', function () {
                        net.teardown();
                        expect(net.graph.context.runState).toEqual(RunState.LOADED);
                    });
                });
                describe('can control execution state', function () {
                    this.factory = new ComponentFactory();
                    var net = new Network(this.factory, new Graph(null, {}));
                    beforeAll(function (done) {
                        net.loadComponents().then(function () {
                            done();
                        });
                    });
                });
            });

            describe("A Node", function () {
                beforeEach(function () {
                    this.graph1 = new Graph(null, {});
                    this.node1 = new Node(this.graph1, {
                        id: 'node1'
                    });
                    this.node2 = new Node(this.graph1, {
                        id: 'node2',
                        component: 'component2',
                        ports: {
                            "n2p1": {},
                            "n2p2": {}
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
                        var p1 = this.node2.getPortArray()[0];
                        var p2 = this.node2.getPortArray()[1];
                        expect(p1 instanceof Port).toBe(true);
                        expect(p1.id).toEqual('n2p1');
                        expect(p2.id).toEqual('n2p2');
                    });
                    it('that can be searched by port-id', function () {
                        var p1 = this.node2.getPortByID('n2p1');
                        var p2 = this.node2.getPortByID('n2p2');
                        var p3 = this.node2.getPortByID('inexistent');
                        expect(p1 instanceof Port).toBe(true);
                        expect(p1.id).toEqual('n2p1');
                        expect(p2.id).toEqual('n2p2');
                        expect(p3).toBeUndefined();
                    });
                });
            });

            IntegerMessage = (function (_Message) {
                _inherits(IntegerMessage, _Message);

                function IntegerMessage(value) {
                    _classCallCheck(this, IntegerMessage);

                    _Message.call(this, undefined, value);
                }

                return IntegerMessage;
            })(Message);

            describe('A Channel', function () {
                describe('can be active or inactive', function () {
                    var ch = new Channel();
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
                    var ch = new Channel();
                    var ep1 = new EndPoint('ep1');
                    var ep2 = new EndPoint('ep2');
                    it('to which EndPoints can be added', function () {
                        ch.addEndPoint(ep1);
                        expect(ch.endPoints.length).toBe(1);

                        ch.addEndPoint(ep2);
                        expect(ch.endPoints.length).toBe(2);
                    });
                    it('... and removed', function () {
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
                    var ch = new Channel();
                    var ep1 = new EndPoint('ep1', Direction.INOUT);
                    var ep2 = new EndPoint('ep2', Direction.INOUT);
                    ep1.attach(ch);
                    ep2.attach(ch);
                    ch.activate();
                    it('can send messages from 1(IO) to 2(IO)', function (done) {
                        ep2.onMessage(function (m) {
                            expect(m).toBeDefined();done();
                        });
                        ep1.sendMessage(new IntegerMessage(101));
                    });
                    it('can send messages from 2(IO) to 1(IO)', function (done) {
                        ep1.onMessage(function (m) {
                            expect(m).toBeDefined();done();
                        });
                        ep2.sendMessage(new IntegerMessage(102));
                    });
                    it('can send messages from 1(IO) to 2(IO) and back to 1(IO)', function (done) {
                        ep2.onMessage(function (m, ep) {
                            ep2.sendMessage(m);
                        });
                        ep1.sendMessage(new IntegerMessage(100));
                        ep1.onMessage(function (m) {
                            expect(m).toBeDefined();done();
                        });
                    });
                });
                describe('communicates from OUT to IN', function () {
                    var ch = new Channel();
                    var ep1 = new EndPoint('ep1', Direction.OUT);
                    var ep2 = new EndPoint('ep2', Direction.IN);
                    ep1.attach(ch);
                    ep2.attach(ch);
                    ch.activate();
                    it('can send messages from (OUT) to (IN)', function (done) {
                        ep2.onMessage(function (m) {
                            expect(m).toBeDefined();done();
                        });
                        ep1.sendMessage(new IntegerMessage(101));
                    });
                    it('cannot send messages from (IN) to (OUT)', function () {
                        expect(function () {
                            ep2.sendMessage(new IntegerMessage(102));
                        }).toThrow();
                    });
                    it('can reply, messages from (OUT) to (IN) and respond to (OUT)', function (done) {
                        ep2.onMessage(function (m, ep) {
                            m.header.isResponse = true;ep2.sendMessage(m);
                        });
                        ep1.sendMessage(new IntegerMessage(100));
                        ep1.onMessage(function (m) {
                            expect(m).toBeDefined();done();
                        });
                    });
                });
                describe('can distribute to multiple endpoints', function () {
                    var ch = new Channel();
                    var ep1 = new EndPoint('ep1', Direction.OUT);
                    var ep2 = new EndPoint('ep2', Direction.IN);
                    var ep3 = new EndPoint('ep3', Direction.IN);
                    ep1.attach(ch);
                    ep2.attach(ch);
                    ep3.attach(ch);
                    ch.activate();
                    it('can send messages from 1 to 2', function (done) {
                        var rcv = 0;
                        ep2.onMessage(function (m) {
                            expect(m).toBeDefined();if (++rcv == 2) done();
                        });
                        ep3.onMessage(function (m) {
                            expect(m).toBeDefined();if (++rcv == 2) done();
                        });
                        ep1.sendMessage(new IntegerMessage(120));
                    });
                });
            });

            describe('A ByteArray', function () {
                it('stores a sequence of bytes', function () {
                    var bs = new ByteArray([0, 1, 2, 3, 4]);
                    expect(bs.toString()).toBe("0001020304");
                });
                it('can be instanciated from an array of bytes', function () {
                    var bs = new ByteArray([0, 1, 2, 3, 4]);
                    expect(bs.toString()).toBe("0001020304");
                    var bytes = [];
                    for (var i = 0; i < 10000; ++i) {
                        bytes[i] = i & 0xff;
                    }bs = new ByteArray(bytes);
                    expect(bs.length).toBe(10000);
                });
                it('can be compared (equal)', function () {
                    var bs1 = new ByteArray([0, 1, 2, 3, 4]);
                    var bs2 = new ByteArray("00 01 02 03 04", ByteArray.HEX);
                    var bs3 = bs1.clone().setByteAt(1, 0x99);

                    expect(bs1.equals(bs1)).toBe(true);

                    expect(bs1.equals(bs2)).toBe(true);
                    expect(bs1.equals(bs3)).not.toBe(true);
                });
            });

            __decorate = undefined && undefined.__decorate || function (decorators, target, key, desc) {
                var c = arguments.length,
                    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
                    d;
                if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
                return c > 3 && r && Object.defineProperty(target, key, r), r;
            };

            __metadata = undefined && undefined.__metadata || function (k, v) {
                if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
            };

            gr1 = {
                nodes: {
                    "n1": {
                        component: "c1"
                    }
                }
            };

            C = (function () {
                function C(node) {
                    _classCallCheck(this, C);

                    console.log('C1 got node: ' + node.id);
                }

                C.prototype.initialize = function initialize(initialData) {
                    console.log('C1 created with init data' + JSON.stringify(initialData));
                    return {};
                };

                C.prototype.start = function start() {
                    console.log('C1 started ');
                };

                C.prototype.stop = function stop() {
                    console.log('C1 stopped');
                };

                return C;
            })();

            C = __decorate([inject(), __metadata('design:paramtypes', [Node])], C);

            describe("A ComponentFactory", function () {
                describe("without a loader", function () {
                    beforeEach(function () {
                        this.factory = new ComponentFactory();

                        this.factory.register('c1', C);
                    });
                    it('can be used to *load* components', function (done) {
                        var graph = new Graph(null, gr1);
                        var net = new Network(this.factory, graph);

                        net.loadComponents().then(function () {
                            expect(graph.nodes.get('n1').context.instance).toBeDefined();
                            net.initialize();
                        }).then(function () {
                            done();
                        });
                    });
                });
            });

            __decorate = undefined && undefined.__decorate || function (decorators, target, key, desc) {
                var c = arguments.length,
                    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
                    d;
                if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
                return c > 3 && r && Object.defineProperty(target, key, r), r;
            };

            __metadata = undefined && undefined.__metadata || function (k, v) {
                if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
            };

            StateLogger = (function () {
                function StateLogger() {
                    _classCallCheck(this, StateLogger);

                    this.state = "created";
                }

                StateLogger.prototype.initialize = function initialize(initialData) {
                    this.state = "initialized";
                    return {};
                };

                StateLogger.prototype.teardown = function teardown() {
                    this.state = "finalized";
                };

                StateLogger.prototype.start = function start() {
                    this.state = "started";
                };

                StateLogger.prototype.stop = function stop() {
                    this.state = "stopped";
                };

                StateLogger.prototype.pause = function pause() {
                    this.state = "paused";
                };

                StateLogger.prototype.resume = function resume() {
                    this.state = "resumed";
                };

                return StateLogger;
            })();

            StateLogger = __decorate([inject(), __metadata('design:paramtypes', [])], StateLogger);

            describe("A Runtime Context", function () {
                var gr1 = {
                    nodes: {
                        "n1": {
                            component: "c1"
                        }
                    }
                };
                describe("acts as a proxy for the component", function () {
                    var factory = new ComponentFactory();
                    var graph = new Graph(null, gr1);
                    var net = new Network(factory, graph);

                    factory.register('c1', StateLogger);
                    it('controls the component lifecycle', function (done) {
                        var ctx = undefined;
                        var comp = undefined;

                        net.loadComponents().then(function () {
                            ctx = graph.nodes.get('n1').context;
                            comp = ctx.instance;
                            expect(comp instanceof StateLogger).toBe(true);
                            expect(comp.state).toEqual('created');
                            expect(ctx.runState).toEqual(RunState.LOADED);
                        }).then(function () {
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
                        }).then(function () {
                            done();
                        });
                    });
                });
            });
        }
    };
});