'use strict';

angular
    .module('snackrApp')
    .config(['$locationProvider', '$routeProvider',
        function config($locationProvider, $routeProvider) {
            $locationProvider.hashPrefix('!');

            $routeProvider
                .when('/events', {
                    templateUrl: 'views/events/dashboard.html'
                })
                .when('/events/:eventId/details', {
                    templateUrl: 'views/events/details.html'
                })
                .when('/order-request-basket/builder/:customerEventAttendanceProfileId/:eventVendorVenueId', {
                    templateUrl: 'views/order-request-basket/builder.html'
                })
                .when('/customer-event-attendance-profile/:eventId', {
                    templateUrl: 'views/customer-event-attendance-profiles/create.html'
                })
                .otherwise('/events');
        }
    ]);