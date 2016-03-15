import {Router, NavigationInstruction, Redirect, RouterConfiguration} from 'aurelia-router';

export class App {
  router: Router;
 
  configureRouter(config: RouterConfiguration, router: Router) {
    config.title = 'comp3200';
    config.addPipelineStep('authorize', AuthorizeStep);

    config.map([
      {
        route: ['', 'login'],
        name: 'login',
        moduleId: 'login',
        nav: false,
        title: 'Login',
        settings: 'home',
      },
      {
        route: ['signup'],
        name: 'signup',
        moduleId: 'signup',
        nav: false,
        title: 'Sign up',
        settings: 'home',
      },
      {
        route: ['my-networks'],
        name: 'my-networks',
        moduleId: 'my-networks',
        nav: true,
        title: 'My Networks',
        settings: 'share-alt',
        auth: true,
      },
    ]);

    this.router = router;
  }
}

class AuthorizeStep {
  run(navigationInstruction: NavigationInstruction, next: Function): Promise<any> {
    if (navigationInstruction.getAllInstructions().some(i => (i.config as any).auth)) {
      var isLoggedIn = localStorage.getItem("jwt") !== null;
      if (!isLoggedIn) {
        return (next as any).cancel(new Redirect('login'));
      }
    }

    return next();
  }
}
