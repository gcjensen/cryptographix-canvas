import {LinkConfigDialog} from '../../src/link-config-dialog';
import {DialogController} from 'aurelia-dialog';

describe('the LinkConfigDialog module', () => {
  var sut;

  beforeEach(() => {
    sut = new LinkConfigDialog(new DialogController());
  });

  it('contains a dialog controller property', () => {
    expect(sut.controller).toBeDefined();
  });

});
