app.run(function(formlyConfig, $templateCache) {

    formlyConfig.setType({
        name: 'search-select',
        templateUrl: 'fluro-interaction-form/search-select/fluro-search-select.html',
        controller: 'FluroSearchSelectController',
        wrapper: ['bootstrapLabel', 'bootstrapHasError'],
    });

});

app.controller('FluroSearchSelectController', function($scope, $http, Fluro, $filter, FluroValidate) {


    /////////////////////////////////////////////////////////////////////////

    //Search Object
    $scope.search = {};

    //Proposed value
    $scope.proposed = {}

    /////////////////////////////////////////////////////////////////////////

    var to = $scope.to;
    var opts = $scope.options;

    //Selection Object
    $scope.selection = {};

    /////////////////////////////////////////////////////////////////////////

    //Get the definition
    var definition = $scope.to.definition;


    /////////////////////////////////////////////////////////////////////////

    if (!definition.params) {
        definition.params = {};
    }

    /////////////////////////////////////////////////////////////////////////

    var restrictType = definition.params.restrictType;

    //Add maximum search results
    var searchLimit = definition.params.searchLimit;
    if (!searchLimit) {
        searchLimit = 10;
    }

    /////////////////////////////////////////////////////////////////////////

    //console.log('DEFINITION', definition);

    //Minimum and maximum
    var minimum = definition.minimum;
    var maximum = definition.maximum;

    if (!minimum) {
        minimum = 0;
    }

    if (!maximum) {
        maximim = 0;
    }

    $scope.multiple = (maximum != 1);

    if($scope.multiple) {
        if($scope.model[opts.key] && _.isArray($scope.model[opts.key])) {
            $scope.selection.values = angular.copy($scope.model[opts.key]);
        }
    } else {
        if($scope.model[opts.key]) {
            $scope.selection.value = $scope.model[opts.key];
        }
    }

    /////////////////////////////////////////////////////////////////////////


    $scope.canAddMore = function() {

        if (!maximum) {
            return true;
        }

        if ($scope.multiple) {
            return ($scope.selection.values.length < maximum);
        } else {
            if (!$scope.selection.value) {
                return true;
            }
        }
    }


    /////////////////////////////////////////////////////////////////////////

    $scope.contains = function(value) {
        if ($scope.multiple) {
            //Check if the values are selected
            return _.includes($scope.selection.values, value);
        } else {
            return $scope.selection.value == value;
        }
    }

    /////////////////////////////////////////////////////////////////////////

    $scope.$watch('model', function(newModelValue, oldModelValue) {
        if (newModelValue != oldModelValue) {

            var modelValue;


            //If there is properties in the FORM model
            if (_.keys(newModelValue).length) {

                //Get the model for this particular field
                modelValue = newModelValue[opts.key];


               

                if ($scope.multiple) {
                    if (modelValue && _.isArray(modelValue)) {
                        $scope.selection.values = angular.copy(modelValue);
                    } else {
                        $scope.selection.values = [];
                    }
                } else {
                    $scope.selection.value = angular.copy(modelValue);
                }
            }
        }
    }, true);

    /////////////////////////////////////////////////////////////////////////

    function setModel() {

        if ($scope.multiple) {
            $scope.model[opts.key] = angular.copy($scope.selection.values);
        } else {
            $scope.model[opts.key] = angular.copy($scope.selection.value);
        }

        if ($scope.fc) {
            $scope.fc.$setTouched();
        }


        checkValidity();
    }

    /////////////////////////////////////////////////////////////////////////

    if (opts.expressionProperties && opts.expressionProperties['templateOptions.required']) {
        $scope.$watch(function() {
            return $scope.to.required;
        }, function(newValue) {
            checkValidity();
        });
    }

    /////////////////////////////////////////////////////////////////////////

    if ($scope.to.required) {
        var unwatchFormControl = $scope.$watch('fc', function(newValue) {
            if (!newValue) {
                return;
            }
            checkValidity();
            unwatchFormControl();
        });
    }

    /////////////////////////////////////////////////////////////////////////

    function checkValidity() {


        var validRequired;
        var validInput = FluroValidate.validate($scope.model[$scope.options.key], definition);

        //Check if multiple
        if ($scope.multiple) {
            if ($scope.to.required) {
                validRequired = _.isArray($scope.model[opts.key]) && $scope.model[opts.key].length > 0;
            }
        } else {
            if ($scope.to.required) {
                if ($scope.model[opts.key]) {
                    validRequired = true;
                }
            }
        }

        if ($scope.fc) {

            $scope.fc.$setValidity('required', validRequired);
            $scope.fc.$setValidity('validInput', validInput);
        }
    }

    /////////////////////////////////////////////////////////////////////////

    $scope.select = function(value) {

        //console.log('SELECT', value)

        if ($scope.multiple) {
            if (!$scope.canAddMore()) {
                return;
            }
            $scope.selection.values.push(value);


        } else {
            $scope.selection.value = value;

        }

        //Clear proposed item
        $scope.proposed = {};

        //Set the model
        setModel();


    }

    /////////////////////////////////////////////////////////

    $scope.retrieveReferenceOptions = function(val) {


        ////////////////////////

        //Create Search Url
        var searchUrl = Fluro.apiURL + '/content';
        if (restrictType) {
            searchUrl += '/' + restrictType;
        }
        searchUrl += '/search';

        ////////////////////////

        return $http.get(searchUrl + '/' + val, {
            ignoreLoadingBar: true,
            params: {
                limit: searchLimit,
            }
        }).then(function(response) {

            //Got the results
            var results = response.data;

            return _.reduce(results, function(filtered, item) {
                var exists = _.some($scope.selection.values, {
                    '_id': item._id
                });
                if (!exists) {
                    filtered.push(item);
                }
                return filtered;
            }, []);

        });

    }

    ////////////////////////////////////////////////////////////

    $scope.getValueLabel = function(value) {
        if(definition.options && definition.options.length) {
            var match = _.find(definition.options, {value:value});
            if(match && match.name) {
                return match.name;
            }
        }

        return value;
    }

    ////////////////////////////////////////////////////////////

    $scope.retrieveValueOptions = function(val) {

        if (definition.options && definition.options.length) {

            var options = _.reduce(definition.options, function(results, item) {

                var exists;

                if ($scope.multiple) {
                    exists = _.includes($scope.selection.values, item.value);
                } else {
                    exists = $scope.selection.value == item.value;
                }

                if (!exists) {
                    results.push({
                        name:item.name,
                        value:item.value,
                    });
                }

                return results;
            }, []);


            return $filter('filter')(options, val);

        } else if (definition.allowedValues && definition.allowedValues.length) {

            var options = _.reduce(definition.allowedValues, function(results, allowedValue) {

                var exists;

                if ($scope.multiple) {
                    exists = _.includes($scope.selection.values, allowedValue);
                } else {
                    exists = $scope.selection.value == allowedValue;
                }

                if (!exists) {
                    results.push({
                        name:allowedValue,
                        value:allowedValue,
                    });
                }

                return results;
            }, []);

            console.log('Options', options)

            return $filter('filter')(options, val);
        }
    }

    /////////////////////////////////////////////////////////////////////////

    $scope.deselect = function(value) {
        if ($scope.multiple) {
            _.pull($scope.selection.values, value);
        } else {
            delete $scope.selection.value;
        }

        setModel();
    }

    /////////////////////////////////////////////////////////////////////////

    $scope.toggle = function(reference) {
        if ($scope.contains(reference)) {
            $scope.deselect(reference);
        } else {
            $scope.select(reference);
        }

        //Update model
        //setModel();
    }

})