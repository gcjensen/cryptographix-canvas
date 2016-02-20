define(["require", "exports", '../../src/link-config-dialog', 'aurelia-dialog'], function (require, exports, link_config_dialog_1, aurelia_dialog_1) {
    describe('the LinkConfigDialog module', function () {
        var sut;
        beforeEach(function () {
            sut = new link_config_dialog_1.LinkConfigDialog(new aurelia_dialog_1.DialogController());
        });
        it('contains a dialog controller property', function () {
            expect(sut.controller).toBeDefined();
        });
    });
});
//# sourceMappingURL=link-config-dialog.spec.js.map