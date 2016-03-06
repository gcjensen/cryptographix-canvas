export class Home {
  heading = 'Home'; 

  attached() {
    document.getElementById('page-title').style.marginTop = ((screen.height / 3) - 100) + "px";
  }

}
