import {Node} from '../libs/sim-core-master/dist/cryptographix-sim-core';

export class Zoomer {
  
  static zoomIn(nodeToZoom: Node, nodes: Node[], zoomLevel: number) {

    jsPlumb.setDraggable(nodeToZoom.id, false);
    var nodeElement = document.getElementById(nodeToZoom.id);
    nodeElement.style.width = (parseInt(nodeElement.style.width) * zoomLevel) + "px";
    nodeElement.style.height = (parseInt(nodeElement.style.height) * zoomLevel) + "px";
    // border radius is hardcoded becuase of strange issue where it is blank the first time
    nodeElement.style.borderRadius = (20 * zoomLevel) + "px";
    this.setFonts("componentName", zoomLevel);    

    var zoomedOldX = parseInt(nodeElement.style.left);
    var zoomedOldY = parseInt(nodeElement.style.top);
    var zoomedNewX = (screen.width / 2) - ((zoomLevel * 100) / 2);
    var zoomedNewY = (screen.height / 2) - ((zoomLevel * 100) / 1.5);
    var deltaX = zoomedNewX - zoomedOldX;
    var deltaY = zoomedNewY - zoomedOldY;

    jsPlumb.animate(nodeToZoom.id, { 
        "left": zoomedNewX, 
        "top": zoomedNewY, 
        "height": nodeElement.style.height, 
        "width": nodeElement.style.width 
      },{ 
        duration: "400" 
      },{ 
        step: function() {         
          jsPlumb.repaintEverything();
        }
    });

    var otherNodes = nodes.filter(function(node) {
        return node.id !== nodeToZoom.id;
    });

    for (var node of otherNodes) {
      jsPlumb.setDraggable(node.id, false);
      nodeElement = document.getElementById(node.id);
      nodeElement.style.width = (parseInt(nodeElement.style.width) * zoomLevel) + "px";
      nodeElement.style.height = (parseInt(nodeElement.style.height) * zoomLevel) + "px";
      nodeElement.style.borderRadius = (parseInt(nodeElement.style.borderRadius) * zoomLevel) + "px";

      var oldX = parseInt(nodeElement.style.left);
      var oldY = parseInt(nodeElement.style.top);
      var newX = oldX + deltaX + ((zoomLevel - 1) * (oldX - zoomedOldX));
      var newY = oldY + deltaY + ((zoomLevel - 1) * (oldY - zoomedOldY));

      jsPlumb.animate(node.id, { 
          "left": newX, 
          "top": newY, 
          "height": nodeElement.style.height, 
          "width": nodeElement.style.width 
        },{ 
          duration: "400" 
        },{ 
          step: function() {         
            jsPlumb.repaintEverything();
          }
      });
    }
  }

  static zoomOut(nodes: Node[]) {

    for (var node of nodes) {
      jsPlumb.setDraggable(node.id, true);
      var nodeElement = document.getElementById(node.id);
      nodeElement.style.width = "100px";
      nodeElement.style.height = "100px";
      nodeElement.style.borderRadius = "20px";
      this.setFonts("componentName", 1);    

      jsPlumb.animate(node.id, { "left": parseInt(node.metadata.view.x), "top": parseInt(node.metadata.view.y), "height": "100px", "width": "400px" }, { duration: "400" }, { 
        step:function() {         
          jsPlumb.repaintEverything();
        }
     });
    }

  }

  static setFonts(className: string, zoomFactor: number) {
    var componentLabels: any = document.getElementsByClassName(className);
    for (var label of componentLabels) {
      label.style.fontSize = (40 * zoomFactor) + "px";
      label.style.marginTop = (17 * zoomFactor) + "px";
    }
  }
}