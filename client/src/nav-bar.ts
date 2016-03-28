import {bindable} from 'aurelia-framework';
import {autoinject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';


@autoinject
export class NavBar {

  @bindable router: Router = null;
  subscription: any;
  eventAggregator: EventAggregator;
  username: string;

  // used to control whether 'login' or 'signup' are highlighting in nav
  currentRoute: string;

  constructor(eventAggregator: EventAggregator) {
    this.eventAggregator = eventAggregator;
  }

  navigationSuccess(event) {
    this.currentRoute = event.instruction.fragment;
  }

  attached() {
    this.subscription = this.eventAggregator.subscribe(
      'router:navigation:success',
      this.navigationSuccess.bind(this));

    this.subscription = this.eventAggregator.subscribe('router:navigation:success', value => {
      this.username = localStorage.getItem("username");
    });

  }

  detached() {
    this.subscription.dispose();
  }

  get isAuthenticated() {
    return localStorage.getItem('jwt') !== null;
  }

  logout() {
    localStorage.removeItem('jwt');
    this.router.navigate("/login");
  }
}