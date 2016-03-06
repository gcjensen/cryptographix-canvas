import {DialogController} from 'aurelia-dialog';
import {autoinject, TaskQueue} from 'aurelia-framework';
import {Network, Graph, Direction, ComponentFactory, Kind, Node} from 'cryptographix-sim-core';
import { ByteArrayEntry } from './bytearray-entry';
import { ByteArrayViewer } from './bytearray-viewer';
import { CryptoBox } from './crypto-box';

@autoinject
export class AddNodeDialog {

  controller: DialogController;
  components: {};
  nodes = [];
  nodeStyle = "palette";
  taskQueue: TaskQueue;
  componentName: string;
  selectedNode: Node;
  nodeID: string = "";

  constructor(controller: DialogController, taskQueue: TaskQueue) {
    this.controller = controller;
    this.taskQueue = taskQueue;
  }

  attached() {
    for (var node in nodes) {
      if (nodes.hasOwnProperty(node)) {
        var newNode = new Node(null, nodes[node]);
        this.nodes.push(newNode);
      }
    }
    this.taskQueue.queueMicroTask({
      call: () => this.configureDomElements()
    });
  }

  nodeSelected(node: Node) {
    // returns all the nodes back to normal so just one is then 'zoomed'
    for (var _node of this.nodes) {
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

  configureDomElements() {
    let nodeElements = document.getElementsByClassName("node-palette");
    // add the jquery listeners to animate the nodes on hover
    var self = this;
    // the casts to any are to remove TypeScript warnings about unknown methods
    ($(".node-palette") as any).mouseover(function() {
      if (self.selectedNode === undefined) {
        self.componentName = this.id;
        if (self.nodeID !== "")
          (document.getElementById("addButton") as any).disabled = false;
      }
    })
    .mouseleave(function() {
      if (self.selectedNode === undefined) {
        (document.getElementById("addButton") as any).disabled = true;
        self.componentName = "";
      }
    });

    // the user can only procede if they've their new node an id, so the add
    // button is only enabled if their is text in the 'id-input' field
    ($("#id-input") as any).keyup(function () {
      if (self.selectedNode !== undefined && self.nodeID !== "") {
        (document.getElementById("addButton") as any).disabled = false;
        if (self.selectedNode)
          self.selectedNode.id = self.nodeID;
      } else {
        (document.getElementById("addButton") as any).disabled = true;
      }
    });
  }
}

// the nodes/components in the palette the user can choose from
var nodes = {
  "bytearray-entry": {
    "id": "bytearray-entry",
    "component": "ByteArrayEntry",
    "metadata": { 
      "view": { "width": "200px", "height": "200px" },
      "icon": "pencil",
      "vm": "bytearray-entry"
    },
    "ports": {
      'out': { "direction": "OUT" },
    }
  },
  "crypto-box": {
    "id": "crypto-box",
    "component": "CryptoBox",
    "metadata": { 
      "view": { "width": "100px", "height": "100px" },
      "icon": "lock",
      "vm": "crypto-box"
    },
    "ports": {
      'plaintext': { "direction": "IN" },
      'ciphertext': { "direction": "OUT" },
      'key': { "direction": "IN" }
    }
  },
  "bytearray-viewer": {
    "id": "bytearray-viewer",
    "component": "ByteArrayViewer",
    "metadata": { 
      "view": { "width": "200px", "height": "200px" },
      "icon": "eye",
      "vm": "bytearray-viewer"
    },
    "ports": {
      'in': { "direction": "IN" },
    }
  }
}