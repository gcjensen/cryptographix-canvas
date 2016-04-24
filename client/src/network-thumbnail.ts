import { autoinject, customElement, bindable, TaskQueue } from "aurelia-framework";
import { Network, Node } from "cryptographix-sim-core";
import { MyNetworks } from "./my-networks";

@autoinject
@customElement("network-thumbnail")
@bindable("network")
@bindable("container")
export class NetworkThumbnail {

  public network: Network;
  public nodes: Array<Node> = [];
  public nodeStyle: string = "thumbnail";

  private container: MyNetworks;
  private taskQueue: TaskQueue;

  constructor(taskQueue: TaskQueue) {
    this.taskQueue = taskQueue;
  }

  public attached(): void {
    // when returning from canvas, nodes array needs to be emptied
    if (this.nodes.length > 0) {
      this.nodes = [];
    }
    // the network object has been bound to canvas in the view
    this.network.loadComponents().then(() => {
      this.network.graph.nodes.forEach(node => {
        this.nodes.push(node);
      });
    });

    this.addAnimationListeners();
  }

  public delete(): void {
    this.container.deleteNetwork(this.network);
  }

  public load(): void {
    this.container.loadNetwork(this.network);
  }

  /******************** Private Implementation ********************/

  private addAnimationListeners(): void {
    // the casts to any are to remove TypeScript warnings about unknown methods
    ($(".network-thumbnail") as any).mouseenter(function(){
        ($(this) as any).addClass("hover");
    })
    .mouseleave(function(){
        ($(this) as any).removeClass("hover");
    })
    .mousedown(function(){
        ($(this) as any).removeClass("hover");
    });
  }
}
