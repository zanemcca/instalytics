
var app = angular.module('instalytics', ['chart.js', 'ngAnimate', 'angular-loading-bar', 'ngMaterial', 'ngResource', 'ui.router']);

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
      DownVotes: $resource('/api/downvotes'),
      UpVotes: $resource('/api/upvotes'),
      Clicks: $resource('/api/clicks'),
      Shares: $resource('/api/shares'),
      Articles: $resource('/api/articles'),
      Subarticles: $resource('/api/subarticles')
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

var processDate = function(raw, output){
  if(raw._id) {
    var date = new Date(parseInt(raw._id.toString().substring(0,8), 16)*1000);
    var dateString = date.toDateString();
    if(output[dateString]) {
      output[dateString].count++;
    } else {
      output[dateString] = {
        count: 1,
        date: date
      }
    }
  }
};

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
      type: 'Views',
      excludeUsers: true
    };

    var IN_VIEW = 2;
    var OUT_VIEW = 1;
    var TOTAL = 0;
    $scope.time = {
      labels: ['loading'],
      series: ['Total','OutOfView', 'InView'],
      data: [[0], [0], [0]]
    };

    $scope.graph = {
      showTotal: false,
      showOutView: false
    };


    var convert = function(raw) {
      console.log('Starting processing');
      $scope.noLocation = -2;
      $scope.outOfBounds = 0;
      $scope.unique = 0;

      var bnds = map.getBounds();
      var data = [];

      var users = {};
      var time = {};
      var outViewTime = {};
      for(var i in raw) {
        if(raw[i].location) {
          var loc = posToLatLng(raw[i].location);
          if(loc) {
            if(bnds.contains(loc)){
              processDate(raw[i], time);
              if(users[raw[i].username]) {
                users[raw[i].username]++;
              } else {
                $scope.unique++;
                users[raw[i].username] = 1;
              }
              data.push(loc);
            } else {
              processDate(raw[i], outViewTime);
              $scope.outOfBounds++;
            }
          } else {
            processDate(raw[i], outViewTime);
            $scope.noLocation++;
          }
        } else {
          processDate(raw[i], outViewTime);
          $scope.noLocation++;
        }
      }

      var user;
      for(var i in users) {
        if(!user || users[i] > users[user]) {
          user = i;
        }
      }

      try { 
        var sortedTime = Object.keys(time).sort(function(a,b) {
          return time[a].date.getTime() - time[b].date.getTime();
        }).map(function(sortedKey) {
          return time[sortedKey];
        });

        var sortedOutViewTime = Object.keys(outViewTime).sort(function(a,b) {
          return outViewTime[a].date.getTime() - outViewTime[b].date.getTime();
        }).map(function(sortedKey) {
          return outViewTime[sortedKey];
        });

        $scope.time.data[IN_VIEW].length = 0;
        $scope.time.data[OUT_VIEW].length = 0;
        $scope.time.data[TOTAL].length = 0;
        $scope.time.labels.length = 0;

        // Prepopulate the dates up to the first sortedTime date
        var date = (new Date(sortedOutViewTime[0].date.toDateString())).getTime();
        var end = (new Date(sortedTime[0].date.toDateString())).getTime();
        if(date < end) {
          $scope.time.labels.push(sortedOutViewTime[0].date.toDateString());
          $scope.time.data[IN_VIEW].push(0);
          while(end - (new Date($scope.time.labels[$scope.time.labels.length -1])).getTime() > 1000*60*60*24) {
          //while(end - (new Date($scope.time.labels[$scope.time.labels.length -1])).getTime() > 0) {
            $scope.time.labels.push((new Date((new Date($scope.time.labels[$scope.time.labels.length -1])).getTime() + 1000*60*60*24)).toDateString());
            $scope.time.data[IN_VIEW].push(0);
          }
        }

        console.log('Processing in view');
        for(var i in sortedTime) {
          if($scope.time.labels.length > 0) {
            //Fill in any missing days
            var date = (new Date(sortedTime[i].date.toDateString())).getTime();
            while(date - (new Date($scope.time.labels[$scope.time.labels.length -1])).getTime() > 1000*60*60*24) {
              $scope.time.labels.push((new Date((new Date($scope.time.labels[$scope.time.labels.length -1])).getTime() + 1000*60*60*24)).toDateString());
              $scope.time.data[IN_VIEW].push(0);
            }
          }
          $scope.time.labels.push(sortedTime[i].date.toDateString());
          $scope.time.data[IN_VIEW].push(sortedTime[i].count);
        }

        console.log('Processing out of view');
        for(var i in sortedOutViewTime) {
          //Fill in any missing labels 
          while($scope.time.data[OUT_VIEW].length >= $scope.time.labels.length) {
            $scope.time.labels.push((new Date((new Date($scope.time.labels[$scope.time.labels.length -1])).getTime() + 1000*60*60*24)).toDateString());
          }

          var dateString = sortedOutViewTime[i].date.toDateString();
          var date = (new Date(dateString)).getTime();
          //Fill in any missing days
          while(date - (new Date($scope.time.labels[$scope.time.data[OUT_VIEW].length])).getTime() > 0) {
            $scope.time.data[OUT_VIEW].push(0);
            if($scope.time.data[OUT_VIEW].length >= $scope.time.labels.length) {
              $scope.time.labels.push((new Date((new Date($scope.time.labels[$scope.time.labels.length -1])).getTime() + 1000*60*60*24)).toDateString());
            }
          }

          if($scope.graph.showOutView) {
            $scope.time.data[OUT_VIEW].push(sortedOutViewTime[i].count);
          } else {
            $scope.time.data[OUT_VIEW].push(0);
          }
        }
        // Fill in the remainder
        while($scope.time.data[OUT_VIEW].length < $scope.time.labels.length) {
          $scope.time.data[OUT_VIEW].push(0);
        }
        while($scope.time.data[IN_VIEW].length < $scope.time.labels.length) {
          $scope.time.data[IN_VIEW].push(0);
        }

        for(var i in $scope.time.labels) {
          if($scope.graph.showTotal) {
            $scope.time.data[TOTAL].push($scope.time.data[IN_VIEW][i] + $scope.time.data[OUT_VIEW][i]);
          } else {
            $scope.time.data[TOTAL].push(0);
          }
        }

      } catch(e) {
        console.log(e);
      }

      /*
      console.log($scope.time.data[IN_VIEW].length);
      console.log($scope.time.data[OUT_VIEW].length);
      console.log($scope.time.data[TOTAL].length);
      console.log($scope.time.labels.length);
     */

      console.log('Finished processing!');

      $scope.topUser = {
        name: user,
        count: users[user]
      };

      $scope.total = data.length;
      return data;
    };

    var items, heatmap, listener;

    var retrieve = function(query) {
      if(query) {
        query = {
          query: query
        };
      }

      items = Server[$scope.filter.type].query(query,function() {

        var data = convert(items);

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
              heatmap.setData(convert(items));
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
            //'gavin',
            //'sophie',
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

          retrieve({
            username: {
              $nin: excludedUsers
            }
          });
         });
      } else {
        retrieve();
      }
    };

    $scope.loadData();
}]);
