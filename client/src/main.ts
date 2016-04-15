import { Aurelia } from "aurelia-framework";
import "bootstrap";

export function configure(aurelia: Aurelia) {
  aurelia.use
    .standardConfiguration()
    .developmentLogging();

  aurelia.use.plugin("aurelia-animator-css");
  aurelia.use.plugin("aurelia-dialog");

  aurelia.start().then(a => a.setRoot());
}
