import {Home} from 'src/home';

describe('the Home module', () => {
  var sut, mockedRouter;

  beforeEach(() => {
    sut = new Home();
  });

  it('sets the heading', (done) => {
    expect(sut.heading).toBe('Home'); 
  });

});

