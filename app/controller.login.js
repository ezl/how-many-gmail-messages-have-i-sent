var controller = angular.module('gmailChecker.controller.login', []);

controller.controller('gmailChecker.controller.login', ['$scope', 'GAuth', 'GData', '$state', '$cookies', '$timeout',
    function loginCtl($scope, GAuth, GData, $state, $cookies, $timeout) {
        $scope.doLogin = function() {
            GAuth.checkAuth().then(
                function () {
                    $scope.addUser();
                },
                function() {
                    $scope.addUser();
                }
            );
        };
    }
]);
