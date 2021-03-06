gostApp.controller('DatastreamCtrl', function ($scope, $http, $routeParams, Page) {
    $scope.id = $routeParams.id;
    $scope.Page.setTitle('DATASTREAM(' + $scope.id + ')');
    $scope.Page.setHeaderIcon(iconDatastream);

    $scope.$on("$destroy", function () {
        client.unsubscribe("v1.0/Datastreams(" + getId($scope.id) + ")/Observations");
    });

    labels = [];
    values = [];

	client = new Paho.MQTT.Client(getWebsocketUrl(), guid());
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    client.connect({ onSuccess: onConnect, useSSL: getSSLEnabled() });

      function onConnect() {
        client.subscribe("v1.0/Datastreams(" + getId($scope.id) + ")/Observations");
        console.log("v1.0/Datastreams(" + getId($scope.id) + ")/Observations subscribed");
    }

    function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
            console.log("onConnectionLost:" + responseObject.errorMessage);
        }
    }

    function onMessageArrived(message) {
        switch (message.destinationName) {
            case 'v1.0/Datastreams(' + getId($scope.id) + ')/Observations':
				try {
					  //$scope.brokerVersion = message.payloadString;
					var r = JSON.parse(message.payloadString);
					//$scope.observationsList.push(r)

					values.push(r['result'])
					labels.push(r['phenomenonTime'])
					
					if(values.length > 50){
						values.splice(0, 1);
					}
					
					if(labels.length > 50){
						labels.splice(0, 1);
					}
					
					observationChartAddData(labels, values);
					//$scope.$apply();
					break;
				}
				catch(err) {
					
				}
              
        }
    }

    $http.get(getUrl() + "/v1.0/Datastreams(" + getId($scope.id) + ")").then(function (response) {
        $scope.name = response.data["name"];
        $scope.description = response.data["description"];
        $scope.unitOfMeasurement = response.data["unitOfMeasurement"];
        $scope.observedArea = response.data["observedArea"];
        $scope.Page.selectedDatastream = response.data;
    });

    $scope.tabPropertiesClicked = function () {

    };

    $scope.tabThingClicked = function () {
        $http.get(getUrl() + "/v1.0/Datastreams(" + getId($scope.id) + ")/Thing").then(function (response) {
            $scope.thingId = response.data["@iot.id"];
            $scope.thingDescription = response.data["description"];
            $scope.thingProperties = response.data["properties"];
        });
    };

    $scope.tabSensorClicked = function () {
        $http.get(getUrl() + "/v1.0/Datastreams(" + getId($scope.id) + ")/Sensor").then(function (response) {
            $scope.sensorId = response.data["@iot.id"];
            $scope.sensorDescription = response.data["description"];
            $scope.sensorEncoding = response.data["encodingType"];
            $scope.sensorMetadata = response.data["metadata"];
        });
    };

    $scope.tabObservationsClicked = function () {
	    $http.get(getUrl() + "/v1.0/Datastreams(" + getId($scope.id) + ")/Observations?$orderby=phenomenonTime desc&$top=1").then(function (r) {
		    $http.get(getUrl() + "/v1.0/Datastreams(" + getId($scope.id) + ")/Observations?$filter=phenomenonTime gt "+r.data.value[0]['phenomenonTime'] +" sub duration'P1d'&$orderby=phenomenonTime desc&$top=10000").then(function (response) {
			    response.data.value.reverse();
			    $scope.observationsList = response.data.value;

			    labels = []
			    values = []
			    angular.forEach($scope.observationsList, function (value, key) {
				    if(moment(value['phenomenonTime']).isValid())
				    {
					    labels.push(value['phenomenonTime']);
					    values.push(value['result']);
				    }
				    else
				    {
					    interval = moment.interval(value['phenomenonTime'])
					    labels.push(interval.start());
					    values.push(value['result']);
					    labels.push(interval.end());
					    values.push(value['result']);
				    }

			    });

			    createObservationChart(labels, values);
		    });
	    });
    };

	$scope.tabObservedPropertyClicked = function () {
		$http.get(getUrl() + "/v1.0/Datastreams(" + getId($scope.id) + ")/ObservedProperty").then(function (response) {
			$scope.observedPropertyId = response.data["@iot.id"];
            $scope.observedPropertyName = response.data["name"];
            $scope.observedPropertyDescription = response.data["description"];
            $scope.observedPropertyDefinition = response.data["definition"];
        });
    };
});
