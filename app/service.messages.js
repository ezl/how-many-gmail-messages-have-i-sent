angular.module('Messages', [])
.factory("Messages", ["$q", "$cookies", "GApi", "$sessionStorage", '$interval',
    function($q, $cookies, GApi, $sessionStorage, $interval){
        var query = "newer_than:1d in:sent";
        var errorHandler = function (reject) { return function(error){ return reject(error); }};
        var scheduler = null;
        var defaultStorage = {
            "lastLoad": null,
            "messages": [],
            "updateInterval": 5,
            "aggregated": {"one": 0, "six": 0, "twentyFour": 0}
        };

        var storage = $sessionStorage.$default(defaultStorage);

        // API methods and helpers
        var updateStorage = function () {
            messagesList().then(function (messages) {
                console.debug("storage is updated");
                storage.messages = messages;
                storage.lastLoad = new Date();
                aggregate();
            });

        };

        var getMessage = function(messageId) {
            var params = {"id": messageId, "userId": $cookies.get('userId')};
            return GApi.executeAuth("gmail", "users.messages.get", params);
        };

        var messagesList = function(){ return $q(function(resolve, reject){
            var messagesListHandler = function(resp){
                var ids = _.map(resp.messages, "id");

                $q.all(_.map(ids, getMessage)).then(function(messages){ resolve(messages) }, errorHandler(reject));
            };

            var params = {'userId': $cookies.get('userId'), 'q': query};
            var messageListPromise = GApi.executeAuth("gmail", "users.messages.list", params);

            messageListPromise.then(messagesListHandler, errorHandler(reject));
        });};

        var aggregate = function(){
            // report periods: 1 hour, 6 hour, 24 hour
            var one_hour_count = 0, six_hours_count = 0, more_6_hours_count = 0;
            var currentTimestamp = new Date().getTime();
            var deltaSec;
            var HOUR = 3600, HOURS_6 = HOUR * 6;

            _.forEach(storage.messages, function(message){
                var msgTimestamp = parseInt(message.internalDate);
                deltaSec = (currentTimestamp - msgTimestamp) / 1000;

                if( deltaSec <= HOUR){
                    one_hour_count++;
                } else if(deltaSec <= HOURS_6){
                    six_hours_count++;
                } else {
                    more_6_hours_count++;
                }
            });


            storage["aggregated"] = {
                'one': one_hour_count,
                'six': six_hours_count,
                'twentyFour': (more_6_hours_count + six_hours_count + one_hour_count)
            };
        };

        var messagesReset = function () {
            storage.$reset(defaultStorage);
            stopSync();
        };

        var stopSync = function () {
            console.debug("stop sync");
            if (!scheduler) return;
            $interval.cancel(scheduler);
        };

        var startSync = function () {
            stopSync();
            console.debug("start sync");

            console.debug("load storage");
            updateStorage();
            scheduler = $interval(updateStorage, storage.updateInterval * 60 * 1000);
        };

        // end API methods and helpers

        return {
            "reset": messagesReset,
            "storage": storage,
            "startSync": startSync,
            "stopSync": stopSync
        };
    }
]);