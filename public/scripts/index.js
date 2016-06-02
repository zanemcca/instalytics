
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
      Views: $resource('/api/views'),
      Articles: $resource('/api/articles/:id')
    };
}]);

app.constant(
  '_',
  window._
);

app.controller('mainCtrl', [
  '$scope',
  '$timeout',
  'Server',
  '_',
  function(
    $scope,
    $timeout,
    Server,
    _
  ) {
    var element = document.getElementById('map');
    var options = {
      center: { lat: 54.70831, lng: -97.871324},
      zoom: 3
    };

    var map = new google.maps.Map(element, options);

    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    searchBox.addListener('places_changed', function() {
      var places = searchBox.getPlaces();
      if(places.length === 0) {
        return;
      }

      var bounds = new google.maps.LatLngBounds();
      places.forEach(function(place) {
        if(place.geometry.viewport) {
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });
      map.fitBounds(bounds);
    });

    var posToLatLng = function(pos) {
      if(pos.lat && pos.lng) {
        return new google.maps.LatLng(pos.lat, pos.lng);
      } else if(pos.coordinates) {
        return new google.maps.LatLng(pos.coordinates[1], pos.coordinates[0]);
      }
    };

    $scope.noLocation = 0;

    var excludedUsers = [
      'zane',
      'shawn',
      'superman',
      'flash',
      'ben',
      'fastresponse',
      '3000',
      'mrreportz'
    ];
    //excludedUsers = [];

    var views = Server.Views.query({
      query: {
        username: {
          $nin: excludedUsers 
        }
      }
    },function() {
      var data = [];
      for(var i in views) {
        if(views[i].location) {
          var loc = posToLatLng(views[i].location);
          if(loc) {
            data.push(loc);
          } else {
            $scope.noLocation++;
          }
        } else {
          $scope.noLocation++;
        }
      }

      $scope.total = views.length;

      var heatmap = new google.maps.visualization.HeatmapLayer({
        map: map,
        radius: 15,
        opacity: 1,
        dissipating: true,
        data: data
      });

      google.maps.event.addListener(map, 'bounds_changed', _.debounce(function() {
        var bnds = map.getBounds();
        var minimized = [];
        for( var i in data) {
          if(bnds.contains(data[i])){
            minimized.push(data[i]);
          }
        }
        $timeout(function() {
          $scope.total = minimized.length;
        });
        heatmap.setData(minimized);
      },500));
    });

}]);
