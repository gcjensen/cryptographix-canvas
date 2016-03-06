import 'bootstrap';
import {Aurelia} from 'aurelia-framework';

export function configure(aurelia: Aurelia) {
  aurelia.use
    .standardConfiguration()
    .developmentLogging();

  aurelia.use.plugin('aurelia-animator-css');
  aurelia.use.plugin('aurelia-dialog');

  aurelia.start().then(a => a.setRoot());
}
