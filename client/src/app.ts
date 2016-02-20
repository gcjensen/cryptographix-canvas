import {Router, RouterConfiguration} from 'aurelia-router'

export class App {
  router: Router;
  
  configureRouter(config: RouterConfiguration, router: Router) {
    config.title = 'comp3200';
    config.map([
      { 
        route: ['', 'home'],    
        name: 'home',         
        moduleId: 'home',    
        nav: true, title: 'Home',    
        settings: 'home'
      },
      { 
        route: ['my-networks'], 
        name: 'my-networks', 
        moduleId: 'my-networks', 
        nav: true, 
        title: 'My Networks', 
        settings: 'share-alt'},
    ]);

    this.router = router;
  }
}
