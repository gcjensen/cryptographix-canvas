  import { Container, autoinject as inject } from 'aurelia-dependency-injection';
  import { EventAggregator } from 'aurelia-event-aggregator';

export class HexCodec {
    static decode(a) {
        if (HexCodec.hexDecodeMap == undefined) {
            var hex = "0123456789ABCDEF";
            var allow = " \f\n\r\t\u00A0\u2028\u2029";
            var dec = [];
            for (var i = 0; i < 16; ++i)
                dec[hex.charAt(i)] = i;
            hex = hex.toLowerCase();
            for (var i = 10; i < 16; ++i)
                dec[hex.charAt(i)] = i;
            for (var i = 0; i < allow.length; ++i)
                dec[allow.charAt(i)] = -1;
            HexCodec.hexDecodeMap = dec;
        }
        var out = [];
        var bits = 0, char_count = 0;
        for (var i = 0; i < a.length; ++i) {
            var c = a.charAt(i);
            if (c == '=')
                break;
            var b = HexCodec.hexDecodeMap[c];
            if (b == -1)
                continue;
            if (b == undefined)
                throw 'Illegal character at offset ' + i;
            bits |= b;
            if (++char_count >= 2) {
                out.push(bits);
                bits = 0;
                char_count = 0;
            }
            else {
                bits <<= 4;
            }
        }
        if (char_count)
            throw "Hex encoding incomplete: 4 bits missing";
        return Uint8Array.from(out);
    }
}

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
export class Base64Codec {
    static decode(b64) {
        if (b64.length % 4 > 0) {
            throw new Error('Invalid base64 string. Length must be a multiple of 4');
        }
        function decode(elt) {
            var code = elt.charCodeAt(0);
            if (code === BASE64SPECIALS.PLUS || code === BASE64SPECIALS.PLUS_URL_SAFE)
                return 62;
            if (code === BASE64SPECIALS.SLASH || code === BASE64SPECIALS.SLASH_URL_SAFE)
                return 63;
            if (code >= BASE64SPECIALS.NUMBER) {
                if (code < BASE64SPECIALS.NUMBER + 10)
                    return code - BASE64SPECIALS.NUMBER + 26 + 26;
                if (code < BASE64SPECIALS.UPPER + 26)
                    return code - BASE64SPECIALS.UPPER;
                if (code < BASE64SPECIALS.LOWER + 26)
                    return code - BASE64SPECIALS.LOWER + 26;
            }
            throw new Error('Invalid base64 string. Character not valid');
        }
        let len = b64.length;
        let placeHolders = b64.charAt(len - 2) === '=' ? 2 : b64.charAt(len - 1) === '=' ? 1 : 0;
        let arr = new Uint8Array(b64.length * 3 / 4 - placeHolders);
        let l = placeHolders > 0 ? b64.length - 4 : b64.length;
        var L = 0;
        function push(v) {
            arr[L++] = v;
        }
        let i = 0, j = 0;
        for (; i < l; i += 4, j += 3) {
            let tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3));
            push((tmp & 0xFF0000) >> 16);
            push((tmp & 0xFF00) >> 8);
            push(tmp & 0xFF);
        }
        if (placeHolders === 2) {
            let tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4);
            push(tmp & 0xFF);
        }
        else if (placeHolders === 1) {
            let tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2);
            push((tmp >> 8) & 0xFF);
            push(tmp & 0xFF);
        }
        return arr;
    }
    static encode(uint8) {
        var i;
        var extraBytes = uint8.length % 3;
        var output = '';
        const lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        function encode(num) {
            return lookup.charAt(num);
        }
        function tripletToBase64(num) {
            return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F);
        }
        let length = uint8.length - extraBytes;
        for (i = 0; i < length; i += 3) {
            let temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
            output += tripletToBase64(temp);
        }
        switch (extraBytes) {
            case 1:
                let temp = uint8[uint8.length - 1];
                output += encode(temp >> 2);
                output += encode((temp << 4) & 0x3F);
                output += '==';
                break;
            case 2:
                temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
                output += encode(temp >> 10);
                output += encode((temp >> 4) & 0x3F);
                output += encode((temp << 2) & 0x3F);
                output += '=';
                break;
            default:
                break;
        }
        return output;
    }
}



export class ByteArray {
    constructor(bytes, format, opt) {
        if (!bytes) {
            this.byteArray = new Uint8Array(0);
        }
        else if (!format || format == ByteArray.BYTES) {
            if (bytes instanceof ArrayBuffer)
                this.byteArray = new Uint8Array(bytes);
            else if (bytes instanceof Uint8Array)
                this.byteArray = bytes;
            else if (bytes instanceof ByteArray)
                this.byteArray = bytes.byteArray;
            else if (bytes instanceof Array)
                this.byteArray = new Uint8Array(bytes);
        }
        else if (typeof bytes == "string") {
            if (format == ByteArray.BASE64) {
                this.byteArray = Base64Codec.decode(bytes);
            }
            else if (format == ByteArray.HEX) {
                this.byteArray = HexCodec.decode(bytes);
            }
            else if (format == ByteArray.UTF8) {
                let l = bytes.length;
                let ba = new Uint8Array(l);
                for (let i = 0; i < l; ++i)
                    ba[i] = bytes.charCodeAt(i);
                this.byteArray = ba;
            }
        }
        if (!this.byteArray) {
            throw new Error("Invalid Params for ByteArray()");
        }
    }
    get length() {
        return this.byteArray.length;
    }
    set length(len) {
        if (this.byteArray.length >= len) {
            this.byteArray = this.byteArray.slice(0, len);
        }
        else {
            let old = this.byteArray;
            this.byteArray = new Uint8Array(len);
            this.byteArray.set(old, 0);
        }
    }
    get backingArray() {
        return this.byteArray;
    }
    equals(value) {
        let ba = this.byteArray;
        let vba = value.byteArray;
        var ok = (ba.length == vba.length);
        if (ok) {
            for (let i = 0; i < ba.length; ++i)
                ok = ok && (ba[i] == vba[i]);
        }
        return ok;
    }
    byteAt(offset) {
        return this.byteArray[offset];
    }
    wordAt(offset) {
        return (this.byteArray[offset] << 8)
            + (this.byteArray[offset + 1]);
    }
    littleEndianWordAt(offset) {
        return (this.byteArray[offset])
            + (this.byteArray[offset + 1] << 8);
    }
    dwordAt(offset) {
        return (this.byteArray[offset] << 24)
            + (this.byteArray[offset + 1] << 16)
            + (this.byteArray[offset + 2] << 8)
            + (this.byteArray[offset + 3]);
    }
    setByteAt(offset, value) {
        this.byteArray[offset] = value;
        return this;
    }
    setBytesAt(offset, value) {
        this.byteArray.set(value.byteArray, offset);
        return this;
    }
    clone() {
        return new ByteArray(this.byteArray.slice());
    }
    bytesAt(offset, count) {
        if (!Number.isInteger(count))
            count = (this.length - offset);
        return new ByteArray(this.byteArray.slice(offset, offset + count));
    }
    viewAt(offset, count) {
        if (!Number.isInteger(count))
            count = (this.length - offset);
        return new ByteArray(this.byteArray.subarray(offset, offset + count));
    }
    addByte(value) {
        this.byteArray[this.byteArray.length] = value;
        return this;
    }
    setLength(len) {
        this.length = len;
        return this;
    }
    concat(bytes) {
        let ba = this.byteArray;
        this.byteArray = new Uint8Array(ba.length + bytes.length);
        this.byteArray.set(ba);
        this.byteArray.set(bytes.byteArray, ba.length);
        return this;
    }
    not() {
        let ba = this.byteArray;
        for (let i = 0; i < ba.length; ++i)
            ba[i] = ba[i] ^ 0xFF;
        return this;
    }
    and(value) {
        let ba = this.byteArray;
        let vba = value.byteArray;
        for (let i = 0; i < ba.length; ++i)
            ba[i] = ba[i] & vba[i];
        return this;
    }
    or(value) {
        let ba = this.byteArray;
        let vba = value.byteArray;
        for (let i = 0; i < ba.length; ++i)
            ba[i] = ba[i] | vba[i];
        return this;
    }
    xor(value) {
        let ba = this.byteArray;
        let vba = value.byteArray;
        for (let i = 0; i < ba.length; ++i)
            ba[i] = ba[i] ^ vba[i];
        return this;
    }
    toString(format, opt) {
        let s = "";
        for (var i = 0; i < this.length; ++i)
            s += ("0" + this.byteArray[i].toString(16)).substring(-2);
        return s;
    }
}
ByteArray.BYTES = 0;
ByteArray.HEX = 1;
ByteArray.BASE64 = 2;
ByteArray.UTF8 = 3;

export class Key {
    constructor(id, key) {
        this.id = id;
        if (key)
            this.cryptoKey = key;
        else {
            this.cryptoKey =
                {
                    type: "",
                    algorithm: "",
                    extractable: true,
                    usages: []
                };
        }
    }
    get type() {
        return this.cryptoKey.type;
    }
    get algorithm() {
        return this.cryptoKey.algorithm;
    }
    get extractable() {
        return this.cryptoKey.extractable;
    }
    get usages() {
        return this.cryptoKey.usages;
    }
    get innerKey() {
        return this.cryptoKey;
    }
}


export class PrivateKey extends Key {
}


export class PublicKey extends Key {
}

export class KeyPair {
}


export class CryptographicService {
    constructor() {
        this.crypto = window.crypto.subtle;
        if (!this.crypto && msrcrypto)
            this.crypto = msrcrypto;
    }
    decrypt(algorithm, key, data) {
        return new Promise((resolve, reject) => {
            this.crypto.decrypt(algorithm, key.innerKey, data.backingArray)
                .then((res) => { resolve(new ByteArray(res)); })
                .catch((err) => { reject(err); });
        });
    }
    digest(algorithm, data) {
        return new Promise((resolve, reject) => {
            this.crypto.digest(algorithm, data.backingArray)
                .then((res) => { resolve(new ByteArray(res)); })
                .catch((err) => { reject(err); });
        });
    }
    encrypt(algorithm, key, data) {
        return new Promise((resolve, reject) => {
            this.crypto.encrypt(algorithm, key.innerKey, data.backingArray)
                .then((res) => { resolve(new ByteArray(res)); })
                .catch((err) => { reject(err); });
        });
    }
    exportKey(format, key) {
        return new Promise((resolve, reject) => {
            this.crypto.exportKey(format, key.innerKey)
                .then((res) => { resolve(new ByteArray(res)); })
                .catch((err) => { reject(err); });
        });
    }
    generateKey(algorithm, extractable, keyUsages) {
        return new Promise((resolve, reject) => {
        });
    }
    importKey(format, keyData, algorithm, extractable, keyUsages) {
        return new Promise((resolve, reject) => {
            this.crypto.importKey(format, keyData.backingArray, algorithm, extractable, keyUsages)
                .then((res) => { resolve(res); })
                .catch((err) => { reject(err); });
        });
    }
    sign(algorithm, key, data) {
        return new Promise((resolve, reject) => {
            this.crypto.sign(algorithm, key.innerKey, data.backingArray)
                .then((res) => { resolve(new ByteArray(res)); })
                .catch((err) => { reject(err); });
        });
    }
    verify(algorithm, key, signature, data) {
        return new Promise((resolve, reject) => {
            this.crypto.verify(algorithm, key.innerKey, signature.backingArray, data.backingArray)
                .then((res) => { resolve(new ByteArray(res)); })
                .catch((err) => { reject(err); });
        });
    }
}

export { Container, inject };

export class EventHub {
    constructor() {
        this._eventAggregator = new EventAggregator();
    }
    publish(event, data) {
        this._eventAggregator.publish(event, data);
    }
    subscribe(event, handler) {
        return this._eventAggregator.subscribe(event, handler);
    }
    subscribeOnce(event, handler) {
        return this._eventAggregator.subscribeOnce(event, handler);
    }
}

export class Enum {
}
;
export class KindInfo {
    constructor() {
        this.fields = {};
    }
}
export class KindBuilder {
    constructor(ctor, description) {
        this.ctor = ctor;
        ctor.kindInfo = {
            name: ctor.name,
            description: description,
            fields: {}
        };
    }
    static init(ctor, description) {
        let builder = new KindBuilder(ctor, description);
        return builder;
    }
    field(name, description, dataType, opts) {
        this.ctor.kindInfo.fields[name] = {
            description: description,
            dataType: dataType
        };
        return this;
    }
}
var Oranges;
(function (Oranges) {
    Oranges[Oranges["BLOOD"] = 0] = "BLOOD";
    Oranges[Oranges["SEVILLE"] = 1] = "SEVILLE";
    Oranges[Oranges["SATSUMA"] = 2] = "SATSUMA";
    Oranges[Oranges["NAVEL"] = 3] = "NAVEL";
})(Oranges || (Oranges = {}));
class FruityKind {
}
KindBuilder.init(FruityKind, 'a Collection of fruit')
    .field('banana', 'a banana', String)
    .field('apple', 'an apple or pear', Number)
    .field('orange', 'some sort of orange', Enum);

export class Message {
    constructor(header, payload) {
        this._header = header || {};
        this._payload = payload;
    }
    get header() {
        return this._header;
    }
    get payload() {
        return this._payload;
    }
}
export class KindMessage extends Message {
}

var window = window || {};
export class TaskScheduler {
    constructor() {
        this.taskQueue = [];
        var self = this;
        if (typeof TaskScheduler.BrowserMutationObserver === 'function') {
            this.requestFlushTaskQueue = TaskScheduler.makeRequestFlushFromMutationObserver(function () {
                return self.flushTaskQueue();
            });
        }
        else {
            this.requestFlushTaskQueue = TaskScheduler.makeRequestFlushFromTimer(function () {
                return self.flushTaskQueue();
            });
        }
    }
    static makeRequestFlushFromMutationObserver(flush) {
        var toggle = 1;
        var observer = new TaskScheduler.BrowserMutationObserver(flush);
        var node = document.createTextNode('');
        observer.observe(node, { characterData: true });
        return function requestFlush() {
            toggle = -toggle;
            node["data"] = toggle;
        };
    }
    static makeRequestFlushFromTimer(flush) {
        return function requestFlush() {
            var timeoutHandle = setTimeout(handleFlushTimer, 0);
            var intervalHandle = setInterval(handleFlushTimer, 50);
            function handleFlushTimer() {
                clearTimeout(timeoutHandle);
                clearInterval(intervalHandle);
                flush();
            }
        };
    }
    shutdown() {
    }
    queueTask(task) {
        if (this.taskQueue.length < 1) {
            this.requestFlushTaskQueue();
        }
        this.taskQueue.push(task);
    }
    flushTaskQueue() {
        var queue = this.taskQueue, capacity = TaskScheduler.taskQueueCapacity, index = 0, task;
        while (index < queue.length) {
            task = queue[index];
            try {
                task.call();
            }
            catch (error) {
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
    }
    onError(error, task) {
        if ('onError' in task) {
            task.onError(error);
        }
        else if (TaskScheduler.hasSetImmediate) {
            setImmediate(function () {
                throw error;
            });
        }
        else {
            setTimeout(function () {
                throw error;
            }, 0);
        }
    }
}
TaskScheduler.BrowserMutationObserver = window["MutationObserver"] || window["WebKitMutationObserver"];
TaskScheduler.hasSetImmediate = typeof setImmediate === 'function';
TaskScheduler.taskQueueCapacity = 1024;



export class Channel {
    constructor() {
        this._active = false;
        this._endPoints = [];
    }
    shutdown() {
        this._active = false;
        this._endPoints = [];
        if (this._taskScheduler) {
            this._taskScheduler.shutdown();
            this._taskScheduler = undefined;
        }
    }
    get active() {
        return this._active;
    }
    activate() {
        this._taskScheduler = new TaskScheduler();
        this._active = true;
    }
    deactivate() {
        this._taskScheduler = undefined;
        this._active = false;
    }
    addEndPoint(endPoint) {
        this._endPoints.push(endPoint);
    }
    removeEndPoint(endPoint) {
        let idx = this._endPoints.indexOf(endPoint);
        if (idx >= 0) {
            this._endPoints.splice(idx, 1);
        }
    }
    get endPoints() {
        return this._endPoints;
    }
    sendMessage(origin, message) {
        let isResponse = (message.header && message.header.isResponse);
        if (!this._active)
            return;
        if (origin.direction == Direction.IN && !isResponse)
            throw new Error('Unable to send on IN port');
        this._endPoints.forEach(endPoint => {
            if (origin != endPoint) {
                if (endPoint.direction != Direction.OUT || isResponse) {
                    this._taskScheduler.queueTask(() => {
                        endPoint.handleMessage(message, origin, this);
                    });
                }
            }
        });
    }
}

export var Direction;
(function (Direction) {
    Direction[Direction["IN"] = 1] = "IN";
    Direction[Direction["OUT"] = 2] = "OUT";
    Direction[Direction["INOUT"] = 3] = "INOUT";
})(Direction || (Direction = {}));
;
export class EndPoint {
    constructor(id, direction = Direction.INOUT) {
        this._id = id;
        this._direction = direction;
        this._channels = [];
        this._messageListeners = [];
    }
    shutdown() {
        this.detachAll();
        this._messageListeners = [];
    }
    get id() {
        return this._id;
    }
    attach(channel) {
        this._channels.push(channel);
        channel.addEndPoint(this);
    }
    detach(channelToDetach) {
        let idx = this._channels.indexOf(channelToDetach);
        if (idx >= 0) {
            channelToDetach.removeEndPoint(this);
            this._channels.splice(idx, 1);
        }
    }
    detachAll() {
        this._channels.forEach(channel => {
            channel.removeEndPoint(this);
        });
        this._channels = [];
    }
    get attached() {
        return (this._channels.length > 0);
    }
    get direction() {
        return this._direction;
    }
    handleMessage(message, fromEndPoint, fromChannel) {
        this._messageListeners.forEach(messageListener => {
            messageListener(message, this, fromChannel);
        });
    }
    sendMessage(message) {
        this._channels.forEach(channel => {
            channel.sendMessage(this, message);
        });
    }
    onMessage(messageListener) {
        this._messageListeners.push(messageListener);
    }
}


export var ProtocolTypeBits;
(function (ProtocolTypeBits) {
    ProtocolTypeBits[ProtocolTypeBits["PACKET"] = 0] = "PACKET";
    ProtocolTypeBits[ProtocolTypeBits["STREAM"] = 1] = "STREAM";
    ProtocolTypeBits[ProtocolTypeBits["ONEWAY"] = 0] = "ONEWAY";
    ProtocolTypeBits[ProtocolTypeBits["CLIENTSERVER"] = 4] = "CLIENTSERVER";
    ProtocolTypeBits[ProtocolTypeBits["PEER2PEER"] = 6] = "PEER2PEER";
    ProtocolTypeBits[ProtocolTypeBits["UNTYPED"] = 0] = "UNTYPED";
    ProtocolTypeBits[ProtocolTypeBits["TYPED"] = 8] = "TYPED";
})(ProtocolTypeBits || (ProtocolTypeBits = {}));
export class Protocol {
}
Protocol.protocolType = 0;
class ClientServerProtocol extends Protocol {
}
ClientServerProtocol.protocolType = ProtocolTypeBits.CLIENTSERVER | ProtocolTypeBits.TYPED;
class APDU {
}
class APDUMessage extends Message {
}
class APDUProtocol extends ClientServerProtocol {
}

export class PortInfo {
    constructor() {
        this.index = 0;
        this.required = false;
    }
}

export class StoreInfo {
}

export class ComponentInfo {
    constructor() {
        this.detailLink = '';
        this.category = '';
        this.author = '';
        this.ports = {};
        this.stores = {};
    }
}


export class ComponentBuilder {
    constructor(ctor, description, category) {
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
    static init(ctor, description, category) {
        let builder = new ComponentBuilder(ctor, description, category);
        return builder;
    }
    port(id, direction, opts) {
        opts = opts || {};
        this.ctor.componentInfo.ports[id] = {
            direction: direction,
            protocol: opts.protocol,
            index: opts.index,
            required: opts.required
        };
        return this;
    }
    name(name) {
        this.ctor.componentInfo.name = name;
        return this;
    }
}
class C {
}
ComponentBuilder.init(C, 'Test Component')
    .port('p1', Direction.IN);


export class Port {
    constructor(owner, endPoint, attributes = {}) {
        if (!endPoint) {
            let direction = attributes.direction || Direction.INOUT;
            if (typeof attributes.direction == "string")
                direction = Direction[direction.toUpperCase()];
            endPoint = new EndPoint(attributes.id, direction);
        }
        this._owner = owner;
        this._endPoint = endPoint;
        this._protocolID = attributes['protocol'] || 'any';
        this.metadata = attributes.metadata || { x: 100, y: 100 };
    }
    get endPoint() {
        return this._endPoint;
    }
    set endPoint(endPoint) {
        this._endPoint = endPoint;
    }
    toObject(opts) {
        var port = {
            id: this._endPoint.id,
            direction: this._endPoint.direction,
            protocol: (this._protocolID != 'any') ? this._protocolID : undefined,
            metadata: this.metadata,
        };
        return port;
    }
    get owner() {
        return this._owner;
    }
    get protocolID() {
        return this._protocolID;
    }
    get id() {
        return this._endPoint.id;
    }
    get direction() {
        return this._endPoint.direction;
    }
}
export class PublicPort extends Port {
    constructor(owner, endPoint, attributes) {
        super(owner, endPoint, attributes);
        let proxyDirection = (this._endPoint.direction == Direction.IN)
            ? Direction.OUT
            : (this._endPoint.direction == Direction.OUT)
                ? Direction.IN
                : Direction.INOUT;
        this.proxyEndPoint = new EndPoint(this._endPoint.id, proxyDirection);
        this.proxyEndPoint.onMessage((message) => {
            this._endPoint.handleMessage(message, this.proxyEndPoint, this.proxyChannel);
        });
        this._endPoint.onMessage((message) => {
            this.proxyEndPoint.sendMessage(message);
        });
        this.proxyChannel = null;
    }
    connectPrivate(channel) {
        this.proxyChannel = channel;
        this.proxyEndPoint.attach(channel);
    }
    disconnectPrivate() {
        this.proxyEndPoint.detach(this.proxyChannel);
    }
    toObject(opts) {
        var port = super.toObject(opts);
        return port;
    }
}



export class Node extends EventHub {
    constructor(owner, attributes = {}) {
        super();
        this._owner = owner;
        this._id = attributes.id || '';
        this._component = attributes.component;
        this._initialData = attributes.initialData || {};
        this._ports = new Map();
        this.metadata = attributes.metadata || {};
        Object.keys(attributes.ports || {}).forEach((id) => {
            this.addPlaceholderPort(id, attributes.ports[id]);
        });
    }
    toObject(opts) {
        var node = {
            id: this.id,
            component: this._component,
            initialData: this._initialData,
            ports: {},
            metadata: this.metadata
        };
        this._ports.forEach((port, id) => {
            node.ports[id] = port.toObject();
        });
        return node;
    }
    get owner() {
        return this._owner;
    }
    get id() {
        return this._id;
    }
    set id(id) {
        this._id = id;
    }
    addPlaceholderPort(id, attributes) {
        attributes["id"] = id;
        let port = new Port(this, null, attributes);
        this._ports.set(id, port);
        return port;
    }
    get ports() {
        return this._ports;
    }
    getPortArray() {
        let xports = [];
        this._ports.forEach((port, id) => {
            xports.push(port);
        });
        return xports;
    }
    getPortByID(id) {
        return this._ports.get(id);
    }
    identifyPort(id, protocolID) {
        var port;
        if (id)
            port = this._ports.get(id);
        else if (protocolID) {
            this._ports.forEach((p, id) => {
                if (p.protocolID == protocolID)
                    port = p;
            }, this);
        }
        return port;
    }
    removePort(id) {
        return this._ports.delete(id);
    }
    loadComponent(factory) {
        this.unloadComponent();
        let ctx = this._context = factory.createContext(this._component, this._initialData);
        ctx.container.registerInstance(Node, this);
        let me = this;
        return ctx.load();
    }
    get context() {
        return this._context;
    }
    unloadComponent() {
        if (this._context) {
            this._context.release();
            this._context = null;
        }
    }
}

export var RunState;
(function (RunState) {
    RunState[RunState["NEWBORN"] = 0] = "NEWBORN";
    RunState[RunState["LOADING"] = 1] = "LOADING";
    RunState[RunState["LOADED"] = 2] = "LOADED";
    RunState[RunState["READY"] = 3] = "READY";
    RunState[RunState["RUNNING"] = 4] = "RUNNING";
    RunState[RunState["PAUSED"] = 5] = "PAUSED";
})(RunState || (RunState = {}));
export class RuntimeContext {
    constructor(factory, container, id, config, deps = []) {
        this._runState = RunState.NEWBORN;
        this._factory = factory;
        this._id = id;
        this._config = config;
        this._container = container;
        for (let i in deps) {
            if (!this._container.hasResolver(deps[i]))
                this._container.registerSingleton(deps[i], deps[i]);
        }
    }
    get instance() {
        return this._instance;
    }
    get container() {
        return this._container;
    }
    load() {
        let me = this;
        this._instance = null;
        return new Promise((resolve, reject) => {
            me._runState = RunState.LOADING;
            this._factory.loadComponent(this, this._id)
                .then((instance) => {
                me._instance = instance;
                me.setRunState(RunState.LOADED);
                resolve();
            })
                .catch((err) => {
                me._runState = RunState.NEWBORN;
                reject(err);
            });
        });
    }
    get runState() {
        return this._runState;
    }
    inState(states) {
        return new Set(states).has(this._runState);
    }
    setRunState(runState) {
        let inst = this.instance;
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
                    let endPoints = {};
                    if (inst.initialize)
                        endPoints = this.instance.initialize(this._config);
                    this.reconcilePorts(endPoints);
                }
                else if (this.inState([RunState.RUNNING, RunState.PAUSED])) {
                    if (inst.stop)
                        this.instance.stop();
                }
                else
                    throw new Error('Component cannot be initialized, not loaded');
                break;
            case RunState.RUNNING:
                if (this.inState([RunState.READY, RunState.RUNNING])) {
                    if (inst.start)
                        this.instance.start();
                }
                else if (this.inState([RunState.PAUSED])) {
                    if (inst.resume)
                        this.instance.resume();
                }
                else
                    throw new Error('Component cannot be started, not ready');
                break;
            case RunState.PAUSED:
                if (this.inState([RunState.RUNNING])) {
                    if (inst.pause)
                        this.instance.pause();
                }
                else if (this.inState([RunState.PAUSED])) {
                }
                else
                    throw new Error('Component cannot be paused');
                break;
        }
        this._runState = runState;
    }
    reconcilePorts(endPoints) {
    }
    release() {
        this._instance = null;
        this._factory = null;
    }
}

;
class ModuleRegistryEntry {
    constructor(address) {
    }
}
export class SystemModuleLoader {
    constructor() {
        this.moduleRegistry = new Map();
    }
    getOrCreateModuleRegistryEntry(address) {
        return this.moduleRegistry[address] || (this.moduleRegistry[address] = new ModuleRegistryEntry(address));
    }
    loadModule(id) {
        let newId = System.normalizeSync(id);
        let existing = this.moduleRegistry[newId];
        if (existing) {
            return Promise.resolve(existing);
        }
        return System.import(newId).then(m => {
            this.moduleRegistry[newId] = m;
            return m;
        });
    }
}



export class ComponentFactory {
    constructor(container, loader) {
        this._loader = loader;
        this._container = container || new Container();
        this._components = new Map();
        this._components.set(undefined, Object);
        this._components.set("", Object);
    }
    createContext(id, config, deps = []) {
        let childContainer = this._container.createChild();
        return new RuntimeContext(this, childContainer, id, config, deps);
    }
    getChildContainer() {
        return;
    }
    loadComponent(ctx, id) {
        let createComponent = function (ctor) {
            let newInstance = ctx.container.invoke(ctor);
            return newInstance;
        };
        let me = this;
        return new Promise((resolve, reject) => {
            let ctor = this.get(id);
            if (ctor) {
                resolve(createComponent(ctor));
            }
            else if (this._loader) {
                this._loader.loadModule(id)
                    .then((ctor) => {
                    me._components.set(id, ctor);
                    resolve(createComponent(ctor));
                })
                    .catch((e) => {
                    reject('ComponentFactory: Unable to load component "' + id + '" - ' + e);
                });
            }
            else {
                reject('ComponentFactory: Component "' + id + '" not registered, and Loader not available');
            }
        });
    }
    get(id) {
        return this._components.get(id);
    }
    register(id, ctor) {
        this._components.set(id, ctor);
    }
}

export class Link {
    constructor(owner, attributes = {}) {
        this._owner = owner;
        this._id = attributes.id || "";
        this._from = attributes['from'];
        this._to = attributes['to'];
        this._protocolID = attributes['protocol'] || 'any';
        this.metadata = attributes.metadata || { x: 100, y: 100 };
    }
    toObject(opts) {
        let link = {
            id: this._id,
            protocol: (this._protocolID != 'any') ? this._protocolID : undefined,
            metadata: this.metadata,
            from: this._from,
            to: this._to
        };
        return link;
    }
    set id(id) {
        this._id = id;
    }
    connect(channel) {
        let fromPort = this.fromNode.identifyPort(this._from.portID, this._protocolID);
        let toPort = this.toNode.identifyPort(this._to.portID, this._protocolID);
        this._channel = channel;
        fromPort.endPoint.attach(channel);
        toPort.endPoint.attach(channel);
    }
    disconnect() {
        let chan = this._channel;
        if (chan) {
            this._channel.endPoints.forEach((endPoint) => {
                endPoint.detach(this._channel);
            });
            this._channel = undefined;
        }
        return chan;
    }
    get fromNode() {
        return this._owner.getNodeByID(this._from.nodeID);
    }
    get fromPort() {
        let node = this.fromNode;
        return (node) ? node.identifyPort(this._from.portID, this._protocolID) : undefined;
    }
    set fromPort(port) {
        this._from = {
            nodeID: port.owner.id,
            portID: port.id
        };
        this._protocolID = port.protocolID;
    }
    get toNode() {
        return this._owner.getNodeByID(this._to.nodeID);
    }
    get toPort() {
        let node = this.toNode;
        return (node) ? node.identifyPort(this._to.portID, this._protocolID) : undefined;
    }
    set toPort(port) {
        this._to = {
            nodeID: port.owner.id,
            portID: port.id
        };
        this._protocolID = port.protocolID;
    }
    get protocolID() {
        return this._protocolID;
    }
}





export class Network extends EventHub {
    constructor(factory, graph) {
        super();
        this._factory = factory;
        this._graph = graph || new Graph(null, {});
        let me = this;
        this._graph.subscribe(Graph.EVENT_ADD_NODE, (data) => {
            let runState = me._graph.context.runState;
            if (runState != RunState.NEWBORN) {
                let { node } = data;
                node.loadComponent(me._factory)
                    .then(() => {
                    if (Network.inState([RunState.RUNNING, RunState.PAUSED, RunState.READY], runState))
                        Network.setRunState(node, RunState.READY);
                    if (Network.inState([RunState.RUNNING, RunState.PAUSED], runState))
                        Network.setRunState(node, runState);
                    this.publish(Network.EVENT_GRAPH_CHANGE, { node: node });
                });
            }
        });
    }
    get graph() {
        return this._graph;
    }
    loadComponents() {
        let me = this;
        this.publish(Network.EVENT_STATE_CHANGE, { state: RunState.LOADING });
        return this._graph.loadComponent(this._factory).then(() => {
            this.publish(Network.EVENT_STATE_CHANGE, { state: RunState.LOADED });
        });
    }
    initialize() {
        this.setRunState(RunState.READY);
    }
    teardown() {
        this.setRunState(RunState.LOADED);
    }
    static inState(states, runState) {
        return new Set(states).has(runState);
    }
    static setRunState(node, runState) {
        let ctx = node.context;
        let currentState = ctx.runState;
        if (node instanceof Graph) {
            let nodes = node.nodes;
            if ((runState == RunState.LOADED) && (currentState >= RunState.READY)) {
                let links = node.links;
                links.forEach((link) => {
                    Network.unwireLink(link);
                });
            }
            nodes.forEach(function (subNode) {
                Network.setRunState(subNode, runState);
            });
            ctx.setRunState(runState);
            if ((runState == RunState.READY) && (currentState >= RunState.LOADED)) {
                let links = node.links;
                links.forEach((link) => {
                    Network.wireLink(link);
                });
            }
        }
        else {
            ctx.setRunState(runState);
        }
    }
    static unwireLink(link) {
        let fromNode = link.fromNode;
        let toNode = link.toNode;
        let chan = link.disconnect();
        if (chan)
            chan.deactivate();
    }
    static wireLink(link) {
        let fromNode = link.fromNode;
        let toNode = link.toNode;
        let channel = new Channel();
        link.connect(channel);
        channel.activate();
    }
    setRunState(runState) {
        Network.setRunState(this._graph, runState);
        this.publish(Network.EVENT_STATE_CHANGE, { state: runState });
    }
    start(initiallyPaused = false) {
        this.setRunState(initiallyPaused ? RunState.PAUSED : RunState.RUNNING);
    }
    step() {
    }
    stop() {
        this.setRunState(RunState.READY);
    }
    pause() {
        this.setRunState(RunState.PAUSED);
    }
    resume() {
        this.setRunState(RunState.RUNNING);
    }
}
Network.EVENT_STATE_CHANGE = 'network:state-change';
Network.EVENT_GRAPH_CHANGE = 'network:graph-change';




export class Graph extends Node {
    constructor(owner, attributes = {}) {
        super(owner, attributes);
        this.initFromObject(attributes);
    }
    initFromString(jsonString) {
        this.initFromObject(JSON.parse(jsonString));
    }
    initFromObject(attributes) {
        this.id = attributes.id || "$graph";
        this._nodes = new Map();
        this._links = new Map();
        Object.keys(attributes.nodes || {}).forEach((id) => {
            this.addNode(id, attributes.nodes[id]);
        });
        Object.keys(attributes.links || {}).forEach((id) => {
            this.addLink(id, attributes.links[id]);
        });
    }
    toObject(opts) {
        var graph = super.toObject();
        let nodes = graph["nodes"] = {};
        this._nodes.forEach((node, id) => {
            nodes[id] = node.toObject();
        });
        let links = graph["links"] = {};
        this._links.forEach((link, id) => {
            links[id] = link.toObject();
        });
        return graph;
    }
    loadComponent(factory) {
        return new Promise((resolve, reject) => {
            let pendingCount = 0;
            let nodes = new Map(this._nodes);
            nodes.set('$graph', this);
            nodes.forEach((node, id) => {
                let done;
                pendingCount++;
                if (node == this) {
                    done = super.loadComponent(factory);
                }
                else {
                    done = node.loadComponent(factory);
                }
                done.then(() => {
                    --pendingCount;
                    if (pendingCount == 0)
                        resolve();
                })
                    .catch((reason) => {
                    reject(reason);
                });
            });
        });
    }
    get nodes() {
        return this._nodes;
    }
    get links() {
        return this._links;
    }
    getNodeByID(id) {
        if (id == '$graph')
            return this;
        return this._nodes.get(id);
    }
    addNode(id, attributes) {
        let node = new Node(this, attributes);
        node.id = id;
        this._nodes.set(id, node);
        this.publish(Graph.EVENT_ADD_NODE, { node: node });
        return node;
    }
    renameNode(id, newID) {
        let node = this._nodes.get(id);
        if (id != newID) {
            let eventData = { node: node, attrs: { id: node.id } };
            this._nodes.delete(id);
            node.id = newID;
            this._nodes.set(newID, node);
            this.publish(Graph.EVENT_UPD_NODE, eventData);
        }
    }
    removeNode(id) {
        let node = this._nodes.get(id);
        if (node)
            this.publish(Graph.EVENT_DEL_NODE, { node: node });
        return this._nodes.delete(id);
    }
    getLinkByID(id) {
        return this._links[id];
    }
    addLink(id, attributes) {
        let link = new Link(this, attributes);
        link.id = id;
        this._links.set(id, link);
        this.publish(Graph.EVENT_ADD_LINK, { link: link });
        return link;
    }
    renameLink(id, newID) {
        let link = this._links.get(id);
        this._links.delete(id);
        let eventData = { link: link, attrs: { id: link.id } };
        link.id = newID;
        this.publish(Graph.EVENT_UPD_NODE, eventData);
        this._links.set(newID, link);
    }
    removeLink(id) {
        let link = this._links.get(id);
        if (link)
            this.publish(Graph.EVENT_DEL_LINK, { link: link });
        return this._links.delete(id);
    }
    addPublicPort(id, attributes) {
        attributes["id"] = id;
        let port = new PublicPort(this, null, attributes);
        this._ports.set(id, port);
        return port;
    }
}
Graph.EVENT_ADD_NODE = 'graph:add-node';
Graph.EVENT_UPD_NODE = 'graph:upd-node';
Graph.EVENT_DEL_NODE = 'graph:del-node';
Graph.EVENT_ADD_LINK = 'graph:add-link';
Graph.EVENT_UPD_LINK = 'graph:upd-link';
Graph.EVENT_DEL_LINK = 'graph:del-link';


export class SimulationEngine {
    constructor(loader, container) {
        this.loader = loader;
        this.container = container;
    }
    getComponentFactory() {
        return new ComponentFactory(this.container, this.loader);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImtpbmQvaGV4LWNvZGVjLnRzIiwia2luZC9iYXNlNjQtY29kZWMudHMiLCJraW5kL2J5dGUtYXJyYXkudHMiLCJjcnlwdG9ncmFwaGljLXNlcnZpY2VzL2tleS50cyIsImNyeXB0b2dyYXBoaWMtc2VydmljZXMvcHJpdmF0ZS1rZXkudHMiLCJjcnlwdG9ncmFwaGljLXNlcnZpY2VzL3B1YmxpYy1rZXkudHMiLCJjcnlwdG9ncmFwaGljLXNlcnZpY2VzL2tleS1wYWlyLnRzIiwiY3J5cHRvZ3JhcGhpYy1zZXJ2aWNlcy9jcnlwdG9ncmFwaGljLXNlcnZpY2UudHMiLCJkZXBlbmRlbmN5LWluamVjdGlvbi9jb250YWluZXIudHMiLCJldmVudC1odWIvZXZlbnQtaHViLnRzIiwia2luZC9raW5kLnRzIiwibWVzc2FnaW5nL21lc3NhZ2UudHMiLCJydW50aW1lL3Rhc2stc2NoZWR1bGVyLnRzIiwibWVzc2FnaW5nL2NoYW5uZWwudHMiLCJtZXNzYWdpbmcvZW5kLXBvaW50LnRzIiwibWVzc2FnaW5nL3Byb3RvY29sLnRzIiwiY29tcG9uZW50L3BvcnQtaW5mby50cyIsImNvbXBvbmVudC9zdG9yZS1pbmZvLnRzIiwiY29tcG9uZW50L2NvbXBvbmVudC1pbmZvLnRzIiwiY29tcG9uZW50L2NvbXBvbmVudC50cyIsImdyYXBoL3BvcnQudHMiLCJncmFwaC9ub2RlLnRzIiwicnVudGltZS9ydW50aW1lLWNvbnRleHQudHMiLCJydW50aW1lL21vZHVsZS1sb2FkZXIudHMiLCJydW50aW1lL2NvbXBvbmVudC1mYWN0b3J5LnRzIiwiZ3JhcGgvbGluay50cyIsImdyYXBoL25ldHdvcmsudHMiLCJncmFwaC9ncmFwaC50cyIsInJ1bnRpbWUvc2ltdWxhdGlvbi1lbmdpbmUudHMiXSwibmFtZXMiOlsiSGV4Q29kZWMiLCJIZXhDb2RlYy5kZWNvZGUiLCJCQVNFNjRTUEVDSUFMUyIsIkJhc2U2NENvZGVjIiwiQmFzZTY0Q29kZWMuZGVjb2RlIiwiQmFzZTY0Q29kZWMuZGVjb2RlLmRlY29kZSIsIkJhc2U2NENvZGVjLmRlY29kZS5wdXNoIiwiQmFzZTY0Q29kZWMuZW5jb2RlIiwiQmFzZTY0Q29kZWMuZW5jb2RlLmVuY29kZSIsIkJhc2U2NENvZGVjLmVuY29kZS50cmlwbGV0VG9CYXNlNjQiLCJCeXRlQXJyYXkiLCJCeXRlQXJyYXkuY29uc3RydWN0b3IiLCJCeXRlQXJyYXkubGVuZ3RoIiwiQnl0ZUFycmF5LmJhY2tpbmdBcnJheSIsIkJ5dGVBcnJheS5lcXVhbHMiLCJCeXRlQXJyYXkuYnl0ZUF0IiwiQnl0ZUFycmF5LndvcmRBdCIsIkJ5dGVBcnJheS5saXR0bGVFbmRpYW5Xb3JkQXQiLCJCeXRlQXJyYXkuZHdvcmRBdCIsIkJ5dGVBcnJheS5zZXRCeXRlQXQiLCJCeXRlQXJyYXkuc2V0Qnl0ZXNBdCIsIkJ5dGVBcnJheS5jbG9uZSIsIkJ5dGVBcnJheS5ieXRlc0F0IiwiQnl0ZUFycmF5LnZpZXdBdCIsIkJ5dGVBcnJheS5hZGRCeXRlIiwiQnl0ZUFycmF5LnNldExlbmd0aCIsIkJ5dGVBcnJheS5jb25jYXQiLCJCeXRlQXJyYXkubm90IiwiQnl0ZUFycmF5LmFuZCIsIkJ5dGVBcnJheS5vciIsIkJ5dGVBcnJheS54b3IiLCJCeXRlQXJyYXkudG9TdHJpbmciLCJLZXkiLCJLZXkuY29uc3RydWN0b3IiLCJLZXkudHlwZSIsIktleS5hbGdvcml0aG0iLCJLZXkuZXh0cmFjdGFibGUiLCJLZXkudXNhZ2VzIiwiS2V5LmlubmVyS2V5IiwiUHJpdmF0ZUtleSIsIlB1YmxpY0tleSIsIktleVBhaXIiLCJDcnlwdG9ncmFwaGljU2VydmljZSIsIkNyeXB0b2dyYXBoaWNTZXJ2aWNlLmNvbnN0cnVjdG9yIiwiQ3J5cHRvZ3JhcGhpY1NlcnZpY2UuZGVjcnlwdCIsIkNyeXB0b2dyYXBoaWNTZXJ2aWNlLmRpZ2VzdCIsIkNyeXB0b2dyYXBoaWNTZXJ2aWNlLmVuY3J5cHQiLCJDcnlwdG9ncmFwaGljU2VydmljZS5leHBvcnRLZXkiLCJDcnlwdG9ncmFwaGljU2VydmljZS5nZW5lcmF0ZUtleSIsIkNyeXB0b2dyYXBoaWNTZXJ2aWNlLmltcG9ydEtleSIsIkNyeXB0b2dyYXBoaWNTZXJ2aWNlLnNpZ24iLCJDcnlwdG9ncmFwaGljU2VydmljZS52ZXJpZnkiLCJFdmVudEh1YiIsIkV2ZW50SHViLmNvbnN0cnVjdG9yIiwiRXZlbnRIdWIucHVibGlzaCIsIkV2ZW50SHViLnN1YnNjcmliZSIsIkV2ZW50SHViLnN1YnNjcmliZU9uY2UiLCJFbnVtIiwiS2luZEluZm8iLCJLaW5kSW5mby5jb25zdHJ1Y3RvciIsIktpbmRCdWlsZGVyIiwiS2luZEJ1aWxkZXIuY29uc3RydWN0b3IiLCJLaW5kQnVpbGRlci5pbml0IiwiS2luZEJ1aWxkZXIuZmllbGQiLCJPcmFuZ2VzIiwiRnJ1aXR5S2luZCIsIk1lc3NhZ2UiLCJNZXNzYWdlLmNvbnN0cnVjdG9yIiwiTWVzc2FnZS5oZWFkZXIiLCJNZXNzYWdlLnBheWxvYWQiLCJLaW5kTWVzc2FnZSIsIlRhc2tTY2hlZHVsZXIiLCJUYXNrU2NoZWR1bGVyLmNvbnN0cnVjdG9yIiwiVGFza1NjaGVkdWxlci5tYWtlUmVxdWVzdEZsdXNoRnJvbU11dGF0aW9uT2JzZXJ2ZXIiLCJUYXNrU2NoZWR1bGVyLm1ha2VSZXF1ZXN0Rmx1c2hGcm9tTXV0YXRpb25PYnNlcnZlci5yZXF1ZXN0Rmx1c2giLCJUYXNrU2NoZWR1bGVyLm1ha2VSZXF1ZXN0Rmx1c2hGcm9tVGltZXIiLCJUYXNrU2NoZWR1bGVyLm1ha2VSZXF1ZXN0Rmx1c2hGcm9tVGltZXIucmVxdWVzdEZsdXNoIiwiVGFza1NjaGVkdWxlci5tYWtlUmVxdWVzdEZsdXNoRnJvbVRpbWVyLnJlcXVlc3RGbHVzaC5oYW5kbGVGbHVzaFRpbWVyIiwiVGFza1NjaGVkdWxlci5zaHV0ZG93biIsIlRhc2tTY2hlZHVsZXIucXVldWVUYXNrIiwiVGFza1NjaGVkdWxlci5mbHVzaFRhc2tRdWV1ZSIsIlRhc2tTY2hlZHVsZXIub25FcnJvciIsIkNoYW5uZWwiLCJDaGFubmVsLmNvbnN0cnVjdG9yIiwiQ2hhbm5lbC5zaHV0ZG93biIsIkNoYW5uZWwuYWN0aXZlIiwiQ2hhbm5lbC5hY3RpdmF0ZSIsIkNoYW5uZWwuZGVhY3RpdmF0ZSIsIkNoYW5uZWwuYWRkRW5kUG9pbnQiLCJDaGFubmVsLnJlbW92ZUVuZFBvaW50IiwiQ2hhbm5lbC5lbmRQb2ludHMiLCJDaGFubmVsLnNlbmRNZXNzYWdlIiwiRGlyZWN0aW9uIiwiRW5kUG9pbnQiLCJFbmRQb2ludC5jb25zdHJ1Y3RvciIsIkVuZFBvaW50LnNodXRkb3duIiwiRW5kUG9pbnQuaWQiLCJFbmRQb2ludC5hdHRhY2giLCJFbmRQb2ludC5kZXRhY2giLCJFbmRQb2ludC5kZXRhY2hBbGwiLCJFbmRQb2ludC5hdHRhY2hlZCIsIkVuZFBvaW50LmRpcmVjdGlvbiIsIkVuZFBvaW50LmhhbmRsZU1lc3NhZ2UiLCJFbmRQb2ludC5zZW5kTWVzc2FnZSIsIkVuZFBvaW50Lm9uTWVzc2FnZSIsIlByb3RvY29sVHlwZUJpdHMiLCJQcm90b2NvbCIsIkNsaWVudFNlcnZlclByb3RvY29sIiwiQVBEVSIsIkFQRFVNZXNzYWdlIiwiQVBEVVByb3RvY29sIiwiUG9ydEluZm8iLCJQb3J0SW5mby5jb25zdHJ1Y3RvciIsIlN0b3JlSW5mbyIsIkNvbXBvbmVudEluZm8iLCJDb21wb25lbnRJbmZvLmNvbnN0cnVjdG9yIiwiQ29tcG9uZW50QnVpbGRlciIsIkNvbXBvbmVudEJ1aWxkZXIuY29uc3RydWN0b3IiLCJDb21wb25lbnRCdWlsZGVyLmluaXQiLCJDb21wb25lbnRCdWlsZGVyLnBvcnQiLCJDb21wb25lbnRCdWlsZGVyLm5hbWUiLCJDIiwiUG9ydCIsIlBvcnQuY29uc3RydWN0b3IiLCJQb3J0LmVuZFBvaW50IiwiUG9ydC50b09iamVjdCIsIlBvcnQub3duZXIiLCJQb3J0LnByb3RvY29sSUQiLCJQb3J0LmlkIiwiUG9ydC5kaXJlY3Rpb24iLCJQdWJsaWNQb3J0IiwiUHVibGljUG9ydC5jb25zdHJ1Y3RvciIsIlB1YmxpY1BvcnQuY29ubmVjdFByaXZhdGUiLCJQdWJsaWNQb3J0LmRpc2Nvbm5lY3RQcml2YXRlIiwiUHVibGljUG9ydC50b09iamVjdCIsIk5vZGUiLCJOb2RlLmNvbnN0cnVjdG9yIiwiTm9kZS50b09iamVjdCIsIk5vZGUub3duZXIiLCJOb2RlLmlkIiwiTm9kZS5hZGRQbGFjZWhvbGRlclBvcnQiLCJOb2RlLnBvcnRzIiwiTm9kZS5nZXRQb3J0QXJyYXkiLCJOb2RlLmdldFBvcnRCeUlEIiwiTm9kZS5pZGVudGlmeVBvcnQiLCJOb2RlLnJlbW92ZVBvcnQiLCJOb2RlLmxvYWRDb21wb25lbnQiLCJOb2RlLmNvbnRleHQiLCJOb2RlLnVubG9hZENvbXBvbmVudCIsIlJ1blN0YXRlIiwiUnVudGltZUNvbnRleHQiLCJSdW50aW1lQ29udGV4dC5jb25zdHJ1Y3RvciIsIlJ1bnRpbWVDb250ZXh0Lmluc3RhbmNlIiwiUnVudGltZUNvbnRleHQuY29udGFpbmVyIiwiUnVudGltZUNvbnRleHQubG9hZCIsIlJ1bnRpbWVDb250ZXh0LnJ1blN0YXRlIiwiUnVudGltZUNvbnRleHQuaW5TdGF0ZSIsIlJ1bnRpbWVDb250ZXh0LnNldFJ1blN0YXRlIiwiUnVudGltZUNvbnRleHQucmVjb25jaWxlUG9ydHMiLCJSdW50aW1lQ29udGV4dC5yZWxlYXNlIiwiTW9kdWxlUmVnaXN0cnlFbnRyeSIsIk1vZHVsZVJlZ2lzdHJ5RW50cnkuY29uc3RydWN0b3IiLCJTeXN0ZW1Nb2R1bGVMb2FkZXIiLCJTeXN0ZW1Nb2R1bGVMb2FkZXIuY29uc3RydWN0b3IiLCJTeXN0ZW1Nb2R1bGVMb2FkZXIuZ2V0T3JDcmVhdGVNb2R1bGVSZWdpc3RyeUVudHJ5IiwiU3lzdGVtTW9kdWxlTG9hZGVyLmxvYWRNb2R1bGUiLCJDb21wb25lbnRGYWN0b3J5IiwiQ29tcG9uZW50RmFjdG9yeS5jb25zdHJ1Y3RvciIsIkNvbXBvbmVudEZhY3RvcnkuY3JlYXRlQ29udGV4dCIsIkNvbXBvbmVudEZhY3RvcnkuZ2V0Q2hpbGRDb250YWluZXIiLCJDb21wb25lbnRGYWN0b3J5LmxvYWRDb21wb25lbnQiLCJDb21wb25lbnRGYWN0b3J5LmdldCIsIkNvbXBvbmVudEZhY3RvcnkucmVnaXN0ZXIiLCJMaW5rIiwiTGluay5jb25zdHJ1Y3RvciIsIkxpbmsudG9PYmplY3QiLCJMaW5rLmlkIiwiTGluay5jb25uZWN0IiwiTGluay5kaXNjb25uZWN0IiwiTGluay5mcm9tTm9kZSIsIkxpbmsuZnJvbVBvcnQiLCJMaW5rLnRvTm9kZSIsIkxpbmsudG9Qb3J0IiwiTGluay5wcm90b2NvbElEIiwiTmV0d29yayIsIk5ldHdvcmsuY29uc3RydWN0b3IiLCJOZXR3b3JrLmdyYXBoIiwiTmV0d29yay5sb2FkQ29tcG9uZW50cyIsIk5ldHdvcmsuaW5pdGlhbGl6ZSIsIk5ldHdvcmsudGVhcmRvd24iLCJOZXR3b3JrLmluU3RhdGUiLCJOZXR3b3JrLnNldFJ1blN0YXRlIiwiTmV0d29yay51bndpcmVMaW5rIiwiTmV0d29yay53aXJlTGluayIsIk5ldHdvcmsuc3RhcnQiLCJOZXR3b3JrLnN0ZXAiLCJOZXR3b3JrLnN0b3AiLCJOZXR3b3JrLnBhdXNlIiwiTmV0d29yay5yZXN1bWUiLCJHcmFwaCIsIkdyYXBoLmNvbnN0cnVjdG9yIiwiR3JhcGguaW5pdEZyb21TdHJpbmciLCJHcmFwaC5pbml0RnJvbU9iamVjdCIsIkdyYXBoLnRvT2JqZWN0IiwiR3JhcGgubG9hZENvbXBvbmVudCIsIkdyYXBoLm5vZGVzIiwiR3JhcGgubGlua3MiLCJHcmFwaC5nZXROb2RlQnlJRCIsIkdyYXBoLmFkZE5vZGUiLCJHcmFwaC5yZW5hbWVOb2RlIiwiR3JhcGgucmVtb3ZlTm9kZSIsIkdyYXBoLmdldExpbmtCeUlEIiwiR3JhcGguYWRkTGluayIsIkdyYXBoLnJlbmFtZUxpbmsiLCJHcmFwaC5yZW1vdmVMaW5rIiwiR3JhcGguYWRkUHVibGljUG9ydCIsIlNpbXVsYXRpb25FbmdpbmUiLCJTaW11bGF0aW9uRW5naW5lLmNvbnN0cnVjdG9yIiwiU2ltdWxhdGlvbkVuZ2luZS5nZXRDb21wb25lbnRGYWN0b3J5Il0sIm1hcHBpbmdzIjoiQUFBQTtJQUlFQSxPQUFPQSxNQUFNQSxDQUFFQSxDQUFTQTtRQUV0QkMsRUFBRUEsQ0FBQ0EsQ0FBRUEsUUFBUUEsQ0FBQ0EsWUFBWUEsSUFBSUEsU0FBVUEsQ0FBQ0EsQ0FDekNBLENBQUNBO1lBQ0NBLElBQUlBLEdBQUdBLEdBQUdBLGtCQUFrQkEsQ0FBQ0E7WUFDN0JBLElBQUlBLEtBQUtBLEdBQUdBLDZCQUE2QkEsQ0FBQ0E7WUFDMUNBLElBQUlBLEdBQUdBLEdBQWFBLEVBQUVBLENBQUNBO1lBQ3ZCQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFDdkJBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQzNCQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQSxXQUFXQSxFQUFFQSxDQUFDQTtZQUN4QkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsRUFBRUEsQ0FBQ0EsR0FBR0EsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQ3hCQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUMzQkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQ2pDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUM5QkEsUUFBUUEsQ0FBQ0EsWUFBWUEsR0FBR0EsR0FBR0EsQ0FBQ0E7UUFDOUJBLENBQUNBO1FBRURBLElBQUlBLEdBQUdBLEdBQWFBLEVBQUVBLENBQUNBO1FBQ3ZCQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxFQUFFQSxVQUFVQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUM3QkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsRUFBRUEsRUFBRUEsQ0FBQ0EsRUFDakNBLENBQUNBO1lBQ0NBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ3BCQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxHQUFHQSxDQUFDQTtnQkFDVEEsS0FBS0EsQ0FBQ0E7WUFDVkEsSUFBSUEsQ0FBQ0EsR0FBR0EsUUFBUUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDakNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO2dCQUNSQSxRQUFRQSxDQUFDQTtZQUNiQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxTQUFTQSxDQUFDQTtnQkFDZkEsTUFBTUEsOEJBQThCQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUM3Q0EsSUFBSUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDVkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsVUFBVUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3BCQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFFQSxJQUFJQSxDQUFFQSxDQUFDQTtnQkFDakJBLElBQUlBLEdBQUdBLENBQUNBLENBQUNBO2dCQUNUQSxVQUFVQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNuQkEsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ0pBLElBQUlBLEtBQUtBLENBQUNBLENBQUNBO1lBQ2ZBLENBQUNBO1FBQ0hBLENBQUNBO1FBRURBLEVBQUVBLENBQUNBLENBQUNBLFVBQVVBLENBQUNBO1lBQ2JBLE1BQU1BLHlDQUF5Q0EsQ0FBQ0E7UUFFbERBLE1BQU1BLENBQUNBLFVBQVVBLENBQUNBLElBQUlBLENBQUVBLEdBQUdBLENBQUVBLENBQUNBO0lBQ2hDQSxDQUFDQTtBQUNIRCxDQUFDQTtBQUFBO0FDOUNELElBQUssY0FRSjtBQVJELFdBQUssY0FBYztJQUNqQkUsd0NBQU9BLEdBQUdBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBLFVBQUFBLENBQUFBO0lBQ3hCQSx5Q0FBUUEsR0FBR0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsV0FBQUEsQ0FBQUE7SUFDekJBLDBDQUFTQSxHQUFHQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQSxZQUFBQSxDQUFBQTtJQUMxQkEseUNBQVFBLEdBQUdBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBLFdBQUFBLENBQUFBO0lBQ3pCQSx5Q0FBUUEsR0FBR0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsV0FBQUEsQ0FBQUE7SUFDekJBLGlEQUFnQkEsR0FBR0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsbUJBQUFBLENBQUFBO0lBQ2pDQSxrREFBaUJBLEdBQUdBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBLG9CQUFBQSxDQUFBQTtBQUNwQ0EsQ0FBQ0EsRUFSSSxjQUFjLEtBQWQsY0FBYyxRQVFsQjtBQUVEO0lBRUVDLE9BQU9BLE1BQU1BLENBQUVBLEdBQVdBO1FBRXhCQyxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN2QkEsTUFBTUEsSUFBSUEsS0FBS0EsQ0FBQ0EsdURBQXVEQSxDQUFDQSxDQUFDQTtRQUMzRUEsQ0FBQ0E7UUFFREEsZ0JBQWlCQSxHQUFXQTtZQUUxQkMsSUFBSUEsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFFN0JBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLEtBQUtBLGNBQWNBLENBQUNBLElBQUlBLElBQUlBLElBQUlBLEtBQUtBLGNBQWNBLENBQUNBLGFBQWFBLENBQUNBO2dCQUN4RUEsTUFBTUEsQ0FBQ0EsRUFBRUEsQ0FBQ0E7WUFFWkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsS0FBS0EsY0FBY0EsQ0FBQ0EsS0FBS0EsSUFBSUEsSUFBSUEsS0FBS0EsY0FBY0EsQ0FBQ0EsY0FBY0EsQ0FBQ0E7Z0JBQzFFQSxNQUFNQSxDQUFDQSxFQUFFQSxDQUFDQTtZQUVaQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxJQUFJQSxjQUFjQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUNsQ0EsQ0FBQ0E7Z0JBQ0NBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLEdBQUdBLGNBQWNBLENBQUNBLE1BQU1BLEdBQUdBLEVBQUVBLENBQUNBO29CQUNwQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsR0FBR0EsY0FBY0EsQ0FBQ0EsTUFBTUEsR0FBR0EsRUFBRUEsR0FBR0EsRUFBRUEsQ0FBQ0E7Z0JBRWhEQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxHQUFHQSxjQUFjQSxDQUFDQSxLQUFLQSxHQUFHQSxFQUFFQSxDQUFDQTtvQkFDbkNBLE1BQU1BLENBQUNBLElBQUlBLEdBQUdBLGNBQWNBLENBQUNBLEtBQUtBLENBQUNBO2dCQUVyQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsR0FBR0EsY0FBY0EsQ0FBQ0EsS0FBS0EsR0FBR0EsRUFBRUEsQ0FBQ0E7b0JBQ25DQSxNQUFNQSxDQUFDQSxJQUFJQSxHQUFHQSxjQUFjQSxDQUFDQSxLQUFLQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUM1Q0EsQ0FBQ0E7WUFFREEsTUFBTUEsSUFBSUEsS0FBS0EsQ0FBQ0EsNENBQTRDQSxDQUFDQSxDQUFDQTtRQUNoRUEsQ0FBQ0E7UUFPREQsSUFBSUEsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFDckJBLElBQUlBLFlBQVlBLEdBQUdBLEdBQUdBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLEtBQUtBLEdBQUdBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLEtBQUtBLEdBQUdBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBR3pGQSxJQUFJQSxHQUFHQSxHQUFHQSxJQUFJQSxVQUFVQSxDQUFFQSxHQUFHQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxZQUFZQSxDQUFFQSxDQUFDQTtRQUc5REEsSUFBSUEsQ0FBQ0EsR0FBR0EsWUFBWUEsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFFdkRBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBRVZBLGNBQWVBLENBQU9BO1lBQ3BCRSxHQUFHQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUNmQSxDQUFDQTtRQUVERixJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUVqQkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0E7WUFDN0JBLElBQUlBLEdBQUdBLEdBQUdBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBLEdBQUdBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBLEdBQUdBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQzNJQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxRQUFRQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUM3QkEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDMUJBLElBQUlBLENBQUNBLEdBQUdBLEdBQUdBLElBQUlBLENBQUNBLENBQUNBO1FBQ25CQSxDQUFDQTtRQUVEQSxFQUFFQSxDQUFDQSxDQUFDQSxZQUFZQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN2QkEsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDMUVBLElBQUlBLENBQUNBLEdBQUdBLEdBQUdBLElBQUlBLENBQUNBLENBQUNBO1FBQ25CQSxDQUFDQTtRQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxZQUFZQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUM5QkEsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDOUdBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLENBQUNBO1lBQ3hCQSxJQUFJQSxDQUFDQSxHQUFHQSxHQUFHQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNuQkEsQ0FBQ0E7UUFFREEsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0E7SUFDYkEsQ0FBQ0E7SUFFREQsT0FBT0EsTUFBTUEsQ0FBRUEsS0FBaUJBO1FBRTlCSSxJQUFJQSxDQUFTQSxDQUFDQTtRQUNkQSxJQUFJQSxVQUFVQSxHQUFHQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUNsQ0EsSUFBSUEsTUFBTUEsR0FBR0EsRUFBRUEsQ0FBQ0E7UUFFaEJBLE1BQU1BLE1BQU1BLEdBQUdBLGtFQUFrRUEsQ0FBQ0E7UUFDbEZBLGdCQUFpQkEsR0FBU0E7WUFDeEJDLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBQzVCQSxDQUFDQTtRQUVERCx5QkFBMEJBLEdBQVdBO1lBQ25DRSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxJQUFJQSxFQUFFQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxNQUFNQSxDQUFDQSxHQUFHQSxJQUFJQSxFQUFFQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxNQUFNQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUM1R0EsQ0FBQ0E7UUFHREYsSUFBSUEsTUFBTUEsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsR0FBR0EsVUFBVUEsQ0FBQ0E7UUFDdkNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLE1BQU1BLEVBQUVBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBO1lBQy9CQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuRUEsTUFBTUEsSUFBSUEsZUFBZUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbENBLENBQUNBO1FBR0RBLE1BQU1BLENBQUNBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBO1lBQ25CQSxLQUFLQSxDQUFDQTtnQkFDSkEsSUFBSUEsSUFBSUEsR0FBR0EsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ25DQSxNQUFNQSxJQUFJQSxNQUFNQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDNUJBLE1BQU1BLElBQUlBLE1BQU1BLENBQUNBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLENBQUNBO2dCQUNyQ0EsTUFBTUEsSUFBSUEsSUFBSUEsQ0FBQ0E7Z0JBQ2ZBLEtBQUtBLENBQUFBO1lBQ1BBLEtBQUtBLENBQUNBO2dCQUNKQSxJQUFJQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDbEVBLE1BQU1BLElBQUlBLE1BQU1BLENBQUNBLElBQUlBLElBQUlBLEVBQUVBLENBQUNBLENBQUNBO2dCQUM3QkEsTUFBTUEsSUFBSUEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JDQSxNQUFNQSxJQUFJQSxNQUFNQSxDQUFDQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFDckNBLE1BQU1BLElBQUlBLEdBQUdBLENBQUNBO2dCQUNkQSxLQUFLQSxDQUFBQTtZQUNQQTtnQkFDRUEsS0FBS0EsQ0FBQ0E7UUFDVkEsQ0FBQ0E7UUFFREEsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7SUFDaEJBLENBQUNBO0FBQ0hKLENBQUNBO0FBQUE7T0NqSU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxhQUFhO09BQy9CLEVBQUUsV0FBVyxFQUFFLE1BQU0sZ0JBQWdCO0FBRTVDO0lBa0JFTyxZQUFhQSxLQUFxRUEsRUFBRUEsTUFBZUEsRUFBRUEsR0FBU0E7UUFFNUdDLEVBQUVBLENBQUNBLENBQUVBLENBQUNBLEtBQU1BLENBQUNBLENBQ2JBLENBQUNBO1lBRUNBLElBQUlBLENBQUNBLFNBQVNBLEdBQUdBLElBQUlBLFVBQVVBLENBQUVBLENBQUNBLENBQUVBLENBQUNBO1FBQ3ZDQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFFQSxDQUFDQSxNQUFNQSxJQUFJQSxNQUFNQSxJQUFJQSxTQUFTQSxDQUFDQSxLQUFNQSxDQUFDQSxDQUNoREEsQ0FBQ0E7WUFDQ0EsRUFBRUEsQ0FBQ0EsQ0FBRUEsS0FBS0EsWUFBWUEsV0FBWUEsQ0FBQ0E7Z0JBQ2pDQSxJQUFJQSxDQUFDQSxTQUFTQSxHQUFHQSxJQUFJQSxVQUFVQSxDQUFlQSxLQUFLQSxDQUFFQSxDQUFDQTtZQUN4REEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBRUEsS0FBS0EsWUFBWUEsVUFBV0EsQ0FBQ0E7Z0JBQ3JDQSxJQUFJQSxDQUFDQSxTQUFTQSxHQUFHQSxLQUFLQSxDQUFDQTtZQUN6QkEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBRUEsS0FBS0EsWUFBWUEsU0FBVUEsQ0FBQ0E7Z0JBQ3BDQSxJQUFJQSxDQUFDQSxTQUFTQSxHQUFHQSxLQUFLQSxDQUFDQSxTQUFTQSxDQUFDQTtZQUNuQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBRUEsS0FBS0EsWUFBWUEsS0FBTUEsQ0FBQ0E7Z0JBQ2hDQSxJQUFJQSxDQUFDQSxTQUFTQSxHQUFHQSxJQUFJQSxVQUFVQSxDQUFFQSxLQUFLQSxDQUFFQSxDQUFDQTtRQUs3Q0EsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBRUEsT0FBT0EsS0FBS0EsSUFBSUEsUUFBU0EsQ0FBQ0EsQ0FDcENBLENBQUNBO1lBQ0NBLEVBQUVBLENBQUNBLENBQUVBLE1BQU1BLElBQUlBLFNBQVNBLENBQUNBLE1BQU9BLENBQUNBLENBQ2pDQSxDQUFDQTtnQkFDR0EsSUFBSUEsQ0FBQ0EsU0FBU0EsR0FBR0EsV0FBV0EsQ0FBQ0EsTUFBTUEsQ0FBVUEsS0FBS0EsQ0FBRUEsQ0FBQ0E7WUFDekRBLENBQUNBO1lBQ0RBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUVBLE1BQU1BLElBQUlBLFNBQVNBLENBQUNBLEdBQUlBLENBQUNBLENBQ25DQSxDQUFDQTtnQkFDQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsR0FBR0EsUUFBUUEsQ0FBQ0EsTUFBTUEsQ0FBVUEsS0FBS0EsQ0FBRUEsQ0FBQ0E7WUFDcERBLENBQUNBO1lBQ0RBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUVBLE1BQU1BLElBQUlBLFNBQVNBLENBQUNBLElBQUtBLENBQUNBLENBQ3BDQSxDQUFDQTtnQkFDQ0EsSUFBSUEsQ0FBQ0EsR0FBYUEsS0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7Z0JBQ2pDQSxJQUFJQSxFQUFFQSxH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LENBQ2JBLENBQUNBO2dCQUNDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxLQUFLQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUM1QkEsQ0FBQ0E7WUFFREEsS0FBS0EsRUFBRUEsQ0FBQ0E7WUFFUkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsR0FBR0EsUUFBUUEsQ0FBQ0EsQ0FDckJBLENBQUNBO2dCQUNDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxHQUFHQSxDQUFDQSxFQUFFQSxJQUFJQSxHQUFHQSxLQUFLQSxFQUFFQSxJQUFJQSxFQUFFQSxFQUN2Q0EsQ0FBQ0E7b0JBQ0NBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLElBQUlBLEdBQUdBLEtBQUtBLENBQUNBLENBQUNBO2dCQUNwQ0EsQ0FBQ0E7Z0JBRURBLEtBQUtBLENBQUNBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBO2dCQUN0QkEsS0FBS0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDWkEsQ0FBQ0E7UUFDSEEsQ0FBQ0E7UUFFREEsS0FBS0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7SUFDbkJBLENBQUNBO0lBRURULE9BQU9BLENBQUNBLEtBQUtBLEVBQUVBLElBQUlBO1FBRWpCVSxFQUFFQSxDQUFDQSxDQUFDQSxTQUFTQSxJQUFJQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7UUFDdEJBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUVBLGFBQWFBLENBQUNBLGVBQWdCQSxDQUFDQSxDQUN6Q0EsQ0FBQ0E7WUFDQ0EsWUFBWUEsQ0FBQ0E7Z0JBQ1gsTUFBTSxLQUFLLENBQUM7WUFDZCxDQUFDLENBQUNBLENBQUNBO1FBQ0xBLENBQUNBO1FBQ0RBLElBQUlBLENBQ0pBLENBQUNBO1lBQ0NBLFVBQVVBLENBQUNBO2dCQUNULE1BQU0sS0FBSyxDQUFDO1lB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SixVQUFVQTtRQUVSSyxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQTtRQUV6QkEsRUFBRUEsQ0FBQ0EsQ0FBRUEsSUFBS0EsQ0FBQ0EsQ0FDWEEsQ0FBQ0E7WUFDQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsT0FBT0EsQ0FBRUEsQ0FBRUEsUUFBUUE7Z0JBQ3pDQSxRQUFRQSxDQUFDQSxNQUFNQSxDQUFFQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFFQSxDQUFDQTtZQUNuQ0EsQ0FBQ0EsQ0FBRUEsQ0FBQ0E7WUFFSkEsSUFBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsU0FBU0EsQ0FBQ0E7UUFDNUJBLENBQUNBO1FBRURBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURMLElBQUlBLFFBQVFBO1FBRVZNLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLFdBQVdBLENBQUVBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLENBQUVBLENBQUNBO0lBQ3REQSxDQUFDQTtJQUVETixJQUFJQSxRQUFRQTtRQUVWTyxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQTtRQUV6QkEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsWUFBWUEsQ0FBRUEsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsTUFBTUEsRUFBRUEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBRUEsR0FBR0EsU0FBU0EsQ0FBQ0E7SUFDdkZBLENBQUNBO0lBRURQLElBQUlBLFFBQVFBLENBQUVBLElBQVVBO1FBRXRCTyxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQTtZQUNYQSxNQUFNQSxFQUFFQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxFQUFFQTtZQUNyQkEsTUFBTUEsRUFBRUEsSUFBSUEsQ0FBQ0EsRUFBRUE7U0FDaEJBLENBQUNBO1FBRUZBLElBQUlBLENBQUNBLFdBQVdBLEdBQUdBLElBQUlB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QUVBLEVBQUVBLElBQUlBLENBQUVBLENBQUNBO1FBRTVCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtBQUNIaEIsQ0FBQ0E7QUE3UFEsb0JBQWMsR0FBRyxnQkFBZ0IsQ0FBQztBQUNsQyxvQkFBYyxHQUFHLGdCQUFnQixDQUFDO0FBQ2xDLG9CQUFjLEdBQUcsZ0JBQWdCLENBQUM7QUFFbEMsb0JBQWMsR0FBRyxnQkFBZ0IsQ0FBQztBQUNsQyxvQkFBYyxHQUFHLGdCQUFnQixDQUFDO0FBQ2xDLG9CQUFjLEdBQUcsZ0JBQWdCLENBdVB6Qzs7T0MxUU0sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHFCQUFxQjtBQUt0RDtJQVVFaUIsWUFBYUEsTUFBb0JBLEVBQUVBLFNBQW9CQTtRQUNyREMsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsTUFBTUEsQ0FBQ0E7UUFDckJBLElBQUlBLENBQUNBLFNBQVNBLEdBQUdBLFNBQVNBLENBQUNBO0lBQzdCQSxDQUFDQTtJQU1ERCxtQkFBbUJBO1FBQ2pCRSxNQUFNQSxDQUFDQSxJQUFJQSxnQkFBZ0JBLENBQUVBLElBQUlBLENBQUNBLFNBQVNBLEVBQUVBLElBQUlBLENBQUNBLE1BQU1BLENBQUVBLENBQUNBO0lBQzdEQSxDQUFDQTtBQUVIRixDQUFDQTtBQUFBIiwiZmlsZSI6ImNyeXB0b2dyYXBoaXgtc2ltLWNvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgSGV4Q29kZWNcbntcbiAgcHJpdmF0ZSBzdGF0aWMgaGV4RGVjb2RlTWFwOiBudW1iZXJbXTtcblxuICBzdGF0aWMgZGVjb2RlKCBhOiBzdHJpbmcgKTogVWludDhBcnJheVxuICB7XG4gICAgaWYgKCBIZXhDb2RlYy5oZXhEZWNvZGVNYXAgPT0gdW5kZWZpbmVkIClcbiAgICB7XG4gICAgICB2YXIgaGV4ID0gXCIwMTIzNDU2Nzg5QUJDREVGXCI7XG4gICAgICB2YXIgYWxsb3cgPSBcIiBcXGZcXG5cXHJcXHRcXHUwMEEwXFx1MjAyOFxcdTIwMjlcIjtcbiAgICAgIHZhciBkZWM6IG51bWJlcltdID0gW107XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyArK2kpXG4gICAgICAgICAgZGVjW2hleC5jaGFyQXQoaSldID0gaTtcbiAgICAgIGhleCA9IGhleC50b0xvd2VyQ2FzZSgpO1xuICAgICAgZm9yICh2YXIgaSA9IDEwOyBpIDwgMTY7ICsraSlcbiAgICAgICAgICBkZWNbaGV4LmNoYXJBdChpKV0gPSBpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbGxvdy5sZW5ndGg7ICsraSlcbiAgICAgICAgICBkZWNbYWxsb3cuY2hhckF0KGkpXSA9IC0xO1xuICAgICAgSGV4Q29kZWMuaGV4RGVjb2RlTWFwID0gZGVjO1xuICAgIH1cblxuICAgIHZhciBvdXQ6IG51bWJlcltdID0gW107XG4gICAgdmFyIGJpdHMgPSAwLCBjaGFyX2NvdW50ID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyArK2kpXG4gICAge1xuICAgICAgdmFyIGMgPSBhLmNoYXJBdChpKTtcbiAgICAgIGlmIChjID09ICc9JylcbiAgICAgICAgICBicmVhaztcbiAgICAgIHZhciBiID0gSGV4Q29kZWMuaGV4RGVjb2RlTWFwW2NdO1xuICAgICAgaWYgKGIgPT0gLTEpXG4gICAgICAgICAgY29udGludWU7XG4gICAgICBpZiAoYiA9PSB1bmRlZmluZWQpXG4gICAgICAgICAgdGhyb3cgJ0lsbGVnYWwgY2hhcmFjdGVyIGF0IG9mZnNldCAnICsgaTtcbiAgICAgIGJpdHMgfD0gYjtcbiAgICAgIGlmICgrK2NoYXJfY291bnQgPj0gMikge1xuICAgICAgICAgIG91dC5wdXNoKCBiaXRzICk7XG4gICAgICAgICAgYml0cyA9IDA7XG4gICAgICAgICAgY2hhcl9jb3VudCA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJpdHMgPDw9IDQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNoYXJfY291bnQpXG4gICAgICB0aHJvdyBcIkhleCBlbmNvZGluZyBpbmNvbXBsZXRlOiA0IGJpdHMgbWlzc2luZ1wiO1xuXG4gICAgcmV0dXJuIFVpbnQ4QXJyYXkuZnJvbSggb3V0ICk7XG4gIH1cbn1cbiIsInR5cGUgYnl0ZSA9IG51bWJlcjtcblxuZW51bSBCQVNFNjRTUEVDSUFMUyB7XG4gIFBMVVMgPSAnKycuY2hhckNvZGVBdCgwKSxcbiAgU0xBU0ggPSAnLycuY2hhckNvZGVBdCgwKSxcbiAgTlVNQkVSID0gJzAnLmNoYXJDb2RlQXQoMCksXG4gIExPV0VSID0gJ2EnLmNoYXJDb2RlQXQoMCksXG4gIFVQUEVSID0gJ0EnLmNoYXJDb2RlQXQoMCksXG4gIFBMVVNfVVJMX1NBRkUgPSAnLScuY2hhckNvZGVBdCgwKSxcbiAgU0xBU0hfVVJMX1NBRkUgPSAnXycuY2hhckNvZGVBdCgwKVxufVxuXG5leHBvcnQgY2xhc3MgQmFzZTY0Q29kZWNcbntcbiAgc3RhdGljIGRlY29kZSggYjY0OiBzdHJpbmcgKTogVWludDhBcnJheVxuICB7XG4gICAgaWYgKGI2NC5sZW5ndGggJSA0ID4gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGJhc2U2NCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlY29kZSggZWx0OiBTdHJpbmcgKTogbnVtYmVyXG4gICAge1xuICAgICAgdmFyIGNvZGUgPSBlbHQuY2hhckNvZGVBdCgwKTtcblxuICAgICAgaWYgKGNvZGUgPT09IEJBU0U2NFNQRUNJQUxTLlBMVVMgfHwgY29kZSA9PT0gQkFTRTY0U1BFQ0lBTFMuUExVU19VUkxfU0FGRSlcbiAgICAgICAgcmV0dXJuIDYyOyAvLyAnKydcblxuICAgICAgaWYgKGNvZGUgPT09IEJBU0U2NFNQRUNJQUxTLlNMQVNIIHx8IGNvZGUgPT09IEJBU0U2NFNQRUNJQUxTLlNMQVNIX1VSTF9TQUZFKVxuICAgICAgICByZXR1cm4gNjM7IC8vICcvJ1xuXG4gICAgICBpZiAoY29kZSA+PSBCQVNFNjRTUEVDSUFMUy5OVU1CRVIpXG4gICAgICB7XG4gICAgICAgIGlmIChjb2RlIDwgQkFTRTY0U1BFQ0lBTFMuTlVNQkVSICsgMTApXG4gICAgICAgICAgcmV0dXJuIGNvZGUgLSBCQVNFNjRTUEVDSUFMUy5OVU1CRVIgKyAyNiArIDI2O1xuXG4gICAgICAgIGlmIChjb2RlIDwgQkFTRTY0U1BFQ0lBTFMuVVBQRVIgKyAyNilcbiAgICAgICAgICByZXR1cm4gY29kZSAtIEJBU0U2NFNQRUNJQUxTLlVQUEVSO1xuXG4gICAgICAgIGlmIChjb2RlIDwgQkFTRTY0U1BFQ0lBTFMuTE9XRVIgKyAyNilcbiAgICAgICAgICByZXR1cm4gY29kZSAtIEJBU0U2NFNQRUNJQUxTLkxPV0VSICsgMjY7XG4gICAgICB9XG5cbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBiYXNlNjQgc3RyaW5nLiBDaGFyYWN0ZXIgbm90IHZhbGlkJyk7XG4gICAgfVxuXG4gICAgLy8gdGhlIG51bWJlciBvZiBlcXVhbCBzaWducyAocGxhY2UgaG9sZGVycylcbiAgICAvLyBpZiB0aGVyZSBhcmUgdHdvIHBsYWNlaG9sZGVycywgdGhhbiB0aGUgdHdvIGNoYXJhY3RlcnMgYmVmb3JlIGl0XG4gICAgLy8gcmVwcmVzZW50IG9uZSBieXRlXG4gICAgLy8gaWYgdGhlcmUgaXMgb25seSBvbmUsIHRoZW4gdGhlIHRocmVlIGNoYXJhY3RlcnMgYmVmb3JlIGl0IHJlcHJlc2VudCAyIGJ5dGVzXG4gICAgLy8gdGhpcyBpcyBqdXN0IGEgY2hlYXAgaGFjayB0byBub3QgZG8gaW5kZXhPZiB0d2ljZVxuICAgIGxldCBsZW4gPSBiNjQubGVuZ3RoO1xuICAgIGxldCBwbGFjZUhvbGRlcnMgPSBiNjQuY2hhckF0KGxlbiAtIDIpID09PSAnPScgPyAyIDogYjY0LmNoYXJBdChsZW4gLSAxKSA9PT0gJz0nID8gMSA6IDA7XG5cbiAgICAvLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcbiAgICBsZXQgYXJyID0gbmV3IFVpbnQ4QXJyYXkoIGI2NC5sZW5ndGggKiAzIC8gNCAtIHBsYWNlSG9sZGVycyApO1xuXG4gICAgLy8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuICAgIGxldCBsID0gcGxhY2VIb2xkZXJzID4gMCA/IGI2NC5sZW5ndGggLSA0IDogYjY0Lmxlbmd0aDtcblxuICAgIHZhciBMID0gMDtcblxuICAgIGZ1bmN0aW9uIHB1c2ggKHY6IGJ5dGUpIHtcbiAgICAgIGFycltMKytdID0gdjtcbiAgICB9XG5cbiAgICBsZXQgaSA9IDAsIGogPSAwO1xuXG4gICAgZm9yICg7IGkgPCBsOyBpICs9IDQsIGogKz0gMykge1xuICAgICAgbGV0IHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTgpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgMTIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPDwgNikgfCBkZWNvZGUoYjY0LmNoYXJBdChpICsgMykpO1xuICAgICAgcHVzaCgodG1wICYgMHhGRjAwMDApID4+IDE2KTtcbiAgICAgIHB1c2goKHRtcCAmIDB4RkYwMCkgPj4gOCk7XG4gICAgICBwdXNoKHRtcCAmIDB4RkYpO1xuICAgIH1cblxuICAgIGlmIChwbGFjZUhvbGRlcnMgPT09IDIpIHtcbiAgICAgIGxldCB0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPj4gNCk7XG4gICAgICBwdXNoKHRtcCAmIDB4RkYpO1xuICAgIH0gZWxzZSBpZiAocGxhY2VIb2xkZXJzID09PSAxKSB7XG4gICAgICBsZXQgdG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxMCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCA0KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpID4+IDIpO1xuICAgICAgcHVzaCgodG1wID4+IDgpICYgMHhGRik7XG4gICAgICBwdXNoKHRtcCAmIDB4RkYpO1xuICAgIH1cblxuICAgIHJldHVybiBhcnI7XG4gIH1cblxuICBzdGF0aWMgZW5jb2RlKCB1aW50ODogVWludDhBcnJheSApOiBzdHJpbmdcbiAge1xuICAgIHZhciBpOiBudW1iZXI7XG4gICAgdmFyIGV4dHJhQnl0ZXMgPSB1aW50OC5sZW5ndGggJSAzOyAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuICAgIHZhciBvdXRwdXQgPSAnJztcblxuICAgIGNvbnN0IGxvb2t1cCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcbiAgICBmdW5jdGlvbiBlbmNvZGUoIG51bTogYnl0ZSApIHtcbiAgICAgIHJldHVybiBsb29rdXAuY2hhckF0KG51bSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0KCBudW06IG51bWJlciApIHtcbiAgICAgIHJldHVybiBlbmNvZGUobnVtID4+IDE4ICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDEyICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDYgJiAweDNGKSArIGVuY29kZShudW0gJiAweDNGKTtcbiAgICB9XG5cbiAgICAvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG4gICAgbGV0IGxlbmd0aCA9IHVpbnQ4Lmxlbmd0aCAtIGV4dHJhQnl0ZXM7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAzKSB7XG4gICAgICBsZXQgdGVtcCA9ICh1aW50OFtpXSA8PCAxNikgKyAodWludDhbaSArIDFdIDw8IDgpICsgKHVpbnQ4W2kgKyAyXSk7XG4gICAgICBvdXRwdXQgKz0gdHJpcGxldFRvQmFzZTY0KHRlbXApO1xuICAgIH1cblxuICAgIC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcbiAgICBzd2l0Y2ggKGV4dHJhQnl0ZXMpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgbGV0IHRlbXAgPSB1aW50OFt1aW50OC5sZW5ndGggLSAxXTtcbiAgICAgICAgb3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDIpO1xuICAgICAgICBvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDQpICYgMHgzRik7XG4gICAgICAgIG91dHB1dCArPSAnPT0nO1xuICAgICAgICBicmVha1xuICAgICAgY2FzZSAyOlxuICAgICAgICB0ZW1wID0gKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDJdIDw8IDgpICsgKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdKTtcbiAgICAgICAgb3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDEwKTtcbiAgICAgICAgb3V0cHV0ICs9IGVuY29kZSgodGVtcCA+PiA0KSAmIDB4M0YpO1xuICAgICAgICBvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDIpICYgMHgzRik7XG4gICAgICAgIG91dHB1dCArPSAnPSc7XG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG59XG4iLCJpbXBvcnQgeyBIZXhDb2RlYyB9IGZyb20gJy4vaGV4LWNvZGVjJztcbmltcG9ydCB7IEJhc2U2NENvZGVjIH0gZnJvbSAnLi9iYXNlNjQtY29kZWMnO1xuXG5leHBvcnQgY2xhc3MgQnl0ZUFycmF5IC8vZXh0ZW5kcyBVaW50OEFycmF5XG57XG4gIHB1YmxpYyBzdGF0aWMgQllURVMgPSAwO1xuICBwdWJsaWMgc3RhdGljIEhFWCA9IDE7XG4gIHB1YmxpYyBzdGF0aWMgQkFTRTY0ID0gMjtcbiAgcHVibGljIHN0YXRpYyBVVEY4ID0gMztcblxuICBwcml2YXRlIGJ5dGVBcnJheTogVWludDhBcnJheTtcbiAgLyoqXG4gICAqIENyZWF0ZSBhIEJ5dGVBcnJheVxuICAgKiBAcGFyYW0gYnl0ZXMgLSBpbml0aWFsIGNvbnRlbnRzLCBvcHRpb25hbFxuICAgKiAgIG1heSBiZTpcbiAgICogICAgIGFuIGV4aXN0aW5nIEJ5dGVBcnJheVxuICAgKiAgICAgYW4gQXJyYXkgb2YgbnVtYmVycyAoMC4uMjU1KVxuICAgKiAgICAgYSBzdHJpbmcsIHRvIGJlIGNvbnZlcnRlZFxuICAgKiAgICAgYW4gQXJyYXlCdWZmZXJcbiAgICogICAgIGEgVWludDhBcnJheVxuICAgKi9cbiAgY29uc3RydWN0b3IoIGJ5dGVzPzogQnl0ZUFycmF5IHwgQXJyYXk8bnVtYmVyPiB8IFN0cmluZyB8IEFycmF5QnVmZmVyIHwgVWludDhBcnJheSwgZm9ybWF0PzogbnVtYmVyLCBvcHQ/OiBhbnkgKVxuICB7XG4gICAgaWYgKCAhYnl0ZXMgKVxuICAgIHtcbiAgICAgIC8vIHplcm8tbGVuZ3RoIGFycmF5XG4gICAgICB0aGlzLmJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KCAwICk7XG4gICAgfVxuICAgIGVsc2UgaWYgKCAhZm9ybWF0IHx8IGZvcm1hdCA9PSBCeXRlQXJyYXkuQllURVMgKVxuICAgIHtcbiAgICAgIGlmICggYnl0ZXMgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciApXG4gICAgICAgIHRoaXMuYnl0ZUFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoIDxBcnJheUJ1ZmZlcj5ieXRlcyApO1xuICAgICAgZWxzZSBpZiAoIGJ5dGVzIGluc3RhbmNlb2YgVWludDhBcnJheSApXG4gICAgICAgIHRoaXMuYnl0ZUFycmF5ID0gYnl0ZXM7XG4gICAgICBlbHNlIGlmICggYnl0ZXMgaW5zdGFuY2VvZiBCeXRlQXJyYXkgKVxuICAgICAgICB0aGlzLmJ5dGVBcnJheSA9IGJ5dGVzLmJ5dGVBcnJheTtcbiAgICAgIGVsc2UgaWYgKCBieXRlcyBpbnN0YW5jZW9mIEFycmF5IClcbiAgICAgICAgdGhpcy5ieXRlQXJyYXkgPSBuZXcgVWludDhBcnJheSggYnl0ZXMgKTtcbiAgICAgIC8vZWxzZSBpZiAoIHR5cGVvZiBieXRlcyA9PSBcInN0cmluZ1wiIClcbiAgICAgIC8ve1xuLy8gICAgICAgIHRoaXMuYnl0ZUFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoIDxzdHJpbmc+Ynl0ZXMgKTtcbiAgICAgIC8vfVxuICAgIH1cbiAgICBlbHNlIGlmICggdHlwZW9mIGJ5dGVzID09IFwic3RyaW5nXCIgKVxuICAgIHtcbiAgICAgIGlmICggZm9ybWF0ID09IEJ5dGVBcnJheS5CQVNFNjQgKVxuICAgICAge1xuICAgICAgICAgIHRoaXMuYnl0ZUFycmF5ID0gQmFzZTY0Q29kZWMuZGVjb2RlKCA8c3RyaW5nPmJ5dGVzICk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmICggZm9ybWF0ID09IEJ5dGVBcnJheS5IRVggKVxuICAgICAge1xuICAgICAgICB0aGlzLmJ5dGVBcnJheSA9IEhleENvZGVjLmRlY29kZSggPHN0cmluZz5ieXRlcyApO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoIGZvcm1hdCA9PSBCeXRlQXJyYXkuVVRGOCApXG4gICAgICB7XG4gICAgICAgIGxldCBsID0gKCA8c3RyaW5nPmJ5dGVzICkubGVuZ3RoO1xuICAgICAgICBsZXQgYmEgPSBuZXcgVWludDhBcnJheSggbCApO1xuICAgICAgICBmb3IoIGxldCBpID0gMDsgaSA8IGw7ICsraSApXG4gICAgICAgICAgYmFbaV0gPSAoIDxzdHJpbmc+Ynl0ZXMgKS5jaGFyQ29kZUF0KCBpICk7XG5cbiAgICAgICAgdGhpcy5ieXRlQXJyYXkgPSBiYTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBNdXN0IGhhdmUgZXhlYyBvbmUgb2YgYWJvdmUgYWxsb2NhdG9yc1xuICAgIGlmICggIXRoaXMuYnl0ZUFycmF5IClcbiAgICB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoIFwiSW52YWxpZCBQYXJhbXMgZm9yIEJ5dGVBcnJheSgpXCIpXG4gICAgfVxuICB9XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXJcbiAge1xuICAgIHJldHVybiB0aGlzLmJ5dGVBcnJheS5sZW5ndGg7XG4gIH1cblxuICBzZXQgbGVuZ3RoKCBsZW46IG51bWJlciApXG4gIHtcbiAgICBpZiAoIHRoaXMuYnl0ZUFycmF5Lmxlbmd0aCA+PSBsZW4gKVxuICAgIHtcbiAgICAgIHRoaXMuYnl0ZUFycmF5ID0gdGhpcy5ieXRlQXJyYXkuc2xpY2UoIDAsIGxlbiApO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgbGV0IG9sZCA9IHRoaXMuYnl0ZUFycmF5O1xuICAgICAgdGhpcy5ieXRlQXJyYXkgPSBuZXcgVWludDhBcnJheSggbGVuICk7XG4gICAgICB0aGlzLmJ5dGVBcnJheS5zZXQoIG9sZCwgMCApO1xuICAgIH1cbiAgfVxuXG4gIGdldCBiYWNraW5nQXJyYXkoKTogVWludDhBcnJheVxuICB7XG4gICAgcmV0dXJuIHRoaXMuYnl0ZUFycmF5O1xuICB9XG5cbiAgZXF1YWxzKCB2YWx1ZTogQnl0ZUFycmF5ICk6IGJvb2xlYW5cbiAge1xuICAgIGxldCBiYSA9IHRoaXMuYnl0ZUFycmF5O1xuICAgIGxldCB2YmEgPSB2YWx1ZS5ieXRlQXJyYXk7XG4gICAgdmFyIG9rID0gKCBiYS5sZW5ndGggPT0gdmJhLmxlbmd0aCApO1xuXG4gICAgaWYgKCBvayApXG4gICAge1xuICAgICAgZm9yKCBsZXQgaSA9IDA7IGkgPCBiYS5sZW5ndGg7ICsraSApXG4gICAgICAgIG9rID0gb2sgJiYgKCBiYVtpXSA9PSB2YmFbaV0gKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2s7XG4gIH1cblxuICAvKipcbiAgICAqIGdldCBieXRlIGF0IG9mZnNldFxuICAgICovXG4gIGJ5dGVBdCggb2Zmc2V0OiBudW1iZXIgKTogbnVtYmVyXG4gIHtcbiAgICByZXR1cm4gdGhpcy5ieXRlQXJyYXlbIG9mZnNldCBdO1xuICB9XG5cbiAgd29yZEF0KCBvZmZzZXQ6IG51bWJlciApOiBudW1iZXJcbiAge1xuICAgIHJldHVybiAoIHRoaXMuYnl0ZUFycmF5WyBvZmZzZXQgICAgIF0gPDwgIDggKVxuICAgICAgICAgKyAoIHRoaXMuYnl0ZUFycmF5WyBvZmZzZXQgKyAxIF0gICAgICAgKTtcbiAgfVxuXG4gIGxpdHRsZUVuZGlhbldvcmRBdCggb2Zmc2V0ICk6IG51bWJlclxuICB7XG4gICAgcmV0dXJuICggdGhpcy5ieXRlQXJyYXlbIG9mZnNldCAgICAgXSApXG4gICAgICAgICArICggdGhpcy5ieXRlQXJyYXlbIG9mZnNldCArIDEgXSA8PCAgOCApO1xuICB9XG5cbiAgZHdvcmRBdCggb2Zmc2V0OiBudW1iZXIgKTogbnVtYmVyXG4gIHtcbiAgICByZXR1cm4gKCB0aGlzLmJ5dGVBcnJheVsgb2Zmc2V0ICAgICBdIDw8IDI0IClcbiAgICAgICAgICsgKCB0aGlzLmJ5dGVBcnJheVsgb2Zmc2V0ICsgMSBdIDw8IDE2IClcbiAgICAgICAgICsgKCB0aGlzLmJ5dGVBcnJheVsgb2Zmc2V0ICsgMiBdIDw8ICA4IClcbiAgICAgICAgICsgKCB0aGlzLmJ5dGVBcnJheVsgb2Zmc2V0ICsgMyBdICAgICAgICk7XG4gIH1cblxuICAvKipcbiAgICAqIHNldCBieXRlIGF0IG9mZnNldFxuICAgICogQGZsdWVudFxuICAgICovXG4gIHNldEJ5dGVBdCggb2Zmc2V0OiBudW1iZXIsIHZhbHVlOiBudW1iZXIgKTogQnl0ZUFycmF5XG4gIHtcbiAgICB0aGlzLmJ5dGVBcnJheVsgb2Zmc2V0IF0gPSB2YWx1ZTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0Qnl0ZXNBdCggb2Zmc2V0OiBudW1iZXIsIHZhbHVlOiBCeXRlQXJyYXkgKTogQnl0ZUFycmF5XG4gIHtcbiAgICB0aGlzLmJ5dGVBcnJheS5zZXQoIHZhbHVlLmJ5dGVBcnJheSwgb2Zmc2V0ICk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGNsb25lKCk6IEJ5dGVBcnJheVxuICB7XG4gICAgcmV0dXJuIG5ldyBCeXRlQXJyYXkoIHRoaXMuYnl0ZUFycmF5LnNsaWNlKCkgKTtcbiAgfVxuXG4gIC8qKlxuICAqIEV4dHJhY3QgYSBzZWN0aW9uIChvZmZzZXQsIGNvdW50KSBmcm9tIHRoZSBCeXRlQXJyYXlcbiAgKiBAZmx1ZW50XG4gICogQHJldHVybnMgYSBuZXcgQnl0ZUFycmF5IGNvbnRhaW5pbmcgYSBzZWN0aW9uLlxuICAqL1xuICBieXRlc0F0KCBvZmZzZXQ6IG51bWJlciwgY291bnQ/OiBudW1iZXIgKTogQnl0ZUFycmF5XG4gIHtcbiAgICBpZiAoICFOdW1iZXIuaXNJbnRlZ2VyKCBjb3VudCApIClcbiAgICAgIGNvdW50ID0gKCB0aGlzLmxlbmd0aCAtIG9mZnNldCApO1xuXG4gICAgcmV0dXJuIG5ldyBCeXRlQXJyYXkoIHRoaXMuYnl0ZUFycmF5LnNsaWNlKCBvZmZzZXQsIG9mZnNldCArIGNvdW50ICkgKTtcbiAgfVxuXG4gIC8qKlxuICAqIENyZWF0ZSBhIHZpZXcgaW50byB0aGUgQnl0ZUFycmF5XG4gICpcbiAgKiBAcmV0dXJucyBhIEJ5dGVBcnJheSByZWZlcmVuY2luZyBhIHNlY3Rpb24gb2Ygb3JpZ2luYWwgQnl0ZUFycmF5LlxuICAqL1xuICB2aWV3QXQoIG9mZnNldDogbnVtYmVyLCBjb3VudD86IG51bWJlciApOiBCeXRlQXJyYXlcbiAge1xuICAgIGlmICggIU51bWJlci5pc0ludGVnZXIoIGNvdW50ICkgKVxuICAgICAgY291bnQgPSAoIHRoaXMubGVuZ3RoIC0gb2Zmc2V0ICk7XG5cbiAgICByZXR1cm4gbmV3IEJ5dGVBcnJheSggdGhpcy5ieXRlQXJyYXkuc3ViYXJyYXkoIG9mZnNldCwgb2Zmc2V0ICsgY291bnQgKSApO1xuICB9XG5cbiAgLyoqXG4gICogQXBwZW5kIGJ5dGVcbiAgKiBAZmx1ZW50XG4gICovXG4gIGFkZEJ5dGUoIHZhbHVlOiBudW1iZXIgKTogQnl0ZUFycmF5XG4gIHtcbiAgICB0aGlzLmJ5dGVBcnJheVsgdGhpcy5ieXRlQXJyYXkubGVuZ3RoIF0gPSB2YWx1ZTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0TGVuZ3RoKCBsZW46IG51bWJlciApOiBCeXRlQXJyYXlcbiAge1xuICAgIHRoaXMubGVuZ3RoID0gbGVuO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBjb25jYXQoIGJ5dGVzOiBCeXRlQXJyYXkgKTogQnl0ZUFycmF5XG4gIHtcbiAgICBsZXQgYmEgPSB0aGlzLmJ5dGVBcnJheTtcblxuICAgIHRoaXMuYnl0ZUFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoIGJhLmxlbmd0aCArIGJ5dGVzLmxlbmd0aCApO1xuXG4gICAgdGhpcy5ieXRlQXJyYXkuc2V0KCBiYSApO1xuICAgIHRoaXMuYnl0ZUFycmF5LnNldCggYnl0ZXMuYnl0ZUFycmF5LCBiYS5sZW5ndGggKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbm90KCApOiBCeXRlQXJyYXlcbiAge1xuICAgIGxldCBiYSA9IHRoaXMuYnl0ZUFycmF5O1xuXG4gICAgZm9yKCBsZXQgaSA9IDA7IGkgPCBiYS5sZW5ndGg7ICsraSApXG4gICAgICBiYVtpXSA9IGJhW2ldIF4weEZGO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBhbmQoIHZhbHVlOiBCeXRlQXJyYXkgKTogQnl0ZUFycmF5XG4gIHtcbiAgICBsZXQgYmEgPSB0aGlzLmJ5dGVBcnJheTtcbiAgICBsZXQgdmJhID0gdmFsdWUuYnl0ZUFycmF5O1xuXG4gICAgZm9yKCBsZXQgaSA9IDA7IGkgPCBiYS5sZW5ndGg7ICsraSApXG4gICAgICBiYVtpXSA9IGJhW2ldICYgdmJhWyBpIF07XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIG9yKCB2YWx1ZTogQnl0ZUFycmF5ICk6IEJ5dGVBcnJheVxuICB7XG4gICAgbGV0IGJhID0gdGhpcy5ieXRlQXJyYXk7XG4gICAgbGV0IHZiYSA9IHZhbHVlLmJ5dGVBcnJheTtcblxuICAgIGZvciggbGV0IGkgPSAwOyBpIDwgYmEubGVuZ3RoOyArK2kgKVxuICAgICAgYmFbaV0gPSBiYVtpXSB8IHZiYVsgaSBdO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB4b3IoIHZhbHVlOiBCeXRlQXJyYXkgKTogQnl0ZUFycmF5XG4gIHtcbiAgICBsZXQgYmEgPSB0aGlzLmJ5dGVBcnJheTtcbiAgICBsZXQgdmJhID0gdmFsdWUuYnl0ZUFycmF5O1xuXG4gICAgZm9yKCBsZXQgaSA9IDA7IGkgPCBiYS5sZW5ndGg7ICsraSApXG4gICAgICBiYVtpXSA9IGJhW2ldIF4gdmJhWyBpIF07XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHRvU3RyaW5nKCBmb3JtYXQ/OiBudW1iZXIsIG9wdD86IGFueSApXG4gIHtcbiAgICBsZXQgcyA9IFwiXCI7XG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgKytpIClcbiAgICAgIHMgKz0gKCBcIjBcIiArIHRoaXMuYnl0ZUFycmF5WyBpIF0udG9TdHJpbmcoIDE2ICkpLnN1YnN0cmluZyggLTIgKTtcblxuICAgIHJldHVybiBzO1xuICB9XG59XG4iLCIvL2VudW0gS2V5VHlwZSB7IFwicHVibGljXCIsIFwicHJpdmF0ZVwiLCBcInNlY3JldFwiIH07XG5cbi8vZW51bSBLZXlVc2FnZSB7IFwiZW5jcnlwdFwiLCBcImRlY3J5cHRcIiwgXCJzaWduXCIsIFwidmVyaWZ5XCIsIFwiZGVyaXZlS2V5XCIsIFwiZGVyaXZlQml0c1wiLCBcIndyYXBLZXlcIiwgXCJ1bndyYXBLZXlcIiB9O1xuXG5leHBvcnQgY2xhc3MgS2V5IC8vaW1wbGVtZW50cyBDcnlwdG9LZXlcbntcbiAgcHJvdGVjdGVkIGlkOiBzdHJpbmc7XG5cbiAgcHJvdGVjdGVkIGNyeXB0b0tleTogQ3J5cHRvS2V5O1xuXG4gIGNvbnN0cnVjdG9yKCBpZDogc3RyaW5nLCBrZXk/OiBDcnlwdG9LZXkgKVxuICB7XG4gICAgdGhpcy5pZCA9IGlkO1xuXG4gICAgaWYgKCBrZXkgKVxuICAgICAgdGhpcy5jcnlwdG9LZXkgPSBrZXk7XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIHRoaXMuY3J5cHRvS2V5ID1cbiAgICAgIHtcbiAgICAgICAgdHlwZTogXCJcIixcbiAgICAgICAgYWxnb3JpdGhtOiBcIlwiLFxuICAgICAgICBleHRyYWN0YWJsZTogdHJ1ZSxcbiAgICAgICAgdXNhZ2VzOiBbXVxuICAgICAgfTtcbiAgICB9XG5cbiAgfVxuXG4gIHB1YmxpYyBnZXQgdHlwZSgpOiBzdHJpbmdcbiAge1xuICAgIHJldHVybiB0aGlzLmNyeXB0b0tleS50eXBlO1xuICB9XG5cbiAgcHVibGljIGdldCBhbGdvcml0aG0oKTogS2V5QWxnb3JpdGhtXG4gIHtcbiAgICByZXR1cm4gdGhpcy5jcnlwdG9LZXkuYWxnb3JpdGhtO1xuICB9XG5cbiAgcHVibGljIGdldCBleHRyYWN0YWJsZSgpOiBib29sZWFuXG4gIHtcbiAgICByZXR1cm4gdGhpcy5jcnlwdG9LZXkuZXh0cmFjdGFibGU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IHVzYWdlcygpOiBzdHJpbmdbXVxuICB7XG4gICAgcmV0dXJuIHRoaXMuY3J5cHRvS2V5LnVzYWdlcztcbiAgfVxuXG4gIHB1YmxpYyBnZXQgaW5uZXJLZXkoKTogQ3J5cHRvS2V5XG4gIHtcbiAgICByZXR1cm4gdGhpcy5jcnlwdG9LZXk7XG4gIH1cbi8qICBnZXRDb21wb25lbnQoIGNvbXBvbmVudElEOiBzdHJpbmcgKTogYW55XG4gIHtcbiAgICByZXR1cm4gdGhpcy5rZXlDb21wb25lbnRzWyBjb21wb25lbnRJRCBdO1xuICB9XG5cbiAgc2V0Q29tcG9uZW50KCBjb21wb25lbnRJRDogc3RyaW5nLCB2YWx1ZTogYW55IClcbiAge1xuICAgIHRoaXMua2V5Q29tcG9uZW50c1sgY29tcG9uZW50SUQgXSA9IHZhbHVlO1xuICB9Ki9cbn1cbiIsImltcG9ydCB7IEtleSB9IGZyb20gJy4va2V5JztcblxuZXhwb3J0IGNsYXNzIFByaXZhdGVLZXkgZXh0ZW5kcyBLZXlcbntcblxufVxuIiwiaW1wb3J0IHsgS2V5IH0gZnJvbSAnLi9rZXknO1xuXG5leHBvcnQgY2xhc3MgUHVibGljS2V5IGV4dGVuZHMgS2V5XG57XG5cbn1cbiIsImltcG9ydCB7IFByaXZhdGVLZXkgfSBmcm9tICcuL3ByaXZhdGUta2V5JztcbmltcG9ydCB7IFB1YmxpY0tleSB9IGZyb20gJy4vcHVibGljLWtleSc7XG5cbmV4cG9ydCBjbGFzcyBLZXlQYWlyXG57XG4gIHByaXZhdGVLZXk6IFByaXZhdGVLZXk7XG4gIHB1YmxpY0tleTogUHVibGljS2V5O1xufVxuIiwiaW1wb3J0IHsgQnl0ZUFycmF5IH0gZnJvbSAnLi4va2luZC9ieXRlLWFycmF5JztcbmltcG9ydCB7IEtleSB9IGZyb20gJy4va2V5JztcbmltcG9ydCB7IFByaXZhdGVLZXkgfSBmcm9tICcuL3ByaXZhdGUta2V5JztcbmltcG9ydCB7IFB1YmxpY0tleSB9IGZyb20gJy4vcHVibGljLWtleSc7XG5pbXBvcnQgeyBLZXlQYWlyIH0gZnJvbSAnLi9rZXktcGFpcic7XG5cbmRlY2xhcmUgdmFyIG1zcmNyeXB0bztcblxuZXhwb3J0IGNsYXNzIENyeXB0b2dyYXBoaWNTZXJ2aWNlIHtcbiAgcHJvdGVjdGVkIGNyeXB0bzogU3VidGxlQ3J5cHRvO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuY3J5cHRvID0gd2luZG93LmNyeXB0by5zdWJ0bGU7XG5cbiAgICBpZiAoICF0aGlzLmNyeXB0byAmJiBtc3JjcnlwdG8gKVxuICAgICAgIHRoaXMuY3J5cHRvID0gbXNyY3J5cHRvO1xuICB9XG5cbiAgZGVjcnlwdChhbGdvcml0aG06IHN0cmluZyB8IEFsZ29yaXRobSwga2V5OiBLZXksIGRhdGE6IEJ5dGVBcnJheSk6IFByb21pc2U8Qnl0ZUFycmF5PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPEJ5dGVBcnJheT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5jcnlwdG8uZGVjcnlwdChhbGdvcml0aG0sIGtleS5pbm5lcktleSwgZGF0YS5iYWNraW5nQXJyYXkpXG4gICAgICAgIC50aGVuKChyZXMpID0+IHsgcmVzb2x2ZShuZXcgQnl0ZUFycmF5KHJlcykpOyB9KVxuICAgICAgICAuY2F0Y2goKGVycikgPT4geyByZWplY3QoZXJyKTsgfSk7XG4gICAgfSk7XG4gIH1cblxuLy9kZXJpdmVCaXRzKGFsZ29yaXRobTogc3RyaW5nIHwgQWxnb3JpdGhtLCBiYXNlS2V5OiBDcnlwdG9LZXksIGxlbmd0aDogbnVtYmVyKTogYW55O1xuLy9kZXJpdmVLZXkoYWxnb3JpdGhtOiBzdHJpbmcgfCBBbGdvcml0aG0sIGJhc2VLZXk6IENyeXB0b0tleSwgZGVyaXZlZEtleVR5cGU6IHN0cmluZyB8IEFsZ29yaXRobSwgZXh0cmFjdGFibGU6IGJvb2xlYW4sIGtleVVzYWdlczogc3RyaW5nW10pOiBhbnk7XG4gIGRpZ2VzdChhbGdvcml0aG06IHN0cmluZyB8IEFsZ29yaXRobSwgZGF0YTogQnl0ZUFycmF5KTogYW55IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2U8Qnl0ZUFycmF5PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLmNyeXB0by5kaWdlc3QoYWxnb3JpdGhtLCBkYXRhLmJhY2tpbmdBcnJheSlcbiAgICAgICAudGhlbigocmVzKSA9PiB7IHJlc29sdmUobmV3IEJ5dGVBcnJheShyZXMpKTsgfSlcbiAgICAgICAuY2F0Y2goKGVycikgPT4geyByZWplY3QoZXJyKTsgfSk7XG4gICAgfSk7XG4gIH1cblxuICBlbmNyeXB0KCBhbGdvcml0aG06IHN0cmluZyB8IEFsZ29yaXRobSwga2V5OiBLZXksIGRhdGE6IEJ5dGVBcnJheSApOiBQcm9taXNlPEJ5dGVBcnJheT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxCeXRlQXJyYXk+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMuY3J5cHRvLmVuY3J5cHQoYWxnb3JpdGhtLCBrZXkuaW5uZXJLZXksIGRhdGEuYmFja2luZ0FycmF5KVxuICAgICAgICAudGhlbigocmVzKSA9PiB7IHJlc29sdmUobmV3IEJ5dGVBcnJheShyZXMpKTsgfSlcbiAgICAgICAgLmNhdGNoKChlcnIpID0+IHsgcmVqZWN0KGVycik7IH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZXhwb3J0S2V5KCBmb3JtYXQ6IHN0cmluZywga2V5OiBLZXkgKTogUHJvbWlzZTxCeXRlQXJyYXk+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2U8Qnl0ZUFycmF5PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLmNyeXB0by5leHBvcnRLZXkoZm9ybWF0LCBrZXkuaW5uZXJLZXkpXG4gICAgICAgIC50aGVuKChyZXMpID0+IHsgcmVzb2x2ZShuZXcgQnl0ZUFycmF5KHJlcykpOyB9KVxuICAgICAgICAuY2F0Y2goKGVycikgPT4geyByZWplY3QoZXJyKTsgfSk7XG4gICAgfSk7XG4gIH1cblxuICBnZW5lcmF0ZUtleSggYWxnb3JpdGhtOiBzdHJpbmcgfCBBbGdvcml0aG0sIGV4dHJhY3RhYmxlOiBib29sZWFuLCBrZXlVc2FnZXM6IHN0cmluZ1tdICk6IFByb21pc2U8S2V5IHwgS2V5UGFpcj4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxLZXkgfCBLZXlQYWlyPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgIH0pO1xuICB9XG5cbiAgaW1wb3J0S2V5KGZvcm1hdDogc3RyaW5nLCBrZXlEYXRhOiBCeXRlQXJyYXkgLCBhbGdvcml0aG06IHN0cmluZyB8IEFsZ29yaXRobSwgZXh0cmFjdGFibGU6IGJvb2xlYW4sIGtleVVzYWdlczogc3RyaW5nW10pOiBQcm9taXNlPENyeXB0b0tleT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxLZXk+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMuY3J5cHRvLmltcG9ydEtleShmb3JtYXQsIGtleURhdGEuYmFja2luZ0FycmF5LCBhbGdvcml0aG0sIGV4dHJhY3RhYmxlLCBrZXlVc2FnZXMpXG4gICAgICAgIC50aGVuKChyZXMpID0+IHsgcmVzb2x2ZShyZXMpOyB9KVxuICAgICAgICAuY2F0Y2goKGVycikgPT4geyByZWplY3QoZXJyKTsgfSk7XG4gICB9KTtcbiAgfVxuXG4gIHNpZ24oYWxnb3JpdGhtOiBzdHJpbmcgfCBBbGdvcml0aG0sIGtleTogS2V5LCBkYXRhOiBCeXRlQXJyYXkpOiBQcm9taXNlPEJ5dGVBcnJheT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxCeXRlQXJyYXk+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMuY3J5cHRvLnNpZ24oYWxnb3JpdGhtLCBrZXkuaW5uZXJLZXksIGRhdGEuYmFja2luZ0FycmF5KVxuICAgICAgICAudGhlbigocmVzKSA9PiB7IHJlc29sdmUobmV3IEJ5dGVBcnJheShyZXMpKTsgfSlcbiAgICAgICAgLmNhdGNoKChlcnIpID0+IHsgcmVqZWN0KGVycik7IH0pO1xuICAgIH0pO1xuICB9XG5cbi8vdW53cmFwS2V5KGZvcm1hdDogc3RyaW5nLCB3cmFwcGVkS2V5OiBBcnJheUJ1ZmZlclZpZXcsIHVud3JhcHBpbmdLZXk6IENyeXB0b0tleSwgdW53cmFwQWxnb3JpdGhtOiBzdHJpbmcgfCBBbGdvcml0aG0sIHVud3JhcHBlZEtleUFsZ29yaXRobTogc3RyaW5nIHwgQWxnb3JpdGhtLCBleHRyYWN0YWJsZTogYm9vbGVhbiwga2V5VXNhZ2VzOiBzdHJpbmdbXSk6IGFueTtcbiAgdmVyaWZ5KGFsZ29yaXRobTogc3RyaW5nIHwgQWxnb3JpdGhtLCBrZXk6IEtleSwgc2lnbmF0dXJlOiBCeXRlQXJyYXksIGRhdGE6IEJ5dGVBcnJheSk6IFByb21pc2U8Qnl0ZUFycmF5PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPEJ5dGVBcnJheT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5jcnlwdG8udmVyaWZ5KGFsZ29yaXRobSwga2V5LmlubmVyS2V5LCBzaWduYXR1cmUuYmFja2luZ0FycmF5LCBkYXRhLmJhY2tpbmdBcnJheSlcbiAgICAgICAgLnRoZW4oKHJlcykgPT4geyByZXNvbHZlKG5ldyBCeXRlQXJyYXkocmVzKSk7IH0pXG4gICAgICAgIC5jYXRjaCgoZXJyKSA9PiB7IHJlamVjdChlcnIpOyB9KTtcbiAgICB9KTtcbiAgfVxuXG4vL3dyYXBLZXkoZm9ybWF0OiBzdHJpbmcsIGtleTogQ3J5cHRvS2V5LCB3cmFwcGluZ0tleTogQ3J5cHRvS2V5LCB3cmFwQWxnb3JpdGhtOiBzdHJpbmcgfCBBbGdvcml0aG0pOiBhbnk7XG59XG4iLCJpbXBvcnQgeyBDb250YWluZXIsIGF1dG9pbmplY3QgYXMgaW5qZWN0IH0gZnJvbSAnYXVyZWxpYS1kZXBlbmRlbmN5LWluamVjdGlvbic7XG5pbXBvcnQgeyBtZXRhZGF0YSB9IGZyb20gJ2F1cmVsaWEtbWV0YWRhdGEnO1xuXG5leHBvcnQgeyBDb250YWluZXIsIGluamVjdCB9O1xuZXhwb3J0IGludGVyZmFjZSBJbmplY3RhYmxlIHtcbiAgbmV3KCAuLi5hcmdzICk6IE9iamVjdDtcbn1cbiIsImltcG9ydCB7IEV2ZW50QWdncmVnYXRvciwgU3Vic2NyaXB0aW9uLCBIYW5kbGVyIGFzIEV2ZW50SGFuZGxlciB9IGZyb20gJ2F1cmVsaWEtZXZlbnQtYWdncmVnYXRvcic7XG5cbi8vZXhwb3J0IHsgRXZlbnRIYW5kbGVyIH07XG5cbmV4cG9ydCBjbGFzcyBFdmVudEh1Ylxue1xuICBfZXZlbnRBZ2dyZWdhdG9yOiBFdmVudEFnZ3JlZ2F0b3I7XG5cbiAgY29uc3RydWN0b3IoIClcbiAge1xuICAgIHRoaXMuX2V2ZW50QWdncmVnYXRvciA9IG5ldyBFdmVudEFnZ3JlZ2F0b3IoKTtcbiAgfVxuXG4gIHB1YmxpYyBwdWJsaXNoKCBldmVudDogc3RyaW5nLCBkYXRhPzogYW55IClcbiAge1xuICAgIHRoaXMuX2V2ZW50QWdncmVnYXRvci5wdWJsaXNoKCBldmVudCwgZGF0YSApO1xuICB9XG5cbiAgcHVibGljIHN1YnNjcmliZSggZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogRnVuY3Rpb24gKTogU3Vic2NyaXB0aW9uXG4gIHtcbiAgICByZXR1cm4gdGhpcy5fZXZlbnRBZ2dyZWdhdG9yLnN1YnNjcmliZSggZXZlbnQsIGhhbmRsZXIgKTtcbiAgfVxuXG4gIHB1YmxpYyBzdWJzY3JpYmVPbmNlKCBldmVudDogc3RyaW5nLCBoYW5kbGVyOiBGdW5jdGlvbiApOiBTdWJzY3JpcHRpb25cbiAge1xuICAgIHJldHVybiB0aGlzLl9ldmVudEFnZ3JlZ2F0b3Iuc3Vic2NyaWJlT25jZSggZXZlbnQsIGhhbmRsZXIgKTtcbiAgfVxufVxuXG4vKmZ1bmN0aW9uIGV2ZW50SHViKCk6IGFueSB7XG4gIHJldHVybiBmdW5jdGlvbiBldmVudEh1YjxURnVuY3Rpb24gZXh0ZW5kcyBGdW5jdGlvbiwgRXZlbnRIdWI+KHRhcmdldDogVEZ1bmN0aW9uKTogVEZ1bmN0aW9uIHtcblxuICAgIHRhcmdldC5wcm90b3R5cGUuc3Vic2NyaWJlID0gbmV3Q29uc3RydWN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSh0YXJnZXQucHJvdG90eXBlKTtcbiAgICBuZXdDb25zdHJ1Y3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSB0YXJnZXQ7XG5cbiAgICByZXR1cm4gPGFueT4gbmV3Q29uc3RydWN0b3I7XG4gIH1cbn1cblxuQGV2ZW50SHViKClcbmNsYXNzIE15Q2xhc3Mge307XG4qL1xuIiwiaW1wb3J0IHsgQnl0ZUFycmF5IH0gZnJvbSAnLi9ieXRlLWFycmF5JztcblxuZXhwb3J0IGNsYXNzIEVudW0ge307XG5cbmV4cG9ydCB0eXBlIERhdGFUeXBlID0gU3RyaW5nIHwgTnVtYmVyIHwgRW51bSB8IEJ5dGVBcnJheSB8IEtpbmQ7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmllbGRJbmZvIHtcbiAgaWQ/OiBzdHJpbmc7XG5cbiAgZGVzY3JpcHRpb246IHN0cmluZztcblxuICBkYXRhVHlwZTogRGF0YVR5cGU7XG5cbiAgZW51bUluZm8/OiBNYXA8bnVtYmVyLCBzdHJpbmc+O1xuXG4gIG1pbkxlbmd0aD86IG51bWJlcjtcblxuICBtYXhMZW5ndGg/OiBudW1iZXI7XG59XG5cbi8qKlxuKiBNZXRhZGF0YSBhYm91dCBhIEtpbmQuIENvbnRhaW5zIG5hbWUsIGRlc2NyaXB0aW9uIGFuZCBhIG1hcCBvZlxuKiBwcm9wZXJ0eS1kZXNjcmlwdG9ycyB0aGF0IGRlc2NyaWJlIHRoZSBzZXJpYWxpemFibGUgZmllbGRzIG9mXG4qIGFuIG9iamVjdCBvZiB0aGF0IEtpbmQuXG4qL1xuZXhwb3J0IGNsYXNzIEtpbmRJbmZvXG57XG4gIG5hbWU6IHN0cmluZztcblxuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuXG4gIGZpZWxkczogeyBbaWQ6IHN0cmluZ106IEZpZWxkSW5mbyB9ID0ge307XG59XG5cblxuLyoqXG4qIEJ1aWxkZXIgZm9yICdLaW5kJyBtZXRhZGF0YVxuKi9cbmV4cG9ydCBjbGFzcyBLaW5kQnVpbGRlclxue1xuICBwcml2YXRlIGN0b3I6IEtpbmRDb25zdHJ1Y3RvcjtcblxuICBjb25zdHJ1Y3RvciggY3RvcjogS2luZENvbnN0cnVjdG9yLCBkZXNjcmlwdGlvbjogc3RyaW5nICkge1xuICAgIHRoaXMuY3RvciA9IGN0b3I7XG5cbiAgICBjdG9yLmtpbmRJbmZvID0ge1xuICAgICAgbmFtZTogY3Rvci5uYW1lLFxuICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxuICAgICAgZmllbGRzOiB7fVxuICAgIH1cbiAgfVxuXG5cbiAgcHJpdmF0ZSBraW5kSW5mbzogS2luZEluZm87XG5cbiAgcHVibGljIHN0YXRpYyBpbml0KCBjdG9yOiBLaW5kQ29uc3RydWN0b3IsIGRlc2NyaXB0aW9uOiBzdHJpbmcgKTogS2luZEJ1aWxkZXJcbiAge1xuICAgIGxldCBidWlsZGVyID0gbmV3IEtpbmRCdWlsZGVyKCBjdG9yLCBkZXNjcmlwdGlvbiApO1xuXG4gICAgcmV0dXJuIGJ1aWxkZXI7XG4gIH1cblxuICBwdWJsaWMgZmllbGQoIG5hbWU6IHN0cmluZywgZGVzY3JpcHRpb246IHN0cmluZywgZGF0YVR5cGU6IERhdGFUeXBlLCBvcHRzPyApOiBLaW5kQnVpbGRlclxuICB7XG4gICAgdGhpcy5jdG9yLmtpbmRJbmZvLmZpZWxkc1sgbmFtZSBdID0ge1xuICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxuICAgICAgZGF0YVR5cGU6IGRhdGFUeXBlXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cblxuLyogIG1ha2VLaW5kKCBraW5kQ29uc3RydWN0b3IsIGtpbmRPcHRpb25zIClcbiAge1xuICAgIHZhciAka2luZEluZm8gPSBraW5kT3B0aW9ucy5raW5kSW5mbztcblxuICAgIGtpbmRDb25zdHJ1Y3Rvci4ka2luZE5hbWUgPSAka2luZEluZm8udGl0bGU7XG5cbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKCBraW5kT3B0aW9ucy5raW5kTWV0aG9kcyApO1xuXG4gICAgZm9yICggdmFyIGogPSAwLCBqaiA9IGtleXMubGVuZ3RoOyBqIDwgamo7IGorKyApIHtcbiAgICAgIHZhciBrZXkgPSBrZXlzW2pdO1xuICAgICAga2luZENvbnN0cnVjdG9yW2tleV0gPSBraW5kT3B0aW9ucy5raW5kTWV0aG9kc1trZXldO1xuICAgIH1cblxuICAgIGtpbmRDb25zdHJ1Y3Rvci5nZXRLaW5kSW5mbyA9IGtpbmRDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZ2V0S2luZEluZm8gPSBmdW5jdGlvbiBnZXRLaW5kSW5mbygpIHtcbiAgICAgIHJldHVybiAka2luZEluZm87XG4gICAgfVxuXG4gICAgcmV0dXJuIGtpbmRDb25zdHJ1Y3RvcjtcbiAgfVxuKi9cblxuLyoqXG4qIFJlcHJlc2VudHMgYSBzZXJpYWxpemFibGUgYW5kIGluc3BlY3RhYmxlIGRhdGEtdHlwZVxuKiBpbXBsZW1lbnRlZCBhcyBhIGhhc2gtbWFwIGNvbnRhaW5pbmcga2V5LXZhbHVlIHBhaXJzLFxuKiBhbG9uZyB3aXRoIG1ldGFkYXRhIHRoYXQgZGVzY3JpYmVzIGVhY2ggZmllbGQgdXNpbmcgYSBqc29uLXNjaGVtZSBsaWtlXG4qL1xuZXhwb3J0IGludGVyZmFjZSBLaW5kXG57XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgS2luZENvbnN0cnVjdG9yXG57XG4gIG5ldyAoIC4uLmFyZ3MgKTogS2luZDtcblxuICBraW5kSW5mbz86IEtpbmRJbmZvO1xufVxuXG5lbnVtIE9yYW5nZXMge1xuICBCTE9PRCxcbiAgU0VWSUxMRSxcbiAgU0FUU1VNQSxcbiAgTkFWRUxcbn1cblxuLyoqXG4qIEV4YW1wbGVcbiovXG5jbGFzcyBGcnVpdHlLaW5kIGltcGxlbWVudHMgS2luZFxue1xuICBiYW5hbmE6IFN0cmluZztcbiAgYXBwbGU6IE51bWJlcjtcbiAgb3JhbmdlOiBPcmFuZ2VzO1xufVxuXG5LaW5kQnVpbGRlci5pbml0KCBGcnVpdHlLaW5kLCAnYSBDb2xsZWN0aW9uIG9mIGZydWl0JyApXG4gIC5maWVsZCgnYmFuYW5hJywgJ2EgYmFuYW5hJywgU3RyaW5nIClcbiAgLmZpZWxkKCdhcHBsZScsICdhbiBhcHBsZSBvciBwZWFyJywgTnVtYmVyIClcbiAgLmZpZWxkKCdvcmFuZ2UnLCAnc29tZSBzb3J0IG9mIG9yYW5nZScsIEVudW0gKVxuICA7XG4iLCJpbXBvcnQgeyBLaW5kIH0gZnJvbSAnLi4va2luZC9raW5kJztcbmltcG9ydCB7IEVuZFBvaW50IH0gZnJvbSAnLi9lbmQtcG9pbnQnO1xuXG4vKlxuKiBNZXNzYWdlIEhlYWRlclxuKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWVzc2FnZUhlYWRlclxue1xuICAvKlxuICAqIE1lc3NhZ2UgTmFtZSwgaW5kaWNhdGVzIGEgY29tbWFuZCAvIG1ldGhvZCAvIHJlc3BvbnNlIHRvIGV4ZWN1dGVcbiAgKi9cbiAgbWV0aG9kPzogc3RyaW5nO1xuXG4gIC8qXG4gICogTWVzc2FnZSBJZGVudGlmaWVyICh1bmlxdWUpIGZvciBlYWNoIHNlbnQgbWVzc2FnZSAob3IgQ01ELVJFU1AgcGFpcilcbiAgKi9cbiAgaWQ/OiBudW1iZXI7XG5cblxuICAvKlxuICAqIERlc2NyaXB0aW9uLCB1c2VmdWwgZm9yIHRyYWNpbmcgYW5kIGxvZ2dpbmdcbiAgKi9cbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG5cbiAgLypcbiAgKiBGb3IgQ01EL1JFU1Agc3R5bGUgcHJvdG9jb2xzLCBpbmRpY2F0ZXMgdGhhdCBtZXNzYWdlIGRpc3BhdGNoZWRcbiAgKiBpbiByZXNwb25zZSB0byBhIHByZXZpb3VzIGNvbW1hbmRcbiAgKi9cbiAgaXNSZXNwb25zZT86IGJvb2xlYW47XG5cbiAgLypcbiAgKiBFbmRQb2ludCB0aGF0IG9yaWdpbmF0ZWQgdGhlIG1lc3NhZ2VcbiAgKi9cbiAgb3JpZ2luPzogRW5kUG9pbnQ7XG5cblxuICAvKlxuICAqIEluZGljYXRlcyB0aGUgS2luZCBvZiBkYXRhICh3aGVuIHNlcmlhbGl6ZWQpXG4gICovXG4gIGtpbmROYW1lPzogc3RyaW5nO1xufVxuXG4vKlxuKiBBIFR5cGVkIE1lc3NhZ2UsIHdpdGggaGVhZGVyIGFuZCBwYXlsb2FkXG4qL1xuZXhwb3J0IGNsYXNzIE1lc3NhZ2U8VD5cbntcbiAgcHJpdmF0ZSBfaGVhZGVyOiBNZXNzYWdlSGVhZGVyO1xuICBwcml2YXRlIF9wYXlsb2FkOiBUO1xuXG4gIGNvbnN0cnVjdG9yKCBoZWFkZXI6IE1lc3NhZ2VIZWFkZXIsIHBheWxvYWQ6IFQgKVxuICB7XG4gICAgdGhpcy5faGVhZGVyID0gaGVhZGVyIHx8IHt9O1xuICAgIHRoaXMuX3BheWxvYWQgPSBwYXlsb2FkO1xuICB9XG5cbiAgZ2V0IGhlYWRlcigpOiBNZXNzYWdlSGVhZGVyXG4gIHtcbiAgICByZXR1cm4gdGhpcy5faGVhZGVyO1xuICB9XG5cbiAgZ2V0IHBheWxvYWQoKTogVFxuICB7XG4gICAgcmV0dXJuIHRoaXMuX3BheWxvYWQ7XG4gIH1cbn1cblxuLypcbiogQSB0eXBlZCBNZXNzYWdlIHdob3NlIHBheWxvYWQgaXMgYSBLaW5kXG4qL1xuZXhwb3J0IGNsYXNzIEtpbmRNZXNzYWdlPEsgZXh0ZW5kcyBLaW5kPiBleHRlbmRzIE1lc3NhZ2U8Sz5cbntcbn1cbiIsImV4cG9ydCB0eXBlIFRhc2sgPSAoKSA9PiB2b2lkO1xuZXhwb3J0IHR5cGUgRmx1c2hGdW5jID0gKCkgPT4gdm9pZDtcbnZhciB3aW5kb3cgPSB3aW5kb3cgfHwge307XG5cbmV4cG9ydCBjbGFzcyBUYXNrU2NoZWR1bGVyXG57XG4gIHN0YXRpYyBtYWtlUmVxdWVzdEZsdXNoRnJvbU11dGF0aW9uT2JzZXJ2ZXIoZmx1c2gpOiBGbHVzaEZ1bmNcbiAge1xuICAgIHZhciB0b2dnbGUgPSAxO1xuXG4gICAgdmFyIG9ic2VydmVyID0gbmV3IFRhc2tTY2hlZHVsZXIuQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIoZmx1c2gpO1xuXG4gICAgdmFyIG5vZGU6IE9iamVjdCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcblxuICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RGbHVzaCgpXG4gICAge1xuICAgICAgdG9nZ2xlID0gLXRvZ2dsZTtcbiAgICAgIG5vZGVbXCJkYXRhXCJdID0gdG9nZ2xlO1xuICAgIH07XG4gIH1cblxuICBzdGF0aWMgbWFrZVJlcXVlc3RGbHVzaEZyb21UaW1lcihmbHVzaCk6IEZsdXNoRnVuY1xuICB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHJlcXVlc3RGbHVzaCgpIHtcbiAgICAgIHZhciB0aW1lb3V0SGFuZGxlID0gc2V0VGltZW91dChoYW5kbGVGbHVzaFRpbWVyLCAwKTtcblxuICAgICAgdmFyIGludGVydmFsSGFuZGxlID0gc2V0SW50ZXJ2YWwoaGFuZGxlRmx1c2hUaW1lciwgNTApO1xuICAgICAgZnVuY3Rpb24gaGFuZGxlRmx1c2hUaW1lcigpXG4gICAgICB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SGFuZGxlKTtcbiAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbEhhbmRsZSk7XG4gICAgICAgIGZsdXNoKCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIHN0YXRpYyBCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9IHdpbmRvd1sgXCJNdXRhdGlvbk9ic2VydmVyXCIgXSB8fCB3aW5kb3dbIFwiV2ViS2l0TXV0YXRpb25PYnNlcnZlclwiXTtcbiAgc3RhdGljIGhhc1NldEltbWVkaWF0ZSA9IHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09ICdmdW5jdGlvbic7XG5cbiAgc3RhdGljIHRhc2tRdWV1ZUNhcGFjaXR5ID0gMTAyNDtcbiAgdGFza1F1ZXVlOiBUYXNrW107XG5cbiAgcmVxdWVzdEZsdXNoVGFza1F1ZXVlOiBGbHVzaEZ1bmM7XG5cbiAgY29uc3RydWN0b3IoKVxuICB7XG4gICAgdGhpcy50YXNrUXVldWUgPSBbXTtcblxuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGlmICh0eXBlb2YgVGFza1NjaGVkdWxlci5Ccm93c2VyTXV0YXRpb25PYnNlcnZlciA9PT0gJ2Z1bmN0aW9uJylcbiAgICB7XG4gICAgICB0aGlzLnJlcXVlc3RGbHVzaFRhc2tRdWV1ZSA9IFRhc2tTY2hlZHVsZXIubWFrZVJlcXVlc3RGbHVzaEZyb21NdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuZmx1c2hUYXNrUXVldWUoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgdGhpcy5yZXF1ZXN0Rmx1c2hUYXNrUXVldWUgPSBUYXNrU2NoZWR1bGVyLm1ha2VSZXF1ZXN0Rmx1c2hGcm9tVGltZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc2VsZi5mbHVzaFRhc2tRdWV1ZSgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICogQ2xlYW51cCB0aGUgVGFza1NjaGVkdWxlciwgY2FuY2VsbGluZyBhbnkgcGVuZGluZyBjb21tdW5pY2F0aW9ucy5cbiAgKi9cbiAgc2h1dGRvd24oKVxuICB7XG4gIH1cblxuICBxdWV1ZVRhc2soIHRhc2spXG4gIHtcbiAgICBpZiAoIHRoaXMudGFza1F1ZXVlLmxlbmd0aCA8IDEgKVxuICAgIHtcbiAgICAgIHRoaXMucmVxdWVzdEZsdXNoVGFza1F1ZXVlKCk7XG4gICAgfVxuXG4gICAgdGhpcy50YXNrUXVldWUucHVzaCh0YXNrKTtcbiAgfVxuXG4gIGZsdXNoVGFza1F1ZXVlKClcbiAge1xuICAgIHZhciBxdWV1ZSA9IHRoaXMudGFza1F1ZXVlLFxuICAgICAgICBjYXBhY2l0eSA9IFRhc2tTY2hlZHVsZXIudGFza1F1ZXVlQ2FwYWNpdHksXG4gICAgICAgIGluZGV4ID0gMCxcbiAgICAgICAgdGFzaztcblxuICAgIHdoaWxlIChpbmRleCA8IHF1ZXVlLmxlbmd0aClcbiAgICB7XG4gICAgICB0YXNrID0gcXVldWVbaW5kZXhdO1xuXG4gICAgICB0cnlcbiAgICAgIHtcbiAgICAgICAgdGFzay5jYWxsKCk7XG4gICAgICB9XG4gICAgICBjYXRjaCAoZXJyb3IpXG4gICAgICB7XG4gICAgICAgIHRoaXMub25FcnJvcihlcnJvciwgdGFzayk7XG4gICAgICB9XG5cbiAgICAgIGluZGV4Kys7XG5cbiAgICAgIGlmIChpbmRleCA+IGNhcGFjaXR5KVxuICAgICAge1xuICAgICAgICBmb3IgKHZhciBzY2FuID0gMDsgc2NhbiA8IGluZGV4OyBzY2FuKyspXG4gICAgICAgIHtcbiAgICAgICAgICBxdWV1ZVtzY2FuXSA9IHF1ZXVlW3NjYW4gKyBpbmRleF07XG4gICAgICAgIH1cblxuICAgICAgICBxdWV1ZS5sZW5ndGggLT0gaW5kZXg7XG4gICAgICAgIGluZGV4ID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBxdWV1ZS5sZW5ndGggPSAwO1xuICB9XG5cbiAgb25FcnJvcihlcnJvciwgdGFzaylcbiAge1xuICAgIGlmICgnb25FcnJvcicgaW4gdGFzaykge1xuICAgICAgdGFzay5vbkVycm9yKGVycm9yKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoIFRhc2tTY2hlZHVsZXIuaGFzU2V0SW1tZWRpYXRlIClcbiAgICB7XG4gICAgICBzZXRJbW1lZGlhdGUoZnVuY3Rpb24gKCkge1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfSwgMCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBUYXNrU2NoZWR1bGVyIH0gZnJvbSAnLi4vcnVudGltZS90YXNrLXNjaGVkdWxlcic7XG5pbXBvcnQgeyBFbmRQb2ludCwgRGlyZWN0aW9uIH0gZnJvbSAnLi9lbmQtcG9pbnQnO1xuaW1wb3J0IHsgTWVzc2FnZSB9IGZyb20gJy4vbWVzc2FnZSc7XG5cbi8qKlxuKiBBIG1lc3NhZ2UtcGFzc2luZyBjaGFubmVsIGJldHdlZW4gbXVsdGlwbGUgRW5kUG9pbnRzXG4qXG4qIEVuZFBvaW50cyBtdXN0IGZpcnN0IHJlZ2lzdGVyIHdpdGggdGhlIENoYW5uZWwuIFdoZW5ldmVyIHRoZSBDaGFubmVsIGlzIGluXG4qIGFuIGFjdGl2ZSBzdGF0ZSwgY2FsbHMgdG8gc2VuZE1lc3NhZ2Ugd2lsbCBmb3J3YXJkIHRoZSBtZXNzYWdlIHRvIGFsbFxuKiByZWdpc3RlcmVkIEVuZFBvaW50cyAoZXhjZXB0IHRoZSBvcmlnaW5hdG9yIEVuZFBvaW50KS5cbiovXG5leHBvcnQgY2xhc3MgQ2hhbm5lbFxue1xuICAvKipcbiAgKiBUcnVlIGlmIENoYW5uZWwgaXMgYWN0aXZlXG4gICovXG4gIHByaXZhdGUgX2FjdGl2ZTogYm9vbGVhbjtcblxuICAvKipcbiAgKiBBcnJheSBvZiBFbmRQb2ludHMgYXR0YWNoZWQgdG8gdGhpcyBDaGFubmVsXG4gICovXG4gIHByaXZhdGUgX2VuZFBvaW50czogRW5kUG9pbnRbXTtcblxuICAvKipcbiAgKiBQcml2YXRlIFRhc2tTY2hlZHVsZXIgdXNlZCB0byBtYWtlIG1lc3NhZ2Utc2VuZHMgYXN5bmNocm9ub3VzLlxuICAqL1xuICBwcml2YXRlIF90YXNrU2NoZWR1bGVyOiBUYXNrU2NoZWR1bGVyO1xuXG4gIC8qKlxuICAqIENyZWF0ZSBhIG5ldyBDaGFubmVsLCBpbml0aWFsbHkgaW5hY3RpdmVcbiAgKi9cbiAgY29uc3RydWN0b3IoKVxuICB7XG4gICAgdGhpcy5fYWN0aXZlID0gZmFsc2U7XG4gICAgdGhpcy5fZW5kUG9pbnRzID0gW107XG4gIH1cblxuICAvKipcbiAgKiBDbGVhbnVwIHRoZSBDaGFubmVsLCBkZWFjdGl2YXRlLCByZW1vdmUgYWxsIEVuZFBvaW50cyBhbmRcbiAgKiBhYm9ydCBhbnkgcGVuZGluZyBjb21tdW5pY2F0aW9ucy5cbiAgKi9cbiAgcHVibGljIHNodXRkb3duKClcbiAge1xuICAgIHRoaXMuX2FjdGl2ZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5fZW5kUG9pbnRzID0gW107XG5cbiAgICBpZiAoIHRoaXMuX3Rhc2tTY2hlZHVsZXIgKVxuICAgIHtcbiAgICAgIHRoaXMuX3Rhc2tTY2hlZHVsZXIuc2h1dGRvd24oKTtcblxuICAgICAgdGhpcy5fdGFza1NjaGVkdWxlciA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgKiBJcyBDaGFubmVsIGFjdGl2ZT9cbiAgKlxuICAqIEByZXR1cm5zIHRydWUgaWYgY2hhbm5lbCBpcyBhY3RpdmUsIGZhbHNlIG90aGVyd2lzZVxuICAqL1xuICBwdWJsaWMgZ2V0IGFjdGl2ZSgpOiBib29sZWFuXG4gIHtcbiAgICByZXR1cm4gdGhpcy5fYWN0aXZlO1xuICB9XG5cbiAgLyoqXG4gICogQWN0aXZhdGUgdGhlIENoYW5uZWwsIGVuYWJsaW5nIGNvbW11bmljYXRpb25cbiAgKi9cbiAgcHVibGljIGFjdGl2YXRlKClcbiAge1xuICAgIHRoaXMuX3Rhc2tTY2hlZHVsZXIgPSBuZXcgVGFza1NjaGVkdWxlcigpO1xuXG4gICAgdGhpcy5fYWN0aXZlID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAqIERlYWN0aXZhdGUgdGhlIENoYW5uZWwsIGRpc2FibGluZyBhbnkgZnVydGhlciBjb21tdW5pY2F0aW9uXG4gICovXG4gIHB1YmxpYyBkZWFjdGl2YXRlKClcbiAge1xuICAgIHRoaXMuX3Rhc2tTY2hlZHVsZXIgPSB1bmRlZmluZWQ7XG5cbiAgICB0aGlzLl9hY3RpdmUgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAqIFJlZ2lzdGVyIGFuIEVuZFBvaW50IHRvIHNlbmQgYW5kIHJlY2VpdmUgbWVzc2FnZXMgdmlhIHRoaXMgQ2hhbm5lbC5cbiAgKlxuICAqIEBwYXJhbSBlbmRQb2ludCAtIHRoZSBFbmRQb2ludCB0byByZWdpc3RlclxuICAqL1xuICBwdWJsaWMgYWRkRW5kUG9pbnQoIGVuZFBvaW50OiBFbmRQb2ludCApXG4gIHtcbiAgICB0aGlzLl9lbmRQb2ludHMucHVzaCggZW5kUG9pbnQgKTtcbiAgfVxuXG4gIC8qKlxuICAqIFVucmVnaXN0ZXIgYW4gRW5kUG9pbnQuXG4gICpcbiAgKiBAcGFyYW0gZW5kUG9pbnQgLSB0aGUgRW5kUG9pbnQgdG8gdW5yZWdpc3RlclxuICAqL1xuICBwdWJsaWMgcmVtb3ZlRW5kUG9pbnQoIGVuZFBvaW50OiBFbmRQb2ludCApXG4gIHtcbiAgICBsZXQgaWR4ID0gdGhpcy5fZW5kUG9pbnRzLmluZGV4T2YoIGVuZFBvaW50ICk7XG5cbiAgICBpZiAoIGlkeCA+PSAwIClcbiAgICB7XG4gICAgICB0aGlzLl9lbmRQb2ludHMuc3BsaWNlKCBpZHgsIDEgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgKiBHZXQgRW5kUG9pbnRzIHJlZ2lzdGVyZWQgd2l0aCB0aGlzIENoYW5uZWxcbiAgKlxuICAqIEByZXR1cm4gQXJyYXkgb2YgRW5kUG9pbnRzXG4gICovXG4gIHB1YmxpYyBnZXQgZW5kUG9pbnRzKCk6IEVuZFBvaW50W11cbiAge1xuICAgIHJldHVybiB0aGlzLl9lbmRQb2ludHM7XG4gIH1cblxuICAvKipcbiAgKiBTZW5kIGEgbWVzc2FnZSB0byBhbGwgbGlzdGVuZXJzIChleGNlcHQgb3JpZ2luKVxuICAqXG4gICogQHBhcmFtIG9yaWdpbiAtIEVuZFBvaW50IHRoYXQgaXMgc2VuZGluZyB0aGUgbWVzc2FnZVxuICAqIEBwYXJhbSBtZXNzYWdlIC0gTWVzc2FnZSB0byBiZSBzZW50XG4gICovXG4gIHB1YmxpYyBzZW5kTWVzc2FnZSggb3JpZ2luOiBFbmRQb2ludCwgbWVzc2FnZTogTWVzc2FnZTxhbnk+IClcbiAge1xuICAgIGxldCBpc1Jlc3BvbnNlID0gKCBtZXNzYWdlLmhlYWRlciAmJiBtZXNzYWdlLmhlYWRlci5pc1Jlc3BvbnNlICk7XG5cbiAgICBpZiAoICF0aGlzLl9hY3RpdmUgKVxuICAgICAgcmV0dXJuO1xuXG4gICAgaWYgKCBvcmlnaW4uZGlyZWN0aW9uID09IERpcmVjdGlvbi5JTiAmJiAhaXNSZXNwb25zZSApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoICdVbmFibGUgdG8gc2VuZCBvbiBJTiBwb3J0Jyk7XG5cbiAgICB0aGlzLl9lbmRQb2ludHMuZm9yRWFjaCggZW5kUG9pbnQgPT4ge1xuICAgICAgLy8gU2VuZCB0byBhbGwgbGlzdGVuZXJzLCBleGNlcHQgZm9yIG9yaWdpbmF0b3IgLi4uXG4gICAgICBpZiAoIG9yaWdpbiAhPSBlbmRQb2ludCApXG4gICAgICB7XG4gICAgICAgIC8vIE9ubHkgc2VuZCB0byBJTiBvciBJTk9VVCBsaXN0ZW5lcnMsIFVOTEVTUyBtZXNzYWdlIGlzIGFcbiAgICAgICAgLy8gcmVwbHkgKGluIGEgY2xpZW50LXNlcnZlcikgY29uZmlndXJhdGlvblxuICAgICAgICBpZiAoIGVuZFBvaW50LmRpcmVjdGlvbiAhPSBEaXJlY3Rpb24uT1VUIHx8IGlzUmVzcG9uc2UgKVxuICAgICAgICB7XG4gICAgICAgICAgdGhpcy5fdGFza1NjaGVkdWxlci5xdWV1ZVRhc2soICgpID0+IHtcbiAgICAgICAgICAgIGVuZFBvaW50LmhhbmRsZU1lc3NhZ2UoIG1lc3NhZ2UsIG9yaWdpbiwgdGhpcyApO1xuICAgICAgICAgIH0gKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgeyBNZXNzYWdlIH0gZnJvbSAnLi9tZXNzYWdlJztcbmltcG9ydCB7IENoYW5uZWwgfSBmcm9tICcuL2NoYW5uZWwnO1xuXG5leHBvcnQgZW51bSBEaXJlY3Rpb24ge1xuICBJTiA9IDEsXG4gIE9VVCA9IDIsXG4gIElOT1VUID0gM1xufTtcblxuZXhwb3J0IHR5cGUgSGFuZGxlTWVzc2FnZURlbGVnYXRlID0gKCBtZXNzYWdlOiBNZXNzYWdlPGFueT4sIHJlY2VpdmluZ0VuZFBvaW50PzogRW5kUG9pbnQsIHJlY2VpdmluZ0NoYW5uZWw/OiBDaGFubmVsICkgPT4gdm9pZDtcblxuLyoqXG4qIEFuIEVuZFBvaW50IGlzIGEgc2VuZGVyL3JlY2VpdmVyIGZvciBtZXNzYWdlLXBhc3NpbmcuIEl0IGhhcyBhbiBpZGVudGlmaWVyXG4qIGFuZCBhbiBvcHRpb25hbCBkaXJlY3Rpb24sIHdoaWNoIG1heSBiZSBJTiwgT1VUIG9yIElOL09VVCAoZGVmYXVsdCkuXG4qXG4qIEVuZFBvaW50cyBtYXkgaGF2ZSBtdWx0aXBsZSBjaGFubmVscyBhdHRhY2hlZCwgYW5kIHdpbGwgZm9yd2FyZCBtZXNzYWdlc1xuKiB0byBhbGwgb2YgdGhlbS5cbiovXG5leHBvcnQgY2xhc3MgRW5kUG9pbnRcbntcbiAgcHJvdGVjdGVkIF9pZDogc3RyaW5nO1xuXG4gIC8qKlxuICAqIEEgbGlzdCBvZiBhdHRhY2hlZCBDaGFubmVsc1xuICAqL1xuICBwcm90ZWN0ZWQgX2NoYW5uZWxzOiBDaGFubmVsW107XG5cbiAgLyoqXG4gICogQSBsaXN0IG9mIGF0dGFjaGVkIENoYW5uZWxzXG4gICovXG4gIHByb3RlY3RlZCBfbWVzc2FnZUxpc3RlbmVyczogSGFuZGxlTWVzc2FnZURlbGVnYXRlW107XG5cbiAgcHJpdmF0ZSBfZGlyZWN0aW9uOiBEaXJlY3Rpb247XG5cbiAgY29uc3RydWN0b3IoIGlkOiBzdHJpbmcsIGRpcmVjdGlvbjogRGlyZWN0aW9uID0gRGlyZWN0aW9uLklOT1VUIClcbiAge1xuICAgIHRoaXMuX2lkID0gaWQ7XG5cbiAgICB0aGlzLl9kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG5cbiAgICB0aGlzLl9jaGFubmVscyA9IFtdO1xuXG4gICAgdGhpcy5fbWVzc2FnZUxpc3RlbmVycyA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICogQ2xlYW51cCB0aGUgRW5kUG9pbnQsIGRldGFjaGluZyBhbnkgYXR0YWNoZWQgQ2hhbm5lbHMgYW5kIHJlbW92aW5nIGFueVxuICAqIG1lc3NhZ2UtbGlzdGVuZXJzLiBDYWxsaW5nIHNodXRkb3duKCkgaXMgbWFuZGF0b3J5IHRvIGF2b2lkIG1lbW9yeS1sZWFrc1xuICAqIGR1ZSB0byB0aGUgY2lyY3VsYXIgcmVmZXJlbmNlcyB0aGF0IGV4aXN0IGJldHdlZW4gQ2hhbm5lbHMgYW5kIEVuZFBvaW50c1xuICAqL1xuICBwdWJsaWMgc2h1dGRvd24oKVxuICB7XG4gICAgdGhpcy5kZXRhY2hBbGwoKTtcblxuICAgIHRoaXMuX21lc3NhZ2VMaXN0ZW5lcnMgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIEVuZFBvaW50J3MgaWRcbiAgICovXG4gIGdldCBpZCgpOiBzdHJpbmdcbiAge1xuICAgIHJldHVybiB0aGlzLl9pZDtcbiAgfVxuXG4gIC8qKlxuICAqIEF0dGFjaCBhIENoYW5uZWwgdG8gdGhpcyBFbmRQb2ludC4gT25jZSBhdHRhY2hlZCwgdGhlIENoYW5uZWwgd2lsbCBmb3J3YXJkXG4gICogbWVzc2FnZXMgdG8gdGhpcyBFbmRQb2ludCwgYW5kIHdpbGwgYWNjZXB0IG1lc3NhZ2VzIG9yaWdpbmF0ZWQgaGVyZS5cbiAgKiBBbiBFbmRQb2ludCBjYW4gaGF2ZSBtdWx0aXBsZSBDaGFubmVscyBhdHRhY2hlZCwgaW4gd2hpY2ggY2FzZSBpdCB3aWxsXG4gICogYnJvYWRjYXN0IHRvIHRoZW0gYWxsIHdoZW4gc2VuZGluZywgYW5kIHdpbGwgcmVjZWl2ZSBtZXNzYWdlcyBpblxuICAqIGFycml2YWwtb3JkZXIuXG4gICovXG4gIHB1YmxpYyBhdHRhY2goIGNoYW5uZWw6IENoYW5uZWwgKVxuICB7XG4gICAgdGhpcy5fY2hhbm5lbHMucHVzaCggY2hhbm5lbCApO1xuXG4gICAgY2hhbm5lbC5hZGRFbmRQb2ludCggdGhpcyApO1xuICB9XG5cbiAgLyoqXG4gICogRGV0YWNoIGEgc3BlY2lmaWMgQ2hhbm5lbCBmcm9tIHRoaXMgRW5kUG9pbnQuXG4gICovXG4gIHB1YmxpYyBkZXRhY2goIGNoYW5uZWxUb0RldGFjaDogQ2hhbm5lbCApXG4gIHtcbiAgICBsZXQgaWR4ID0gdGhpcy5fY2hhbm5lbHMuaW5kZXhPZiggY2hhbm5lbFRvRGV0YWNoICk7XG5cbiAgICBpZiAoIGlkeCA+PSAwIClcbiAgICB7XG4gICAgICBjaGFubmVsVG9EZXRhY2gucmVtb3ZlRW5kUG9pbnQoIHRoaXMgKTtcblxuICAgICAgdGhpcy5fY2hhbm5lbHMuc3BsaWNlKCBpZHgsIDEgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgKiBEZXRhY2ggYWxsIENoYW5uZWxzIGZyb20gdGhpcyBFbmRQb2ludC5cbiAgKi9cbiAgcHVibGljIGRldGFjaEFsbCgpXG4gIHtcbiAgICB0aGlzLl9jaGFubmVscy5mb3JFYWNoKCBjaGFubmVsID0+IHtcbiAgICAgIGNoYW5uZWwucmVtb3ZlRW5kUG9pbnQoIHRoaXMgKTtcbiAgICB9ICk7XG5cbiAgICB0aGlzLl9jaGFubmVscyA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICogQXJlIGFueSBjaGFubmVscyBhdHRhY2hlZCB0byB0aGlzIEVuZFBvaW50P1xuICAqXG4gICogQHJldHVybnMgdHJ1ZSBpZiBFbmRwb2ludCBpcyBhdHRhY2hlZCB0byBhdC1sZWFzdC1vbmUgQ2hhbm5lbFxuICAqL1xuICBnZXQgYXR0YWNoZWQoKVxuICB7XG4gICAgcmV0dXJuICggdGhpcy5fY2hhbm5lbHMubGVuZ3RoID4gMCApO1xuICB9XG5cbiAgZ2V0IGRpcmVjdGlvbigpOiBEaXJlY3Rpb25cbiAge1xuICAgIHJldHVybiB0aGlzLl9kaXJlY3Rpb247XG4gIH1cblxuICAvKipcbiAgKiBIYW5kbGUgYW4gaW5jb21pbmcgTWVzc2FnZSwgbWV0aG9kIGNhbGxlZCBieSBDaGFubmVsLlxuICAqL1xuICBwdWJsaWMgaGFuZGxlTWVzc2FnZSggbWVzc2FnZTogTWVzc2FnZTxhbnk+LCBmcm9tRW5kUG9pbnQ6IEVuZFBvaW50LCBmcm9tQ2hhbm5lbDogQ2hhbm5lbCApXG4gIHtcbiAgICB0aGlzLl9tZXNzYWdlTGlzdGVuZXJzLmZvckVhY2goIG1lc3NhZ2VMaXN0ZW5lciA9PiB7XG4gICAgICBtZXNzYWdlTGlzdGVuZXIoIG1lc3NhZ2UsIHRoaXMsIGZyb21DaGFubmVsICk7XG4gICAgfSApO1xuICB9XG5cbiAgLyoqXG4gICogU2VuZCBhIE1lc3NhZ2UuXG4gICovXG4gIHB1YmxpYyBzZW5kTWVzc2FnZSggbWVzc2FnZTogTWVzc2FnZTxhbnk+IClcbiAge1xuICAgIHRoaXMuX2NoYW5uZWxzLmZvckVhY2goIGNoYW5uZWwgPT4ge1xuICAgICAgY2hhbm5lbC5zZW5kTWVzc2FnZSggdGhpcywgbWVzc2FnZSApO1xuICAgIH0gKTtcbiAgfVxuXG4gIC8qKlxuICAqIFJlZ2lzdGVyIGEgZGVsZWdhdGUgdG8gcmVjZWl2ZSBpbmNvbWluZyBNZXNzYWdlc1xuICAqXG4gICogQHBhcmFtIG1lc3NhZ2VMaXN0ZW5lciAtIGRlbGVnYXRlIHRvIGJlIGNhbGxlZCB3aXRoIHJlY2VpdmVkIE1lc3NhZ2VcbiAgKi9cbiAgcHVibGljIG9uTWVzc2FnZSggbWVzc2FnZUxpc3RlbmVyOiBIYW5kbGVNZXNzYWdlRGVsZWdhdGUgKVxuICB7XG4gICAgdGhpcy5fbWVzc2FnZUxpc3RlbmVycy5wdXNoKCBtZXNzYWdlTGlzdGVuZXIgKTtcbiAgfVxufVxuXG4vKipcbiogQW4gaW5kZXhlZCBjb2xsZWN0aW9uIG9mIEVuZFBvaW50IG9iamVjdHMsIG5vcm1hbGx5IGluZGV4ZWQgdmlhIEVuZFBvaW50J3NcbiogdW5pcXVlIGlkZW50aWZpZXJcbiovXG5leHBvcnQgdHlwZSBFbmRQb2ludENvbGxlY3Rpb24gPSB7IFtpZDogc3RyaW5nXTogRW5kUG9pbnQ7IH07XG4iLCJpbXBvcnQgeyBNZXNzYWdlIH0gZnJvbSAnLi9tZXNzYWdlJztcbmltcG9ydCB7IEtpbmQsIEtpbmRJbmZvIH0gZnJvbSAnLi4va2luZC9raW5kJztcblxuZXhwb3J0IGVudW0gUHJvdG9jb2xUeXBlQml0c1xue1xuICBQQUNLRVQgPSAwLCAgICAgICAgIC8qKiBEYXRhZ3JhbS1vcmllbnRlZCAoYWx3YXlzIGNvbm5lY3RlZC4uLikgKi9cbiAgU1RSRUFNID0gMSwgICAgICAgICAvKiogQ29ubmVjdGlvbi1vcmllbnRlZCAqL1xuXG4gIE9ORVdBWSA9IDAsICAgICAgICAgLyoqIFVuaWRpcmVjdGlvbmFsIE9VVCAoc291cmNlKSAtPiBJTiAoc2luaykgKi9cbiAgQ0xJRU5UU0VSVkVSID0gNCwgICAvKiogQ29tbWFuZCBPVVQtPklOLCBSZXNwb25zZSBJTi0+T1VUICovXG4gIFBFRVIyUEVFUiA9IDYsICAgICAgLyoqIEJpZGlyZWN0aW9uYWw6IElOT1VUIDwtPiBJTk9VVCAqL1xuXG4gIFVOVFlQRUQgPSAwLCAgICAgICAgLyoqIFVudHlwZWQgZGF0YSAqL1xuICBUWVBFRCA9IDgsICAgICAgICAgIC8qKiBUeXBlZCBkYXRhICoqL1xufVxuXG5leHBvcnQgdHlwZSBQcm90b2NvbFR5cGUgPSBudW1iZXI7XG5cbmV4cG9ydCBjbGFzcyBQcm90b2NvbDxUPlxue1xuICBzdGF0aWMgcHJvdG9jb2xUeXBlOiBQcm90b2NvbFR5cGUgPSAwO1xufVxuXG4vKipcbiogQSBDbGllbnQtU2VydmVyIFByb3RvY29sLCB0byBiZSB1c2VkIGJldHdlZW5cbiovXG5jbGFzcyBDbGllbnRTZXJ2ZXJQcm90b2NvbDxUPiBleHRlbmRzIFByb3RvY29sPFQ+XG57XG4gIHN0YXRpYyBwcm90b2NvbFR5cGU6IFByb3RvY29sVHlwZSA9IFByb3RvY29sVHlwZUJpdHMuQ0xJRU5UU0VSVkVSIHwgUHJvdG9jb2xUeXBlQml0cy5UWVBFRDtcbn1cblxuY2xhc3MgQVBEVSBpbXBsZW1lbnRzIEtpbmQge1xuICBraW5kSW5mbzogS2luZEluZm87XG4gIHByb3BlcnRpZXM7XG59XG5cbmNsYXNzIEFQRFVNZXNzYWdlIGV4dGVuZHMgTWVzc2FnZTxBUERVPlxue1xufVxuXG5jbGFzcyBBUERVUHJvdG9jb2wgZXh0ZW5kcyBDbGllbnRTZXJ2ZXJQcm90b2NvbDxBUERVTWVzc2FnZT5cbntcblxufVxuIiwiaW1wb3J0IHsgRW5kUG9pbnRDb2xsZWN0aW9uLCBEaXJlY3Rpb24gfSBmcm9tICcuLi9tZXNzYWdpbmcvZW5kLXBvaW50JztcbmltcG9ydCB7IFByb3RvY29sIH0gZnJvbSAnLi4vbWVzc2FnaW5nL3Byb3RvY29sJztcblxuLyoqXG4qIEBjbGFzcyBQb3J0SW5mb1xuKlxuKiBNZXRhZGF0YSBhYm91dCBhIGNvbXBvbmVudCdzIFBvcnRcbiovXG5leHBvcnQgY2xhc3MgUG9ydEluZm9cbntcbiAgLyoqXG4gICogRGlyZWN0aW9uOiBJTiwgT1VULCBvciBJTk9VVFxuICAqICAgZm9yIGNsaWVudC1zZXJ2ZXIsIE9VVD1DbGllbnQsIElOPVNlcnZlclxuICAqICAgZm9yIHNvY2tldFxuICAqL1xuICBkaXJlY3Rpb246IERpcmVjdGlvbjtcblxuICAvKipcbiAgKiBQcm90b2NvbCBpbXBsZW1lbnRlZCBieSB0aGUgcG9ydFxuICAqL1xuICBwcm90b2NvbDogUHJvdG9jb2w8YW55PjtcblxuICAvKipcbiAgKiBSRlUgLSBpbmRleGFibGUgcG9ydHNcbiAgKi9cbiAgaW5kZXg6IG51bWJlciA9IDA7XG5cbiAgLyoqXG4gICogdHJ1ZSBpcyBwb3J0IG11c3QgYmUgY29ubmVjdGVkIGZvciBjb21wb25lbnQgdG8gZXhlY3V0ZVxuICAqL1xuICByZXF1aXJlZDogYm9vbGVhbiA9IGZhbHNlO1xufVxuIiwiXG4vKipcbiogTWV0YWRhdGEgYWJvdXQgYSBjb21wb25lbnQncyBTdG9yZVxuKiBUT0RPOiBcbiovXG5leHBvcnQgY2xhc3MgU3RvcmVJbmZvXG57XG59XG4iLCJpbXBvcnQgeyBFbmRQb2ludENvbGxlY3Rpb24sIERpcmVjdGlvbiB9IGZyb20gJy4uL21lc3NhZ2luZy9lbmQtcG9pbnQnO1xuaW1wb3J0IHsgUHJvdG9jb2wgfSBmcm9tICcuLi9tZXNzYWdpbmcvcHJvdG9jb2wnO1xuXG5pbXBvcnQgeyBQb3J0SW5mbyB9IGZyb20gJy4vcG9ydC1pbmZvJztcblxuLyoqXG4qIEBjbGFzcyBDb21wb25lbnRJbmZvXG4qXG4qIE1ldGFkYXRhIGFib3V0IGEgQ29tcG9uZW50XG4qL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudEluZm9cbntcbiAgLyoqXG4gICogQ29tcG9uZW50IE5hbWVcbiAgKi9cbiAgbmFtZTogc3RyaW5nO1xuXG4gIC8qKlxuICAqIEJyaWVmIGRlc2NyaXB0aW9uIGZvciB0aGUgY29tcG9uZW50LCB0byBhcHBlYXIgaW4gJ2hpbnQnXG4gICovXG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG5cbiAgLyoqXG4gICogTGluayB0byBkZXRhaWxlZCBpbmZvcm1hdGlvbiBmb3IgdGhlIGNvbXBvbmVudFxuICAqL1xuICBkZXRhaWxMaW5rOiBzdHJpbmcgPSAnJztcblxuICAvKipcbiAgKiBDYXRlZ29yeSBuYW1lIGZvciB0aGUgY29tcG9uZW50LCBncm91cHMgc2FtZSBjYXRlZ29yaWVzIHRvZ2V0aGVyXG4gICovXG4gIGNhdGVnb3J5OiBzdHJpbmcgPSAnJztcblxuICAvKipcbiAgKiBBdXRob3IncyBuYW1lXG4gICovXG4gIGF1dGhvcjogc3RyaW5nID0gJyc7XG5cbiAgLyoqXG4gICogQXJyYXkgb2YgUG9ydCBkZXNjcmlwdG9ycy4gV2hlbiBhY3RpdmUsIHRoZSBjb21wb25lbnQgd2lsbCBjb21tdW5pY2F0ZVxuICAqIHRocm91Z2ggY29ycmVzcG9uZGluZyBFbmRQb2ludHNcbiAgKi9cbiAgcG9ydHM6IHsgW2lkOiBzdHJpbmddOiBQb3J0SW5mbyB9ID0ge307XG4gIHN0b3JlczogeyBbaWQ6IHN0cmluZ106IFBvcnRJbmZvIH0gPSB7fTtcblxuICBjb25zdHJ1Y3RvcigpXG4gIHtcbiAgfVxufVxuIiwiaW1wb3J0IHsgUG9ydEluZm8gfSBmcm9tICcuL3BvcnQtaW5mbyc7XG5pbXBvcnQgeyBTdG9yZUluZm8gfSBmcm9tICcuL3N0b3JlLWluZm8nO1xuaW1wb3J0IHsgQ29tcG9uZW50SW5mbyB9IGZyb20gJy4vY29tcG9uZW50LWluZm8nO1xuaW1wb3J0IHsgRW5kUG9pbnRDb2xsZWN0aW9uLCBEaXJlY3Rpb24gfSBmcm9tICcuLi9tZXNzYWdpbmcvZW5kLXBvaW50JztcbmltcG9ydCB7IFByb3RvY29sIH0gZnJvbSAnLi4vbWVzc2FnaW5nL3Byb3RvY29sJztcbmltcG9ydCB7IEtpbmQgfSBmcm9tICcuLi9raW5kL2tpbmQnO1xuXG4vKipcbiogQnVpbGRlciBmb3IgJ0NvbXBvbmVudCcgbWV0YWRhdGEgKHN0YXRpYyBjb21wb25lbnRJbmZvKVxuKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRCdWlsZGVyXG57XG4gIHByaXZhdGUgY3RvcjogQ29tcG9uZW50Q29uc3RydWN0b3I7XG5cbiAgY29uc3RydWN0b3IoIGN0b3I6IENvbXBvbmVudENvbnN0cnVjdG9yLCBkZXNjcmlwdGlvbjogc3RyaW5nLCBjYXRlZ29yeT86IHN0cmluZyApIHtcblxuICAgIHRoaXMuY3RvciA9IGN0b3I7XG5cbiAgICBjdG9yLmNvbXBvbmVudEluZm8gPSB7XG4gICAgICBuYW1lOiBjdG9yLm5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24sXG4gICAgICBkZXRhaWxMaW5rOiAnJyxcbiAgICAgIGNhdGVnb3J5OiBjYXRlZ29yeSxcbiAgICAgIGF1dGhvcjogJycsXG4gICAgICBwb3J0czoge30sXG4gICAgICBzdG9yZXM6IHt9XG4gICAgfTtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgaW5pdCggY3RvcjogQ29tcG9uZW50Q29uc3RydWN0b3IsIGRlc2NyaXB0aW9uOiBzdHJpbmcsIGNhdGVnb3J5Pzogc3RyaW5nICk6IENvbXBvbmVudEJ1aWxkZXJcbiAge1xuICAgIGxldCBidWlsZGVyID0gbmV3IENvbXBvbmVudEJ1aWxkZXIoIGN0b3IsIGRlc2NyaXB0aW9uLCBjYXRlZ29yeSApO1xuXG4gICAgcmV0dXJuIGJ1aWxkZXI7XG4gIH1cblxuICBwdWJsaWMgcG9ydCggaWQ6IHN0cmluZywgZGlyZWN0aW9uOiBEaXJlY3Rpb24sIG9wdHM/OiB7IHByb3RvY29sPzogUHJvdG9jb2w8YW55PjsgaW5kZXg/OiBudW1iZXI7IHJlcXVpcmVkPzogYm9vbGVhbiB9ICk6IENvbXBvbmVudEJ1aWxkZXJcbiAge1xuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgdGhpcy5jdG9yLmNvbXBvbmVudEluZm8ucG9ydHNbIGlkIF0gPSB7XG4gICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbixcbiAgICAgIHByb3RvY29sOiBvcHRzLnByb3RvY29sLFxuICAgICAgaW5kZXg6IG9wdHMuaW5kZXgsXG4gICAgICByZXF1aXJlZDogb3B0cy5yZXF1aXJlZFxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHB1YmxpYyBuYW1lKCBuYW1lOiBzdHJpbmcgKSB7XG4gICAgdGhpcy5jdG9yLmNvbXBvbmVudEluZm8ubmFtZSA9IG5hbWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuLyoqXG4qIENvbXBvbmVudHMgYXJlIHJ1bnRpbWUgb2JqZWN0cyB0aGF0IGV4ZWN1dGUgd2l0aGluIGEgR3JhcGguXG4qIEEgZ3JhcGggTm9kZSBpcyBhIHBsYWNlaG9sZGVyIGZvciB0aGUgYWN0dWFsIENvbXBvbmVudCB0aGF0XG4qIHdpbGwgZXhlY3V0ZS5cbiogVGhpcyBpbnRlcmZhY2UgZGVmaW5lcyB0aGUgc3RhbmRhcmQgbWV0aG9kcyBhbmQgcHJvcGVydGllcyB0aGF0IGEgQ29tcG9uZW50XG4qIGNhbiBvcHRpb25hbGx5IGltcGxlbWVudC5cbiovXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvbmVudFxue1xuICBpbml0aWFsaXplPyggY29uZmlnOiBLaW5kICk6IEVuZFBvaW50Q29sbGVjdGlvbjtcbiAgdGVhcmRvd24/KCk7XG5cbiAgc3RhcnQ/KCk7XG4gIHN0b3A/KCk7XG5cbiAgcGF1c2U/KCk7XG4gIHJlc3VtZT8oKTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnRDb25zdHJ1Y3Rvclxue1xuICBuZXcgKCAuLi5hcmdzICk6IENvbXBvbmVudDtcblxuICBjb21wb25lbnRJbmZvPzogQ29tcG9uZW50SW5mbztcbn1cblxuLyoqXG4qIEV4YW1wbGUgdXNhZ2UgLi4uLlxuKi9cbmNsYXNzIEMgaW1wbGVtZW50cyBDb21wb25lbnQge1xuXG59XG5cbkNvbXBvbmVudEJ1aWxkZXIuaW5pdCggQywgJ1Rlc3QgQ29tcG9uZW50JyApXG4gICAgICAgICAgICAgICAgLnBvcnQoICdwMScsIERpcmVjdGlvbi5JTiApXG4gICAgICAgICAgICAgICAgO1xuIiwiaW1wb3J0IHsgRW5kUG9pbnQsIERpcmVjdGlvbiB9IGZyb20gJy4uL21lc3NhZ2luZy9lbmQtcG9pbnQnO1xuaW1wb3J0IHsgQ2hhbm5lbCB9IGZyb20gJy4uL21lc3NhZ2luZy9jaGFubmVsJztcblxuaW1wb3J0IHsgR3JhcGggfSBmcm9tICcuL2dyYXBoJztcbmltcG9ydCB7IE5vZGUgfSBmcm9tICcuL25vZGUnO1xuXG4vKipcbiogQSBQb3J0IGlzIGEgcGxhY2Vob2xkZXIgZm9yIGFuIEVuZFBvaW50IHB1Ymxpc2hlZCBieSB0aGUgdW5kZXJseWluZ1xuKiBjb21wb25lbnQgb2YgYSBOb2RlLlxuKi9cbmV4cG9ydCBjbGFzcyBQb3J0XG57XG4gIHByb3RlY3RlZCBfb3duZXI6IE5vZGU7XG4gIHByb3RlY3RlZCBfcHJvdG9jb2xJRDogc3RyaW5nO1xuXG4gIHByb3RlY3RlZCBfZW5kUG9pbnQ6IEVuZFBvaW50O1xuXG4gIHB1YmxpYyBtZXRhZGF0YTogYW55O1xuXG4gIGNvbnN0cnVjdG9yKCBvd25lcjogTm9kZSwgZW5kUG9pbnQ6IEVuZFBvaW50LCBhdHRyaWJ1dGVzOiBhbnkgPSB7fSApXG4gIHtcbiAgICAvLyBXYXMgYW4gRW5kUG9pbnQgc3VwcGxpZWQ/XG4gICAgaWYgKCAhZW5kUG9pbnQgKVxuICAgIHtcbiAgICAgIGxldCBkaXJlY3Rpb24gPSBhdHRyaWJ1dGVzLmRpcmVjdGlvbiB8fCBEaXJlY3Rpb24uSU5PVVQ7XG5cbiAgICAgIGlmICggdHlwZW9mIGF0dHJpYnV0ZXMuZGlyZWN0aW9uID09IFwic3RyaW5nXCIgKVxuICAgICAgICBkaXJlY3Rpb24gPSBEaXJlY3Rpb25bIGRpcmVjdGlvbi50b1VwcGVyQ2FzZSgpIF07XG5cbiAgICAgIC8vIENyZWF0ZSBhIFwiZHVtbXlcIiBlbmRQb2ludCB3aXRoIGNvcnJlY3QgaWQgKyBkaXJlY3Rpb25cbiAgICAgIGVuZFBvaW50ID0gbmV3IEVuZFBvaW50KCBhdHRyaWJ1dGVzLmlkLCBkaXJlY3Rpb24gKTtcbiAgICB9XG5cbiAgICB0aGlzLl9vd25lciA9IG93bmVyO1xuICAgIHRoaXMuX2VuZFBvaW50ID0gZW5kUG9pbnQ7XG5cbiAgICB0aGlzLl9wcm90b2NvbElEID0gYXR0cmlidXRlc1sgJ3Byb3RvY29sJyBdIHx8ICdhbnknO1xuXG4gICAgdGhpcy5tZXRhZGF0YSA9IGF0dHJpYnV0ZXMubWV0YWRhdGEgfHwgeyB4OiAxMDAsIHk6IDEwMCB9O1xuICB9XG5cbiAgcHVibGljIGdldCBlbmRQb2ludCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZW5kUG9pbnQ7XG4gIH1cbiAgcHVibGljIHNldCBlbmRQb2ludCggZW5kUG9pbnQ6IEVuZFBvaW50ICkge1xuICAgIHRoaXMuX2VuZFBvaW50ID0gZW5kUG9pbnQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIFBPSk8gZm9yIHNlcmlhbGl6YXRpb25cbiAgICovXG4gIHRvT2JqZWN0KCBvcHRzPzogYW55ICk6IE9iamVjdFxuICB7XG4gICAgdmFyIHBvcnQgPSB7XG4gICAgICBpZDogdGhpcy5fZW5kUG9pbnQuaWQsXG4gICAgICBkaXJlY3Rpb246IHRoaXMuX2VuZFBvaW50LmRpcmVjdGlvbixcbiAgICAgIHByb3RvY29sOiAoIHRoaXMuX3Byb3RvY29sSUQgIT0gJ2FueScgKSA/IHRoaXMuX3Byb3RvY29sSUQgOiB1bmRlZmluZWQsXG4gICAgICBtZXRhZGF0YTogdGhpcy5tZXRhZGF0YSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIHBvcnQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBQb3J0J3Mgb3duZXJcbiAgICovXG4gIGdldCBvd25lcigpOiBOb2RlIHtcbiAgICByZXR1cm4gdGhpcy5fb3duZXJcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIFBvcnQncyBwcm90b2NvbCBJRFxuICAgKi9cbiAgZ2V0IHByb3RvY29sSUQoKTogc3RyaW5nXG4gIHtcbiAgICByZXR1cm4gdGhpcy5fcHJvdG9jb2xJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIFBvcnQncyBFbmRQb2ludCBJRFxuICAgKi9cbiAgZ2V0IGlkKCk6IHN0cmluZ1xuICB7XG4gICAgcmV0dXJuIHRoaXMuX2VuZFBvaW50LmlkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgUG9ydCdzIEVuZFBvaW50IERpcmVjdGlvblxuICAgKi9cbiAgZ2V0IGRpcmVjdGlvbigpOiBEaXJlY3Rpb25cbiAge1xuICAgIHJldHVybiB0aGlzLl9lbmRQb2ludC5kaXJlY3Rpb247XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgUHVibGljUG9ydCBleHRlbmRzIFBvcnRcbntcbiAgcHJveHlFbmRQb2ludDogRW5kUG9pbnQ7XG4gIHByb3h5Q2hhbm5lbDogQ2hhbm5lbDtcblxuICBjb25zdHJ1Y3Rvciggb3duZXI6IEdyYXBoLCBlbmRQb2ludDogRW5kUG9pbnQsIGF0dHJpYnV0ZXM6IHt9IClcbiAge1xuICAgIHN1cGVyKCBvd25lciwgZW5kUG9pbnQsIGF0dHJpYnV0ZXMgKTtcblxuICAgIGxldCBwcm94eURpcmVjdGlvbiA9XG4gICAgICAoIHRoaXMuX2VuZFBvaW50LmRpcmVjdGlvbiA9PSBEaXJlY3Rpb24uSU4gKVxuICAgICAgICA/IERpcmVjdGlvbi5PVVRcbiAgICAgICAgOiAoIHRoaXMuX2VuZFBvaW50LmRpcmVjdGlvbiA9PSBEaXJlY3Rpb24uT1VUIClcbiAgICAgICAgICA/IERpcmVjdGlvbi5JTlxuICAgICAgICAgIDogRGlyZWN0aW9uLklOT1VUO1xuXG4gICAgLy8gQ3JlYXRlIGFuIEVuZFBvaW50IHRvIHByb3h5IGJldHdlZW4gdGhlIFB1YmxpYyBhbmQgUHJpdmF0ZSAoaW50ZXJuYWwpXG4gICAgLy8gc2lkZXMgb2YgdGhlIFBvcnQuXG4gICAgdGhpcy5wcm94eUVuZFBvaW50ID0gbmV3IEVuZFBvaW50KCB0aGlzLl9lbmRQb2ludC5pZCwgcHJveHlEaXJlY3Rpb24gKTtcblxuICAgIC8vIFdpcmUtdXAgcHJveHkgLVxuXG4gICAgLy8gRm9yd2FyZCBpbmNvbWluZyBwYWNrZXRzIChmcm9tIHB1YmxpYyBpbnRlcmZhY2UpIHRvIHByaXZhdGVcbiAgICB0aGlzLnByb3h5RW5kUG9pbnQub25NZXNzYWdlKCAoIG1lc3NhZ2UgKSA9PiB7XG4gICAgICB0aGlzLl9lbmRQb2ludC5oYW5kbGVNZXNzYWdlKCBtZXNzYWdlLCB0aGlzLnByb3h5RW5kUG9pbnQsIHRoaXMucHJveHlDaGFubmVsICk7XG4gICAgfSk7XG5cbiAgICAvLyBGb3J3YXJkIG91dGdvaW5nIHBhY2tldHMgKGZyb20gcHJpdmF0ZSBpbnRlcmZhY2UpIHRvIHB1YmxpY1xuICAgIHRoaXMuX2VuZFBvaW50Lm9uTWVzc2FnZSggKCBtZXNzYWdlICkgPT4ge1xuICAgICAgdGhpcy5wcm94eUVuZFBvaW50LnNlbmRNZXNzYWdlKCBtZXNzYWdlICk7XG4gICAgfSk7XG5cbiAgICAvLyBub3QgeWV0IGNvbm5lY3RlZFxuICAgIHRoaXMucHJveHlDaGFubmVsID0gbnVsbDtcbiAgfVxuXG4gIC8vIENvbm5lY3QgdG8gUHJpdmF0ZSAoaW50ZXJuYWwpIEVuZFBvaW50LiBUbyBiZSBjYWxsZWQgZHVyaW5nIGdyYXBoXG4gIC8vIHdpcmVVcCBwaGFzZVxuICBwdWJsaWMgY29ubmVjdFByaXZhdGUoIGNoYW5uZWw6IENoYW5uZWwgKVxuICB7XG4gICAgdGhpcy5wcm94eUNoYW5uZWwgPSBjaGFubmVsO1xuXG4gICAgdGhpcy5wcm94eUVuZFBvaW50LmF0dGFjaCggY2hhbm5lbCApO1xuICB9XG5cbiAgcHVibGljIGRpc2Nvbm5lY3RQcml2YXRlKClcbiAge1xuICAgIHRoaXMucHJveHlFbmRQb2ludC5kZXRhY2goIHRoaXMucHJveHlDaGFubmVsICk7XG4gIH1cblxuICB0b09iamVjdCggb3B0cz86IGFueSApOiBPYmplY3RcbiAge1xuICAgIHZhciBwb3J0ID0gc3VwZXIudG9PYmplY3QoIG9wdHMgKTtcblxuICAgIHJldHVybiBwb3J0O1xuICB9XG59XG4iLCJpbXBvcnQgeyBSdW50aW1lQ29udGV4dCB9IGZyb20gJy4uL3J1bnRpbWUvcnVudGltZS1jb250ZXh0JztcbmltcG9ydCB7IENvbXBvbmVudEZhY3Rvcnl9IGZyb20gJy4uL3J1bnRpbWUvY29tcG9uZW50LWZhY3RvcnknO1xuaW1wb3J0IHsgRXZlbnRIdWIgfSBmcm9tICcuLi9ldmVudC1odWIvZXZlbnQtaHViJztcblxuaW1wb3J0IHsgR3JhcGggfSBmcm9tICcuL2dyYXBoJztcbmltcG9ydCB7IFBvcnQgfSBmcm9tICcuL3BvcnQnO1xuXG5leHBvcnQgY2xhc3MgTm9kZSBleHRlbmRzIEV2ZW50SHViXG57XG4gIHByb3RlY3RlZCBfb3duZXI6IEdyYXBoO1xuICBwcm90ZWN0ZWQgX2lkOiBzdHJpbmc7XG5cbiAgcHJvdGVjdGVkIF9jb21wb25lbnQ6IHN0cmluZztcbiAgcHJvdGVjdGVkIF9pbml0aWFsRGF0YTogT2JqZWN0O1xuXG4gIHByb3RlY3RlZCBfcG9ydHM6IE1hcDxzdHJpbmcsIFBvcnQ+O1xuXG4gIHB1YmxpYyBtZXRhZGF0YTogYW55O1xuXG4gIC8qKlxuICAgKiBSdW50aW1lIGFuZCBjb21wb25lbnQgaW5zdGFuY2UgdGhhdCB0aGlzIG5vZGUgcmVwcmVzZW50c1xuICAgKi9cbiAgcHJvdGVjdGVkIF9jb250ZXh0OiBSdW50aW1lQ29udGV4dDtcblxuICBjb25zdHJ1Y3Rvciggb3duZXI6IEdyYXBoLCBhdHRyaWJ1dGVzOiBhbnkgPSB7fSApXG4gIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5fb3duZXIgPSBvd25lcjtcbiAgICB0aGlzLl9pZCA9IGF0dHJpYnV0ZXMuaWQgfHwgJyc7XG4gICAgdGhpcy5fY29tcG9uZW50ID0gYXR0cmlidXRlcy5jb21wb25lbnQ7XG4gICAgdGhpcy5faW5pdGlhbERhdGEgPSBhdHRyaWJ1dGVzLmluaXRpYWxEYXRhIHx8IHt9O1xuXG4gICAgdGhpcy5fcG9ydHMgPSBuZXcgTWFwPHN0cmluZywgUG9ydD4oKTtcblxuICAgIHRoaXMubWV0YWRhdGEgPSBhdHRyaWJ1dGVzLm1ldGFkYXRhIHx8IHsgfTtcblxuICAgIC8vIEluaXRpYWxseSBjcmVhdGUgJ3BsYWNlaG9sZGVyJyBwb3J0cy4gT25jZSBjb21wb25lbnQgaGFzIGJlZW5cbiAgICAvLyBsb2FkZWQgYW5kIGluc3RhbnRpYXRlZCwgdGhleSB3aWxsIGJlIGNvbm5lY3RlZCBjb25uZWN0ZWQgdG9cbiAgICAvLyB0aGUgY29tcG9uZW50J3MgY29tbXVuaWNhdGlvbiBlbmQtcG9pbnRzXG4gICAgT2JqZWN0LmtleXMoIGF0dHJpYnV0ZXMucG9ydHMgfHwge30gKS5mb3JFYWNoKCAoaWQpID0+IHtcbiAgICAgIHRoaXMuYWRkUGxhY2Vob2xkZXJQb3J0KCBpZCwgYXR0cmlidXRlcy5wb3J0c1sgaWQgXSApO1xuICAgIH0gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gUE9KTyBmb3Igc2VyaWFsaXphdGlvblxuICAgKi9cbiAgdG9PYmplY3QoIG9wdHM/OiBhbnkgKTogT2JqZWN0XG4gIHtcbiAgICB2YXIgbm9kZSA9IHtcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgY29tcG9uZW50OiB0aGlzLl9jb21wb25lbnQsXG4gICAgICBpbml0aWFsRGF0YTogdGhpcy5faW5pdGlhbERhdGEsXG4gICAgICBwb3J0czoge30sXG4gICAgICBtZXRhZGF0YTogdGhpcy5tZXRhZGF0YVxuICAgIH07XG5cbiAgICB0aGlzLl9wb3J0cy5mb3JFYWNoKCAoIHBvcnQsIGlkICkgPT4ge1xuICAgICAgbm9kZS5wb3J0c1sgaWQgXSA9IHBvcnQudG9PYmplY3QoKTtcbiAgICB9ICk7XG5cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIE5vZGUncyBvd25lclxuICAgKi9cbiAgcHVibGljIGdldCBvd25lcigpOiBHcmFwaCB7XG4gICAgcmV0dXJuIHRoaXMuX293bmVyXG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBOb2RlJ3MgaWRcbiAgICovXG4gIGdldCBpZCgpOiBzdHJpbmdcbiAge1xuICAgIHJldHVybiB0aGlzLl9pZDtcbiAgfVxuICAvKipcbiAgICogU2V0IHRoZSBOb2RlJ3MgaWRcbiAgICogQHBhcmFtIGlkIC0gbmV3IGlkZW50aWZpZXJcbiAgICovXG4gIHNldCBpZCggaWQ6IHN0cmluZyApXG4gIHtcbiAgICB0aGlzLl9pZCA9IGlkO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIHBsYWNlaG9sZGVyIFBvcnRcbiAgICovXG4gIHByb3RlY3RlZCBhZGRQbGFjZWhvbGRlclBvcnQoIGlkOiBzdHJpbmcsIGF0dHJpYnV0ZXM6IHt9ICk6IFBvcnRcbiAge1xuICAgIGF0dHJpYnV0ZXNbXCJpZFwiXSA9IGlkO1xuXG4gICAgbGV0IHBvcnQgPSBuZXcgUG9ydCggdGhpcywgbnVsbCwgYXR0cmlidXRlcyApO1xuXG4gICAgdGhpcy5fcG9ydHMuc2V0KCBpZCwgcG9ydCApO1xuXG4gICAgcmV0dXJuIHBvcnQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHBvcnRzIGFzIGFuIGFycmF5IG9mIFBvcnRzXG4gICAqXG4gICAqIEByZXR1cm4gUG9ydFtdXG4gICAqL1xuICBnZXQgcG9ydHMoKTogTWFwPHN0cmluZywgUG9ydD5cbiAge1xuICAgIHJldHVybiB0aGlzLl9wb3J0cztcbiAgfVxuXG4gIGdldFBvcnRBcnJheSgpOiBQb3J0W10ge1xuICAgIGxldCB4cG9ydHM6IFBvcnRbXSA9IFtdO1xuXG4gICAgdGhpcy5fcG9ydHMuZm9yRWFjaCggKCBwb3J0LCBpZCApID0+IHtcbiAgICAgIHhwb3J0cy5wdXNoKCBwb3J0ICk7XG4gICAgfSApO1xuXG4gICAgcmV0dXJuIHhwb3J0cztcbiAgfVxuXG4gIC8qKlxuICAgKiBMb29rdXAgYSBQb3J0IGJ5IGl0J3MgSURcbiAgICogQHBhcmFtIGlkIC0gcG9ydCBpZGVudGlmaWVyXG4gICAqXG4gICAqIEByZXR1cm4gUG9ydCBvciB1bmRlZmluZWRcbiAgICovXG4gIGdldFBvcnRCeUlEKCBpZDogc3RyaW5nICk6IFBvcnRcbiAge1xuICAgIHJldHVybiB0aGlzLl9wb3J0cy5nZXQoIGlkICk7XG4gIH1cblxuICBpZGVudGlmeVBvcnQoIGlkOiBzdHJpbmcsIHByb3RvY29sSUQ/OiBzdHJpbmcgKTogUG9ydFxuICB7XG4gICAgdmFyIHBvcnQ6IFBvcnQ7XG5cbiAgICBpZiAoIGlkIClcbiAgICAgIHBvcnQgPSB0aGlzLl9wb3J0cy5nZXQoIGlkICk7XG4gICAgZWxzZSBpZiAoIHByb3RvY29sSUQgKVxuICAgIHtcbiAgICAgIHRoaXMuX3BvcnRzLmZvckVhY2goICggcCwgaWQgKSA9PiB7XG4gICAgICAgIGlmICggcC5wcm90b2NvbElEID09IHByb3RvY29sSUQgKVxuICAgICAgICAgIHBvcnQgPSBwO1xuICAgICAgfSwgdGhpcyApO1xuICAgIH1cblxuICAgIHJldHVybiBwb3J0O1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIFBvcnQgZnJvbSB0aGlzIE5vZGVcbiAgICogQHBhcmFtIGlkIC0gaWRlbnRpZmllciBvZiBQb3J0IHRvIGJlIHJlbW92ZWRcbiAgICogQHJldHVybiB0cnVlIC0gcG9ydCByZW1vdmVkXG4gICAqICAgICAgICAgZmFsc2UgLSBwb3J0IGluZXhpc3RlbnRcbiAgICovXG4gIHJlbW92ZVBvcnQoIGlkOiBzdHJpbmcgKTogYm9vbGVhblxuICB7XG4gICAgcmV0dXJuIHRoaXMuX3BvcnRzLmRlbGV0ZSggaWQgKTtcbiAgfVxuXG4gIGxvYWRDb21wb25lbnQoIGZhY3Rvcnk6IENvbXBvbmVudEZhY3RvcnkgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy51bmxvYWRDb21wb25lbnQoKTtcblxuICAgIC8vIEdldCBhIENvbXBvbmVudENvbnRleHQgcmVzcG9uc2FibGUgZm9yIENvbXBvbmVudCdzIGxpZmUtY3ljbGUgY29udHJvbFxuICAgIGxldCBjdHggPSB0aGlzLl9jb250ZXh0ID0gZmFjdG9yeS5jcmVhdGVDb250ZXh0KCB0aGlzLl9jb21wb25lbnQsIHRoaXMuX2luaXRpYWxEYXRhICk7XG5cbiAgICAvLyBNYWtlIE5vZGUgdmlzaWJsZSB0byBpbnN0YW5jZVxuICAgIGN0eC5jb250YWluZXIucmVnaXN0ZXJJbnN0YW5jZSggTm9kZSwgdGhpcyApO1xuXG4gICAgbGV0IG1lID0gdGhpcztcblxuICAgIC8vIExvYWQgY29tcG9uZW50XG4gICAgcmV0dXJuIGN0eC5sb2FkKCk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGNvbnRleHQoKTogUnVudGltZUNvbnRleHQge1xuICAgIHJldHVybiB0aGlzLl9jb250ZXh0O1xuICB9XG5cbiAgdW5sb2FkQ29tcG9uZW50KClcbiAge1xuICAgIGlmICggdGhpcy5fY29udGV4dCApXG4gICAge1xuICAgICAgdGhpcy5fY29udGV4dC5yZWxlYXNlKCk7XG5cbiAgICAgIHRoaXMuX2NvbnRleHQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG59XG4iLCJpbXBvcnQgeyBLaW5kIH0gZnJvbSAnLi4va2luZC9raW5kJztcbmltcG9ydCB7IEVuZFBvaW50Q29sbGVjdGlvbiB9IGZyb20gJy4uL21lc3NhZ2luZy9lbmQtcG9pbnQnO1xuaW1wb3J0IHsgTm9kZSB9IGZyb20gJy4uL2dyYXBoL25vZGUnO1xuaW1wb3J0IHsgQ29tcG9uZW50RmFjdG9yeX0gZnJvbSAnLi9jb21wb25lbnQtZmFjdG9yeSc7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnQvY29tcG9uZW50JztcblxuaW1wb3J0IHsgQ29udGFpbmVyLCBJbmplY3RhYmxlIH0gZnJvbSAnLi4vZGVwZW5kZW5jeS1pbmplY3Rpb24vY29udGFpbmVyJztcblxuZXhwb3J0IGVudW0gUnVuU3RhdGUge1xuICBORVdCT1JOLCAgICAgIC8vIE5vdCB5ZXQgbG9hZGVkXG4gIExPQURJTkcsICAgICAgLy8gV2FpdGluZyBmb3IgYXN5bmMgbG9hZCB0byBjb21wbGV0ZVxuICBMT0FERUQsICAgICAgIC8vIENvbXBvbmVudCBsb2FkZWQsIG5vdCB5ZXQgZXhlY3V0YWJsZVxuICBSRUFEWSwgICAgICAgIC8vIFJlYWR5IGZvciBFeGVjdXRpb25cbiAgUlVOTklORywgICAgICAvLyBOZXR3b3JrIGFjdGl2ZSwgYW5kIHJ1bm5pbmdcbiAgUEFVU0VEICAgICAgICAvLyBOZXR3b3JrIHRlbXBvcmFyaWx5IHBhdXNlZFxufVxuXG4vKipcbiogVGhlIHJ1bnRpbWUgY29udGV4dCBpbmZvcm1hdGlvbiBmb3IgYSBDb21wb25lbnQgaW5zdGFuY2VcbiovXG5leHBvcnQgY2xhc3MgUnVudGltZUNvbnRleHRcbntcbiAgLyoqXG4gICogVGhlIGNvbXBvbmVudCBpZCAvIGFkZHJlc3NcbiAgKi9cbiAgcHJpdmF0ZSBfaWQ6IHN0cmluZztcblxuICAvKipcbiAgKiBUaGUgcnVudGltZSBjb21wb25lbnQgaW5zdGFuY2UgdGhhdCB0aGlzIG5vZGUgcmVwcmVzZW50c1xuICAqL1xuICBwcml2YXRlIF9pbnN0YW5jZTogQ29tcG9uZW50O1xuXG4gIC8qKlxuICAqIEluaXRpYWwgRGF0YSBmb3IgdGhlIGNvbXBvbmVudCBpbnN0YW5jZVxuICAqL1xuICBwcml2YXRlIF9jb25maWc6IHt9O1xuXG4gIC8qKlxuICAqIFRoZSBydW50aW1lIGNvbXBvbmVudCBpbnN0YW5jZSB0aGF0IHRoaXMgbm9kZSByZXByZXNlbnRzXG4gICovXG4gIHByaXZhdGUgX2NvbnRhaW5lcjogQ29udGFpbmVyO1xuXG4gIC8qKlxuICAqIFRoZSBjb21wb25lbnQgZmFjdG9yeSB0aGF0IGNyZWF0ZWQgdXNcbiAgKi9cbiAgcHJpdmF0ZSBfZmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTtcblxuICAvKipcbiAgKlxuICAqXG4gICovXG4gIGNvbnN0cnVjdG9yKCBmYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5LCBjb250YWluZXI6IENvbnRhaW5lciwgaWQ6IHN0cmluZywgY29uZmlnOiB7fSwgZGVwczogSW5qZWN0YWJsZVtdID0gW10gKSB7XG5cbiAgICB0aGlzLl9mYWN0b3J5ID0gZmFjdG9yeTtcblxuICAgIHRoaXMuX2lkID0gaWQ7XG5cbiAgICB0aGlzLl9jb25maWcgPSBjb25maWc7XG5cbiAgICB0aGlzLl9jb250YWluZXIgPSBjb250YWluZXI7XG5cbiAgICAvLyBSZWdpc3RlciBhbnkgY29udGV4dCBkZXBlbmRlbmNpZXNcbiAgICBmb3IoIGxldCBpIGluIGRlcHMgKVxuICAgIHtcbiAgICAgIGlmICggIXRoaXMuX2NvbnRhaW5lci5oYXNSZXNvbHZlciggZGVwc1tpXSApIClcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLnJlZ2lzdGVyU2luZ2xldG9uKCBkZXBzW2ldLCBkZXBzW2ldICk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGluc3RhbmNlKCk6IENvbXBvbmVudCB7XG4gICAgcmV0dXJuIHRoaXMuX2luc3RhbmNlO1xuICB9XG5cbiAgZ2V0IGNvbnRhaW5lcigpOiBDb250YWluZXIge1xuICAgIHJldHVybiB0aGlzLl9jb250YWluZXI7XG4gIH1cblxuICBsb2FkKCApOiBQcm9taXNlPHZvaWQ+XG4gIHtcbiAgICBsZXQgbWUgPSB0aGlzO1xuXG4gICAgdGhpcy5faW5zdGFuY2UgPSBudWxsO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KCAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAvLyBnZXQgYW4gaW5zdGFuY2UgZnJvbSB0aGUgZmFjdG9yeVxuICAgICAgbWUuX3J1blN0YXRlID0gUnVuU3RhdGUuTE9BRElORztcbiAgICAgIHRoaXMuX2ZhY3RvcnkubG9hZENvbXBvbmVudCggdGhpcywgdGhpcy5faWQgKVxuICAgICAgICAudGhlbiggKGluc3RhbmNlKSA9PiB7XG4gICAgICAgICAgLy8gQ29tcG9uZW50IChhbmQgYW55IGRlcGVuZGVuY2llcykgaGF2ZSBiZWVuIGxvYWRlZFxuICAgICAgICAgIG1lLl9pbnN0YW5jZSA9IGluc3RhbmNlO1xuICAgICAgICAgIG1lLnNldFJ1blN0YXRlKCBSdW5TdGF0ZS5MT0FERUQgKTtcblxuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKCAoZXJyKSA9PiB7XG4gICAgICAgICAgLy8gVW5hYmxlIHRvIGxvYWRcbiAgICAgICAgICBtZS5fcnVuU3RhdGUgPSBSdW5TdGF0ZS5ORVdCT1JOO1xuXG4gICAgICAgICAgcmVqZWN0KCBlcnIgKTtcbiAgICAgICAgfSk7XG4gICAgfSApO1xuICB9XG5cbiAgX3J1blN0YXRlOiBSdW5TdGF0ZSA9IFJ1blN0YXRlLk5FV0JPUk47XG4gIGdldCBydW5TdGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fcnVuU3RhdGU7XG4gIH1cblxuICBwcml2YXRlIGluU3RhdGUoIHN0YXRlczogUnVuU3RhdGVbXSApOiBib29sZWFuIHtcbiAgICByZXR1cm4gbmV3IFNldDxSdW5TdGF0ZT4oIHN0YXRlcyApLmhhcyggdGhpcy5fcnVuU3RhdGUgKTtcbiAgfVxuXG4gIC8qKlxuICAqIFRyYW5zaXRpb24gY29tcG9uZW50IHRvIG5ldyBzdGF0ZVxuICAqIFN0YW5kYXJkIHRyYW5zaXRpb25zLCBhbmQgcmVzcGVjdGl2ZSBhY3Rpb25zLCBhcmU6XG4gICogICBMT0FERUQgLT4gUkVBRFkgICAgICBpbnN0YW50aWF0ZSBhbmQgaW5pdGlhbGl6ZSBjb21wb25lbnRcbiAgKiAgIFJFQURZIC0+IExPQURFRCAgICAgIHRlYXJkb3duIGFuZCBkZXN0cm95IGNvbXBvbmVudFxuICAqXG4gICogICBSRUFEWSAtPiBSVU5OSU5HICAgICBzdGFydCBjb21wb25lbnQgZXhlY3V0aW9uXG4gICogICBSVU5OSU5HIC0+IFJFQURZICAgICBzdG9wIGNvbXBvbmVudCBleGVjdXRpb25cbiAgKlxuICAqICAgUlVOTklORyAtPiBQQVVTRUQgICAgcGF1c2UgY29tcG9uZW50IGV4ZWN1dGlvblxuICAqICAgUEFVU0VEIC0+IFJVTk5JTkcgICAgcmVzdW1lIGNvbXBvbmVudCBleGVjdXRpb25cbiAgKlxuICAqL1xuICBzZXRSdW5TdGF0ZSggcnVuU3RhdGU6IFJ1blN0YXRlICkge1xuICAgIGxldCBpbnN0ID0gdGhpcy5pbnN0YW5jZTtcblxuICAgIHN3aXRjaCggcnVuU3RhdGUgKSAvLyB0YXJnZXQgc3RhdGUgLi5cbiAgICB7XG4gICAgICBjYXNlIFJ1blN0YXRlLkxPQURFRDogLy8ganVzdCBsb2FkZWQsIG9yIHRlYXJkb3duXG4gICAgICAgIGlmICggdGhpcy5pblN0YXRlKCBbIFJ1blN0YXRlLlJFQURZLCBSdW5TdGF0ZS5SVU5OSU5HLCBSdW5TdGF0ZS5QQVVTRUQgXSApICkge1xuICAgICAgICAgIC8vIHRlYXJkb3duIGFuZCBkZXN0cm95IGNvbXBvbmVudFxuICAgICAgICAgIGlmICggaW5zdC50ZWFyZG93biApXG4gICAgICAgICAge1xuICAgICAgICAgICAgaW5zdC50ZWFyZG93bigpO1xuXG4gICAgICAgICAgICAvLyBhbmQgZGVzdHJveSBpbnN0YW5jZVxuICAgICAgICAgICAgdGhpcy5faW5zdGFuY2UgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBSdW5TdGF0ZS5SRUFEWTogIC8vIGluaXRpYWxpemUgb3Igc3RvcCBub2RlXG4gICAgICAgIGlmICggdGhpcy5pblN0YXRlKCBbIFJ1blN0YXRlLkxPQURFRCBdICkgKSB7XG4gICAgICAgICAgLy8gaW5pdGlhbGl6ZSBjb21wb25lbnRcbiAgICAgICAgICBsZXQgZW5kUG9pbnRzOiBFbmRQb2ludENvbGxlY3Rpb24gPSB7fTtcblxuICAgICAgICAgIC8vIFRPRE86XG4gICAgICAgICAgaWYgKCBpbnN0LmluaXRpYWxpemUgKVxuICAgICAgICAgICAgZW5kUG9pbnRzID0gdGhpcy5pbnN0YW5jZS5pbml0aWFsaXplKCA8S2luZD50aGlzLl9jb25maWcgKTtcblxuICAgICAgICAgIHRoaXMucmVjb25jaWxlUG9ydHMoIGVuZFBvaW50cyApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmluU3RhdGUoIFsgUnVuU3RhdGUuUlVOTklORywgUnVuU3RhdGUuUEFVU0VEIF0gKSApIHtcbiAgICAgICAgICAvLyBzdG9wIGNvbXBvbmVudFxuICAgICAgICAgIGlmICggaW5zdC5zdG9wIClcbiAgICAgICAgICAgIHRoaXMuaW5zdGFuY2Uuc3RvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdDb21wb25lbnQgY2Fubm90IGJlIGluaXRpYWxpemVkLCBub3QgbG9hZGVkJyApO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBSdW5TdGF0ZS5SVU5OSU5HOiAgLy8gc3RhcnQvcmVzdW1lIG5vZGVcbiAgICAgICAgaWYgKCB0aGlzLmluU3RhdGUoIFsgUnVuU3RhdGUuUkVBRFksIFJ1blN0YXRlLlJVTk5JTkcgXSApICkge1xuICAgICAgICAgIC8vIHN0YXJ0IGNvbXBvbmVudCBleGVjdXRpb25cbiAgICAgICAgICBpZiAoIGluc3Quc3RhcnQgKVxuICAgICAgICAgICAgdGhpcy5pbnN0YW5jZS5zdGFydCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmluU3RhdGUoIFsgUnVuU3RhdGUuUEFVU0VEIF0gKSApIHtcbiAgICAgICAgICAvLyByZXN1bWUgY29tcG9uZW50IGV4ZWN1dGlvbiBhZnRlciBwYXVzZVxuICAgICAgICAgIGlmICggaW5zdC5yZXN1bWUgKVxuICAgICAgICAgICAgdGhpcy5pbnN0YW5jZS5yZXN1bWUoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnQ29tcG9uZW50IGNhbm5vdCBiZSBzdGFydGVkLCBub3QgcmVhZHknICk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIFJ1blN0YXRlLlBBVVNFRDogIC8vIHBhdXNlIG5vZGVcbiAgICAgICAgaWYgKCB0aGlzLmluU3RhdGUoIFsgUnVuU3RhdGUuUlVOTklOR10gKSApIHtcbiAgICAgICAgICBpZiAoIGluc3QucGF1c2UgKVxuICAgICAgICAgICAgdGhpcy5pbnN0YW5jZS5wYXVzZSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmluU3RhdGUoIFsgUnVuU3RhdGUuUEFVU0VEIF0gKSApIHtcbiAgICAgICAgICAvLyBhbHJlYWR5IHBhdXNlZFxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoICdDb21wb25lbnQgY2Fubm90IGJlIHBhdXNlZCcgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgdGhpcy5fcnVuU3RhdGUgPSBydW5TdGF0ZTtcbiAgfVxuXG4gIHByb3RlY3RlZCByZWNvbmNpbGVQb3J0cyggZW5kUG9pbnRzOiBFbmRQb2ludENvbGxlY3Rpb24gKSB7XG4gICAgLy9sZXQgcG9ydHMgPSB0aGlzLm5vZGUucG9ydHM7XG4gICAgLy9lbmRcbiAgfVxuXG4gIHJlbGVhc2UoKSB7XG4gICAgLy8gcmVsZWFzZSBpbnN0YW5jZSwgdG8gYXZvaWQgbWVtb3J5IGxlYWtzXG4gICAgdGhpcy5faW5zdGFuY2UgPSBudWxsO1xuXG4gICAgdGhpcy5fZmFjdG9yeSA9IG51bGxcbiAgfVxufVxuIiwiZXhwb3J0IGludGVyZmFjZSBNb2R1bGVMb2FkZXIge1xuICBoYXNNb2R1bGU/KCBpZDogc3RyaW5nICk6IGJvb2xlYW47XG5cbiAgbG9hZE1vZHVsZSggaWQ6IHN0cmluZyApOiBQcm9taXNlPGFueT47XG59XG5cbmRlY2xhcmUgaW50ZXJmYWNlIFN5c3RlbSB7XG4gIG5vcm1hbGl6ZVN5bmMoIGlkICk7XG4gIGltcG9ydCggaWQgKTtcbn07XG5kZWNsYXJlIHZhciBTeXN0ZW06IFN5c3RlbTtcblxuY2xhc3MgTW9kdWxlUmVnaXN0cnlFbnRyeSB7XG4gIGNvbnN0cnVjdG9yKCBhZGRyZXNzOiBzdHJpbmcgKSB7XG5cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU3lzdGVtTW9kdWxlTG9hZGVyIGltcGxlbWVudHMgTW9kdWxlTG9hZGVyIHtcblxuICBwcml2YXRlIG1vZHVsZVJlZ2lzdHJ5OiBNYXA8c3RyaW5nLCBNb2R1bGVSZWdpc3RyeUVudHJ5PjtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLm1vZHVsZVJlZ2lzdHJ5ID0gbmV3IE1hcDxzdHJpbmcsIE1vZHVsZVJlZ2lzdHJ5RW50cnk+KCk7XG4gIH1cblxuICBwcml2YXRlIGdldE9yQ3JlYXRlTW9kdWxlUmVnaXN0cnlFbnRyeShhZGRyZXNzOiBzdHJpbmcpOiBNb2R1bGVSZWdpc3RyeUVudHJ5IHtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGVSZWdpc3RyeVthZGRyZXNzXSB8fCAodGhpcy5tb2R1bGVSZWdpc3RyeVthZGRyZXNzXSA9IG5ldyBNb2R1bGVSZWdpc3RyeUVudHJ5KGFkZHJlc3MpKTtcbiAgfVxuXG4gIGxvYWRNb2R1bGUoIGlkOiBzdHJpbmcgKTogUHJvbWlzZTxhbnk+IHtcbiAgICBsZXQgbmV3SWQgPSBTeXN0ZW0ubm9ybWFsaXplU3luYyhpZCk7XG4gICAgbGV0IGV4aXN0aW5nID0gdGhpcy5tb2R1bGVSZWdpc3RyeVtuZXdJZF07XG5cbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZXhpc3RpbmcpO1xuICAgIH1cblxuICAgIHJldHVybiBTeXN0ZW0uaW1wb3J0KG5ld0lkKS50aGVuKG0gPT4ge1xuICAgICAgdGhpcy5tb2R1bGVSZWdpc3RyeVtuZXdJZF0gPSBtO1xuICAgICAgcmV0dXJuIG07IC8vZW5zdXJlT3JpZ2luT25FeHBvcnRzKG0sIG5ld0lkKTtcbiAgICB9KTtcbiAgfVxuXG59XG4iLCJpbXBvcnQgeyBDb21wb25lbnQsIENvbXBvbmVudENvbnN0cnVjdG9yIH0gZnJvbSAnLi4vY29tcG9uZW50L2NvbXBvbmVudCc7XG5pbXBvcnQgeyBSdW50aW1lQ29udGV4dCB9IGZyb20gJy4vcnVudGltZS1jb250ZXh0JztcbmltcG9ydCB7IE1vZHVsZUxvYWRlciB9IGZyb20gJy4vbW9kdWxlLWxvYWRlcic7XG5cbmltcG9ydCB7IENvbnRhaW5lciwgSW5qZWN0YWJsZSB9IGZyb20gJy4uL2RlcGVuZGVuY3ktaW5qZWN0aW9uL2NvbnRhaW5lcic7XG5pbXBvcnQgeyBFbmRQb2ludENvbGxlY3Rpb24gfSBmcm9tICcuLi9tZXNzYWdpbmcvZW5kLXBvaW50JztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3Rvcnkge1xuICBwcml2YXRlIF9sb2FkZXI6IE1vZHVsZUxvYWRlcjtcbiAgcHJpdmF0ZSBfY29udGFpbmVyOiBDb250YWluZXI7XG4gIHByaXZhdGUgX2NvbXBvbmVudHM6IE1hcDxzdHJpbmcsIENvbXBvbmVudENvbnN0cnVjdG9yPjtcblxuICBjb25zdHJ1Y3RvciggY29udGFpbmVyPzogQ29udGFpbmVyLCBsb2FkZXI/OiBNb2R1bGVMb2FkZXIgKSB7XG4gICAgdGhpcy5fbG9hZGVyID0gbG9hZGVyO1xuICAgIHRoaXMuX2NvbnRhaW5lciA9IGNvbnRhaW5lciB8fCBuZXcgQ29udGFpbmVyKCk7XG4gICAgdGhpcy5fY29tcG9uZW50cyA9IG5ldyBNYXA8c3RyaW5nLCBDb21wb25lbnRDb25zdHJ1Y3Rvcj4oKTtcblxuICAgIHRoaXMuX2NvbXBvbmVudHMuc2V0KCB1bmRlZmluZWQsIE9iamVjdCApO1xuICAgIHRoaXMuX2NvbXBvbmVudHMuc2V0KCBcIlwiLCBPYmplY3QgKTtcbiAgfVxuXG4gIGNyZWF0ZUNvbnRleHQoIGlkOiBzdHJpbmcsIGNvbmZpZzoge30sIGRlcHM6IEluamVjdGFibGVbXSA9IFtdICk6IFJ1bnRpbWVDb250ZXh0XG4gIHtcbiAgICBsZXQgY2hpbGRDb250YWluZXI6IENvbnRhaW5lciA9IHRoaXMuX2NvbnRhaW5lci5jcmVhdGVDaGlsZCgpO1xuXG4gICAgcmV0dXJuIG5ldyBSdW50aW1lQ29udGV4dCggdGhpcywgY2hpbGRDb250YWluZXIsIGlkLCBjb25maWcsIGRlcHMgKTtcbiAgfVxuXG4gIGdldENoaWxkQ29udGFpbmVyKCk6IENvbnRhaW5lciB7XG4gICAgcmV0dXJuIDtcbiAgfVxuXG4gIGxvYWRDb21wb25lbnQoIGN0eDogUnVudGltZUNvbnRleHQsIGlkOiBzdHJpbmcgKTogUHJvbWlzZTxDb21wb25lbnQ+XG4gIHtcbiAgICBsZXQgY3JlYXRlQ29tcG9uZW50ID0gZnVuY3Rpb24oIGN0b3I6IENvbXBvbmVudENvbnN0cnVjdG9yICk6IENvbXBvbmVudFxuICAgIHtcbiAgICAgIGxldCBuZXdJbnN0YW5jZTogQ29tcG9uZW50ID0gY3R4LmNvbnRhaW5lci5pbnZva2UoIGN0b3IgKTtcblxuICAgICAgcmV0dXJuIG5ld0luc3RhbmNlO1xuICAgIH1cblxuICAgIGxldCBtZSA9IHRoaXM7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2U8Q29tcG9uZW50PiggKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgLy8gQ2hlY2sgY2FjaGVcbiAgICAgIGxldCBjdG9yOiBDb21wb25lbnRDb25zdHJ1Y3RvciA9IHRoaXMuZ2V0KCBpZCApO1xuXG4gICAgICBpZiAoIGN0b3IgKSB7XG4gICAgICAgIC8vIHVzZSBjYWNoZWQgY29uc3RydWN0b3JcbiAgICAgICAgcmVzb2x2ZSggY3JlYXRlQ29tcG9uZW50KCBjdG9yICkgKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKCB0aGlzLl9sb2FkZXIgKSB7XG4gICAgICAgIC8vIGdvdCBhIGxvYWRlZCwgc28gdHJ5IHRvIGxvYWQgdGhlIG1vZHVsZSAuLi5cbiAgICAgICAgdGhpcy5fbG9hZGVyLmxvYWRNb2R1bGUoIGlkIClcbiAgICAgICAgICAudGhlbiggKCBjdG9yOiBDb21wb25lbnRDb25zdHJ1Y3RvciApID0+IHtcblxuICAgICAgICAgICAgLy8gcmVnaXN0ZXIgbG9hZGVkIGNvbXBvbmVudFxuICAgICAgICAgICAgbWUuX2NvbXBvbmVudHMuc2V0KCBpZCwgY3RvciApO1xuXG4gICAgICAgICAgICAvLyBpbnN0YW50aWF0ZSBhbmQgcmVzb2x2ZVxuICAgICAgICAgICAgcmVzb2x2ZSggY3JlYXRlQ29tcG9uZW50KCBjdG9yICkgKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCggKCBlICkgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KCAnQ29tcG9uZW50RmFjdG9yeTogVW5hYmxlIHRvIGxvYWQgY29tcG9uZW50IFwiJyArIGlkICsgJ1wiIC0gJyArIGUgKTtcbiAgICAgICAgICB9ICk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgLy8gb29wcy4gbm8gbG9hZGVyIC4uIG5vIGNvbXBvbmVudFxuICAgICAgICByZWplY3QoICdDb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnQgXCInICsgaWQgKyAnXCIgbm90IHJlZ2lzdGVyZWQsIGFuZCBMb2FkZXIgbm90IGF2YWlsYWJsZScgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGdldCggaWQ6IHN0cmluZyApOiBDb21wb25lbnRDb25zdHJ1Y3RvciB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBvbmVudHMuZ2V0KCBpZCApO1xuICB9XG4gIHJlZ2lzdGVyKCBpZDogc3RyaW5nLCBjdG9yOiBDb21wb25lbnRDb25zdHJ1Y3RvciApIHtcbiAgICB0aGlzLl9jb21wb25lbnRzLnNldCggaWQsIGN0b3IgKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRW5kUG9pbnQgfSBmcm9tICcuLi9tZXNzYWdpbmcvZW5kLXBvaW50JztcbmltcG9ydCB7IENoYW5uZWwgfSBmcm9tICcuLi9tZXNzYWdpbmcvY2hhbm5lbCc7XG5cbmltcG9ydCB7IEdyYXBoIH0gZnJvbSAnLi9ncmFwaCc7XG5pbXBvcnQgeyBOb2RlIH0gZnJvbSAnLi9ub2RlJztcbmltcG9ydCB7IFBvcnQgfSBmcm9tICcuL3BvcnQnO1xuXG5leHBvcnQgdHlwZSBFbmRQb2ludFJlZiA9IHsgbm9kZUlEOiBzdHJpbmcsIHBvcnRJRDogc3RyaW5nIH07XG5cbmV4cG9ydCBjbGFzcyBMaW5rXG57XG4gIHByb3RlY3RlZCBfb3duZXI6IEdyYXBoO1xuICBwcm90ZWN0ZWQgX2lkOiBzdHJpbmc7XG5cbiAgcHJvdGVjdGVkIF9jaGFubmVsOiBDaGFubmVsO1xuICBwcm90ZWN0ZWQgX2Zyb206IEVuZFBvaW50UmVmO1xuICBwcm90ZWN0ZWQgX3RvOiBFbmRQb2ludFJlZjtcblxuICBwcm90ZWN0ZWQgX3Byb3RvY29sSUQ6IHN0cmluZztcbiAgcHJvdGVjdGVkIG1ldGFkYXRhOiBhbnk7XG5cbiAgY29uc3RydWN0b3IoIG93bmVyOiBHcmFwaCwgYXR0cmlidXRlczogYW55ID0ge30gKVxuICB7XG4gICAgdGhpcy5fb3duZXIgPSBvd25lcjtcbiAgICB0aGlzLl9pZCA9IGF0dHJpYnV0ZXMuaWQgfHwgXCJcIjtcbiAgICAvL3RoaXMuX2NoYW5uZWwgPSBudWxsO1xuICAgIHRoaXMuX2Zyb20gPSBhdHRyaWJ1dGVzWyAnZnJvbScgXTtcbiAgICB0aGlzLl90byA9IGF0dHJpYnV0ZXNbICd0bycgXTtcbiAgICB0aGlzLl9wcm90b2NvbElEID0gYXR0cmlidXRlc1sgJ3Byb3RvY29sJyBdIHx8ICdhbnknO1xuXG4gICAgdGhpcy5tZXRhZGF0YSA9IGF0dHJpYnV0ZXMubWV0YWRhdGEgfHwgeyB4OiAxMDAsIHk6IDEwMCB9O1xuICB9XG5cbiAgdG9PYmplY3QoIG9wdHM/OiBhbnkgKTogT2JqZWN0XG4gIHtcbiAgICBsZXQgbGluayA9IHtcbiAgICAgIGlkOiB0aGlzLl9pZCxcbiAgICAgIHByb3RvY29sOiAoIHRoaXMuX3Byb3RvY29sSUQgIT0gJ2FueScgKSA/IHRoaXMuX3Byb3RvY29sSUQgOiB1bmRlZmluZWQsXG4gICAgICBtZXRhZGF0YTogdGhpcy5tZXRhZGF0YSxcbiAgICAgIGZyb206IHRoaXMuX2Zyb20sXG4gICAgICB0bzogdGhpcy5fdG9cbiAgICB9O1xuXG4gICAgcmV0dXJuIGxpbms7XG4gIH1cblxuICBzZXQgaWQoIGlkOiBzdHJpbmcgKVxuICB7XG4gICAgdGhpcy5faWQgPSBpZDtcbiAgfVxuXG4gIGNvbm5lY3QoIGNoYW5uZWw6IENoYW5uZWwgKVxuICB7XG4gICAgLy8gaWRlbnRpZnkgZnJvbVBvcnQgaW4gZnJvbU5vZGVcbiAgICBsZXQgZnJvbVBvcnQ6IFBvcnQgPSB0aGlzLmZyb21Ob2RlLmlkZW50aWZ5UG9ydCggdGhpcy5fZnJvbS5wb3J0SUQsIHRoaXMuX3Byb3RvY29sSUQgKTtcblxuICAgIC8vIGlkZW50aWZ5IHRvUG9ydCBpbiB0b05vZGVcbiAgICBsZXQgdG9Qb3J0OiBQb3J0ID0gdGhpcy50b05vZGUuaWRlbnRpZnlQb3J0KCB0aGlzLl90by5wb3J0SUQsIHRoaXMuX3Byb3RvY29sSUQgKTtcblxuICAgIHRoaXMuX2NoYW5uZWwgPSBjaGFubmVsO1xuXG4gICAgZnJvbVBvcnQuZW5kUG9pbnQuYXR0YWNoKCBjaGFubmVsICk7XG4gICAgdG9Qb3J0LmVuZFBvaW50LmF0dGFjaCggY2hhbm5lbCApO1xuICB9XG5cbiAgZGlzY29ubmVjdCgpOiBDaGFubmVsXG4gIHtcbiAgICBsZXQgY2hhbiA9IHRoaXMuX2NoYW5uZWw7XG5cbiAgICBpZiAoIGNoYW4gKVxuICAgIHtcbiAgICAgIHRoaXMuX2NoYW5uZWwuZW5kUG9pbnRzLmZvckVhY2goICggZW5kUG9pbnQgKSA9PiB7XG4gICAgICAgIGVuZFBvaW50LmRldGFjaCggdGhpcy5fY2hhbm5lbCApO1xuICAgICAgfSApO1xuXG4gICAgICB0aGlzLl9jaGFubmVsID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHJldHVybiBjaGFuO1xuICB9XG5cbiAgZ2V0IGZyb21Ob2RlKCk6IE5vZGVcbiAge1xuICAgIHJldHVybiB0aGlzLl9vd25lci5nZXROb2RlQnlJRCggdGhpcy5fZnJvbS5ub2RlSUQgKTtcbiAgfVxuXG4gIGdldCBmcm9tUG9ydCgpOiBQb3J0XG4gIHtcbiAgICBsZXQgbm9kZSA9IHRoaXMuZnJvbU5vZGU7XG5cbiAgICByZXR1cm4gKG5vZGUpID8gbm9kZS5pZGVudGlmeVBvcnQoIHRoaXMuX2Zyb20ucG9ydElELCB0aGlzLl9wcm90b2NvbElEICkgOiB1bmRlZmluZWQ7XG4gIH1cblxuICBzZXQgZnJvbVBvcnQoIHBvcnQ6IFBvcnQgKVxuICB7XG4gICAgdGhpcy5fZnJvbSA9IHtcbiAgICAgIG5vZGVJRDogcG9ydC5vd25lci5pZCxcbiAgICAgIHBvcnRJRDogcG9ydC5pZFxuICAgIH07XG5cbiAgICB0aGlzLl9wcm90b2NvbElEID0gcG9ydC5wcm90b2NvbElEO1xuICB9XG5cbiAgZ2V0IHRvTm9kZSgpOiBOb2RlXG4gIHtcbiAgICByZXR1cm4gdGhpcy5fb3duZXIuZ2V0Tm9kZUJ5SUQoIHRoaXMuX3RvLm5vZGVJRCApO1xuICB9XG5cbiAgZ2V0IHRvUG9ydCgpOiBQb3J0XG4gIHtcbiAgICBsZXQgbm9kZSA9IHRoaXMudG9Ob2RlO1xuXG4gICAgcmV0dXJuIChub2RlKSA/IG5vZGUuaWRlbnRpZnlQb3J0KCB0aGlzLl90by5wb3J0SUQsIHRoaXMuX3Byb3RvY29sSUQgKSA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHNldCB0b1BvcnQoIHBvcnQ6IFBvcnQgKVxuICB7XG4gICAgdGhpcy5fdG8gPSB7XG4gICAgICBub2RlSUQ6IHBvcnQub3duZXIuaWQsXG4gICAgICBwb3J0SUQ6IHBvcnQuaWRcbiAgICB9O1xuXG4gICAgdGhpcy5fcHJvdG9jb2xJRCA9IHBvcnQucHJvdG9jb2xJRDtcbiAgfVxuXG4gIGdldCBwcm90b2NvbElEKCk6IHN0cmluZ1xuICB7XG4gICAgcmV0dXJuIHRoaXMuX3Byb3RvY29sSUQ7XG4gIH1cbn1cbiIsImltcG9ydCB7IEV2ZW50SHViIH0gZnJvbSAnLi4vZXZlbnQtaHViL2V2ZW50LWh1Yic7XG5pbXBvcnQgeyBDb21wb25lbnRGYWN0b3J5IH0gZnJvbSAnLi4vcnVudGltZS9jb21wb25lbnQtZmFjdG9yeSc7XG5pbXBvcnQgeyBSdW50aW1lQ29udGV4dCwgUnVuU3RhdGUgfSBmcm9tICcuLi9ydW50aW1lL3J1bnRpbWUtY29udGV4dCc7XG5pbXBvcnQgeyBFbmRQb2ludCB9IGZyb20gJy4uL21lc3NhZ2luZy9lbmQtcG9pbnQnO1xuaW1wb3J0IHsgQ2hhbm5lbCB9IGZyb20gJy4uL21lc3NhZ2luZy9jaGFubmVsJztcblxuaW1wb3J0IHsgR3JhcGggfSBmcm9tICcuL2dyYXBoJztcbmltcG9ydCB7IE5vZGUgfSBmcm9tICcuL25vZGUnO1xuaW1wb3J0IHsgTGluayB9IGZyb20gJy4vbGluayc7XG5pbXBvcnQgeyBQb3J0LCBQdWJsaWNQb3J0IH0gZnJvbSAnLi9wb3J0JztcblxuZXhwb3J0IGNsYXNzIE5ldHdvcmsgZXh0ZW5kcyBFdmVudEh1Ylxue1xuICBzdGF0aWMgRVZFTlRfU1RBVEVfQ0hBTkdFID0gJ25ldHdvcms6c3RhdGUtY2hhbmdlJztcbiAgc3RhdGljIEVWRU5UX0dSQVBIX0NIQU5HRSA9ICduZXR3b3JrOmdyYXBoLWNoYW5nZSc7XG5cbiAgcHJpdmF0ZSBfZ3JhcGg6IEdyYXBoO1xuXG4gIHByaXZhdGUgX2ZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk7XG5cbiAgY29uc3RydWN0b3IoIGZhY3Rvcnk6IENvbXBvbmVudEZhY3RvcnksIGdyYXBoPzogR3JhcGggKVxuICB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuX2ZhY3RvcnkgPSBmYWN0b3J5O1xuICAgIHRoaXMuX2dyYXBoID0gZ3JhcGggfHwgbmV3IEdyYXBoKCBudWxsLCB7fSApO1xuXG4gICAgbGV0IG1lID0gdGhpcztcbiAgICB0aGlzLl9ncmFwaC5zdWJzY3JpYmUoIEdyYXBoLkVWRU5UX0FERF9OT0RFLCAoIGRhdGE6IHsgbm9kZTogTm9kZSB9ICk9PiB7XG4gICAgICBsZXQgcnVuU3RhdGU6IFJ1blN0YXRlID0gbWUuX2dyYXBoLmNvbnRleHQucnVuU3RhdGU7XG5cbiAgICAgIGlmICggcnVuU3RhdGUgIT0gUnVuU3RhdGUuTkVXQk9STiApXG4gICAgICB7XG4gICAgICAgIGxldCB7IG5vZGUgfSA9IGRhdGE7XG5cbiAgICAgICAgbm9kZS5sb2FkQ29tcG9uZW50KCBtZS5fZmFjdG9yeSApXG4gICAgICAgICAgLnRoZW4oICgpPT4ge1xuICAgICAgICAgICAgaWYgKCBOZXR3b3JrLmluU3RhdGUoIFsgUnVuU3RhdGUuUlVOTklORywgUnVuU3RhdGUuUEFVU0VELCBSdW5TdGF0ZS5SRUFEWSBdLCBydW5TdGF0ZSApIClcbiAgICAgICAgICAgICAgTmV0d29yay5zZXRSdW5TdGF0ZSggbm9kZSwgUnVuU3RhdGUuUkVBRFkgKTtcblxuICAgICAgICAgICAgaWYgKCBOZXR3b3JrLmluU3RhdGUoIFsgUnVuU3RhdGUuUlVOTklORywgUnVuU3RhdGUuUEFVU0VEIF0sIHJ1blN0YXRlICkgKVxuICAgICAgICAgICAgICBOZXR3b3JrLnNldFJ1blN0YXRlKCBub2RlLCBydW5TdGF0ZSApO1xuXG4gICAgICAgICAgICB0aGlzLnB1Ymxpc2goIE5ldHdvcmsuRVZFTlRfR1JBUEhfQ0hBTkdFLCB7IG5vZGU6IG5vZGUgfSApO1xuICAgICAgICAgIH0pXG4gICAgICB9XG4gICAgfSApO1xuICB9XG5cbiAgZ2V0IGdyYXBoKCk6IEdyYXBoIHtcbiAgICByZXR1cm4gdGhpcy5fZ3JhcGg7XG4gIH1cblxuICAvKipcbiAgKiBMb2FkIGFsbCBjb21wb25lbnRzXG4gICovXG4gIGxvYWRDb21wb25lbnRzKCk6IFByb21pc2U8dm9pZD5cbiAge1xuICAgIGxldCBtZSA9IHRoaXM7XG5cbiAgICB0aGlzLnB1Ymxpc2goIE5ldHdvcmsuRVZFTlRfU1RBVEVfQ0hBTkdFLCB7IHN0YXRlOiBSdW5TdGF0ZS5MT0FESU5HIH0gKTtcblxuICAgIHJldHVybiB0aGlzLl9ncmFwaC5sb2FkQ29tcG9uZW50KCB0aGlzLl9mYWN0b3J5ICkudGhlbiggKCk9PiB7XG4gICAgICB0aGlzLnB1Ymxpc2goIE5ldHdvcmsuRVZFTlRfU1RBVEVfQ0hBTkdFLCB7IHN0YXRlOiBSdW5TdGF0ZS5MT0FERUQgfSApO1xuICAgIH0pO1xuICB9XG5cbiAgaW5pdGlhbGl6ZSgpIHtcbiAgICB0aGlzLnNldFJ1blN0YXRlKCBSdW5TdGF0ZS5SRUFEWSApO1xuICB9XG5cbiAgdGVhcmRvd24oKSB7XG4gICAgdGhpcy5zZXRSdW5TdGF0ZSggUnVuU3RhdGUuTE9BREVEICk7XG4gIH1cblxuICBzdGF0aWMgaW5TdGF0ZSggc3RhdGVzOiBSdW5TdGF0ZVtdLCBydW5TdGF0ZTogUnVuU3RhdGUgKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIG5ldyBTZXQ8UnVuU3RhdGU+KCBzdGF0ZXMgKS5oYXMoIHJ1blN0YXRlICk7XG4gIH1cblxuICAvKipcbiAgKiBBbHRlciBydW4tc3RhdGUgb2YgYSBOb2RlIC0gTE9BREVELCBSRUFEWSwgUlVOTklORyBvciBQQVVTRUQuXG4gICogVHJpZ2dlcnMgU2V0dXAgb3IgVGVhcmRvd24gaWYgdHJhbnNpdGlvbmluZyBiZXR3ZWVuIFJFQURZIGFuZCBMT0FERURcbiAgKiBXaXJldXAgYSBncmFwaCwgY3JlYXRpbmcgQ2hhbm5lbCBiZXR3ZWVuIGxpbmtlZCBOb2Rlc1xuICAqIEFjdHMgcmVjdXJzaXZlbHksIHdpcmluZyB1cCBhbnkgc3ViLWdyYXBoc1xuICAqL1xuICBwcml2YXRlIHN0YXRpYyBzZXRSdW5TdGF0ZSggbm9kZTogTm9kZSwgcnVuU3RhdGU6IFJ1blN0YXRlIClcbiAge1xuICAgIGxldCBjdHggPSBub2RlLmNvbnRleHQ7XG4gICAgbGV0IGN1cnJlbnRTdGF0ZSA9IGN0eC5ydW5TdGF0ZTtcblxuICAgIGlmICggbm9kZSBpbnN0YW5jZW9mIEdyYXBoIClcbiAgICB7XG4gICAgICAvLyAxLiBQcmVwcm9jZXNzXG4gICAgICAvLyAgICBhLiBIYW5kbGUgdGVhcmRvd25cbiAgICAgIC8vICAgIGIuIFByb3BhZ2F0ZSBzdGF0ZSBjaGFuZ2UgdG8gc3VibmV0c1xuICAgICAgbGV0IG5vZGVzOiBNYXA8c3RyaW5nLCBOb2RlPiA9IG5vZGUubm9kZXM7XG5cbiAgICAgIGlmICggKCBydW5TdGF0ZSA9PSBSdW5TdGF0ZS5MT0FERUQgKSAmJiAoIGN1cnJlbnRTdGF0ZSA+PSBSdW5TdGF0ZS5SRUFEWSApICkge1xuICAgICAgICAvLyB0ZWFyaW5nIGRvd24gLi4gdW5saW5rIGdyYXBoIGZpcnN0XG4gICAgICAgIGxldCBsaW5rczogTWFwPHN0cmluZywgTGluaz4gPSBub2RlLmxpbmtzO1xuXG4gICAgICAgIC8vIHVud2lyZSAoZGVhY3RpdmF0ZSBhbmQgZGVzdHJveSApIENoYW5uZWxzIGJldHdlZW4gbGlua2VkIG5vZGVzXG4gICAgICAgIGxpbmtzLmZvckVhY2goICggbGluayApID0+XG4gICAgICAgIHtcbiAgICAgICAgICBOZXR3b3JrLnVud2lyZUxpbmsoIGxpbmsgKTtcbiAgICAgICAgfSApO1xuICAgICAgfVxuXG4gICAgICAvLyBQcm9wYWdhdGUgc3RhdGUgY2hhbmdlIHRvIHN1Yi1uZXRzIGZpcnN0XG4gICAgICBub2Rlcy5mb3JFYWNoKCBmdW5jdGlvbiggc3ViTm9kZSApXG4gICAgICB7XG4gICAgICAgIE5ldHdvcmsuc2V0UnVuU3RhdGUoIHN1Yk5vZGUsIHJ1blN0YXRlICk7XG4gICAgICB9ICk7XG5cbiAgICAgIC8vIDIuIENoYW5nZSBzdGF0ZSAuLi5cbiAgICAgIGN0eC5zZXRSdW5TdGF0ZSggcnVuU3RhdGUgKTtcblxuICAgICAgLy8gMy4gUG9zdHByb2Nlc3NcbiAgICAgIC8vICAgIGEuIEhhbmRsZSBzZXR1cFxuICAgICAgaWYgKCAoIHJ1blN0YXRlID09IFJ1blN0YXRlLlJFQURZICkgJiYgKCBjdXJyZW50U3RhdGUgPj0gUnVuU3RhdGUuTE9BREVEICkgKSB7XG5cbiAgICAgICAgLy8gc2V0dGluZyB1cCAuLiBsaW5rdXAgZ3JhcGggZmlyc3RcbiAgICAgICAgbGV0IGxpbmtzOiBNYXA8c3RyaW5nLCBMaW5rPiA9IG5vZGUubGlua3M7XG4gICAgICAgIC8vIHRyZWF0IGdyYXBoIHJlY3Vyc2l2ZWx5XG5cbiAgICAgICAgLy8gMi4gd2lyZXVwIChjcmVhdGUgYW5kIGFjdGl2YXRlKSBhIENoYW5uZWwgYmV0d2VlbiBsaW5rZWQgbm9kZXNcbiAgICAgICAgbGlua3MuZm9yRWFjaCggKCBsaW5rICkgPT5cbiAgICAgICAge1xuICAgICAgICAgIE5ldHdvcmsud2lyZUxpbmsoIGxpbmsgKTtcbiAgICAgICAgfSApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDaGFuZ2Ugc3RhdGUgLi4uXG4gICAgICBjdHguc2V0UnVuU3RhdGUoIHJ1blN0YXRlICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICogVW53aXJlIGEgbGluaywgcmVtb3ZpbmcgdGhlIENoYW5uZWwgYmV0d2VlbiB0aGUgbGlua2VkIE5vZGVzXG4gICovXG4gIHByaXZhdGUgc3RhdGljIHVud2lyZUxpbmsoIGxpbms6IExpbmsgKVxuICB7XG4gICAgLy8gZ2V0IGxpbmtlZCBub2RlcyAoTGluayBmaW5kcyBOb2RlcyBpbiBwYXJlbnQgR3JhcGgpXG4gICAgbGV0IGZyb21Ob2RlID0gbGluay5mcm9tTm9kZTtcbiAgICBsZXQgdG9Ob2RlID0gbGluay50b05vZGU7XG5cbiAgICBsZXQgY2hhbjogQ2hhbm5lbCA9IGxpbmsuZGlzY29ubmVjdCgpO1xuXG4gICAgaWYgKCBjaGFuIClcbiAgICAgIGNoYW4uZGVhY3RpdmF0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICogV2lyZXVwIGEgbGluaywgY3JlYXRpbmcgQ2hhbm5lbCBiZXR3ZWVuIHRoZSBsaW5rZWQgTm9kZXNcbiAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgd2lyZUxpbmsoIGxpbms6IExpbmsgKVxuICB7XG4gICAgLy8gZ2V0IGxpbmtlZCBub2RlcyAoTGluayBmaW5kcyBOb2RlcyBpbiBwYXJlbnQgR3JhcGgpXG4gICAgbGV0IGZyb21Ob2RlID0gbGluay5mcm9tTm9kZTtcbiAgICBsZXQgdG9Ob2RlID0gbGluay50b05vZGU7XG5cbiAgICAvL2RlYnVnTWVzc2FnZSggXCJMaW5rKFwiK2xpbmsuaWQrXCIpOiBcIiArIGxpbmsuZnJvbSArIFwiIC0+IFwiICsgbGluay50byArIFwiIHByb3RvPVwiK2xpbmsucHJvdG9jb2wgKTtcblxuICAgIGxldCBjaGFubmVsID0gbmV3IENoYW5uZWwoKTtcblxuICAgIGxpbmsuY29ubmVjdCggY2hhbm5lbCApO1xuXG4gICAgY2hhbm5lbC5hY3RpdmF0ZSgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIHNldFJ1blN0YXRlKCBydW5TdGF0ZTogUnVuU3RhdGUgKVxuICB7XG4gICAgTmV0d29yay5zZXRSdW5TdGF0ZSggdGhpcy5fZ3JhcGgsIHJ1blN0YXRlICk7XG5cbiAgICB0aGlzLnB1Ymxpc2goIE5ldHdvcmsuRVZFTlRfU1RBVEVfQ0hBTkdFLCB7IHN0YXRlOiBydW5TdGF0ZSB9ICk7XG4gIH1cblxuICBzdGFydCggaW5pdGlhbGx5UGF1c2VkOiBib29sZWFuID0gZmFsc2UgKSB7XG4gICAgdGhpcy5zZXRSdW5TdGF0ZSggaW5pdGlhbGx5UGF1c2VkID8gUnVuU3RhdGUuUEFVU0VEIDogUnVuU3RhdGUuUlVOTklORyApO1xuICB9XG5cbiAgc3RlcCgpIHtcbiAgICAvLyBUT0RPOiBTaW5nbGUtc3RlcFxuICB9XG5cbiAgc3RvcCgpIHtcbiAgICB0aGlzLnNldFJ1blN0YXRlKCBSdW5TdGF0ZS5SRUFEWSApO1xuICB9XG5cbiAgcGF1c2UoKSB7XG4gICAgdGhpcy5zZXRSdW5TdGF0ZSggUnVuU3RhdGUuUEFVU0VEICk7XG4gIH1cblxuICByZXN1bWUoKSB7XG4gICAgdGhpcy5zZXRSdW5TdGF0ZSggUnVuU3RhdGUuUlVOTklORyApO1xuICB9XG59XG4iLCJpbXBvcnQgeyBDb21wb25lbnRGYWN0b3J5fSBmcm9tICcuLi9ydW50aW1lL2NvbXBvbmVudC1mYWN0b3J5JztcbmltcG9ydCB7IEV2ZW50SHViIH0gZnJvbSAnLi4vZXZlbnQtaHViL2V2ZW50LWh1Yic7XG5cbmltcG9ydCB7IE5ldHdvcmsgfSBmcm9tICcuL25ldHdvcmsnO1xuaW1wb3J0IHsgTm9kZSB9IGZyb20gJy4vbm9kZSc7XG5pbXBvcnQgeyBMaW5rIH0gZnJvbSAnLi9saW5rJztcbmltcG9ydCB7IFBvcnQsIFB1YmxpY1BvcnQgfSBmcm9tICcuL3BvcnQnO1xuXG4vKipcbiAqIEEgR3JhcGggaXMgYSBjb2xsZWN0aW9uIG9mIE5vZGVzIGludGVyY29ubmVjdGVkIHZpYSBMaW5rcy5cbiAqIEEgR3JhcGggaXMgaXRzZWxmIGEgTm9kZSwgd2hvc2UgUG9ydHMgYWN0IGFzIHB1Ymxpc2hlZCBFbmRQb2ludHMsIHRvIHRoZSBHcmFwaC5cbiAqL1xuZXhwb3J0IGNsYXNzIEdyYXBoIGV4dGVuZHMgTm9kZVxue1xuICBzdGF0aWMgRVZFTlRfQUREX05PREUgPSAnZ3JhcGg6YWRkLW5vZGUnO1xuICBzdGF0aWMgRVZFTlRfVVBEX05PREUgPSAnZ3JhcGg6dXBkLW5vZGUnO1xuICBzdGF0aWMgRVZFTlRfREVMX05PREUgPSAnZ3JhcGg6ZGVsLW5vZGUnO1xuXG4gIHN0YXRpYyBFVkVOVF9BRERfTElOSyA9ICdncmFwaDphZGQtbGluayc7XG4gIHN0YXRpYyBFVkVOVF9VUERfTElOSyA9ICdncmFwaDp1cGQtbGluayc7XG4gIHN0YXRpYyBFVkVOVF9ERUxfTElOSyA9ICdncmFwaDpkZWwtbGluayc7XG5cbiAgLyoqXG4gICogTm9kZXMgaW4gdGhpcyBncmFwaC4gRWFjaCBub2RlIG1heSBiZTpcbiAgKiAgIDEuIEEgQ29tcG9uZW50XG4gICogICAyLiBBIHN1Yi1ncmFwaFxuICAqL1xuICBwcm90ZWN0ZWQgX25vZGVzOiBNYXA8c3RyaW5nLCBOb2RlPjtcblxuICAvLyBMaW5rcyBpbiB0aGlzIGdyYXBoLiBFYWNoIG5vZGUgbWF5IGJlOlxuICBwcm90ZWN0ZWQgX2xpbmtzOiBNYXA8c3RyaW5nLCBMaW5rPjtcblxuICAvLyBQdWJsaWMgUG9ydHMgaW4gdGhpcyBncmFwaC4gSW5oZXJpdGVkIGZyb20gTm9kZVxuICAvLyBwcml2YXRlIFBvcnRzO1xuICBjb25zdHJ1Y3Rvciggb3duZXI6IEdyYXBoLCBhdHRyaWJ1dGVzOiBhbnkgPSB7fSApXG4gIHtcbiAgICBzdXBlciggb3duZXIsIGF0dHJpYnV0ZXMgKTtcblxuICAgIHRoaXMuaW5pdEZyb21PYmplY3QoIGF0dHJpYnV0ZXMgKTtcbiAgfVxuXG4gIGluaXRGcm9tU3RyaW5nKCBqc29uU3RyaW5nOiBzdHJpbmcgKVxuICB7XG4gICAgdGhpcy5pbml0RnJvbU9iamVjdCggSlNPTi5wYXJzZSgganNvblN0cmluZyApICk7XG4gIH1cblxuICBpbml0RnJvbU9iamVjdCggYXR0cmlidXRlczogYW55ICkge1xuXG4gICAgdGhpcy5pZCA9IGF0dHJpYnV0ZXMuaWQgfHwgXCIkZ3JhcGhcIjtcblxuICAgIHRoaXMuX25vZGVzID0gbmV3IE1hcDxzdHJpbmcsIE5vZGU+KCk7XG4gICAgdGhpcy5fbGlua3MgPSBuZXcgTWFwPHN0cmluZywgTGluaz4oKTtcblxuICAgIE9iamVjdC5rZXlzKCBhdHRyaWJ1dGVzLm5vZGVzIHx8IHt9ICkuZm9yRWFjaCggKGlkKSA9PiB7XG4gICAgICB0aGlzLmFkZE5vZGUoIGlkLCBhdHRyaWJ1dGVzLm5vZGVzWyBpZCBdICk7XG4gICAgfSk7XG5cbiAgICBPYmplY3Qua2V5cyggYXR0cmlidXRlcy5saW5rcyB8fCB7fSApLmZvckVhY2goIChpZCkgPT4ge1xuICAgICAgdGhpcy5hZGRMaW5rKCBpZCwgYXR0cmlidXRlcy5saW5rc1sgaWQgXSApO1xuICAgIH0pO1xuICB9XG5cbiAgdG9PYmplY3QoIG9wdHM6IGFueSApOiBPYmplY3RcbiAge1xuICAgIHZhciBncmFwaCA9IHN1cGVyLnRvT2JqZWN0KCk7XG5cbiAgICBsZXQgbm9kZXMgPSBncmFwaFsgXCJub2Rlc1wiIF0gPSB7fTtcbiAgICB0aGlzLl9ub2Rlcy5mb3JFYWNoKCAoIG5vZGUsIGlkICkgPT4ge1xuLy8gICAgICBpZiAoIG5vZGUgIT0gdGhpcyApXG4gICAgICAgIG5vZGVzWyBpZCBdID0gbm9kZS50b09iamVjdCgpO1xuICAgIH0pO1xuXG4gICAgbGV0IGxpbmtzID0gZ3JhcGhbIFwibGlua3NcIiBdID0ge307XG4gICAgdGhpcy5fbGlua3MuZm9yRWFjaCggKCBsaW5rLCBpZCApID0+IHtcbiAgICAgIGxpbmtzWyBpZCBdID0gbGluay50b09iamVjdCgpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGdyYXBoO1xuICB9XG5cbiAgbG9hZENvbXBvbmVudCggZmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeSApOiBQcm9taXNlPHZvaWQ+XG4gIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGxldCBwZW5kaW5nQ291bnQgPSAwO1xuXG4gICAgICBsZXQgbm9kZXMgPSBuZXcgTWFwPHN0cmluZywgTm9kZT4oIHRoaXMuX25vZGVzICk7XG4gICAgICBub2Rlcy5zZXQoICckZ3JhcGgnLCB0aGlzICk7XG5cbiAgICAgIG5vZGVzLmZvckVhY2goICggbm9kZSwgaWQgKSA9PiB7XG4gICAgICAgIGxldCBkb25lOiBQcm9taXNlPHZvaWQ+O1xuXG4gICAgICAgIHBlbmRpbmdDb3VudCsrO1xuXG4gICAgICAgIGlmICggbm9kZSA9PSB0aGlzICkge1xuICAgICAgICAgIGRvbmUgPSBzdXBlci5sb2FkQ29tcG9uZW50KCBmYWN0b3J5ICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgZG9uZSA9IG5vZGUubG9hZENvbXBvbmVudCggZmFjdG9yeSApO1xuICAgICAgICB9XG5cbiAgICAgICAgZG9uZS50aGVuKCAoKSA9PiB7XG4gICAgICAgICAgLS1wZW5kaW5nQ291bnQ7XG4gICAgICAgICAgaWYgKCBwZW5kaW5nQ291bnQgPT0gMCApXG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCggKCByZWFzb24gKSA9PiB7XG4gICAgICAgICAgcmVqZWN0KCByZWFzb24gKTtcbiAgICAgICAgfSApO1xuICAgICAgfSApO1xuICAgIH0gKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgbm9kZXMoKTogTWFwPHN0cmluZywgTm9kZT5cbiAge1xuICAgIHJldHVybiB0aGlzLl9ub2RlcztcbiAgfVxuXG4vKiAgcHVibGljIGdldEFsbE5vZGVzKCk6IE5vZGVbXVxuICB7XG4gICAgbGV0IG5vZGVzOiBOb2RlW10gPSBbXTtcblxuICAgIHRoaXMuX25vZGVzLmZvckVhY2goICggbm9kZSwgaWQgKSA9PiB7XG4gICAgICAvLyBEb24ndCByZWN1cnNlIG9uIGdyYXBoJ3MgcHNldWRvLW5vZGVcbiAgICAgIGlmICggKCBub2RlICE9IHRoaXMgKSAmJiAoIG5vZGUgaW5zdGFuY2VvZiBHcmFwaCApIClcbiAgICAgICAgbm9kZXMgPSBub2Rlcy5jb25jYXQoIG5vZGUuZ2V0QWxsTm9kZXMoKSApO1xuXG4gICAgICBub2Rlcy5wdXNoKCBub2RlICk7XG4gICAgfSApO1xuXG4gICAgcmV0dXJuIG5vZGVzO1xuICB9Ki9cblxuICBwdWJsaWMgZ2V0IGxpbmtzKCk6IE1hcDxzdHJpbmcsIExpbms+XG4gIHtcbiAgICByZXR1cm4gdGhpcy5fbGlua3M7XG4gIH1cblxuLyogIHB1YmxpYyBnZXRBbGxMaW5rcygpOiBMaW5rW11cbiAge1xuICAgIGxldCBsaW5rczogTGlua1tdID0gW107XG5cbiAgICB0aGlzLl9ub2Rlcy5mb3JFYWNoKCAoIG5vZGUsIGlkICkgPT4ge1xuICAgICAgaWYgKCAoIG5vZGUgIT0gdGhpcyApICYmICggbm9kZSBpbnN0YW5jZW9mIEdyYXBoICkgKVxuICAgICAgICBsaW5rcyA9IGxpbmtzLmNvbmNhdCggbm9kZS5nZXRBbGxMaW5rcygpICk7XG4gICAgfSApXG5cbiAgICB0aGlzLl9saW5rcy5mb3JFYWNoKCAoIGxpbmssIGlkICkgPT4ge1xuICAgICAgbGlua3MucHVzaCggbGluayApO1xuICAgIH0gKTtcblxuICAgIHJldHVybiBsaW5rcztcbiAgfSovXG5cbi8qICBwdWJsaWMgZ2V0QWxsUG9ydHMoKTogUG9ydFtdXG4gIHtcbiAgICBsZXQgcG9ydHM6IFBvcnRbXSA9IHN1cGVyLmdldFBvcnRBcnJheSgpO1xuXG4gICAgdGhpcy5fbm9kZXMuZm9yRWFjaCggKCBub2RlLCBpZCApID0+IHtcbiAgICAgIGlmICggKCBub2RlICE9IHRoaXMgKSAmJiAoIG5vZGUgaW5zdGFuY2VvZiBHcmFwaCApIClcbiAgICAgICAgcG9ydHMgPSBwb3J0cy5jb25jYXQoIG5vZGUuZ2V0QWxsUG9ydHMoKSApO1xuICAgICAgZWxzZVxuICAgICAgICBwb3J0cyA9IHBvcnRzLmNvbmNhdCggbm9kZS5nZXRQb3J0QXJyYXkoKSApO1xuICAgIH0gKTtcblxuICAgIHJldHVybiBwb3J0cztcbiAgfSovXG5cbiAgcHVibGljIGdldE5vZGVCeUlEKCBpZDogc3RyaW5nICk6IE5vZGVcbiAge1xuICAgIGlmICggaWQgPT0gJyRncmFwaCcgKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICByZXR1cm4gdGhpcy5fbm9kZXMuZ2V0KCBpZCApO1xuICB9XG5cbiAgcHVibGljIGFkZE5vZGUoIGlkOiBzdHJpbmcsIGF0dHJpYnV0ZXM/OiB7fSApOiBOb2RlIHtcblxuICAgIGxldCBub2RlID0gbmV3IE5vZGUoIHRoaXMsIGF0dHJpYnV0ZXMgKTtcblxuICAgIG5vZGUuaWQgPSBpZDtcblxuICAgIHRoaXMuX25vZGVzLnNldCggaWQsIG5vZGUgKTtcblxuICAgIHRoaXMucHVibGlzaCggR3JhcGguRVZFTlRfQUREX05PREUsIHsgbm9kZTogbm9kZSB9ICk7XG5cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIHB1YmxpYyByZW5hbWVOb2RlKCBpZDogc3RyaW5nLCBuZXdJRDogc3RyaW5nICkge1xuXG4gICAgbGV0IG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXQoIGlkICk7XG5cbiAgICBpZiAoIGlkICE9IG5ld0lEIClcbiAgICB7XG4gICAgICBsZXQgZXZlbnREYXRhID0geyBub2RlOiBub2RlLCBhdHRyczogeyBpZDogbm9kZS5pZCB9IH07XG5cbiAgICAgIHRoaXMuX25vZGVzLmRlbGV0ZSggaWQgKTtcblxuICAgICAgbm9kZS5pZCA9IG5ld0lEO1xuXG4gICAgICB0aGlzLl9ub2Rlcy5zZXQoIG5ld0lELCBub2RlICk7XG5cbiAgICAgIHRoaXMucHVibGlzaCggR3JhcGguRVZFTlRfVVBEX05PREUsIGV2ZW50RGF0YSApO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyByZW1vdmVOb2RlKCBpZDogc3RyaW5nICk6IGJvb2xlYW4ge1xuXG4gICAgbGV0IG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXQoIGlkICk7XG4gICAgaWYgKCBub2RlIClcbiAgICAgIHRoaXMucHVibGlzaCggR3JhcGguRVZFTlRfREVMX05PREUsIHsgbm9kZTogbm9kZSB9ICk7XG5cbiAgICByZXR1cm4gdGhpcy5fbm9kZXMuZGVsZXRlKCBpZCApO1xuICB9XG5cbiAgcHVibGljIGdldExpbmtCeUlEKCBpZDogc3RyaW5nICk6IExpbmsge1xuXG4gICAgcmV0dXJuIHRoaXMuX2xpbmtzWyBpZCBdO1xuICB9XG5cbiAgcHVibGljIGFkZExpbmsoIGlkOiBzdHJpbmcsIGF0dHJpYnV0ZXM/OiB7fSApOiBMaW5rIHtcblxuICAgIGxldCBsaW5rID0gbmV3IExpbmsoIHRoaXMsIGF0dHJpYnV0ZXMgKTtcblxuICAgIGxpbmsuaWQgPSBpZDtcblxuICAgIHRoaXMuX2xpbmtzLnNldCggaWQsIGxpbmsgKTtcblxuICAgIHRoaXMucHVibGlzaCggR3JhcGguRVZFTlRfQUREX0xJTkssIHsgbGluazogbGluayB9ICk7XG5cbiAgICByZXR1cm4gbGluaztcbiAgfVxuXG4gIHB1YmxpYyByZW5hbWVMaW5rKCBpZDogc3RyaW5nLCBuZXdJRDogc3RyaW5nICkge1xuXG4gICAgbGV0IGxpbmsgPSB0aGlzLl9saW5rcy5nZXQoIGlkICk7XG5cbiAgICB0aGlzLl9saW5rcy5kZWxldGUoIGlkICk7XG5cbiAgICBsZXQgZXZlbnREYXRhID0geyBsaW5rOiBsaW5rLCBhdHRyczogeyBpZDogbGluay5pZCB9IH07XG5cbiAgICBsaW5rLmlkID0gbmV3SUQ7XG5cbiAgICB0aGlzLnB1Ymxpc2goIEdyYXBoLkVWRU5UX1VQRF9OT0RFLCBldmVudERhdGEgKTtcblxuICAgIHRoaXMuX2xpbmtzLnNldCggbmV3SUQsIGxpbmsgKTtcbiAgfVxuXG4gIHB1YmxpYyByZW1vdmVMaW5rKCBpZDogc3RyaW5nICk6IGJvb2xlYW4ge1xuXG4gICAgbGV0IGxpbmsgPSB0aGlzLl9saW5rcy5nZXQoIGlkICk7XG4gICAgaWYgKCBsaW5rIClcbiAgICAgIHRoaXMucHVibGlzaCggR3JhcGguRVZFTlRfREVMX0xJTkssIHsgbGluazogbGluayB9ICk7XG5cbiAgICByZXR1cm4gdGhpcy5fbGlua3MuZGVsZXRlKCBpZCApO1xuICB9XG5cbiAgcHVibGljIGFkZFB1YmxpY1BvcnQoIGlkOiBzdHJpbmcsIGF0dHJpYnV0ZXM6IHt9ICk6IFB1YmxpY1BvcnRcbiAge1xuICAgIGF0dHJpYnV0ZXNbXCJpZFwiXSA9IGlkO1xuXG4gICAgbGV0IHBvcnQgPSBuZXcgUHVibGljUG9ydCggdGhpcywgbnVsbCwgYXR0cmlidXRlcyApO1xuXG4gICAgdGhpcy5fcG9ydHMuc2V0KCBpZCwgcG9ydCApO1xuXG4gICAgcmV0dXJuIHBvcnQ7XG4gIH1cbn1cbiIsImltcG9ydCB7IE1vZHVsZUxvYWRlciB9IGZyb20gJy4vbW9kdWxlLWxvYWRlcic7XG5pbXBvcnQgeyBDb21wb25lbnRGYWN0b3J5IH0gZnJvbSAnLi9jb21wb25lbnQtZmFjdG9yeSc7XG5cbmltcG9ydCB7IENvbnRhaW5lciB9IGZyb20gJy4uL2RlcGVuZGVuY3ktaW5qZWN0aW9uL2NvbnRhaW5lcic7XG5cblxuZXhwb3J0IGNsYXNzIFNpbXVsYXRpb25FbmdpbmVcbntcbiAgbG9hZGVyOiBNb2R1bGVMb2FkZXI7XG4gIGNvbnRhaW5lcjogQ29udGFpbmVyO1xuXG4gIC8qKlxuICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgU2ltdWxhdGlvbkVuZ2luZS5cbiAgKiBAcGFyYW0gbG9hZGVyIFRoZSBtb2R1bGUgbG9hZGVyLlxuICAqIEBwYXJhbSBjb250YWluZXIgVGhlIHJvb3QgREkgY29udGFpbmVyIGZvciB0aGUgc2ltdWxhdGlvbi5cbiAgKi9cbiAgY29uc3RydWN0b3IoIGxvYWRlcjogTW9kdWxlTG9hZGVyLCBjb250YWluZXI6IENvbnRhaW5lciApIHtcbiAgICB0aGlzLmxvYWRlciA9IGxvYWRlcjtcbiAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgfVxuXG5cbiAgLyoqXG4gICogUmV0dXJuIGEgQ29tcG9uZW50RmFjdG9yeSBmYWNhZGVcbiAgKi9cbiAgZ2V0Q29tcG9uZW50RmFjdG9yeSgpOiBDb21wb25lbnRGYWN0b3J5IHtcbiAgICByZXR1cm4gbmV3IENvbXBvbmVudEZhY3RvcnkoIHRoaXMuY29udGFpbmVyLCB0aGlzLmxvYWRlciApO1xuICB9XG5cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
