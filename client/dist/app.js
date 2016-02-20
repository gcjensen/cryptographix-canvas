define(["require", "exports"], function (require, exports) {
    var App = (function () {
        function App() {
        }
        App.prototype.configureRouter = function (config, router) {
            config.title = 'comp3200';
            config.map([
                {
                    route: ['', 'home'],
                    name: 'home',
                    moduleId: 'home',
                    nav: true, title: 'Home',
                    settings: 'home'
                },
                {
                    route: ['my-networks'],
                    name: 'my-networks',
                    moduleId: 'my-networks',
                    nav: true,
                    title: 'My Networks',
                    settings: 'share-alt' },
            ]);
            this.router = router;
        };
        return App;
    })();
    exports.App = App;
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC50cyJdLCJuYW1lcyI6WyJBcHAiLCJBcHAuY29uc3RydWN0b3IiLCJBcHAuY29uZmlndXJlUm91dGVyIl0sIm1hcHBpbmdzIjoiO0lBRUE7UUFBQUE7UUF3QkFDLENBQUNBO1FBckJDRCw2QkFBZUEsR0FBZkEsVUFBZ0JBLE1BQTJCQSxFQUFFQSxNQUFjQTtZQUN6REUsTUFBTUEsQ0FBQ0EsS0FBS0EsR0FBR0EsVUFBVUEsQ0FBQ0E7WUFDMUJBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBO2dCQUNUQTtvQkFDRUEsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsTUFBTUEsQ0FBQ0E7b0JBQ25CQSxJQUFJQSxFQUFFQSxNQUFNQTtvQkFDWkEsUUFBUUEsRUFBRUEsTUFBTUE7b0JBQ2hCQSxHQUFHQSxFQUFFQSxJQUFJQSxFQUFFQSxLQUFLQSxFQUFFQSxNQUFNQTtvQkFDeEJBLFFBQVFBLEVBQUVBLE1BQU1BO2lCQUNqQkE7Z0JBQ0RBO29CQUNFQSxLQUFLQSxFQUFFQSxDQUFDQSxhQUFhQSxDQUFDQTtvQkFDdEJBLElBQUlBLEVBQUVBLGFBQWFBO29CQUNuQkEsUUFBUUEsRUFBRUEsYUFBYUE7b0JBQ3ZCQSxHQUFHQSxFQUFFQSxJQUFJQTtvQkFDVEEsS0FBS0EsRUFBRUEsYUFBYUE7b0JBQ3BCQSxRQUFRQSxFQUFFQSxXQUFXQSxFQUFDQTthQUN6QkEsQ0FBQ0EsQ0FBQ0E7WUFFSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsTUFBTUEsQ0FBQ0E7UUFDdkJBLENBQUNBO1FBQ0hGLFVBQUNBO0lBQURBLENBeEJBLEFBd0JDQSxJQUFBO0lBeEJZLFdBQUcsTUF3QmYsQ0FBQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1JvdXRlciwgUm91dGVyQ29uZmlndXJhdGlvbn0gZnJvbSAnYXVyZWxpYS1yb3V0ZXInXG5cbmV4cG9ydCBjbGFzcyBBcHAge1xuICByb3V0ZXI6IFJvdXRlcjtcbiAgXG4gIGNvbmZpZ3VyZVJvdXRlcihjb25maWc6IFJvdXRlckNvbmZpZ3VyYXRpb24sIHJvdXRlcjogUm91dGVyKSB7XG4gICAgY29uZmlnLnRpdGxlID0gJ2NvbXAzMjAwJztcbiAgICBjb25maWcubWFwKFtcbiAgICAgIHsgXG4gICAgICAgIHJvdXRlOiBbJycsICdob21lJ10sICAgIFxuICAgICAgICBuYW1lOiAnaG9tZScsICAgICAgICAgXG4gICAgICAgIG1vZHVsZUlkOiAnaG9tZScsICAgIFxuICAgICAgICBuYXY6IHRydWUsIHRpdGxlOiAnSG9tZScsICAgIFxuICAgICAgICBzZXR0aW5nczogJ2hvbWUnXG4gICAgICB9LFxuICAgICAgeyBcbiAgICAgICAgcm91dGU6IFsnbXktbmV0d29ya3MnXSwgXG4gICAgICAgIG5hbWU6ICdteS1uZXR3b3JrcycsIFxuICAgICAgICBtb2R1bGVJZDogJ215LW5ldHdvcmtzJywgXG4gICAgICAgIG5hdjogdHJ1ZSwgXG4gICAgICAgIHRpdGxlOiAnTXkgTmV0d29ya3MnLCBcbiAgICAgICAgc2V0dGluZ3M6ICdzaGFyZS1hbHQnfSxcbiAgICBdKTtcblxuICAgIHRoaXMucm91dGVyID0gcm91dGVyO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
