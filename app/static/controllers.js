var app = angular.module('contribute.controllers', [])

.factory('resultHolder', function() {
    var service = {};
    var _result;
    service.store = function(result) {
        _result = result;
    };
    service.get = function() {
        return _result;
    };
    return service;
})

.controller('WhatIsThisController', ['$scope', function($scope) {

}])

.controller('ValidatorController', [
    '$scope', '$location', '$http', 'resultHolder',
    function($scope, $location, $http, resultHolder) {

        document.title = '/contribute.json';

        $scope.validation = {};
        $scope.validation.url = '';
        $scope.validation.method = 'url';

        $scope.validate = function() {
            if ($scope.validation.method === 'url') {
                if (!$scope.validation.url.trim()) return;
                var url = $scope.validation.url.trim();
                $location.path('/' + encodeURIComponent(url));
                // $location.path('/' + encodeURI(url));
                return false;
            } else if ($scope.validation.method === 'text') {
                if (!$scope.validation.text.trim()) return;
                    $http.post('/validate', $scope.validation.text)
                    .success(function(response) {
                        resultHolder.store(response);
                        $location.path('/result');
                    })
                    .error(function() {
                        console.warn(arguments);
                    });
            } else if ($scope.validation.method === 'file') {
                var input = document.querySelector('form input[type="file"]');
                if (!input.files.length) return;
                var reader = new FileReader();
                reader.onload = function(content) {
                    $http.post('/validate', content.target.result)
                    .success(function(response) {
                        // console.log('RESPONSE', response);
                        resultHolder.store(response);
                        $location.path('/result');
                    })
                    .error(function() {
                        console.warn(arguments);
                    });
                }
                reader.readAsText(input.files[0]);
            }
        };

        $scope.changeValidationMethod = function(method) {
            $scope.validation.method = method;
        };
}])

.controller('ExamplesController', [
    '$scope', '$http',
    function($scope, $http) {
        $scope.loading = true;
        document.title = 'Examples of contribute.json';

        $http.get('/examples.json')
        .success(function(response) {
            $scope.urls = response.urls;
        })
        .error(function(data, status) {
            console.error(data, status);
        })
        .finally(function() {
            $scope.loading = false;
        });

        $scope.urlToLink = function(url) {
            return '/' + encodeURIComponent(encodeURIComponent(url));
        };
}])

.controller('ValidationController', [
    '$scope', '$http', '$routeParams', '$location', 'resultHolder',
    function($scope, $http, $routeParams, $location, resultHolder) {
        var url = $routeParams.wildcard;
        if (url) {
            document.title = 'Validating ' + url;
            url = decodeURIComponent(url);
            // console.log('Look up', url);
        }
        $scope.finished = false;
        $scope.error = null;
        $scope.url = url;

        function pretty_json(obj) {
            return JSON.stringify(obj, undefined, 4);
        }

        function showResult(response) {
            console.log(response);
            $scope.schema = pretty_json(response.schema);
            $scope.schema_url = response.schema_url;
            if (!response.request_error) {
                $scope.response = pretty_json(response.response);  // yuck!
            } else {
                $scope.response = response.response;
            }

            if (response.schema_error) {
                $scope.schema_error = response.schema_error;
            } else if (response.validation_error) {
                $scope.error = response.validation_error;
            } else if (response.request_error) {
                $scope.request_error = response.request_error;
            }
            $scope.finished = true;
        }

        if (resultHolder.get()) {
            showResult(resultHolder.get());
        } else if (url) {
            $http({url: '/validate', method: 'POST', params: {url: url}})
            .success(showResult)
            .error(function(data, status) {
                console.warn(data, status);
            });
        } else {
            $location.path('/');
        }


}])

;
