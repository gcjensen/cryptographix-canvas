import { Container, autoinject as inject } from 'aurelia-dependency-injection';
import { metadata } from 'aurelia-metadata';

export { Container, inject };
export interface Injectable {
  new( ...args ): Object;
}
