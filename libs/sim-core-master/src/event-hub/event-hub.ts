import { EventAggregator, Subscription, Handler as EventHandler } from 'aurelia-event-aggregator';

//export { EventHandler };

export class EventHub
{
  _eventAggregator: EventAggregator;

  constructor( )
  {
    this._eventAggregator = new EventAggregator();
  }

  public publish( event: string, data?: any )
  {
    this._eventAggregator.publish( event, data );
  }

  public subscribe( event: string, handler: Function ): Subscription
  {
    return this._eventAggregator.subscribe( event, handler );
  }

  public subscribeOnce( event: string, handler: Function ): Subscription
  {
    return this._eventAggregator.subscribeOnce( event, handler );
  }
}

/*function eventHub(): any {
  return function eventHub<TFunction extends Function, EventHub>(target: TFunction): TFunction {

    target.prototype.subscribe = newConstructor.prototype = Object.create(target.prototype);
    newConstructor.prototype.constructor = target;

    return <any> newConstructor;
  }
}

@eventHub()
class MyClass {};
*/
