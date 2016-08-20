var controller = angular.module('gmailChecker.controller.home', []);

controller.controller('gmailChecker.controller.home', ['$scope', '$cookies', 'GApi', 'Messages', '$state',
    function homeCtl($scope, $cookies, GApi, Messages, $state) {
        // todo: there is a better place for this checking - routing
        if (!$cookies.get("userId")) $state.go("login");

        Messages.startSync();

        $scope.storage = Messages.storage;
    }
]);