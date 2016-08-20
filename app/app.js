'use strict';

var module = angular.module('gmailChecker', [
    'ngCookies',
    'ui.router',
    'angular-google-gapi',
    'ngStorage',

    'gmailChecker.router',
    'gmailChecker.controller',
    'Messages'
]);

module.run(['GAuth', 'GApi', 'GData', '$rootScope', '$window', '$state', '$cookies', 'Messages',
    function(GAuth, GApi, GData, $rootScope, $window, $state, $cookies, Messages) {
        $rootScope.gdata = GData;

        var CLIENT = '630375832656-7e88ud0mb39o3v3agfu2d1qel3a88ps2.apps.googleusercontent.com';
        var SCOPE = [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.modify"
        ];
        SCOPE = SCOPE.join(" ");

        GApi.load('gmail', 'v1');

        GAuth.setClient(CLIENT);
        GAuth.setScope(SCOPE);

        var currentUser = $cookies.get('userId');

        if(currentUser) {
            GData.setUserId(currentUser);
            GAuth.checkAuth().then(
                function () {
                    if($state.includes('login'))
                        $state.go('home');
                },
                function() {
                    $state.go('login');
                }
            );
        } else {
            $state.go('login');
        }

        $rootScope.logout = function() {
            GAuth.logout().then(function () {
                $cookies.remove('userId');
                GData.setUserId(null);
                Messages.reset();
                $state.go('login');
            });
        };
}]);
