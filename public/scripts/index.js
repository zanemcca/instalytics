
var app = angular.module('instalytics', ['ngAnimate', 'angular-loading-bar', 'ngMaterial', 'ngResource', 'ui.router']);

app.config(function(
  $stateProvider,
  $mdGestureProvider,
  $urlRouterProvider
){
  //$mdGestureProvider.skipClickHijack();

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

function loadJSON(file, callback) {   
    var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
    xobj.open('GET', file, true); // Replace 'my_data' with the path to your file
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            try {
              var res = JSON.parse(xobj.responseText);
              callback(res);
            } catch(e) {
              callback();
            }
          }
    };
    xobj.send(null);  
}

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
    $scope.outOfBounds = 0;
    $scope.total = 0;
    $scope.filter = {
      excludeUsers: true
    };

    var convert = function(raw) {
      $scope.noLocation = 0;
      $scope.outOfBounds = 0;

      var bnds = map.getBounds();
      var data = [];

      var users = {};
      for(var i in raw) {
        if(raw[i].location) {
          var loc = posToLatLng(raw[i].location);
          if(loc) {
            if(bnds.contains(loc)){
              if(users[raw[i].username]) {
                users[raw[i].username]++;
              } else {
                users[raw[i].username] = 1;
              }

              data.push(loc);
            } else {
              $scope.outOfBounds++;
            }
          } else {
            $scope.noLocation++;
          }
        } else {
          $scope.noLocation++;
        }
      }

      var user;
      for(var i in users) {
        if(!user || users[i] > users[user]) {
          user = i;
        }
      }

      $scope.topUser = {
        name: user,
        count: users[user]
      };

      $scope.total = data.length;
      return data;
    };

    var heatmap, listener;

    var retrieveViews = function(query) {
      if(query) {
        query = {
          query: query
        };
      }

      var views = Server.Views.query(query,function() {

        var data = convert(views);

        if(!heatmap) { 
          heatmap = new google.maps.visualization.HeatmapLayer({
            map: map,
            radius: 15,
            opacity: 1,
            dissipating: true,
            data: data
          });
        } else {
          heatmap.setData(data);
        }

        if(!listener) {
          listener = google.maps.event.addListener(map, 'bounds_changed', _.debounce(function() {
            $timeout(function() {
              heatmap.setData(convert(views));
            });
           },500));
        }
      });
    };

    $scope.loadData = function() {
      if($scope.filter.excludeUsers) {
        loadJSON('bensUsers.json', function(users) {
          var excludedUsers = [
            'zane',
            'ben',
            //Sophie
            'sophie',
            //Shawn
            'leblanc',
            'shawn',
            'trump',
            //Bens dad
            'superman',
            'apple',
            'wildfire',
            'star',
            'jesus',
            'flash',
            'alert'
          ];

          if(users) { 
            for(var i in users) {
              if(typeof users[i].Username === 'number') {
                excludedUsers.push(users[i].Username.toString());
              } else {
                excludedUsers.push(users[i].Username.toLowerCase());
              }
            }
          }

          retrieveViews({
            username: {
              $nin: excludedUsers
            }
          });
         });
      } else {
        retrieveViews();
      }
    };

    $scope.loadData();
}]);
