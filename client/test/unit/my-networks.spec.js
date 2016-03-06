define(["require", "exports", '../../src/my-networks'], function (require, exports, my_networks_1) {
    "use strict";
    var HttpStub = (function () {
        function HttpStub() {
        }
        HttpStub.prototype.fetch = function (url) {
            var _this = this;
            return new Promise(function (resolve) {
                resolve({ json: function () { return _this.items; } });
            });
        };
        HttpStub.prototype.configure = function (func) { };
        return HttpStub;
    }());
    function createHttpStub() {
        return new HttpStub();
    }
    describe('the MyNetworks module', function () {
        it('sets fetch response to networks', function (done) {
            var http = createHttpStub(), sut = new my_networks_1.MyNetworks(http), itemStubs = [1], itemFake = [2];
            http.items = itemStubs;
            sut.fetchNetworks().then(function () {
                expect(sut.networks).toBe([itemStubs]);
                expect(sut.networks).not.toBe(itemFake);
                done();
            });
        });
    });
});
//# sourceMappingURL=my-networks.spec.js.map