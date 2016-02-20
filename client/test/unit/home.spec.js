define(["require", "exports", '../../src/home'], function (require, exports, home_1) {
    describe('the Home module', function () {
        var sut;
        beforeEach(function () {
            sut = new home_1.Home();
        });
        it('sets the heading', function () {
            expect(sut.heading).toBe('Home');
        });
    });
});
//# sourceMappingURL=home.spec.js.map