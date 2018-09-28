// Define the `phonecatApp` module
var snackrApp = angular.module('snackrApp', ['ngRoute']);

//Setup Routes
angular
    .module('snackrApp')
    .config(['$locationProvider', '$routeProvider', function config($locationProvider, $routeProvider) {

        $locationProvider.hashPrefix('!');

        $routeProvider
            .when('/events/upcoming', {
                template: '<h1>Upcoming Events</h1><a href="#!/events/1">View Details</a>'
            })
            .when('/events/:eventId', {
                templateUrl: 'views/event-details.html'
            })
            .otherwise('/events/upcoming');
    }]);



var appConfig = {
    baseUrl : 'https://localhost:5001'
};

snackrApp.controller('userController', function UserController($scope, $http) {

    $scope.user = { };

    $http.get(appConfig.baseUrl + '/api/Auth/GetCurrentUser').then(function (response) {
        $scope.user = response.data.user;
    });
});

snackrApp.controller('upcomingEventsController', function UserController($scope, $http) {
    $scope.events = [];

    $scope.getUpcomingEvents = function () {
        $http.get(appConfig.baseUrl + '/api/Events/upcoming').then(function (response) {
            console.log(response);
            $scope.events = response.data;
        });
    };

    $scope.getUpcomingEvents();


});