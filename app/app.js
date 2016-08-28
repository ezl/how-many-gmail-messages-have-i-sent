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

module.run(['GAuth', 'GApi', 'GData', '$rootScope', '$window', '$state', '$cookies', 'Messages', '$sessionStorage',
    function(GAuth, GApi, GData, $rootScope, $window, $state, $cookies, Messages, $sessionStorage) {
        $rootScope.gdata = GData;
        var CLIENT;

        if (window.location.hostname == "localhost"){
            CLIENT = '630375832656-7e88ud0mb39o3v3agfu2d1qel3a88ps2.apps.googleusercontent.com';
        }else{
            CLIENT = "630375832656-1omrp5kvpddd3lmqmfp0fklb9gt239b7.apps.googleusercontent.com";
        }
        var SCOPE = [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.modify"
        ];
        SCOPE = SCOPE.join(" ");

        GApi.load('gmail', 'v1');

        // GAuth.load();
        GAuth.setClient(CLIENT);
        GAuth.setScope(SCOPE);
}]);
