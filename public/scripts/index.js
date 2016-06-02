
var app = angular.module('instalytics', ['ngMaterial', 'ngResource', 'ui.router']);

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

app.service('Server', [
  '$resource',
  function(
    $resource
  ){
    return {
      Articles: $resource('/api/articles/:id')
    };
}]);

app.controller('mainCtrl', [
  '$scope',
  'Server',
  function(
    $scope,
    Server
  ) {
    var element = document.getElementById('map');
    var options = {
      center: { lat: 54.70831, lng: -97.871324},
      zoom: 3
    };

    var map = new google.maps.Map(element, options);

    var articles = Server.Articles.query(function() {
      var data = [];
      for(var i in articles) {
        if(articles[i].lat && articles[i].lng) {
          data.push(new google.maps.LatLng(articles[i].lat, articles[i].lng));
        }
      }

      var heatmap = new google.maps.visualization.HeatmapLayer({
        map: map,
        radius: 15,
        data: data
      });
    });

}]);
