define(["require", "exports", '../../src/app'], function (require, exports, app_1) {
    var RouterStub = (function () {
        function RouterStub() {
        }
        RouterStub.prototype.configure = function (handler) {
            handler(this);
        };
        RouterStub.prototype.map = function (routes) {
            this.routes = routes;
        };
        return RouterStub;
    })();
    describe('the App module', function () {
        var sut, mockedRouter;
        beforeEach(function () {
            mockedRouter = new RouterStub();
            sut = new app_1.App();
            sut.configureRouter(mockedRouter, mockedRouter);
        });
        it('contains a router property', function () {
            expect(sut.router).toBeDefined();
        });
        it('configures the router title', function () {
            expect(sut.router.title).toEqual('comp3200');
        });
        it('should have a home route', function () {
            expect(sut.router.routes).toContain({ route: ['', 'home'], name: 'home', moduleId: 'home', nav: true, title: 'Home', settings: 'home' });
        });
        it('should have a builder route', function () {
            expect(sut.router.routes).toContain({ route: 'builder', name: 'builder', moduleId: 'builder', nav: true, title: 'Builder', settings: 'wrench' });
        });
    });
});
//# sourceMappingURL=app.spec.js.map