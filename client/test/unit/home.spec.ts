import {Home} from '../../src/home';

describe('the Home module', () => {
  var sut;

  beforeEach(() => {
    sut = new Home();
  });

  it('sets the heading', () => {
    expect(sut.heading).toBe('Home'); 
  });

});

