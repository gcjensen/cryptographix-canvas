var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define(["require", "exports", 'aurelia-framework'], function (require, exports, aurelia_framework_1) {
    var NetworkThumbnail = (function () {
        function NetworkThumbnail(taskQueue) {
            this.nodes = [];
            this.nodeStyle = "thumbnail";
            this.taskQueue = taskQueue;
        }
        NetworkThumbnail.prototype.attached = function () {
            var _this = this;
            if (this.nodes.length > 0)
                this.nodes = [];
            this.network.loadComponents().then(function () {
                _this.network.initialize();
                _this.network.graph.nodes.forEach(function (node) {
                    _this.nodes.push(node);
                });
                _this.taskQueue.queueMicroTask({
                    call: function () { return _this.configureDomElements(); }
                });
            });
        };
        NetworkThumbnail.prototype.configureDomElements = function () {
            var nodeElements = document.getElementsByClassName("node-thumbnail");
            for (var _i = 0, _a = nodeElements; _i < _a.length; _i++) {
                var nodeElement = _a[_i];
                nodeElement.style.width = "50px";
                nodeElement.style.height = "50px";
            }
        };
        NetworkThumbnail = __decorate([
            aurelia_framework_1.autoinject,
            aurelia_framework_1.customElement('network-thumbnail'),
            aurelia_framework_1.bindable('network'), 
            __metadata('design:paramtypes', [aurelia_framework_1.TaskQueue])
        ], NetworkThumbnail);
        return NetworkThumbnail;
    })();
    exports.NetworkThumbnail = NetworkThumbnail;
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5ldHdvcmstdGh1bWJuYWlsLnRzIl0sIm5hbWVzIjpbIk5ldHdvcmtUaHVtYm5haWwiLCJOZXR3b3JrVGh1bWJuYWlsLmNvbnN0cnVjdG9yIiwiTmV0d29ya1RodW1ibmFpbC5hdHRhY2hlZCIsIk5ldHdvcmtUaHVtYm5haWwuY29uZmlndXJlRG9tRWxlbWVudHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7SUFJQTtRQVVFQSwwQkFBWUEsU0FBb0JBO1lBSnhCQyxVQUFLQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUVYQSxjQUFTQSxHQUFHQSxXQUFXQSxDQUFDQTtZQUc5QkEsSUFBSUEsQ0FBQ0EsU0FBU0EsR0FBR0EsU0FBU0EsQ0FBQ0E7UUFDN0JBLENBQUNBO1FBRURELG1DQUFRQSxHQUFSQTtZQUFBRSxpQkFjQ0E7WUFaQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQUNBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLEVBQUVBLENBQUNBO1lBRTNDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxjQUFjQSxFQUFFQSxDQUFDQSxJQUFJQSxDQUFDQTtnQkFDakNBLEtBQUlBLENBQUNBLE9BQU9BLENBQUNBLFVBQVVBLEVBQUVBLENBQUNBO2dCQUMxQkEsS0FBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBQUEsSUFBSUE7b0JBQ25DQSxLQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFDeEJBLENBQUNBLENBQUNBLENBQUNBO2dCQUVIQSxLQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxjQUFjQSxDQUFDQTtvQkFDNUJBLElBQUlBLEVBQUVBLGNBQU1BLE9BQUFBLEtBQUlBLENBQUNBLG9CQUFvQkEsRUFBRUEsRUFBM0JBLENBQTJCQTtpQkFDeENBLENBQUNBLENBQUNBO1lBQ0xBLENBQUNBLENBQUNBLENBQUNBO1FBQ0xBLENBQUNBO1FBRURGLCtDQUFvQkEsR0FBcEJBO1lBQ0VHLElBQUlBLFlBQVlBLEdBQUdBLFFBQVFBLENBQUNBLHNCQUFzQkEsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxDQUFDQTtZQUNyRUEsR0FBR0EsQ0FBQ0EsQ0FBb0JBLFVBQXFCQSxFQUFyQkEsS0FBQ0EsWUFBb0JBLEVBQXhDQSxjQUFlQSxFQUFmQSxJQUF3Q0EsQ0FBQ0E7Z0JBQXpDQSxJQUFJQSxXQUFXQSxTQUFBQTtnQkFDbEJBLFdBQVdBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLEdBQUdBLE1BQU1BLENBQUNBO2dCQUNqQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsTUFBTUEsR0FBR0EsTUFBTUEsQ0FBQ0E7YUFDbkNBO1FBQ0hBLENBQUNBO1FBcENISDtZQUFDQSw4QkFBVUE7WUFDVkEsaUNBQWFBLENBQUNBLG1CQUFtQkEsQ0FBQ0E7WUFDbENBLDRCQUFRQSxDQUFDQSxTQUFTQSxDQUFDQTs7NkJBb0NuQkE7UUFBREEsdUJBQUNBO0lBQURBLENBdENBLEFBc0NDQSxJQUFBO0lBbkNZLHdCQUFnQixtQkFtQzVCLENBQUEiLCJmaWxlIjoibmV0d29yay10aHVtYm5haWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2F1dG9pbmplY3QsIGN1c3RvbUVsZW1lbnQsIGJpbmRhYmxlLCBUYXNrUXVldWV9IGZyb20gJ2F1cmVsaWEtZnJhbWV3b3JrJztcblxuaW1wb3J0IHtOZXR3b3JrLCBOb2RlfSBmcm9tICdjcnlwdG9ncmFwaGl4LXNpbS1jb3JlJztcblxuQGF1dG9pbmplY3RcbkBjdXN0b21FbGVtZW50KCduZXR3b3JrLXRodW1ibmFpbCcpXG5AYmluZGFibGUoJ25ldHdvcmsnKVxuZXhwb3J0IGNsYXNzIE5ldHdvcmtUaHVtYm5haWwge1xuICBcbiAgcHJpdmF0ZSBuZXR3b3JrOiBOZXR3b3JrO1xuICBwcml2YXRlIG5vZGVzID0gW107XG4gIHByaXZhdGUgdGFza1F1ZXVlOiBUYXNrUXVldWU7XG4gIHByaXZhdGUgbm9kZVN0eWxlID0gXCJ0aHVtYm5haWxcIjtcblxuICBjb25zdHJ1Y3Rvcih0YXNrUXVldWU6IFRhc2tRdWV1ZSkge1xuICAgIHRoaXMudGFza1F1ZXVlID0gdGFza1F1ZXVlOyAgXG4gIH1cblxuICBhdHRhY2hlZCgpIHtcbiAgICAvLyB3aGVuIHJldHVybmluZyBmcm9tIGNhbnZhcyBub2RlcyBhcnJheSBuZWVkcyB0byBiZSBlbXB0aWVkXG4gICAgaWYgKHRoaXMubm9kZXMubGVuZ3RoID4gMCkgdGhpcy5ub2RlcyA9IFtdO1xuICAgIC8vIHRoZSBuZXR3b3JrIG9iamVjdCBoYXMgYmVlbiBib3VuZCB0byBjYW52YXMgaW4gdGhlIHZpZXdcbiAgICB0aGlzLm5ldHdvcmsubG9hZENvbXBvbmVudHMoKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMubmV0d29yay5pbml0aWFsaXplKCk7XG4gICAgICB0aGlzLm5ldHdvcmsuZ3JhcGgubm9kZXMuZm9yRWFjaChub2RlID0+IHtcbiAgICAgICAgdGhpcy5ub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgfSk7XG4gICAgICAvLyBtaWNyb3Rhc2sgZW5zdXJlcyB0aGUgd29yayBpcyBub3QgZG9uZSB1bnRpbCBlYWNoIG5vZGUgaGFzIGF0dGFjaGVkIHRvIHRoZSB2aWV3XG4gICAgICB0aGlzLnRhc2tRdWV1ZS5xdWV1ZU1pY3JvVGFzayh7XG4gICAgICAgIGNhbGw6ICgpID0+IHRoaXMuY29uZmlndXJlRG9tRWxlbWVudHMoKVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBjb25maWd1cmVEb21FbGVtZW50cygpIHtcbiAgICBsZXQgbm9kZUVsZW1lbnRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIm5vZGUtdGh1bWJuYWlsXCIpO1xuICAgIGZvciAobGV0IG5vZGVFbGVtZW50IG9mIChub2RlRWxlbWVudHMgYXMgYW55KSkge1xuICAgICAgbm9kZUVsZW1lbnQuc3R5bGUud2lkdGggPSBcIjUwcHhcIjtcbiAgICAgIG5vZGVFbGVtZW50LnN0eWxlLmhlaWdodCA9IFwiNTBweFwiO1xuICAgIH1cbiAgfVxuXG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
