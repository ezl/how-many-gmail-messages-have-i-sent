angular.module('Messages', [])
.factory("Messages", ["$q", "$cookies", "GApi", "$sessionStorage", '$interval',
    function($q, $cookies, GApi, $sessionStorage, $interval){
        var query = "newer_than:1d in:sent";
        var userId = $cookies.get('userId');
        var params = {'userId': userId, 'q': query};
        var messageListPromise = GApi.executeAuth("gmail", "users.messages.list", params);
        var errorHandler = function (reject) { return function(error){ return reject(error); }};

        var storage = $sessionStorage.$default({
            "lastLoad": null,
            "messages": [],
            "updateInterval": 1,
            "updateUiInterval": 5
        });

        // API methods and helpers
        var getMessage = function(messageId) {
            var params = {"id": messageId, "userId": userId};
            return GApi.executeAuth("gmail", "users.messages.get", params);
        };

        var messagesList = function(){ return $q(function(resolve, reject){
            var messagesListHandler = function(resp){
                var ids = _.map(resp.messages, "id");

                $q.all(_.map(ids, getMessage)).then(function(messages){ resolve(messages) }, errorHandler(reject));
            };

            messageListPromise.then(messagesListHandler, errorHandler(reject));
        });};

        var messagesReport = function(){ return $q(function(resolve, reject) {
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

            resolve({
                'one': one_hour_count,
                'six': six_hours_count,
                'twentyFour': (more_6_hours_count + six_hours_count + one_hour_count),
                'lastLoad': storage.lastLoad
            });
        }); };
        // end API methods and helpers

        // init
        messagesList().then(function (messages) {
            storage.messages = messages;
            storage.lastLoad = new Date();
        });

        // setup scheduler for updating messages
        $interval(function () {
            messagesList().then(function (messages) {
                storage.messages = messages;
                storage.lastLoad = new Date();
            });

        }, storage.updateInterval * 60 * 1000);

        return {
            "list": function () { return storage.messages; },
            "report": messagesReport,
            "storage": storage
        };
    }
]);