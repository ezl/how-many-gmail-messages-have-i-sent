var controller = angular.module('gmailChecker.controller.home', []);

controller.controller('gmailChecker.controller.home', ['$scope', '$cookies', 'GApi', 'GData', 'GAuth', 'Messages',
    function homeCtl($scope, $cookies, GApi, GData, GAuth, Messages) {
        Messages.startSync();

        $scope.messages = Messages;
    }
]);