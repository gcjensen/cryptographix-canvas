import {autoinject} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import 'fetch';
import {Router} from 'aurelia-router';

@autoinject
export class Signup {

  username: string;
  password: string;
  router: Router;

  attached() {
    // dont' allow access to signup screen if user is already logged in
    if (localStorage.getItem("jwt") !== null)
      this.router.navigate("/my-networks");
  }

  constructor(private http: HttpClient, router: Router) {
    http.configure(config => {
      config
        .useStandardConfiguration()
        .withBaseUrl('http://localhost:8080/api/');
    });
    
    this.http = http;
    this.router = router;
  }

  signup() {
    var user = {
      "username": this.username,
      "password": this.password
    }
    this.http.fetch('signup', {
      method: 'post',
      body: json(user)
    }).then(response => response.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem("jwt", data.token);
          localStorage.setItem("username", data.username);
          this.router.navigate("/my-networks");
        }
      });
  }

}
