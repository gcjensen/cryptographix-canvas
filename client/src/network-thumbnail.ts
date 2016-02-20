import {autoinject, customElement, bindable, TaskQueue} from 'aurelia-framework';

import {Network, Node} from 'cryptographix-sim-core';

@autoinject
@customElement('network-thumbnail')
@bindable('network')
export class NetworkThumbnail {
  
  private network: Network;
  private nodes = [];
  private taskQueue: TaskQueue;
  private nodeStyle = "thumbnail";

  constructor(taskQueue: TaskQueue) {
    this.taskQueue = taskQueue;  
  }

  attached() {
    // when returning from canvas nodes array needs to be emptied
    if (this.nodes.length > 0) this.nodes = [];
    // the network object has been bound to canvas in the view
    this.network.loadComponents().then(() => {
      this.network.initialize();
      this.network.graph.nodes.forEach(node => {
        this.nodes.push(node);
      });
      // microtask ensures the work is not done until each node has attached to the view
      this.taskQueue.queueMicroTask({
        call: () => this.configureDomElements()
      });
    });
  }

  configureDomElements() {
    let nodeElements = document.getElementsByClassName("node-thumbnail");
    for (let nodeElement of (nodeElements as any)) {
      nodeElement.style.width = "50px";
      nodeElement.style.height = "50px";
    }
  }

}