'use strict';

// Define the `snackrApp` module
var snackrApp = angular.module('snackrApp', [
    'ngAnimate',
    'ngRoute'
]);

var appConfig = {
    baseUrl: 'https://snackr-webapi-servicegateway-ordering-intergration.azurewebsites.net'
    //baseUrl: 'https://localhost:5001'
};

snackrApp.controller('userController', function UserController($scope, $http, $window) {

    $scope.user = {};

    $http.get(appConfig.baseUrl + '/api/Auth/GetCurrentUser')
        .success(function (result) {
            console.log(result);
            $scope.user = result.user;
        })
        .error(function (result) {
            $window.location.href = '../Identity/Account/Login';
        });
});

snackrApp.controller('event_dashboardController', function Event_DashboardController($scope, $http) {

    $scope.events = [];

    $scope.getUpcomingEvents = function () {
        $http.get(appConfig.baseUrl + '/api/Events/upcoming').then(function (response) {
            console.log(response);
            $scope.events = response.data;
        });
    };

    $scope.getUpcomingEvents();
});

snackrApp.controller('event_detailsController', function Event_DetailsController($scope, $http, $routeParams, $window) {

    $scope.model = {
        event: {},
        customerEventAttendanceProfile: {},
        eventVendors: [],
        user : {}
    };

    $scope.loadModel = function (eventId) {

        var self = this;

        self.getEvent = function () {

            $http.get(appConfig.baseUrl + '/api/Events/' + eventId).then(function (response) {
                console.log(response);
                $scope.model.event = response.data;
            });

            $http.get(appConfig.baseUrl + '/api/Events/' + eventId + '/vendors').then(function (response) {
                console.log(response);
                $scope.model.eventVendors = response.data;
            });

            $http
                .get(appConfig.baseUrl + '/api/CustomerEventAttendanceProfiles/customer/' + $scope.model.user.customerId + '/event/' + eventId)
                .success(function (result) {
                    console.log("CUSTOMER ATTTENDENCE PROFILE");
                    console.log(result);
                    $scope.model.customerEventAttendanceProfile = result;
                })
                .error(function (result) {
                    $window.location.href = '#!/customer-event-attendance-profile/' + eventId;
                });
        };


        $http
            .get(appConfig.baseUrl + '/api/Auth/GetCurrentUser')
            .success(function (userResult) {
                $scope.model.user = userResult.user;
                self.getEvent();
            })
            .error(function () { alert('error'); });
    };

    $scope.loadModel($routeParams.eventId);

    console.log($scope.model);
});

snackrApp.controller('customerEventAttendanceProfiles_CreateController', function CustomerEventAttendanceProfiles_CreateController($scope, $http, $routeParams, $window) {

    $scope.model = {
        event: {},
        user: {},
        seatKey: ""
    };

    $scope.loadModel = function (eventId) {
        $http.get(appConfig.baseUrl + '/api/Events/' + eventId).then(function (response) { $scope.model.event = response.data; console.log($scope.model.event); });
        $http.get(appConfig.baseUrl + '/api/Auth/GetCurrentUser').then(function (response) { $scope.model.user = response.data.user; console.log($scope.model.user); });
    };

    $scope.submit = function () {

        var request = {
            eventId: $scope.model.event.id,
            seatKey: $scope.model.seatKey
        };

        if (request.seatKey == null) { alert("You must enter you seat number"); return; }

        console.log(request);

        $http({
            url: appConfig.baseUrl + "/api/CustomerEventAttendanceProfiles",
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(request)
        })
        .success(function (response) {
            console.log(response);
            $window.location.href = '#!/events/' + $routeParams.eventId + '/details';
        })
        .error(function (response) {
            alert('Error saving');
            console.log(response);
        });

        
        ///
    };

    $scope.loadModel($routeParams.eventId);
});

snackrApp.controller('orderRequestBasket_builderController', function OrderRequestBasket_BuilderController($scope, $http, $routeParams, $window) {

    $scope.model = {
        //user: {},
        //customerEventAttendanceProfile: {},
        //eventVendorVenue: {},
        cart : {
            items : [],
            total: 0.0,
        }
    };

    $scope.loadModel = function (customerEventAttendanceProfileId, eventVendorVenueId) {

        var self = this;

        self.loadUser = function (builderModel) {

            $http
                .get(appConfig.baseUrl + '/api/Auth/GetCurrentUser')
                .success(function (response) {
                    builderModel.user = response;
                    console.log('loadUser', builderModel);
                    self.loadCustomerEventAttendanceProfile(builderModel);
                })
                .error(function (response) {
                    console.log('loadUser | Error', response);
                    self.errorOut(builderModel);
                });
        };

        self.loadCustomerEventAttendanceProfile = function (builderModel) {
            $http
                .get(appConfig.baseUrl + '/api/CustomerEventAttendanceProfiles/' + customerEventAttendanceProfileId)
                .success(function (response) {
                    builderModel.customerEventAttendanceProfile = response;
                    console.log('loadCustomerEventAttendanceProfile', builderModel);
                    self.loadEventVendorVenue(builderModel);
                })
                .error(function (response) {
                    console.log('loadCustomerEventAttendanceProfile | Error', response);
                    self.errorOut(builderModel);
                });
        };

        self.loadEventVendorVenue = function (builderModel) {

            builderModel.eventVendorVenue = {};

            $http
                .get(appConfig.baseUrl + '/api/EventVendorVenue/' + eventVendorVenueId)
                .success(function (response) {
                    console.log('loadEventVendorVenue | Success', response);
                    
                    builderModel.eventVendorVenue.entity = response;

                    $http
                        .get(appConfig.baseUrl + '/api/VendorEventProfiles/' + response.profileDocumentId)
                        .success(function (innerResponse) {
                            console.log('loadEventVendorVenueProfile | Success', innerResponse);
                            builderModel.eventVendorVenue.profileDocument = innerResponse;

                            console.log('loadEventVendorVenue', builderModel);

                            self.buildModel(builderModel);
                        })
                        .error(function (innerResponse) {
                            console.log('loadEventVendorVenueProfile | Error', innerResponse);
                            self.errorOut(builderModel);
                        });
                })
                .error(function (response) {
                    console.log('loadEventVendorVenue | Error', response);
                    self.errorOut(builderModel);
                });
        };

        self.buildModel = function (builderModel) {

            _.chain(builderModel.eventVendorVenue.profileDocument.menu.menuGroups)
                .map(function (mg) { return mg.menuItems; })
                .flatten()
                .each(function (mi) {
                    mi.cart = {
                        qty: 0,
                        instructions: "",
                        lineTotal: 0.0
                    };
                });

            builderModel.cart = {
                items: [],
                total: 0.0
            };

            //---------------------------------------------------

            $scope.model = builderModel;

            console.log('buildModel2', builderModel);
        };

        self.errorOut = function (builderModel) {
            console.log('errorOut', builderModel);
        };

        self.loadUser({});
    };

    $scope.getCart = function () {

        if (_.isUndefined($scope.model.customerEventAttendanceProfile)) { return {items : [], total : 0}; }


        var items =
            _.chain($scope.model.eventVendorVenue.profileDocument.menu.menuGroups)
                .map(function (mg) { return mg.menuItems; })
                .flatten()
                .filter(function (x) { return x.cart.qty > 0; })
                .value();

        return {
            items : items,
            total : _.chain(items).map(function (mi) { return mi.price * mi.cart.qty; }).reduce(function (agg, x) { return agg + x; })
        };         
    };

    $scope.refreshCart = function () {
        $scope.model.cart = $scope.getCart();
    };

    $scope.submitOrderRequestBasket = function () {

        $('#cartModal').modal('hide');
        $('#submittingOrderRequestBasketModal').modal({ 'backdrop': 'static', 'keyboard': false, 'show': true });

        var orderRequestLines =
            _.chain($scope.getCart().items)
                .map(function (x) {
                    console.log(x);
                    return {
                        item_Id: x.id,
                        item_Name: x.name,
                        instructions: x.cart.instructions,
                        qty: x.cart.qty,
                        total: x.price * x.cart.qty
                    };
                })
                .value();

        var request = {
            eventVendorVenueId: $scope.model.eventVendorVenue.entity.eventVendorVenueId,
            collectionMethod: "ToSeatDelivery",
            deliveryLocationId: $scope.model.customerEventAttendanceProfile.seatLocation.id,
            orderRequestLines: orderRequestLines,
            promoCodes: []
        };
        console.log(request);


        $http({
            url: appConfig.baseUrl + "/api/OrderRequestBasket/createsubmit",
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(request)
        })
            .then(function (response) {
                console.log(response);

                $('#submittingOrderRequestBasketModal').modal('hide');

                var $successModal = $('#orderRequestBasketSubmittedSuccessfullyModal').modal({ 'backdrop': 'static', 'show': true });

                $successModal.on('hide.bs.modal', function () {
                    $window.location.href = '#';
                });     
            },
                function (response) {
                    alert('error');
                    console.log(response);
                });
    };

    $scope.loadModel($routeParams.customerEventAttendanceProfileId, $routeParams.eventVendorVenueId);
});

snackrApp.controller('orderRequestBasket_builderOldController', function OrderRequestBasket_BuilderOldController($scope, $http, $routeParams, $window) {

    $scope.model = {
        customerEventAttendanceProfile: {},
        eventVendorVenue: {},
        cart: [],
        user: {}
    };

    $scope.loadModel = function (customerEventAttendanceProfileId, eventVendorVenueId) {

        var self = this;

        $http.get(appConfig.baseUrl + '/api/Auth/GetCurrentUser').then(function (response) { $scope.model.user = response.data.user; });

        self.getCustomerEventAttendanceProfile = function () {
            $http.get(appConfig.baseUrl + '/api/CustomerEventAttendanceProfiles/' + customerEventAttendanceProfileId).then(function (response) {
                console.log(response);
                $scope.model.customerEventAttendanceProfile = response.data;
            });
        };

        self.getEventVendorVenue = function () {
            $http.get(appConfig.baseUrl + '/api/EventVendorVenue/' + eventVendorVenueId).then(function (response) {
                console.log(response);
                $scope.model.eventVendorVenue.entity = response.data;

                $http.get(appConfig.baseUrl + '/api/VendorEventProfiles/' + response.data.profileDocumentId).then(function (responseInner) {
                    console.log(responseInner);

                    _.each(responseInner.data, function (mg) {
                        _.each(mg.menuItems, function (mi) {
                            mi.cart = {
                                qty: 0,
                                instructions: "",
                                lineTotal: 0.0
                            };
                        })
                    });

                    $scope.model.eventVendorVenue.profileDocument = responseInner.data;

                });
            });
        };

        self.getCart = function () {

            if (_.isUndefined($scope.model.eventVendorVenue.profileDocument) || _.isUndefined($scope.model.eventVendorVenue.profileDocument.menu)) {
                return {
                    items: [],
                    total: 0.0
                };
            }

            var items = [];
            items = _.chain($scope.model.eventVendorVenue.profileDocument.menu.menuGroups)
                .map(function (mg) { return mg.menuItems; })
                .flatten()
                .filter(function (x) { return _.isUndefined(x.cart) ? false : x.cart.qty > 0; })
                .value();

            return {
                items: items,
                total: _.chain(items).map(function (mi) { return mi.price * mi.cart.qty; }).reduce(function (agg, x) { return agg + x; })
            };
        };

        self.getCustomerEventAttendanceProfile();
        self.getEventVendorVenue();
        //self.getCart();


    };




    $scope.submitOrderRequestBasket = function () {

        $('#cartModal').modal('hide');
        $('#submittingOrderRequestBasketModal').modal({ 'backdrop': 'static', 'keyboard': false, 'show': true });

        var orderRequestLines =
            _.chain($scope.getCart().items)
                .map(function (x) {
                    console.log(x);
                    return {
                        item_Id: x.id,
                        item_Name: x.name,
                        instructions: x.cart.instructions,
                        qty: x.cart.qty,
                        total: x.price * x.cart.qty
                    };
                })
                .value();

        var request = {
            eventVendorVenueId: $scope.model.eventVendorVenue.entity.eventVendorVenueId,
            collectionMethod: "ToSeatDelivery",
            deliveryLocationId: $scope.model.customerEventAttendanceProfile.seatLocation.id,
            orderRequestLines: orderRequestLines,
            promoCodes: []
        };
        console.log(request);


        $http({
            url: appConfig.baseUrl + "/api/OrderRequestBasket/createsubmit",
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(request)
        })
            .then(function (response) {
                alert('Order Request Basket Saved');
                $('#submittingOrderRequestBasketModal').modal('hide');
                $window.location.href = '#';
                console.log(response);
            },
                function (response) {
                    alert('error');
                    console.log(response);
                });
    };

    $scope.loadModel($routeParams.customerEventAttendanceProfileId, $routeParams.eventVendorVenueId);
    //$scope.apply();
    //$scope.getCustomerEventAttendanceProfile($routeParams.customerEventAttendanceProfileId);
    //$scope.getEventVendorVenue($routeParams.eventVendorVenueId);

    console.log($scope.model);

});

//snackrApp.controller('orderRequestBasket_builderController', function OrderRequestBasket_BuilderController($scope, $http, $routeParams) {

//    $scope.model = {
//        customerEventAttendanceProfile : {},
//        eventVendorVenue: {},
//        cart: [],
//        user: {}
//    };



//    $http.get(appConfig.baseUrl + '/api/Auth/GetCurrentUser').then(function (response) { $scope.model.user = response.data.user; });

//    $scope.getCustomerEventAttendanceProfile = function (customerEventAttendanceProfileId) {
//        $http.get(appConfig.baseUrl + '/api/CustomerEventAttendanceProfiles/' + customerEventAttendanceProfileId).then(function (response) {
//            console.log(response);
//            $scope.model.customerEventAttendanceProfile = response.data;
//        });
//    };

//    $scope.getEventVendorVenue = function (eventVendorVenueId) {
//        $http.get(appConfig.baseUrl + '/api/EventVendorVenue/' + eventVendorVenueId).then(function (response) {
//            console.log(response);
//            $scope.model.eventVendorVenue.entity = response.data;

//            $http.get(appConfig.baseUrl + '/api/VendorEventProfiles/' + response.data.profileDocumentId).then(function (responseInner) {
//                console.log(responseInner);

//                _.each(responseInner.data, function (mg) {
//                    _.each(mg.menuItems, function (mi) {
//                        mi.cart = {
//                            qty: 0,
//                            instructions: "",
//                            lineTotal: 0.0
//                        };
//                    })
//                });

//                $scope.model.eventVendorVenue.profileDocument = responseInner.data;
//                $scope.$apply();
//            });
//        });
//    };

//    $scope.getCart = function () {

//        if (_.isUndefined($scope.model.eventVendorVenue.profileDocument) || _.isUndefined($scope.model.eventVendorVenue.profileDocument.menu)) {
//            return {
//                items: [],
//                total: 0.0
//            };
//        }

//        var items = [];
//        items = _.chain($scope.model.eventVendorVenue.profileDocument.menu.menuGroups)
//                 .map(function (mg) { return mg.menuItems; })
//                 .flatten()
//                 .filter(function (x) { return _.isUndefined(x.cart) ? false : x.cart.qty > 0; })
//                 .value();

//        return {
//            items: items,
//            total: _.chain(items).map(function (mi) { return mi.price * mi.cart.qty; }).reduce(function (agg, x) { return agg + x; })
//        };
//    };

//    $scope.submitOrderRequestBasket = function () {

//        var orderRequestLines =
//            _.chain($scope.getCart().items)
//                .map(function (x) {
//                    console.log(x);
//                    return {
//                        item_Id: x.id,
//                        item_Name: x.name,
//                        instructions : x.cart.instructions,
//                        qty: x.cart.qty,
//                        total: x.price * x.cart.qty
//                    };
//                })
//                .value();

//        var request = {
//            eventVendorVenueId: $scope.model.eventVendorVenue.entity.eventVendorVenueId,
//            collectionMethod: "ToSeatDelivery",
//            deliveryLocationId: $scope.model.customerEventAttendanceProfile.seatLocation.id,
//            orderRequestLines: orderRequestLines,
//            promoCodes : []
//        };
//        console.log(request);


//        $http({
//            url: appConfig.baseUrl + "/api/OrderRequestBasket/createsubmit",
//            method: "POST",
//            headers: {
//                'Content-Type': 'application/json'
//            },
//            data: JSON.stringify(request)
//        })
//        .then(function (response) {
//            alert('Order Request Basket Saved');
//            console.log(response);
//        },
//        function (response) {
//            alert('error');
//            console.log(response);
//        });
//    };

//    $scope.getCustomerEventAttendanceProfile($routeParams.customerEventAttendanceProfileId);
//    $scope.getEventVendorVenue($routeParams.eventVendorVenueId);

//    console.log($scope.model);

//});



//snackrApp.controller('orderRequestBasket_builderController', function OrderRequestBasket_BuilderController($scope, $http, $routeParams) {

//    $scope.model = {
//        customerEventAttendanceProfile: {},
//        eventVendorVenue: {},
//        cart: [],
//        user: {}
//    };

//    $scope.loadModel = function () {

//        $http.get(appConfig.baseUrl + '/api/Auth/GetCurrentUser').then(function (response) { $scope.model.user = response.data.user; });

//        $scope.getCustomerEventAttendanceProfile = function (customerEventAttendanceProfileId) {
//            $http.get(appConfig.baseUrl + '/api/CustomerEventAttendanceProfiles/' + customerEventAttendanceProfileId).then(function (response) {
//                console.log(response);
//                $scope.model.customerEventAttendanceProfile = response.data;
//            });
//        };


//    };

    



//    $scope.getEventVendorVenue = function (eventVendorVenueId) {
//        $http.get(appConfig.baseUrl + '/api/EventVendorVenue/' + eventVendorVenueId).then(function (response) {
//            console.log(response);
//            $scope.model.eventVendorVenue.entity = response.data;

//            $http.get(appConfig.baseUrl + '/api/VendorEventProfiles/' + response.data.profileDocumentId).then(function (responseInner) {
//                console.log(responseInner);

//                _.each(responseInner.data, function (mg) {
//                    _.each(mg.menuItems, function (mi) {
//                        mi.cart = {
//                            qty: 0,
//                            instructions: "",
//                            lineTotal: 0.0
//                        };
//                    })
//                });

//                $scope.model.eventVendorVenue.profileDocument = responseInner.data;
//            });
//        });
//    };

//    $scope.getCart = function () {

//        if (_.isUndefined($scope.model.eventVendorVenue.profileDocument) || _.isUndefined($scope.model.eventVendorVenue.profileDocument.menu)) {
//            return {
//                items: [],
//                total: 0.0
//            };
//        }

//        var items = [];
//        items = _.chain($scope.model.eventVendorVenue.profileDocument.menu.menuGroups)
//            .map(function (mg) { return mg.menuItems; })
//            .flatten()
//            .filter(function (x) { return _.isUndefined(x.cart) ? false : x.cart.qty > 0; })
//            .value();

//        return {
//            items: items,
//            total: _.chain(items).map(function (mi) { return mi.price * mi.cart.qty; }).reduce(function (agg, x) { return agg + x; })
//        };
//    };

//    $scope.submitOrderRequestBasket = function () {

//        var orderRequestLines =
//            _.chain($scope.getCart().items)
//                .map(function (x) {
//                    console.log(x);
//                    return {
//                        item_Id: x.id,
//                        item_Name: x.name,
//                        instructions: x.cart.instructions,
//                        qty: x.cart.qty,
//                        total: x.price * x.cart.qty
//                    };
//                })
//                .value();

//        var request = {
//            eventVendorVenueId: $scope.model.eventVendorVenue.entity.eventVendorVenueId,
//            collectionMethod: "ToSeatDelivery",
//            deliveryLocationId: $scope.model.customerEventAttendanceProfile.seatLocation.id,
//            orderRequestLines: orderRequestLines,
//            promoCodes: []
//        };
//        console.log(request);


//        $http({
//            url: appConfig.baseUrl + "/api/OrderRequestBasket/createsubmit",
//            method: "POST",
//            headers: {
//                'Content-Type': 'application/json'
//            },
//            data: JSON.stringify(request)
//        })
//            .then(function (response) {
//                alert('Order Request Basket Saved');
//                console.log(response);
//            },
//                function (response) {
//                    alert('error');
//                    console.log(response);
//                });
//    };

//    $scope.getCustomerEventAttendanceProfile($routeParams.customerEventAttendanceProfileId);
//    $scope.getEventVendorVenue($routeParams.eventVendorVenueId);

//    console.log($scope.model);

//});



