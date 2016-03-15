import {autoinject} from 'aurelia-framework';
import {HttpClient, json} from 'aurelia-fetch-client';
import 'fetch';
import {Router} from 'aurelia-router';

@autoinject
export class Login {
 
  username: string;  password: string;
  router: Router;

  constructor(private http: HttpClient, router: Router) {
    http.configure(config => {
      config
        .useStandardConfiguration()
        .withBaseUrl('http://localhost:8080/api/');
    });
    
    this.http = http;
    this.router = router;
  }

  login() {
    var user = {
      "username": this.username,
      "password": this.password
    }
    this.http.fetch('login', {
      method: 'post',
      body: json(user)
    }).then(response => response.json())
      .then(data => {
        console.log(data);
        if (data.success) {
          localStorage.setItem("jwt", data.token);
          localStorage.setItem("username", data.username);
          this.router.navigate("/my-networks");
        }
      });
  }


}
