import { Router, NavigationInstruction, Redirect, RouterConfiguration } from "aurelia-router";

export class App {
  private router: Router;

  public configureRouter(config: RouterConfiguration, router: Router) {
    config.title = "CryptoGraphix Canvas";
    config.addPipelineStep("authorize", AuthorizeStep);

    config.map([
      {
        moduleId: "login",
        name: "login",
        nav: false,
        route: ["", "login"],
        settings: "sign-in",
        title: "Login",
      },
      {
        moduleId: "signup",
        name: "signup",
        nav: false,
        route: ["signup"],
        settings: "user-plus",
        title: "Sign up",
      },
      {
        auth: true,
        moduleId: "my-networks",
        name: "my-networks",
        nav: true,
        route: ["my-networks"],
        settings: "share-alt",
        title: "My Networks",
      },
    ]);

    this.router = router;
  }
}

class AuthorizeStep {
  public run(navigationInstruction: NavigationInstruction, next: Function): Promise<any> {
    if (navigationInstruction.getAllInstructions().some(i => (i.config as any).auth)) {
      let isLoggedIn = localStorage.getItem("jwt") !== null;
      if (!isLoggedIn) {
        return (next as any).cancel(new Redirect("login"));
      }
    }

    return next();
  }
}
