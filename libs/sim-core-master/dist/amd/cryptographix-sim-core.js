define(['exports', 'aurelia-dependency-injection', 'aurelia-event-aggregator'], function (exports, _aureliaDependencyInjection, _aureliaEventAggregator) {
    'use strict';

    exports.__esModule = true;

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

    var HexCodec = (function () {
        function HexCodec() {
            _classCallCheck(this, HexCodec);
        }

        HexCodec.decode = function decode(a) {
            if (HexCodec.hexDecodeMap == undefined) {
                var hex = "0123456789ABCDEF";
                var allow = ' \f\n\r\t \u2028\u2029';
                var dec = [];
                for (var i = 0; i < 16; ++i) dec[hex.charAt(i)] = i;
                hex = hex.toLowerCase();
                for (var i = 10; i < 16; ++i) dec[hex.charAt(i)] = i;
                for (var i = 0; i < allow.length; ++i) dec[allow.charAt(i)] = -1;
                HexCodec.hexDecodeMap = dec;
            }
            var out = [];
            var bits = 0,
                char_count = 0;
            for (var i = 0; i < a.length; ++i) {
                var c = a.charAt(i);
                if (c == '=') break;
                var b = HexCodec.hexDecodeMap[c];
                if (b == -1) continue;
                if (b == undefined) throw 'Illegal character at offset ' + i;
                bits |= b;
                if (++char_count >= 2) {
                    out.push(bits);
                    bits = 0;
                    char_count = 0;
                } else {
                    bits <<= 4;
                }
            }
            if (char_count) throw "Hex encoding incomplete: 4 bits missing";
            return Uint8Array.from(out);
        };

        return HexCodec;
    })();

    exports.HexCodec = HexCodec;

    var BASE64SPECIALS;
    (function (BASE64SPECIALS) {
        BASE64SPECIALS[BASE64SPECIALS["PLUS"] = '+'.charCodeAt(0)] = "PLUS";
        BASE64SPECIALS[BASE64SPECIALS["SLASH"] = '/'.charCodeAt(0)] = "SLASH";
        BASE64SPECIALS[BASE64SPECIALS["NUMBER"] = '0'.charCodeAt(0)] = "NUMBER";
        BASE64SPECIALS[BASE64SPECIALS["LOWER"] = 'a'.charCodeAt(0)] = "LOWER";
        BASE64SPECIALS[BASE64SPECIALS["UPPER"] = 'A'.charCodeAt(0)] = "UPPER";
        BASE64SPECIALS[BASE64SPECIALS["PLUS_URL_SAFE"] = '-'.charCodeAt(0)] = "PLUS_URL_SAFE";
        BASE64SPECIALS[BASE64SPECIALS["SLASH_URL_SAFE"] = '_'.charCodeAt(0)] = "SLASH_URL_SAFE";
    })(BASE64SPECIALS || (BASE64SPECIALS = {}));

    var Base64Codec = (function () {
        function Base64Codec() {
            _classCallCheck(this, Base64Codec);
        }

        Base64Codec.decode = function decode(b64) {
            if (b64.length % 4 > 0) {
                throw new Error('Invalid base64 string. Length must be a multiple of 4');
            }
            function decode(elt) {
                var code = elt.charCodeAt(0);
                if (code === BASE64SPECIALS.PLUS || code === BASE64SPECIALS.PLUS_URL_SAFE) return 62;
                if (code === BASE64SPECIALS.SLASH || code === BASE64SPECIALS.SLASH_URL_SAFE) return 63;
                if (code >= BASE64SPECIALS.NUMBER) {
                    if (code < BASE64SPECIALS.NUMBER + 10) return code - BASE64SPECIALS.NUMBER + 26 + 26;
                    if (code < BASE64SPECIALS.UPPER + 26) return code - BASE64SPECIALS.UPPER;
                    if (code < BASE64SPECIALS.LOWER + 26) return code - BASE64SPECIALS.LOWER + 26;
                }
                throw new Error('Invalid base64 string. Character not valid');
            }
            var len = b64.length;
            var placeHolders = b64.charAt(len - 2) === '=' ? 2 : b64.charAt(len - 1) === '=' ? 1 : 0;
            var arr = new Uint8Array(b64.length * 3 / 4 - placeHolders);
            var l = placeHolders > 0 ? b64.length - 4 : b64.length;
            var L = 0;
            function push(v) {
                arr[L++] = v;
            }
            var i = 0,
                j = 0;
            for (; i < l; i += 4, j += 3) {
                var tmp = decode(b64.charAt(i)) << 18 | decode(b64.charAt(i + 1)) << 12 | decode(b64.charAt(i + 2)) << 6 | decode(b64.charAt(i + 3));
                push((tmp & 0xFF0000) >> 16);
                push((tmp & 0xFF00) >> 8);
                push(tmp & 0xFF);
            }
            if (placeHolders === 2) {
                var tmp = decode(b64.charAt(i)) << 2 | decode(b64.charAt(i + 1)) >> 4;
                push(tmp & 0xFF);
            } else if (placeHolders === 1) {
                var tmp = decode(b64.charAt(i)) << 10 | decode(b64.charAt(i + 1)) << 4 | decode(b64.charAt(i + 2)) >> 2;
                push(tmp >> 8 & 0xFF);
                push(tmp & 0xFF);
            }
            return arr;
        };

        Base64Codec.encode = function encode(uint8) {
            var i;
            var extraBytes = uint8.length % 3;
            var output = '';
            var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            function encode(num) {
                return lookup.charAt(num);
            }
            function tripletToBase64(num) {
                return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F);
            }
            var length = uint8.length - extraBytes;
            for (i = 0; i < length; i += 3) {
                var temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
                output += tripletToBase64(temp);
            }
            switch (extraBytes) {
                case 1:
                    var temp = uint8[uint8.length - 1];
                    output += encode(temp >> 2);
                    output += encode(temp << 4 & 0x3F);
                    output += '==';
                    break;
                case 2:
                    temp = (uint8[uint8.length - 2] << 8) + uint8[uint8.length - 1];
                    output += encode(temp >> 10);
                    output += encode(temp >> 4 & 0x3F);
                    output += encode(temp << 2 & 0x3F);
                    output += '=';
                    break;
                default:
                    break;
            }
            return output;
        };

        return Base64Codec;
    })();

    exports.Base64Codec = Base64Codec;

    var ByteArray = (function () {
        function ByteArray(bytes, format, opt) {
            _classCallCheck(this, ByteArray);

            if (!bytes) {
                this.byteArray = new Uint8Array(0);
            } else if (!format || format == ByteArray.BYTES) {
                if (bytes instanceof ArrayBuffer) this.byteArray = new Uint8Array(bytes);else if (bytes instanceof Uint8Array) this.byteArray = bytes;else if (bytes instanceof ByteArray) this.byteArray = bytes.byteArray;else if (bytes instanceof Array) this.byteArray = new Uint8Array(bytes);
            } else if (typeof bytes == "string") {
                if (format == ByteArray.BASE64) {
                    this.byteArray = Base64Codec.decode(bytes);
                } else if (format == ByteArray.HEX) {
                    this.byteArray = HexCodec.decode(bytes);
                } else if (format == ByteArray.UTF8) {
                    var l = bytes.length;
                    var ba = new Uint8Array(l);
                    for (var i = 0; i < l; ++i) {
                        ba[i] = bytes.charCodeAt(i);
                    }this.byteArray = ba;
                }
            }
            if (!this.byteArray) {
                throw new Error("Invalid Params for ByteArray()");
            }
        }

        ByteArray.prototype.equals = function equals(value) {
            var ba = this.byteArray;
            var vba = value.byteArray;
            var ok = ba.length == vba.length;
            if (ok) {
                for (var i = 0; i < ba.length; ++i) {
                    ok = ok && ba[i] == vba[i];
                }
            }
            return ok;
        };

        ByteArray.prototype.byteAt = function byteAt(offset) {
            return this.byteArray[offset];
        };

        ByteArray.prototype.wordAt = function wordAt(offset) {
            return (this.byteArray[offset] << 8) + this.byteArray[offset + 1];
        };

        ByteArray.prototype.littleEndianWordAt = function littleEndianWordAt(offset) {
            return this.byteArray[offset] + (this.byteArray[offset + 1] << 8);
        };

        ByteArray.prototype.dwordAt = function dwordAt(offset) {
            return (this.byteArray[offset] << 24) + (this.byteArray[offset + 1] << 16) + (this.byteArray[offset + 2] << 8) + this.byteArray[offset + 3];
        };

        ByteArray.prototype.setByteAt = function setByteAt(offset, value) {
            this.byteArray[offset] = value;
            return this;
        };

        ByteArray.prototype.setBytesAt = function setBytesAt(offset, value) {
            this.byteArray.set(value.byteArray, offset);
            return this;
        };

        ByteArray.prototype.clone = function clone() {
            return new ByteArray(this.byteArray.slice());
        };

        ByteArray.prototype.bytesAt = function bytesAt(offset, count) {
            if (!Number.isInteger(count)) count = this.length - offset;
            return new ByteArray(this.byteArray.slice(offset, offset + count));
        };

        ByteArray.prototype.viewAt = function viewAt(offset, count) {
            if (!Number.isInteger(count)) count = this.length - offset;
            return new ByteArray(this.byteArray.subarray(offset, offset + count));
        };

        ByteArray.prototype.addByte = function addByte(value) {
            this.byteArray[this.byteArray.length] = value;
            return this;
        };

        ByteArray.prototype.setLength = function setLength(len) {
            this.length = len;
            return this;
        };

        ByteArray.prototype.concat = function concat(bytes) {
            var ba = this.byteArray;
            this.byteArray = new Uint8Array(ba.length + bytes.length);
            this.byteArray.set(ba);
            this.byteArray.set(bytes.byteArray, ba.length);
            return this;
        };

        ByteArray.prototype.not = function not() {
            var ba = this.byteArray;
            for (var i = 0; i < ba.length; ++i) {
                ba[i] = ba[i] ^ 0xFF;
            }return this;
        };

        ByteArray.prototype.and = function and(value) {
            var ba = this.byteArray;
            var vba = value.byteArray;
            for (var i = 0; i < ba.length; ++i) {
                ba[i] = ba[i] & vba[i];
            }return this;
        };

        ByteArray.prototype.or = function or(value) {
            var ba = this.byteArray;
            var vba = value.byteArray;
            for (var i = 0; i < ba.length; ++i) {
                ba[i] = ba[i] | vba[i];
            }return this;
        };

        ByteArray.prototype.xor = function xor(value) {
            var ba = this.byteArray;
            var vba = value.byteArray;
            for (var i = 0; i < ba.length; ++i) {
                ba[i] = ba[i] ^ vba[i];
            }return this;
        };

        ByteArray.prototype.toString = function toString(format, opt) {
            var s = "";
            for (var i = 0; i < this.length; ++i) s += ("0" + this.byteArray[i].toString(16)).substring(-2);
            return s;
        };

        _createClass(ByteArray, [{
            key: 'length',
            get: function get() {
                return this.byteArray.length;
            },
            set: function set(len) {
                if (this.byteArray.length >= len) {
                    this.byteArray = this.byteArray.slice(0, len);
                } else {
                    var old = this.byteArray;
                    this.byteArray = new Uint8Array(len);
                    this.byteArray.set(old, 0);
                }
            }
        }, {
            key: 'backingArray',
            get: function get() {
                return this.byteArray;
            }
        }]);

        return ByteArray;
    })();

    exports.ByteArray = ByteArray;

    ByteArray.BYTES = 0;
    ByteArray.HEX = 1;
    ByteArray.BASE64 = 2;
    ByteArray.UTF8 = 3;

    var Enum = function Enum() {
        _classCallCheck(this, Enum);
    };

    exports.Enum = Enum;

    ;

    var KindInfo = function KindInfo() {
        _classCallCheck(this, KindInfo);

        this.fields = {};
    };

    exports.KindInfo = KindInfo;

    var KindBuilder = (function () {
        function KindBuilder(ctor, description) {
            _classCallCheck(this, KindBuilder);

            this.ctor = ctor;
            ctor.kindInfo = {
                name: ctor.name,
                description: description,
                fields: {}
            };
        }

        KindBuilder.init = function init(ctor, description) {
            var builder = new KindBuilder(ctor, description);
            return builder;
        };

        KindBuilder.prototype.field = function field(name, description, dataType, opts) {
            this.ctor.kindInfo.fields[name] = {
                description: description,
                dataType: dataType
            };
            return this;
        };

        return KindBuilder;
    })();

    exports.KindBuilder = KindBuilder;

    var Oranges;
    (function (Oranges) {
        Oranges[Oranges["BLOOD"] = 0] = "BLOOD";
        Oranges[Oranges["SEVILLE"] = 1] = "SEVILLE";
        Oranges[Oranges["SATSUMA"] = 2] = "SATSUMA";
        Oranges[Oranges["NAVEL"] = 3] = "NAVEL";
    })(Oranges || (Oranges = {}));

    var FruityKind = function FruityKind() {
        _classCallCheck(this, FruityKind);
    };

    KindBuilder.init(FruityKind, 'a Collection of fruit').field('banana', 'a banana', String).field('apple', 'an apple or pear', Number).field('orange', 'some sort of orange', Enum);

    var Message = (function () {
        function Message(header, payload) {
            _classCallCheck(this, Message);

            this._header = header || {};
            this._payload = payload;
        }

        _createClass(Message, [{
            key: 'header',
            get: function get() {
                return this._header;
            }
        }, {
            key: 'payload',
            get: function get() {
                return this._payload;
            }
        }]);

        return Message;
    })();

    exports.Message = Message;

    var KindMessage = (function (_Message) {
        _inherits(KindMessage, _Message);

        function KindMessage() {
            _classCallCheck(this, KindMessage);

            _Message.apply(this, arguments);
        }

        return KindMessage;
    })(Message);

    exports.KindMessage = KindMessage;

    var window = window || {};

    var TaskScheduler = (function () {
        function TaskScheduler() {
            _classCallCheck(this, TaskScheduler);

            this.taskQueue = [];
            var self = this;
            if (typeof TaskScheduler.BrowserMutationObserver === 'function') {
                this.requestFlushTaskQueue = TaskScheduler.makeRequestFlushFromMutationObserver(function () {
                    return self.flushTaskQueue();
                });
            } else {
                this.requestFlushTaskQueue = TaskScheduler.makeRequestFlushFromTimer(function () {
                    return self.flushTaskQueue();
                });
            }
        }

        TaskScheduler.makeRequestFlushFromMutationObserver = function makeRequestFlushFromMutationObserver(flush) {
            var toggle = 1;
            var observer = new TaskScheduler.BrowserMutationObserver(flush);
            var node = document.createTextNode('');
            observer.observe(node, { characterData: true });
            return function requestFlush() {
                toggle = -toggle;
                node["data"] = toggle;
            };
        };

        TaskScheduler.makeRequestFlushFromTimer = function makeRequestFlushFromTimer(flush) {
            return function requestFlush() {
                var timeoutHandle = setTimeout(handleFlushTimer, 0);
                var intervalHandle = setInterval(handleFlushTimer, 50);
                function handleFlushTimer() {
                    clearTimeout(timeoutHandle);
                    clearInterval(intervalHandle);
                    flush();
                }
            };
        };

        TaskScheduler.prototype.shutdown = function shutdown() {};

        TaskScheduler.prototype.queueTask = function queueTask(task) {
            if (this.taskQueue.length < 1) {
                this.requestFlushTaskQueue();
            }
            this.taskQueue.push(task);
        };

        TaskScheduler.prototype.flushTaskQueue = function flushTaskQueue() {
            var queue = this.taskQueue,
                capacity = TaskScheduler.taskQueueCapacity,
                index = 0,
                task;
            while (index < queue.length) {
                task = queue[index];
                try {
                    task.call();
                } catch (error) {
                    this.onError(error, task);
                }
                index++;
                if (index > capacity) {
                    for (var scan = 0; scan < index; scan++) {
                        queue[scan] = queue[scan + index];
                    }
                    queue.length -= index;
                    index = 0;
                }
            }
            queue.length = 0;
        };

        TaskScheduler.prototype.onError = function onError(error, task) {
            if ('onError' in task) {
                task.onError(error);
            } else if (TaskScheduler.hasSetImmediate) {
                setImmediate(function () {
                    throw error;
                });
            } else {
                setTimeout(function () {
                    throw error;
                }, 0);
            }
        };

        return TaskScheduler;
    })();

    exports.TaskScheduler = TaskScheduler;

    TaskScheduler.BrowserMutationObserver = window["MutationObserver"] || window["WebKitMutationObserver"];
    TaskScheduler.hasSetImmediate = typeof setImmediate === 'function';
    TaskScheduler.taskQueueCapacity = 1024;

    var Channel = (function () {
        function Channel() {
            _classCallCheck(this, Channel);

            this._active = false;
            this._endPoints = [];
        }

        Channel.prototype.shutdown = function shutdown() {
            this._active = false;
            this._endPoints = [];
            if (this._taskScheduler) {
                this._taskScheduler.shutdown();
                this._taskScheduler = undefined;
            }
        };

        Channel.prototype.activate = function activate() {
            this._taskScheduler = new TaskScheduler();
            this._active = true;
        };

        Channel.prototype.deactivate = function deactivate() {
            this._taskScheduler = undefined;
            this._active = false;
        };

        Channel.prototype.addEndPoint = function addEndPoint(endPoint) {
            this._endPoints.push(endPoint);
        };

        Channel.prototype.removeEndPoint = function removeEndPoint(endPoint) {
            var idx = this._endPoints.indexOf(endPoint);
            if (idx >= 0) {
                this._endPoints.splice(idx, 1);
            }
        };

        Channel.prototype.sendMessage = function sendMessage(origin, message) {
            var _this = this;

            var isResponse = message.header && message.header.isResponse;
            if (!this._active) return;
            if (origin.direction == Direction.IN && !isResponse) throw new Error('Unable to send on IN port');
            this._endPoints.forEach(function (endPoint) {
                if (origin != endPoint) {
                    if (endPoint.direction != Direction.OUT || isResponse) {
                        _this._taskScheduler.queueTask(function () {
                            endPoint.handleMessage(message, origin, _this);
                        });
                    }
                }
            });
        };

        _createClass(Channel, [{
            key: 'active',
            get: function get() {
                return this._active;
            }
        }, {
            key: 'endPoints',
            get: function get() {
                return this._endPoints;
            }
        }]);

        return Channel;
    })();

    exports.Channel = Channel;
    var Direction;
    exports.Direction = Direction;
    (function (Direction) {
        Direction[Direction["IN"] = 1] = "IN";
        Direction[Direction["OUT"] = 2] = "OUT";
        Direction[Direction["INOUT"] = 3] = "INOUT";
    })(Direction || (exports.Direction = Direction = {}));
    ;

    var EndPoint = (function () {
        function EndPoint(id) {
            var direction = arguments.length <= 1 || arguments[1] === undefined ? Direction.INOUT : arguments[1];

            _classCallCheck(this, EndPoint);

            this._id = id;
            this._direction = direction;
            this._channels = [];
            this._messageListeners = [];
        }

        EndPoint.prototype.shutdown = function shutdown() {
            this.detachAll();
            this._messageListeners = [];
        };

        EndPoint.prototype.attach = function attach(channel) {
            this._channels.push(channel);
            channel.addEndPoint(this);
        };

        EndPoint.prototype.detach = function detach(channelToDetach) {
            var idx = this._channels.indexOf(channelToDetach);
            if (idx >= 0) {
                channelToDetach.removeEndPoint(this);
                this._channels.splice(idx, 1);
            }
        };

        EndPoint.prototype.detachAll = function detachAll() {
            var _this2 = this;

            this._channels.forEach(function (channel) {
                channel.removeEndPoint(_this2);
            });
            this._channels = [];
        };

        EndPoint.prototype.handleMessage = function handleMessage(message, fromEndPoint, fromChannel) {
            var _this3 = this;

            this._messageListeners.forEach(function (messageListener) {
                messageListener(message, _this3, fromChannel);
            });
        };

        EndPoint.prototype.sendMessage = function sendMessage(message) {
            var _this4 = this;

            this._channels.forEach(function (channel) {
                channel.sendMessage(_this4, message);
            });
        };

        EndPoint.prototype.onMessage = function onMessage(messageListener) {
            this._messageListeners.push(messageListener);
        };

        _createClass(EndPoint, [{
            key: 'id',
            get: function get() {
                return this._id;
            }
        }, {
            key: 'attached',
            get: function get() {
                return this._channels.length > 0;
            }
        }, {
            key: 'direction',
            get: function get() {
                return this._direction;
            }
        }]);

        return EndPoint;
    })();

    exports.EndPoint = EndPoint;
    var ProtocolTypeBits;
    exports.ProtocolTypeBits = ProtocolTypeBits;
    (function (ProtocolTypeBits) {
        ProtocolTypeBits[ProtocolTypeBits["PACKET"] = 0] = "PACKET";
        ProtocolTypeBits[ProtocolTypeBits["STREAM"] = 1] = "STREAM";
        ProtocolTypeBits[ProtocolTypeBits["ONEWAY"] = 0] = "ONEWAY";
        ProtocolTypeBits[ProtocolTypeBits["CLIENTSERVER"] = 4] = "CLIENTSERVER";
        ProtocolTypeBits[ProtocolTypeBits["PEER2PEER"] = 6] = "PEER2PEER";
        ProtocolTypeBits[ProtocolTypeBits["UNTYPED"] = 0] = "UNTYPED";
        ProtocolTypeBits[ProtocolTypeBits["TYPED"] = 8] = "TYPED";
    })(ProtocolTypeBits || (exports.ProtocolTypeBits = ProtocolTypeBits = {}));

    var Protocol = function Protocol() {
        _classCallCheck(this, Protocol);
    };

    exports.Protocol = Protocol;

    Protocol.protocolType = 0;

    var ClientServerProtocol = (function (_Protocol) {
        _inherits(ClientServerProtocol, _Protocol);

        function ClientServerProtocol() {
            _classCallCheck(this, ClientServerProtocol);

            _Protocol.apply(this, arguments);
        }

        return ClientServerProtocol;
    })(Protocol);

    ClientServerProtocol.protocolType = ProtocolTypeBits.CLIENTSERVER | ProtocolTypeBits.TYPED;

    var APDU = function APDU() {
        _classCallCheck(this, APDU);
    };

    var APDUMessage = (function (_Message2) {
        _inherits(APDUMessage, _Message2);

        function APDUMessage() {
            _classCallCheck(this, APDUMessage);

            _Message2.apply(this, arguments);
        }

        return APDUMessage;
    })(Message);

    var APDUProtocol = (function (_ClientServerProtocol) {
        _inherits(APDUProtocol, _ClientServerProtocol);

        function APDUProtocol() {
            _classCallCheck(this, APDUProtocol);

            _ClientServerProtocol.apply(this, arguments);
        }

        return APDUProtocol;
    })(ClientServerProtocol);

    var PortInfo = function PortInfo() {
        _classCallCheck(this, PortInfo);

        this.index = 0;
        this.required = false;
    };

    exports.PortInfo = PortInfo;

    var ComponentInfo = function ComponentInfo() {
        _classCallCheck(this, ComponentInfo);

        this.detailLink = '';
        this.category = '';
        this.author = '';
        this.ports = {};
        this.stores = {};
    };

    exports.ComponentInfo = ComponentInfo;

    var StoreInfo = function StoreInfo() {
        _classCallCheck(this, StoreInfo);
    };

    exports.StoreInfo = StoreInfo;

    var ComponentBuilder = (function () {
        function ComponentBuilder(ctor, description, category) {
            _classCallCheck(this, ComponentBuilder);

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

        ComponentBuilder.init = function init(ctor, description, category) {
            var builder = new ComponentBuilder(ctor, description, category);
            return builder;
        };

        ComponentBuilder.prototype.port = function port(id, direction, opts) {
            opts = opts || {};
            this.ctor.componentInfo.ports[id] = {
                direction: direction,
                protocol: opts.protocol,
                index: opts.index,
                required: opts.required
            };
            return this;
        };

        ComponentBuilder.prototype.name = function name(_name) {
            this.ctor.componentInfo.name = _name;
            return this;
        };

        return ComponentBuilder;
    })();

    exports.ComponentBuilder = ComponentBuilder;

    var C = function C() {
        _classCallCheck(this, C);
    };

    ComponentBuilder.init(C, 'Test Component').port('p1', Direction.IN);

    var Key = (function () {
        function Key(id, key) {
            _classCallCheck(this, Key);

            this.id = id;
            if (key) this.cryptoKey = key;else {
                this.cryptoKey = {
                    type: "",
                    algorithm: "",
                    extractable: true,
                    usages: []
                };
            }
        }

        _createClass(Key, [{
            key: 'type',
            get: function get() {
                return this.cryptoKey.type;
            }
        }, {
            key: 'algorithm',
            get: function get() {
                return this.cryptoKey.algorithm;
            }
        }, {
            key: 'extractable',
            get: function get() {
                return this.cryptoKey.extractable;
            }
        }, {
            key: 'usages',
            get: function get() {
                return this.cryptoKey.usages;
            }
        }, {
            key: 'innerKey',
            get: function get() {
                return this.cryptoKey;
            }
        }]);

        return Key;
    })();

    exports.Key = Key;

    var PrivateKey = (function (_Key) {
        _inherits(PrivateKey, _Key);

        function PrivateKey() {
            _classCallCheck(this, PrivateKey);

            _Key.apply(this, arguments);
        }

        return PrivateKey;
    })(Key);

    exports.PrivateKey = PrivateKey;

    var PublicKey = (function (_Key2) {
        _inherits(PublicKey, _Key2);

        function PublicKey() {
            _classCallCheck(this, PublicKey);

            _Key2.apply(this, arguments);
        }

        return PublicKey;
    })(Key);

    exports.PublicKey = PublicKey;

    var KeyPair = function KeyPair() {
        _classCallCheck(this, KeyPair);
    };

    exports.KeyPair = KeyPair;

    var CryptographicService = (function () {
        function CryptographicService() {
            _classCallCheck(this, CryptographicService);

            this.crypto = window.crypto.subtle;
            if (!this.crypto && msrcrypto) this.crypto = msrcrypto;
        }

        CryptographicService.prototype.decrypt = function decrypt(algorithm, key, data) {
            var _this5 = this;

            return new Promise(function (resolve, reject) {
                _this5.crypto.decrypt(algorithm, key.innerKey, data.backingArray).then(function (res) {
                    resolve(new ByteArray(res));
                })['catch'](function (err) {
                    reject(err);
                });
            });
        };

        CryptographicService.prototype.digest = function digest(algorithm, data) {
            var _this6 = this;

            return new Promise(function (resolve, reject) {
                _this6.crypto.digest(algorithm, data.backingArray).then(function (res) {
                    resolve(new ByteArray(res));
                })['catch'](function (err) {
                    reject(err);
                });
            });
        };

        CryptographicService.prototype.encrypt = function encrypt(algorithm, key, data) {
            var _this7 = this;

            return new Promise(function (resolve, reject) {
                _this7.crypto.encrypt(algorithm, key.innerKey, data.backingArray).then(function (res) {
                    resolve(new ByteArray(res));
                })['catch'](function (err) {
                    reject(err);
                });
            });
        };

        CryptographicService.prototype.exportKey = function exportKey(format, key) {
            var _this8 = this;

            return new Promise(function (resolve, reject) {
                _this8.crypto.exportKey(format, key.innerKey).then(function (res) {
                    resolve(new ByteArray(res));
                })['catch'](function (err) {
                    reject(err);
                });
            });
        };

        CryptographicService.prototype.generateKey = function generateKey(algorithm, extractable, keyUsages) {
            return new Promise(function (resolve, reject) {});
        };

        CryptographicService.prototype.importKey = function importKey(format, keyData, algorithm, extractable, keyUsages) {
            var _this9 = this;

            return new Promise(function (resolve, reject) {
                _this9.crypto.importKey(format, keyData.backingArray, algorithm, extractable, keyUsages).then(function (res) {
                    resolve(res);
                })['catch'](function (err) {
                    reject(err);
                });
            });
        };

        CryptographicService.prototype.sign = function sign(algorithm, key, data) {
            var _this10 = this;

            return new Promise(function (resolve, reject) {
                _this10.crypto.sign(algorithm, key.innerKey, data.backingArray).then(function (res) {
                    resolve(new ByteArray(res));
                })['catch'](function (err) {
                    reject(err);
                });
            });
        };

        CryptographicService.prototype.verify = function verify(algorithm, key, signature, data) {
            var _this11 = this;

            return new Promise(function (resolve, reject) {
                _this11.crypto.verify(algorithm, key.innerKey, signature.backingArray, data.backingArray).then(function (res) {
                    resolve(new ByteArray(res));
                })['catch'](function (err) {
                    reject(err);
                });
            });
        };

        return CryptographicService;
    })();

    exports.CryptographicService = CryptographicService;
    exports.Container = _aureliaDependencyInjection.Container;
    exports.inject = _aureliaDependencyInjection.autoinject;

    var EventHub = (function () {
        function EventHub() {
            _classCallCheck(this, EventHub);

            this._eventAggregator = new _aureliaEventAggregator.EventAggregator();
        }

        EventHub.prototype.publish = function publish(event, data) {
            this._eventAggregator.publish(event, data);
        };

        EventHub.prototype.subscribe = function subscribe(event, handler) {
            return this._eventAggregator.subscribe(event, handler);
        };

        EventHub.prototype.subscribeOnce = function subscribeOnce(event, handler) {
            return this._eventAggregator.subscribeOnce(event, handler);
        };

        return EventHub;
    })();

    exports.EventHub = EventHub;

    var Port = (function () {
        function Port(owner, endPoint) {
            var attributes = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

            _classCallCheck(this, Port);

            if (!endPoint) {
                var direction = attributes.direction || Direction.INOUT;
                if (typeof attributes.direction == "string") direction = Direction[direction.toUpperCase()];
                endPoint = new EndPoint(attributes.id, direction);
            }
            this._owner = owner;
            this._endPoint = endPoint;
            this._protocolID = attributes['protocol'] || 'any';
            this.metadata = attributes.metadata || { x: 100, y: 100 };
        }

        Port.prototype.toObject = function toObject(opts) {
            var port = {
                id: this._endPoint.id,
                direction: this._endPoint.direction,
                protocol: this._protocolID != 'any' ? this._protocolID : undefined,
                metadata: this.metadata
            };
            return port;
        };

        _createClass(Port, [{
            key: 'endPoint',
            get: function get() {
                return this._endPoint;
            },
            set: function set(endPoint) {
                this._endPoint = endPoint;
            }
        }, {
            key: 'owner',
            get: function get() {
                return this._owner;
            }
        }, {
            key: 'protocolID',
            get: function get() {
                return this._protocolID;
            }
        }, {
            key: 'id',
            get: function get() {
                return this._endPoint.id;
            }
        }, {
            key: 'direction',
            get: function get() {
                return this._endPoint.direction;
            }
        }]);

        return Port;
    })();

    exports.Port = Port;

    var PublicPort = (function (_Port) {
        _inherits(PublicPort, _Port);

        function PublicPort(owner, endPoint, attributes) {
            var _this12 = this;

            _classCallCheck(this, PublicPort);

            _Port.call(this, owner, endPoint, attributes);
            var proxyDirection = this._endPoint.direction == Direction.IN ? Direction.OUT : this._endPoint.direction == Direction.OUT ? Direction.IN : Direction.INOUT;
            this.proxyEndPoint = new EndPoint(this._endPoint.id, proxyDirection);
            this.proxyEndPoint.onMessage(function (message) {
                _this12._endPoint.handleMessage(message, _this12.proxyEndPoint, _this12.proxyChannel);
            });
            this._endPoint.onMessage(function (message) {
                _this12.proxyEndPoint.sendMessage(message);
            });
            this.proxyChannel = null;
        }

        PublicPort.prototype.connectPrivate = function connectPrivate(channel) {
            this.proxyChannel = channel;
            this.proxyEndPoint.attach(channel);
        };

        PublicPort.prototype.disconnectPrivate = function disconnectPrivate() {
            this.proxyEndPoint.detach(this.proxyChannel);
        };

        PublicPort.prototype.toObject = function toObject(opts) {
            var port = _Port.prototype.toObject.call(this, opts);
            return port;
        };

        return PublicPort;
    })(Port);

    exports.PublicPort = PublicPort;

    var Node = (function (_EventHub) {
        _inherits(Node, _EventHub);

        function Node(owner) {
            var _this13 = this;

            var attributes = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            _classCallCheck(this, Node);

            _EventHub.call(this);
            this._owner = owner;
            this._id = attributes.id || '';
            this._component = attributes.component;
            this._initialData = attributes.initialData || {};
            this._ports = new Map();
            this.metadata = attributes.metadata || {};
            Object.keys(attributes.ports || {}).forEach(function (id) {
                _this13.addPlaceholderPort(id, attributes.ports[id]);
            });
        }

        Node.prototype.toObject = function toObject(opts) {
            var node = {
                id: this.id,
                component: this._component,
                initialData: this._initialData,
                ports: {},
                metadata: this.metadata
            };
            this._ports.forEach(function (port, id) {
                node.ports[id] = port.toObject();
            });
            return node;
        };

        Node.prototype.addPlaceholderPort = function addPlaceholderPort(id, attributes) {
            attributes["id"] = id;
            var port = new Port(this, null, attributes);
            this._ports.set(id, port);
            return port;
        };

        Node.prototype.getPortArray = function getPortArray() {
            var xports = [];
            this._ports.forEach(function (port, id) {
                xports.push(port);
            });
            return xports;
        };

        Node.prototype.getPortByID = function getPortByID(id) {
            return this._ports.get(id);
        };

        Node.prototype.identifyPort = function identifyPort(id, protocolID) {
            var port;
            if (id) port = this._ports.get(id);else if (protocolID) {
                this._ports.forEach(function (p, id) {
                    if (p.protocolID == protocolID) port = p;
                }, this);
            }
            return port;
        };

        Node.prototype.removePort = function removePort(id) {
            return this._ports['delete'](id);
        };

        Node.prototype.loadComponent = function loadComponent(factory) {
            this.unloadComponent();
            var ctx = this._context = factory.createContext(this._component, this._initialData);
            ctx.container.registerInstance(Node, this);
            var me = this;
            return ctx.load();
        };

        Node.prototype.unloadComponent = function unloadComponent() {
            if (this._context) {
                this._context.release();
                this._context = null;
            }
        };

        _createClass(Node, [{
            key: 'owner',
            get: function get() {
                return this._owner;
            }
        }, {
            key: 'id',
            get: function get() {
                return this._id;
            },
            set: function set(id) {
                this._id = id;
            }
        }, {
            key: 'ports',
            get: function get() {
                return this._ports;
            }
        }, {
            key: 'context',
            get: function get() {
                return this._context;
            }
        }]);

        return Node;
    })(EventHub);

    exports.Node = Node;
    var RunState;
    exports.RunState = RunState;
    (function (RunState) {
        RunState[RunState["NEWBORN"] = 0] = "NEWBORN";
        RunState[RunState["LOADING"] = 1] = "LOADING";
        RunState[RunState["LOADED"] = 2] = "LOADED";
        RunState[RunState["READY"] = 3] = "READY";
        RunState[RunState["RUNNING"] = 4] = "RUNNING";
        RunState[RunState["PAUSED"] = 5] = "PAUSED";
    })(RunState || (exports.RunState = RunState = {}));

    var RuntimeContext = (function () {
        function RuntimeContext(factory, container, id, config) {
            var deps = arguments.length <= 4 || arguments[4] === undefined ? [] : arguments[4];

            _classCallCheck(this, RuntimeContext);

            this._runState = RunState.NEWBORN;
            this._factory = factory;
            this._id = id;
            this._config = config;
            this._container = container;
            for (var i in deps) {
                if (!this._container.hasResolver(deps[i])) this._container.registerSingleton(deps[i], deps[i]);
            }
        }

        RuntimeContext.prototype.load = function load() {
            var _this14 = this;

            var me = this;
            this._instance = null;
            return new Promise(function (resolve, reject) {
                me._runState = RunState.LOADING;
                _this14._factory.loadComponent(_this14, _this14._id).then(function (instance) {
                    me._instance = instance;
                    me.setRunState(RunState.LOADED);
                    resolve();
                })['catch'](function (err) {
                    me._runState = RunState.NEWBORN;
                    reject(err);
                });
            });
        };

        RuntimeContext.prototype.inState = function inState(states) {
            return new Set(states).has(this._runState);
        };

        RuntimeContext.prototype.setRunState = function setRunState(runState) {
            var inst = this.instance;
            switch (runState) {
                case RunState.LOADED:
                    if (this.inState([RunState.READY, RunState.RUNNING, RunState.PAUSED])) {
                        if (inst.teardown) {
                            inst.teardown();
                            this._instance = null;
                        }
                    }
                    break;
                case RunState.READY:
                    if (this.inState([RunState.LOADED])) {
                        var endPoints = {};
                        if (inst.initialize) endPoints = this.instance.initialize(this._config);
                        this.reconcilePorts(endPoints);
                    } else if (this.inState([RunState.RUNNING, RunState.PAUSED])) {
                        if (inst.stop) this.instance.stop();
                    } else throw new Error('Component cannot be initialized, not loaded');
                    break;
                case RunState.RUNNING:
                    if (this.inState([RunState.READY, RunState.RUNNING])) {
                        if (inst.start) this.instance.start();
                    } else if (this.inState([RunState.PAUSED])) {
                        if (inst.resume) this.instance.resume();
                    } else throw new Error('Component cannot be started, not ready');
                    break;
                case RunState.PAUSED:
                    if (this.inState([RunState.RUNNING])) {
                        if (inst.pause) this.instance.pause();
                    } else if (this.inState([RunState.PAUSED])) {} else throw new Error('Component cannot be paused');
                    break;
            }
            this._runState = runState;
        };

        RuntimeContext.prototype.reconcilePorts = function reconcilePorts(endPoints) {};

        RuntimeContext.prototype.release = function release() {
            this._instance = null;
            this._factory = null;
        };

        _createClass(RuntimeContext, [{
            key: 'instance',
            get: function get() {
                return this._instance;
            }
        }, {
            key: 'container',
            get: function get() {
                return this._container;
            }
        }, {
            key: 'runState',
            get: function get() {
                return this._runState;
            }
        }]);

        return RuntimeContext;
    })();

    exports.RuntimeContext = RuntimeContext;

    ;

    var ModuleRegistryEntry = function ModuleRegistryEntry(address) {
        _classCallCheck(this, ModuleRegistryEntry);
    };

    var SystemModuleLoader = (function () {
        function SystemModuleLoader() {
            _classCallCheck(this, SystemModuleLoader);

            this.moduleRegistry = new Map();
        }

        SystemModuleLoader.prototype.getOrCreateModuleRegistryEntry = function getOrCreateModuleRegistryEntry(address) {
            return this.moduleRegistry[address] || (this.moduleRegistry[address] = new ModuleRegistryEntry(address));
        };

        SystemModuleLoader.prototype.loadModule = function loadModule(id) {
            var _this15 = this;

            var newId = System.normalizeSync(id);
            var existing = this.moduleRegistry[newId];
            if (existing) {
                return Promise.resolve(existing);
            }
            return System['import'](newId).then(function (m) {
                _this15.moduleRegistry[newId] = m;
                return m;
            });
        };

        return SystemModuleLoader;
    })();

    exports.SystemModuleLoader = SystemModuleLoader;

    var ComponentFactory = (function () {
        function ComponentFactory(container, loader) {
            _classCallCheck(this, ComponentFactory);

            this._loader = loader;
            this._container = container || new _aureliaDependencyInjection.Container();
            this._components = new Map();
            this._components.set(undefined, Object);
            this._components.set("", Object);
        }

        ComponentFactory.prototype.createContext = function createContext(id, config) {
            var deps = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

            var childContainer = this._container.createChild();
            return new RuntimeContext(this, childContainer, id, config, deps);
        };

        ComponentFactory.prototype.getChildContainer = function getChildContainer() {
            return;
        };

        ComponentFactory.prototype.loadComponent = function loadComponent(ctx, id) {
            var _this16 = this;

            var createComponent = function createComponent(ctor) {
                var newInstance = ctx.container.invoke(ctor);
                return newInstance;
            };
            var me = this;
            return new Promise(function (resolve, reject) {
                var ctor = _this16.get(id);
                if (ctor) {
                    resolve(createComponent(ctor));
                } else if (_this16._loader) {
                    _this16._loader.loadModule(id).then(function (ctor) {
                        me._components.set(id, ctor);
                        resolve(createComponent(ctor));
                    })['catch'](function (e) {
                        reject('ComponentFactory: Unable to load component "' + id + '" - ' + e);
                    });
                } else {
                    reject('ComponentFactory: Component "' + id + '" not registered, and Loader not available');
                }
            });
        };

        ComponentFactory.prototype.get = function get(id) {
            return this._components.get(id);
        };

        ComponentFactory.prototype.register = function register(id, ctor) {
            this._components.set(id, ctor);
        };

        return ComponentFactory;
    })();

    exports.ComponentFactory = ComponentFactory;

    var Link = (function () {
        function Link(owner) {
            var attributes = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            _classCallCheck(this, Link);

            this._owner = owner;
            this._id = attributes.id || "";
            this._from = attributes['from'];
            this._to = attributes['to'];
            this._protocolID = attributes['protocol'] || 'any';
            this.metadata = attributes.metadata || { x: 100, y: 100 };
        }

        Link.prototype.toObject = function toObject(opts) {
            var link = {
                id: this._id,
                protocol: this._protocolID != 'any' ? this._protocolID : undefined,
                metadata: this.metadata,
                from: this._from,
                to: this._to
            };
            return link;
        };

        Link.prototype.connect = function connect(channel) {
            var fromPort = this.fromNode.identifyPort(this._from.portID, this._protocolID);
            var toPort = this.toNode.identifyPort(this._to.portID, this._protocolID);
            this._channel = channel;
            fromPort.endPoint.attach(channel);
            toPort.endPoint.attach(channel);
        };

        Link.prototype.disconnect = function disconnect() {
            var _this17 = this;

            var chan = this._channel;
            if (chan) {
                this._channel.endPoints.forEach(function (endPoint) {
                    endPoint.detach(_this17._channel);
                });
                this._channel = undefined;
            }
            return chan;
        };

        _createClass(Link, [{
            key: 'id',
            set: function set(id) {
                this._id = id;
            }
        }, {
            key: 'fromNode',
            get: function get() {
                return this._owner.getNodeByID(this._from.nodeID);
            }
        }, {
            key: 'fromPort',
            get: function get() {
                var node = this.fromNode;
                return node ? node.identifyPort(this._from.portID, this._protocolID) : undefined;
            },
            set: function set(port) {
                this._from = {
                    nodeID: port.owner.id,
                    portID: port.id
                };
                this._protocolID = port.protocolID;
            }
        }, {
            key: 'toNode',
            get: function get() {
                return this._owner.getNodeByID(this._to.nodeID);
            }
        }, {
            key: 'toPort',
            get: function get() {
                var node = this.toNode;
                return node ? node.identifyPort(this._to.portID, this._protocolID) : undefined;
            },
            set: function set(port) {
                this._to = {
                    nodeID: port.owner.id,
                    portID: port.id
                };
                this._protocolID = port.protocolID;
            }
        }, {
            key: 'protocolID',
            get: function get() {
                return this._protocolID;
            }
        }]);

        return Link;
    })();

    exports.Link = Link;

    var Network = (function (_EventHub2) {
        _inherits(Network, _EventHub2);

        function Network(factory, graph) {
            var _this18 = this;

            _classCallCheck(this, Network);

            _EventHub2.call(this);
            this._factory = factory;
            this._graph = graph || new Graph(null, {});
            var me = this;
            this._graph.subscribe(Graph.EVENT_ADD_NODE, function (data) {
                var runState = me._graph.context.runState;
                if (runState != RunState.NEWBORN) {
                    (function () {
                        var node = data.node;

                        node.loadComponent(me._factory).then(function () {
                            if (Network.inState([RunState.RUNNING, RunState.PAUSED, RunState.READY], runState)) Network.setRunState(node, RunState.READY);
                            if (Network.inState([RunState.RUNNING, RunState.PAUSED], runState)) Network.setRunState(node, runState);
                            _this18.publish(Network.EVENT_GRAPH_CHANGE, { node: node });
                        });
                    })();
                }
            });
        }

        Network.prototype.loadComponents = function loadComponents() {
            var _this19 = this;

            var me = this;
            this.publish(Network.EVENT_STATE_CHANGE, { state: RunState.LOADING });
            return this._graph.loadComponent(this._factory).then(function () {
                _this19.publish(Network.EVENT_STATE_CHANGE, { state: RunState.LOADED });
            });
        };

        Network.prototype.initialize = function initialize() {
            this.setRunState(RunState.READY);
        };

        Network.prototype.teardown = function teardown() {
            this.setRunState(RunState.LOADED);
        };

        Network.inState = function inState(states, runState) {
            return new Set(states).has(runState);
        };

        Network.setRunState = function setRunState(node, runState) {
            var ctx = node.context;
            var currentState = ctx.runState;
            if (node instanceof Graph) {
                var nodes = node.nodes;
                if (runState == RunState.LOADED && currentState >= RunState.READY) {
                    var links = node.links;
                    links.forEach(function (link) {
                        Network.unwireLink(link);
                    });
                }
                nodes.forEach(function (subNode) {
                    Network.setRunState(subNode, runState);
                });
                ctx.setRunState(runState);
                if (runState == RunState.READY && currentState >= RunState.LOADED) {
                    var links = node.links;
                    links.forEach(function (link) {
                        Network.wireLink(link);
                    });
                }
            } else {
                ctx.setRunState(runState);
            }
        };

        Network.unwireLink = function unwireLink(link) {
            var fromNode = link.fromNode;
            var toNode = link.toNode;
            var chan = link.disconnect();
            if (chan) chan.deactivate();
        };

        Network.wireLink = function wireLink(link) {
            var fromNode = link.fromNode;
            var toNode = link.toNode;
            var channel = new Channel();
            link.connect(channel);
            channel.activate();
        };

        Network.prototype.setRunState = function setRunState(runState) {
            Network.setRunState(this._graph, runState);
            this.publish(Network.EVENT_STATE_CHANGE, { state: runState });
        };

        Network.prototype.start = function start() {
            var initiallyPaused = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

            this.setRunState(initiallyPaused ? RunState.PAUSED : RunState.RUNNING);
        };

        Network.prototype.step = function step() {};

        Network.prototype.stop = function stop() {
            this.setRunState(RunState.READY);
        };

        Network.prototype.pause = function pause() {
            this.setRunState(RunState.PAUSED);
        };

        Network.prototype.resume = function resume() {
            this.setRunState(RunState.RUNNING);
        };

        _createClass(Network, [{
            key: 'graph',
            get: function get() {
                return this._graph;
            }
        }]);

        return Network;
    })(EventHub);

    exports.Network = Network;

    Network.EVENT_STATE_CHANGE = 'network:state-change';
    Network.EVENT_GRAPH_CHANGE = 'network:graph-change';

    var Graph = (function (_Node) {
        _inherits(Graph, _Node);

        function Graph(owner) {
            var attributes = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            _classCallCheck(this, Graph);

            _Node.call(this, owner, attributes);
            this.initFromObject(attributes);
        }

        Graph.prototype.initFromString = function initFromString(jsonString) {
            this.initFromObject(JSON.parse(jsonString));
        };

        Graph.prototype.initFromObject = function initFromObject(attributes) {
            var _this20 = this;

            this.id = attributes.id || "$graph";
            this._nodes = new Map();
            this._links = new Map();
            Object.keys(attributes.nodes || {}).forEach(function (id) {
                _this20.addNode(id, attributes.nodes[id]);
            });
            Object.keys(attributes.links || {}).forEach(function (id) {
                _this20.addLink(id, attributes.links[id]);
            });
        };

        Graph.prototype.toObject = function toObject(opts) {
            var graph = _Node.prototype.toObject.call(this);
            var nodes = graph["nodes"] = {};
            this._nodes.forEach(function (node, id) {
                nodes[id] = node.toObject();
            });
            var links = graph["links"] = {};
            this._links.forEach(function (link, id) {
                links[id] = link.toObject();
            });
            return graph;
        };

        Graph.prototype.loadComponent = function loadComponent(factory) {
            var _this21 = this;

            return new Promise(function (resolve, reject) {
                var pendingCount = 0;
                var nodes = new Map(_this21._nodes);
                nodes.set('$graph', _this21);
                nodes.forEach(function (node, id) {
                    var done = undefined;
                    pendingCount++;
                    if (node == _this21) {
                        done = _Node.prototype.loadComponent.call(_this21, factory);
                    } else {
                        done = node.loadComponent(factory);
                    }
                    done.then(function () {
                        --pendingCount;
                        if (pendingCount == 0) resolve();
                    })['catch'](function (reason) {
                        reject(reason);
                    });
                });
            });
        };

        Graph.prototype.getNodeByID = function getNodeByID(id) {
            if (id == '$graph') return this;
            return this._nodes.get(id);
        };

        Graph.prototype.addNode = function addNode(id, attributes) {
            var node = new Node(this, attributes);
            node.id = id;
            this._nodes.set(id, node);
            this.publish(Graph.EVENT_ADD_NODE, { node: node });
            return node;
        };

        Graph.prototype.renameNode = function renameNode(id, newID) {
            var node = this._nodes.get(id);
            if (id != newID) {
                var eventData = { node: node, attrs: { id: node.id } };
                this._nodes['delete'](id);
                node.id = newID;
                this._nodes.set(newID, node);
                this.publish(Graph.EVENT_UPD_NODE, eventData);
            }
        };

        Graph.prototype.removeNode = function removeNode(id) {
            var node = this._nodes.get(id);
            if (node) this.publish(Graph.EVENT_DEL_NODE, { node: node });
            return this._nodes['delete'](id);
        };

        Graph.prototype.getLinkByID = function getLinkByID(id) {
            return this._links[id];
        };

        Graph.prototype.addLink = function addLink(id, attributes) {
            var link = new Link(this, attributes);
            link.id = id;
            this._links.set(id, link);
            this.publish(Graph.EVENT_ADD_LINK, { link: link });
            return link;
        };

        Graph.prototype.renameLink = function renameLink(id, newID) {
            var link = this._links.get(id);
            this._links['delete'](id);
            var eventData = { link: link, attrs: { id: link.id } };
            link.id = newID;
            this.publish(Graph.EVENT_UPD_NODE, eventData);
            this._links.set(newID, link);
        };

        Graph.prototype.removeLink = function removeLink(id) {
            var link = this._links.get(id);
            if (link) this.publish(Graph.EVENT_DEL_LINK, { link: link });
            return this._links['delete'](id);
        };

        Graph.prototype.addPublicPort = function addPublicPort(id, attributes) {
            attributes["id"] = id;
            var port = new PublicPort(this, null, attributes);
            this._ports.set(id, port);
            return port;
        };

        _createClass(Graph, [{
            key: 'nodes',
            get: function get() {
                return this._nodes;
            }
        }, {
            key: 'links',
            get: function get() {
                return this._links;
            }
        }]);

        return Graph;
    })(Node);

    exports.Graph = Graph;

    Graph.EVENT_ADD_NODE = 'graph:add-node';
    Graph.EVENT_UPD_NODE = 'graph:upd-node';
    Graph.EVENT_DEL_NODE = 'graph:del-node';
    Graph.EVENT_ADD_LINK = 'graph:add-link';
    Graph.EVENT_UPD_LINK = 'graph:upd-link';
    Graph.EVENT_DEL_LINK = 'graph:del-link';

    var SimulationEngine = (function () {
        function SimulationEngine(loader, container) {
            _classCallCheck(this, SimulationEngine);

            this.loader = loader;
            this.container = container;
        }

        SimulationEngine.prototype.getComponentFactory = function getComponentFactory() {
            return new ComponentFactory(this.container, this.loader);
        };

        return SimulationEngine;
    })();

    exports.SimulationEngine = SimulationEngine;
});