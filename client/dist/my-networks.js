var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define(["require", "exports", 'aurelia-framework', 'aurelia-fetch-client', 'cryptographix-sim-core', 'fetch'], function (require, exports, aurelia_framework_1, aurelia_fetch_client_1, cryptographix_sim_core_1) {
    var MyNetworks = (function () {
        function MyNetworks(http) {
            this.http = http;
            this.networks = [];
            http.configure(function (config) {
                config
                    .useStandardConfiguration()
                    .withBaseUrl('http://localhost:8080/api/');
            });
            this.components = {
                "A": A,
                "B": B,
                "C": C,
                "D": D
            };
            this.http = http;
            this.fetchNetworks();
            this.label = "My Networks";
        }
        MyNetworks.prototype.fetchNetworks = function () {
            var _this = this;
            this.http.fetch('getNetworks', {
                method: 'get'
            }).then(function (response) { return response.json(); })
                .then(function (data) {
                for (var _i = 0; _i < data.length; _i++) {
                    var network = data[_i];
                    _this.configureNetwork(network);
                }
            });
        };
        MyNetworks.prototype.configureNetwork = function (network) {
            var _this = this;
            var graph = new cryptographix_sim_core_1.Graph(null, network.graph);
            var factory = new cryptographix_sim_core_1.ComponentFactory();
            graph.nodes.forEach(function (node) { _this.configureNode(node, factory, network.graph); });
            this.networks.push(new cryptographix_sim_core_1.Network(factory, graph));
        };
        MyNetworks.prototype.loadNetwork = function (network) {
            this.network = network;
            this.label = this.network.graph.id;
            this.graphSelected = true;
        };
        MyNetworks.prototype.back = function () {
            this.graphSelected = false;
            this.label = "My Networks";
        };
        MyNetworks.prototype.save = function () {
            this.http.fetch('updateNetwork', {
                method: 'post',
                body: aurelia_fetch_client_1.json(this.network.graph.toObject({}))
            }).then(function (response) { return response.json(); })
                .then(function (data) {
                console.log(data);
            });
        };
        MyNetworks.prototype.configureNode = function (node, factory, graph) {
            factory.register(node.toObject().component, this.components[node.toObject().component]);
            node.metadata["view"] = {
                x: graph.nodes[node.id].metadata.view.x,
                y: graph.nodes[node.id].metadata.view.y,
                width: graph.nodes[node.id].metadata.view.width,
                height: graph.nodes[node.id].metadata.view.height
            };
        };
        MyNetworks.prototype.printGraphObject = function () {
            console.log(this.network.graph.toObject({}));
        };
        MyNetworks = __decorate([
            aurelia_framework_1.autoinject, 
            __metadata('design:paramtypes', [aurelia_fetch_client_1.HttpClient])
        ], MyNetworks);
        return MyNetworks;
    })();
    exports.MyNetworks = MyNetworks;
    var A = (function () {
        function A() {
        }
        return A;
    })();
    var B = (function () {
        function B() {
        }
        return B;
    })();
    var C = (function () {
        function C() {
        }
        return C;
    })();
    var D = (function () {
        function D() {
        }
        return D;
    })();
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm15LW5ldHdvcmtzLnRzIl0sIm5hbWVzIjpbIk15TmV0d29ya3MiLCJNeU5ldHdvcmtzLmNvbnN0cnVjdG9yIiwiTXlOZXR3b3Jrcy5mZXRjaE5ldHdvcmtzIiwiTXlOZXR3b3Jrcy5jb25maWd1cmVOZXR3b3JrIiwiTXlOZXR3b3Jrcy5sb2FkTmV0d29yayIsIk15TmV0d29ya3MuYmFjayIsIk15TmV0d29ya3Muc2F2ZSIsIk15TmV0d29ya3MuY29uZmlndXJlTm9kZSIsIk15TmV0d29ya3MucHJpbnRHcmFwaE9iamVjdCIsIkEiLCJBLmNvbnN0cnVjdG9yIiwiQiIsIkIuY29uc3RydWN0b3IiLCJDIiwiQy5jb25zdHJ1Y3RvciIsIkQiLCJELmNvbnN0cnVjdG9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0lBS0E7UUFVRUEsb0JBQW9CQSxJQUFnQkE7WUFBaEJDLFNBQUlBLEdBQUpBLElBQUlBLENBQVlBO1lBTDVCQSxhQUFRQSxHQUFHQSxFQUFFQSxDQUFDQTtZQU1wQkEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsVUFBQUEsTUFBTUE7Z0JBQ25CQSxNQUFNQTtxQkFDSEEsd0JBQXdCQSxFQUFFQTtxQkFDMUJBLFdBQVdBLENBQUNBLDRCQUE0QkEsQ0FBQ0EsQ0FBQ0E7WUFDL0NBLENBQUNBLENBQUNBLENBQUNBO1lBRUhBLElBQUlBLENBQUNBLFVBQVVBLEdBQUdBO2dCQUNoQkEsR0FBR0EsRUFBRUEsQ0FBQ0E7Z0JBQ05BLEdBQUdBLEVBQUVBLENBQUNBO2dCQUNOQSxHQUFHQSxFQUFFQSxDQUFDQTtnQkFDTkEsR0FBR0EsRUFBRUEsQ0FBQ0E7YUFDUEEsQ0FBQUE7WUFFREEsSUFBSUEsQ0FBQ0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7WUFDakJBLElBQUlBLENBQUNBLGFBQWFBLEVBQUVBLENBQUNBO1lBQ3JCQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxhQUFhQSxDQUFDQTtRQUM3QkEsQ0FBQ0E7UUFFREQsa0NBQWFBLEdBQWJBO1lBQUFF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LElBQUE7SUFDVjtRQUFBRTtRQUFTQyxDQUFDQTtRQUFERCxRQUFDQTtJQUFEQSxDQUFULEFBQVVBLElBQUEiLCJmaWxlIjoibXktbmV0d29ya3MuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2F1dG9pbmplY3R9IGZyb20gJ2F1cmVsaWEtZnJhbWV3b3JrJztcbmltcG9ydCB7SHR0cENsaWVudCwganNvbn0gZnJvbSAnYXVyZWxpYS1mZXRjaC1jbGllbnQnO1xuaW1wb3J0ICdmZXRjaCc7XG5pbXBvcnQge05ldHdvcmssIEdyYXBoLCBEaXJlY3Rpb24sIENvbXBvbmVudEZhY3RvcnksIEtpbmQsIE5vZGV9IGZyb20gJ2NyeXB0b2dyYXBoaXgtc2ltLWNvcmUnO1xuXG5AYXV0b2luamVjdFxuZXhwb3J0IGNsYXNzIE15TmV0d29ya3Mge1xuXG4gIHByaXZhdGUgaGVhZGluZzogc3RyaW5nO1xuICBwcml2YXRlIG5ldHdvcms6IE5ldHdvcms7XG4gIHByaXZhdGUgbmV0d29ya3MgPSBbXTtcbiAgcHJpdmF0ZSBjb21wb25lbnRzOiB7fTtcbiAgcHJpdmF0ZSBsYWJlbDogc3RyaW5nO1xuICBncmFwaFNlbGVjdGVkOiBib29sZWFuO1xuICBcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBodHRwOiBIdHRwQ2xpZW50KSB7XG4gICAgaHR0cC5jb25maWd1cmUoY29uZmlnID0+IHtcbiAgICAgIGNvbmZpZ1xuICAgICAgICAudXNlU3RhbmRhcmRDb25maWd1cmF0aW9uKClcbiAgICAgICAgLndpdGhCYXNlVXJsKCdodHRwOi8vbG9jYWxob3N0OjgwODAvYXBpLycpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5jb21wb25lbnRzID0ge1xuICAgICAgXCJBXCI6IEEsXG4gICAgICBcIkJcIjogQixcbiAgICAgIFwiQ1wiOiBDLFxuICAgICAgXCJEXCI6IERcbiAgICB9XG4gICAgXG4gICAgdGhpcy5odHRwID0gaHR0cDtcbiAgICB0aGlzLmZldGNoTmV0d29ya3MoKTtcbiAgICB0aGlzLmxhYmVsID0gXCJNeSBOZXR3b3Jrc1wiO1xuICB9XG5cbiAgZmV0Y2hOZXR3b3JrcygpIHtcbiAgICB0aGlzLmh0dHAuZmV0Y2goJ2dldE5ldHdvcmtzJywge1xuICAgICAgICBtZXRob2Q6ICdnZXQnXG4gICAgfSkudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgZm9yICh2YXIgbmV0d29yayBvZiBkYXRhKSB7XG4gICAgICAgICAgdGhpcy5jb25maWd1cmVOZXR3b3JrKG5ldHdvcmspO1xuICAgICAgICB9XG4gICAgICB9KTsgXG4gIH1cblxuICBjb25maWd1cmVOZXR3b3JrKG5ldHdvcms6IGFueSkge1xuICAgIGxldCBncmFwaCA9IG5ldyBHcmFwaChudWxsLCBuZXR3b3JrLmdyYXBoKTtcbiAgICBsZXQgZmFjdG9yeSA9IG5ldyBDb21wb25lbnRGYWN0b3J5KCk7XG4gICAgZ3JhcGgubm9kZXMuZm9yRWFjaChub2RlID0+IHsgdGhpcy5jb25maWd1cmVOb2RlKG5vZGUsIGZhY3RvcnksIG5ldHdvcmsuZ3JhcGgpIH0pO1xuICAgIHRoaXMubmV0d29ya3MucHVzaChuZXcgTmV0d29yayhmYWN0b3J5LCBncmFwaCkpO1xuICB9XG5cbiAgbG9hZE5ldHdvcmsobmV0d29yazogTmV0d29yaykge1xuICAgIHRoaXMubmV0d29yayA9IG5ldHdvcms7XG4gICAgdGhpcy5sYWJlbCA9IHRoaXMubmV0d29yay5ncmFwaC5pZDtcbiAgICB0aGlzLmdyYXBoU2VsZWN0ZWQgPSB0cnVlO1xuICAgIC8vIHRoZSBjcmVhdGVkIG5ldHdvcmsgb2JqZWN0IGlzIHRoZW4gYm91bmQgdG8gdGhlIGNhbnZhcyBjdXN0b20gZWxlbWVudCBpbiB0aGUgdmlld1xuICB9XG5cbiAgYmFjaygpIHtcbiAgICB0aGlzLmdyYXBoU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLmxhYmVsID0gXCJNeSBOZXR3b3Jrc1wiO1xuICB9XG5cbiAgc2F2ZSgpIHtcbiAgICB0aGlzLmh0dHAuZmV0Y2goJ3VwZGF0ZU5ldHdvcmsnLCB7XG4gICAgICBtZXRob2Q6ICdwb3N0JyxcbiAgICAgIGJvZHk6IGpzb24odGhpcy5uZXR3b3JrLmdyYXBoLnRvT2JqZWN0KHt9KSlcbiAgICB9KS50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgfSk7XG4gIH1cbiAgICAgICAgICBcbiAgY29uZmlndXJlTm9kZShub2RlOiBOb2RlLCBmYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5LCBncmFwaDogYW55KSB7XG4gICAgZmFjdG9yeS5yZWdpc3Rlcigobm9kZS50b09iamVjdCgpIGFzIGFueSkuY29tcG9uZW50LCB0aGlzLmNvbXBvbmVudHNbKG5vZGUudG9PYmplY3QoKSBhcyBhbnkpLmNvbXBvbmVudF0pO1xuICAgIG5vZGUubWV0YWRhdGFbXCJ2aWV3XCJdID0ge1xuICAgICAgeDogZ3JhcGgubm9kZXNbbm9kZS5pZF0ubWV0YWRhdGEudmlldy54LFxuICAgICAgeTogZ3JhcGgubm9kZXNbbm9kZS5pZF0ubWV0YWRhdGEudmlldy55LFxuICAgICAgd2lkdGg6IGdyYXBoLm5vZGVzW25vZGUuaWRdLm1ldGFkYXRhLnZpZXcud2lkdGgsXG4gICAgICBoZWlnaHQ6IGdyYXBoLm5vZGVzW25vZGUuaWRdLm1ldGFkYXRhLnZpZXcuaGVpZ2h0XG4gICAgfVxuICB9XG5cbiAgLy8gdGVtcG9yYXJ5IGZ1bmN0aW9uIHRvIGVuYWJsZSB0ZXN0aW5nIG9mIGdyYXBoIG1vZGlmaWNhdGlvbnNcbiAgcHJpbnRHcmFwaE9iamVjdCgpIHtcbiAgICBjb25zb2xlLmxvZyh0aGlzLm5ldHdvcmsuZ3JhcGgudG9PYmplY3Qoe30pKTtcbiAgfVxuXG59XHRcblxuY2xhc3MgQSB7fVxuY2xhc3MgQiB7fVxuY2xhc3MgQyB7fVxuY2xhc3MgRCB7fVxuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
