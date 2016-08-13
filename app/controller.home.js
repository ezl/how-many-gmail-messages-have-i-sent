var controller = angular.module('gmailChecker.controller.home', []);

controller.controller('gmailChecker.controller.home', ['$scope', '$cookies', 'GApi', 'Messages', '$interval',
    function homeCtl($scope, $cookies, GApi, Messages, $interval) {
        Messages.report().then(function (result) {
            $scope.reportResult = result;
        });

        $scope.storage = Messages.storage;

        $interval(function () {
            Messages.report().then(function (result) {
                $scope.reportResult = result;
            });
        }, Messages.storage.updateUiInterval * 60 * 1000);
    }
]);