export class Home {
  heading = 'Home'; 

  attached() {
    // offset according to the width and height of the text
    document.getElementById('page-title').style.marginLeft = "-120px";
    document.getElementById('page-title').style.marginTop = "-40px";
  }

}
