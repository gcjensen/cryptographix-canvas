import { Channel, EndPoint, Message, Direction } from 'cryptographix-sim-core';

class IntegerMessage extends Message<number>
{
  constructor( value: number )
  {
    super( undefined, value );
  }
}

describe('A Channel', function() {
  describe('can be active or inactive', function() {
    let ch = new Channel();

    it('is initially inactive', function() {
      expect( ch.active ).toBe( false );
    });

    it('can be activated', function() {
      expect( ch.active ).toBe( false );
      ch.activate();
      expect( ch.active ).toBe( true );
      ch.activate();
      expect( ch.active ).toBe( true );
    });

    it('can be deactivated', function() {
      expect( ch.active ).toBe( true );
      ch.deactivate();
      expect( ch.active ).toBe( false );
      ch.deactivate();
      expect( ch.active ).toBe( false );
    });
  });

  describe('has a registry of EndPoints', function() {
    let ch = new Channel();
    var ep1 = new EndPoint('ep1');
    var ep2 = new EndPoint('ep2');

    it( 'to which EndPoints can be added', function() {
      // add an EndPoint
      ch.addEndPoint( ep1 );
      expect( ch.endPoints.length ).toBe( 1 );

      // add another
      ch.addEndPoint( ep2 );
      expect( ch.endPoints.length ).toBe( 2 );
    });

    it( '... and removed',  function() {
      // remove first EndPoint
      ch.removeEndPoint( ep1 );
      expect( ch.endPoints ).toContain( ep2 );

      ch.removeEndPoint( ep2 );
      expect( ch.endPoints.length ).toBe( 0 );
    });

    it( '... even when Channel is activated', function() {
      ch.activate();
      expect( ch.active ).toBe( true );

      ch.addEndPoint( new EndPoint('epx') );
      ch.addEndPoint( new EndPoint('epx') );

      ch.addEndPoint( ep1 );
      expect( ch.endPoints ).toContain( ep1 );
      expect( ch.endPoints.length ).toBe( 3 );

      ch.removeEndPoint( ep1 );
      expect( ch.endPoints ).not.toContain( ep1 );

      ch.shutdown();
      expect( ch.endPoints.length ).toBe( 0 );
    });

  });

  describe('communicates between INOUT endpoints', function() {
    let ch = new Channel();
    var ep1 = new EndPoint( 'ep1', Direction.INOUT );
    var ep2 = new EndPoint( 'ep2', Direction.INOUT );

    ep1.attach( ch );
    ep2.attach( ch );
    ch.activate();

    it( 'can send messages from 1(IO) to 2(IO)', function( done ) {
      ep2.onMessage( (m: Message<any> ) => { expect( m ).toBeDefined(); done(); } );
      ep1.sendMessage( new IntegerMessage(101) );
    } );

    it( 'can send messages from 2(IO) to 1(IO)', (done) => {
      ep1.onMessage( (m: Message<any> ) => { expect( m ).toBeDefined(); done(); } );
      ep2.sendMessage( new IntegerMessage(102) );
    } );

    it( 'can send messages from 1(IO) to 2(IO) and back to 1(IO)', (done) => {
      ep2.onMessage( (m: Message<any>, ep: EndPoint ) => { ep2.sendMessage( m ); } );
      ep1.sendMessage( new IntegerMessage(100) );
      ep1.onMessage( (m: Message<any>) => { expect( m ).toBeDefined(); done() } );
    } );

  });

  describe('communicates from OUT to IN', function() {
    let ch = new Channel();
    var ep1 = new EndPoint( 'ep1', Direction.OUT );
    var ep2 = new EndPoint( 'ep2', Direction.IN );

    ep1.attach( ch );
    ep2.attach( ch );
    ch.activate();

    it( 'can send messages from (OUT) to (IN)', (done) => {
      ep2.onMessage( (m: Message<any> ) => { expect( m ).toBeDefined(); done(); } );
      ep1.sendMessage( new IntegerMessage(101) );
    } );

    it( 'cannot send messages from (IN) to (OUT)', function() {
      expect( () => { ep2.sendMessage( new IntegerMessage(102) ) } ).toThrow();
    } );

    it( 'can reply, messages from (OUT) to (IN) and respond to (OUT)', (done) => {
      ep2.onMessage( (m: Message<any>, ep: EndPoint ) => { m.header.isResponse = true; ep2.sendMessage( m ); } );
      ep1.sendMessage( new IntegerMessage(100) );
      ep1.onMessage( (m: Message<any>) => { expect( m ).toBeDefined(); done() } );
    } );

  });

  describe('can distribute to multiple endpoints', function() {
    let ch = new Channel();
    var ep1 = new EndPoint( 'ep1', Direction.OUT );
    var ep2 = new EndPoint( 'ep2', Direction.IN );
    var ep3 = new EndPoint( 'ep3', Direction.IN );

    ep1.attach( ch );
    ep2.attach( ch );
    ep3.attach( ch );
    ch.activate();

    it( 'can send messages from 1 to 2', (done) => {
      var rcv = 0;
      ep2.onMessage( (m: Message<any> ) => { expect( m ).toBeDefined(); if ( ++rcv == 2) done(); } );
      ep3.onMessage( (m: Message<any> ) => { expect( m ).toBeDefined(); if ( ++rcv == 2) done(); } );
      ep1.sendMessage( new IntegerMessage(120) );
    } );
  });


})
