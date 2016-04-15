import { autoinject } from "aurelia-framework";
import { HttpClient, json } from "aurelia-fetch-client";
import { Router } from "aurelia-router";
import "fetch";

@autoinject
export class Signup {

  private username: string;
  private password: string;
  private router: Router;

  constructor(private http: HttpClient, router: Router) {
    http.configure(config => {
      config
        .useStandardConfiguration()
        .withBaseUrl("http://localhost:8080/api/");
    });
    this.http = http;
    this.router = router;
  }

  public attached(): void {
    // don't allow access to signup screen if user is already logged in
    if (localStorage.getItem("jwt") !== null) {
      this.router.navigate("/my-networks");
    }
  }

  public signup(): void {
    let user = {
      "username": this.username,
      "password": this.password
    };
    this.http.fetch("signup", {
      body: json(user),
      method: "post"
    }).then(response => response.json())
      .then(data => {
        if (data.success) {
          this.setLocalStorage(data);
          this.router.navigate("/my-networks");
        }
      });
  }

  /******************** Private Implementation ********************/

  private setLocalStorage(data: any) {
    localStorage.setItem("jwt", data.token);
    localStorage.setItem("username", data.username);
  }
}
