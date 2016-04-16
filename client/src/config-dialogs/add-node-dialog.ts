import { DialogController } from "aurelia-dialog";
import { autoinject, TaskQueue } from "aurelia-framework";
import { HttpClient } from "aurelia-fetch-client";
import { Node } from "cryptographix-sim-core";
import "fetch";

@autoinject
export class AddNodeDialog {

  public nodes: Array<Node> = [];
  public nodeStyle: string = "palette";
  public componentName: string;
  public selectedNode: Node;
  public nodeID: string = "";

  private takenNames: Array<string> = [];
  private taskQueue: TaskQueue;
  private controller: DialogController;

  constructor(private http: HttpClient, controller: DialogController, taskQueue: TaskQueue) {
    http.configure(config => {
      config
        .useStandardConfiguration()
        .withBaseUrl("http://localhost:8080/api/")
        .withDefaults({
          headers: {
            "authorization": localStorage.getItem("jwt")
          }
        });
    });
    this.http = http;
    this.controller = controller;
    this.taskQueue = taskQueue;
    this.fetchComponents();
  }

  public activate(takenName: Array<string>): void {
    this.takenNames = takenName;
  }

  public nodeSelected(node: Node): void {
    // returns all the nodes back to normal so just one is then "zoomed"
    for (let _node of this.nodes) {
      ($("#" + _node.id) as any).css({
        "transform": "scale(1)"
      });
    }

    ($("#" + node.id) as any).css({
      "transform": "scale(1.3)"
    });

    this.componentName = node.id;
    this.selectedNode = new Node(null, node.toObject());
    this.selectedNode.id = this.nodeID;
  }

  /******************** Private Implementation ********************/

  private fetchComponents(): void {
    this.http.fetch("getComponents", {
        method: "get"
    }).then(response => response.json())
      .then(data => {
        for (let component in data) {
          if (data.hasOwnProperty(component)) {
            let newNode = new Node(null, data[component]);
            this.nodes.push(newNode);
          }
        }
        this.taskQueue.queueMicroTask({
          call: () => this.configureDomElements()
        });
      });
  }

  private configureDomElements(): void {
    // add the jquery listeners to animate the nodes on hover
    let self = this;
    // the casts to any are to remove TypeScript warnings about unknown methods
    ($(".node-palette") as any).mouseover(function() {
      if (self.selectedNode === undefined) {
        self.componentName = this.id;
        if (self.nodeID !== "" && self.takenNames.indexOf(self.nodeID) === -1) {
          (document.getElementById("addButton") as any).disabled = false;
        }
      }
    })
    .mouseleave(function() {
      if (self.selectedNode === undefined) {
        (document.getElementById("addButton") as any).disabled = true;
        self.componentName = "";
      }
    });

    // the user can only procede if they"ve their new node an id, so the add
    // button is only enabled if there is text in the "id-input" field
    ($("#id-input") as any).keyup(function () {
      if (self.selectedNode !== undefined && self.nodeID !== "" && self.takenNames.indexOf(self.nodeID) === -1) {
        (document.getElementById("addButton") as any).disabled = false;
        if (self.selectedNode) {
          self.selectedNode.id = self.nodeID;
        }
      } else {
        (document.getElementById("addButton") as any).disabled = true;
      }
    });
  }
}
