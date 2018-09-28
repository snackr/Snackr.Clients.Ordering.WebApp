'use strict';

angular.
    module('upcomingEventList').
    component('upcomingEventList', {
        templateUrl: 'upcoming-event-list/upcoming-event-list.template.html',
        controller: ['Phone',
            function PhoneListController(Phone) {
                this.phones = Phone.query();
                this.orderProp = 'age';
            }
        ]
    });