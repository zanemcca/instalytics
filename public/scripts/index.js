
var app = angular.module('instalytics', ['ngMaterial', 'ui.router']);

app.config(function(
  $stateProvider,
  $urlRouterProvider
){

  var stateProvider = $stateProvider
  .state('app', {
    url: '/app',
    templateUrl: 'templates/main.html',
    controller: 'mainCtrl'
  });

  $urlRouterProvider.otherwise('/app');
});

app.controller('mainCtrl', [
  '$scope',
  function(
    $scope
  ) {
    //TODO
}]);
