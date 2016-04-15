import { bindable } from "aurelia-framework";
import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { EventAggregator } from "aurelia-event-aggregator";

@autoinject
export class NavBar {

  @bindable public router: Router = null;
  public username: string;
  // used to control whether "login" or "signup" are highlighting in nav
  public currentRoute: string;

  private subscription: any;
  private eventAggregator: EventAggregator;

  constructor(eventAggregator: EventAggregator) {
    this.eventAggregator = eventAggregator;
  }

  public attached(): void {
    this.subscription = this.eventAggregator.subscribe(
      "router:navigation:success",
      this.navigationSuccess.bind(this));

    // ensure the username is updated in the navbar
    this.subscription = this.eventAggregator.subscribe("router:navigation:success", value => {
      this.username = localStorage.getItem("username");
    });
  }

  public detached(): void {
    this.subscription.dispose();
  }

  get isAuthenticated(): boolean {
    return localStorage.getItem("jwt") !== null;
  }

  public logout(): void {
    localStorage.removeItem("jwt");
    this.router.navigate("/login");
  }

  /******************** Private Implementation ********************/

  private navigationSuccess(event): void {
    this.currentRoute = event.instruction.fragment;
  }
}
