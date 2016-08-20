var controller = angular.module('gmailChecker.controller.login', []);

controller.controller('gmailChecker.controller.login', ['$scope', 'GAuth', 'GData', '$state', '$cookies', '$timeout',
    function loginCtl($scope, GAuth, GData, $state, $cookies, $timeout) {
        if(GData.isLogin()){
            $state.go('home');
        }

        var ifLogin = function() {
            $cookies.put('userId', GData.getUserId());
            $state.go('home');
        };

        $scope.doLogin = function() {
            GAuth.checkAuth().then(
                function () {
                    console.debug("auth checked");
                    ifLogin();
                },
                function() {
                    console.debug("do auth checking");
                    GAuth.login().then(function(){
                        console.debug("auth checked");
                        ifLogin();
                    });
                }
            );
        };
    }
]);
