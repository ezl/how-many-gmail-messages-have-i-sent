angular.module('Messages', [])
.factory("Messages", ["$q", "$cookies", "GApi", "GData", "GAuth", "$sessionStorage", '$interval',
    function($q, $cookies, GApi, GData, GAuth, $sessionStorage, $interval){
        var sent_query = "newer_than:1d in:sent";
        var unread_query = "newer_than:1d in:unread";
        var inbox_query = "newer_than:1d in:inbox";

        var errorHandler = function (reject) { return function(error){ return reject(error); }};
        var scheduler = null;
        var defaultStorage = {
            "lastLoad": {},
            "users": [],
            "messages": {},
            "inbox_count": {},
            "unread_count": {},
            "aggregated": {
                "sent": {}, "inbox": {}, "unread": {}
            },
            "updateInterval": 1
        };

        var storage = $sessionStorage.$default(defaultStorage);

        // API methods and helpers
        var updateStorageForUser = function(user) {
            return function() {
                var deferred = $q.defer();

                console.log("Update storage for user: " + user.id);

                GData.setUserId(user.id);

                GAuth.checkAuth().then(function () {
                    var query_handler = _.partial(getMessagesList, user.id, _);
                    $q.all(_.map([sent_query, inbox_query, unread_query], query_handler)).then(function (results) {
                        var SENT_INDEX = 0, INBOX_INDEX = 1, UNREAD_INDEX = 2;

                        storage.lastLoad[user.id] = new Date();
                        storage["aggregated"]["sent"][user.id] = aggregate(results[SENT_INDEX]);
                        storage["aggregated"]["inbox"][user.id] = aggregate(results[INBOX_INDEX]);
                        storage["aggregated"]["unread"][user.id] = aggregate(results[UNREAD_INDEX]);

                        console.debug("messages for user " + user.id + " are updated");

                        deferred.resolve();
                    });

                }, function (error) {
                    console.log("error: " + error.toString());
                });

                return deferred.promise;
            }
        };

        var updateStorage = function () {
            // Important: google client doesn't allow to make async auth and queries
            // that's why all messages updating are performed in sequence way

            var chain = $q.when();

            _.forEach(storage.users, function (user) {
                chain = chain.then(updateStorageForUser(user));
            });
        };

        var getMessage = function(messageId, userId) {
            var params = {"id": messageId, "userId": userId};
            return GApi.executeAuth("gmail", "users.messages.get", params);
        };

        var getMessagesList = function(userId, query){ return $q(function(resolve, reject){
            var messagesListHandler = function(resp){
                var ids = _.map(resp.messages, "id");

                $q.all(_.map(ids, _.partial(getMessage, _, userId))).then(function(messages){ resolve(messages) }, errorHandler(reject));
            };

            var params = {'userId': userId, 'q': query};
            var messageListPromise = GApi.executeAuth("gmail", "users.messages.list", params);

            messageListPromise.then(messagesListHandler, errorHandler(reject));
        });};

        var aggregate = function(messages){
            // report periods: 1 hour, 6 hour, 24 hour
            var one_hour_count = 0, six_hours_count = 0, more_6_hours_count = 0;
            var currentTimestamp = new Date().getTime();
            var deltaSec;
            var HOUR = 3600, HOURS_6 = HOUR * 6;

            _.forEach(messages, function(message){
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


            return {
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

        var addUser = function () {
            GAuth.login().then(function (user) {
                if(!_.find(storage.users, {'id': user.id})){
                    storage.users.push(user);
                    updateStorageForUser(user);
                }
            });
        };

        var removeUser = function (userId) {
            _.remove(storage.users, {"id": userId});
            delete storage.aggregated[userId];
            delete storage.lastLoad[userId];
            delete storage.messages['sent'][userId];
            delete storage.messages['inbox'][userId];
            delete storage.messages['unread'][userId];
        };

        // end API methods and helpers

        return {
            "reset": messagesReset,
            "storage": storage,
            "startSync": startSync,
            "stopSync": stopSync,
            "addUser": addUser,
            "removeUser": removeUser
        };
    }
]);