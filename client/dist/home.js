define(["require", "exports"], function (require, exports) {
    var Home = (function () {
        function Home() {
            this.heading = 'Home';
        }
        Home.prototype.attached = function () {
            document.getElementById('page-title').style.marginTop = ((screen.height / 2) - 100) + "px";
        };
        return Home;
    })();
    exports.Home = Home;
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhvbWUudHMiXSwibmFtZXMiOlsiSG9tZSIsIkhvbWUuY29uc3RydWN0b3IiLCJIb21lLmF0dGFjaGVkIl0sIm1hcHBpbmdzIjoiO0lBQUE7UUFBQUE7WUFDRUMsWUFBT0EsR0FBR0EsTUFBTUEsQ0FBQ0E7UUFNbkJBLENBQUNBO1FBSkNELHVCQUFRQSxHQUFSQTtZQUNFRSxRQUFRQSxDQUFDQSxjQUFjQSxDQUFDQSxZQUFZQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxTQUFTQSxHQUFHQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUM3RkEsQ0FBQ0E7UUFFSEYsV0FBQ0E7SUFBREEsQ0FQQSxBQU9DQSxJQUFBO0lBUFksWUFBSSxPQU9oQixDQUFBIiwiZmlsZSI6ImhvbWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgSG9tZSB7XG4gIGhlYWRpbmcgPSAnSG9tZSc7IFxuXG4gIGF0dGFjaGVkKCkge1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlLXRpdGxlJykuc3R5bGUubWFyZ2luVG9wID0gKChzY3JlZW4uaGVpZ2h0IC8gMikgLSAxMDApICsgXCJweFwiO1xuICB9XG5cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
