import {MyNetworks} from '../../src/my-networks';
import {HttpClient} from 'aurelia-fetch-client';

class HttpStub {
  items: any[];
  
  fetch(url) {
    return new Promise(resolve => {
      resolve({ json: () => this.items });
    });
  }
  
  configure(func) { }
}

function createHttpStub(): any {
  return new HttpStub();
}

describe('the MyNetworks module', () => {

    it('sets fetch response to networks', (done) => {
        var http = createHttpStub(),
            sut = new MyNetworks(<HttpClient>http),
            itemStubs = [1],
            itemFake = [2];

        http.items = itemStubs;

        sut.fetchNetworks().then(() => {
            expect(sut.networks).toBe([itemStubs]);
            expect(sut.networks).not.toBe(itemFake);
            done();
        });
    });
  });