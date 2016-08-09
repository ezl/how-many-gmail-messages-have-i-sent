'use strict';

// Declare app level module which depends on views, and components
angular.module('gmailChecker', [
  'ngCookies',
  'ui.router',
  'angular-google-gapi',
  'gmailChecker.router',
  'gmailChecker.controller'
]).
run(['GAuth', 'GApi', 'GData', '$rootScope', '$window', '$state',
	function(GAuth, GApi, GData, $rootScope, $window, $state) {
		$rootScope.gdata = GData;

        var CLIENT = '630375832656-7e88ud0mb39o3v3agfu2d1qel3a88ps2.apps.googleusercontent.com';
        var SCOPE = [
        	"https://www.googleapis.com/auth/userinfo.email",
        	"https://www.googleapis.com/auth/gmail.readonly"
        ];
        SCOPE = SCOPE.join(" ");

        GApi.load('gmail', 'v1');

        GAuth.setClient(CLIENT);
        GAuth.setScope(SCOPE);
	    // GAuth.load();

        GAuth.checkAuth().then(
            function (user) {
                console.log(user.name + 'is login')
            },
            function() {
            	$state.go("login");
            }
        );

        $rootScope.logout = function() {
            GAuth.logout().then(function () {
                $cookies.remove('userId');
                $state.go('login');
            });
        };
}]);
