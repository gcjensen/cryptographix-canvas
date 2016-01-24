import { Container, inject } from 'cryptographix-sim-core';

class C1
{

}

@inject()
class C2
{
  constructor( public c1: C1 ) {

  }
}

describe("A DI Container", function() {
  it( "injects into the class constructor", () => {
    let jector = new Container();

    let c2 = jector.invoke( C2 );
    expect( c2.c1 instanceof C1 ).toBe( true );

  });
});
