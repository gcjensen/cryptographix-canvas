import {Router, RouterConfiguration} from 'aurelia-router'

export class App {
  router: Router;
  
  configureRouter(config: RouterConfiguration, router: Router) {
    config.title = 'comp3200';
    config.map([
      { route: ['', 'home'], name: 'home',    moduleId: 'home',    nav: true, title: 'Home',    settings: 'home'},
      { route: 'builder',    name: 'builder', moduleId: 'builder', nav: true, title: 'Builder', settings: 'wrench'},
    ]);

    this.router = router;
  }
}
