app.controller('FluroInteractionButtonSelectController', function($scope, FluroValidate) {


    /////////////////////////////////////////////////////////////////////////

    var to = $scope.to;
    var opts = $scope.options;

    $scope.selection = {
        values: [],
        value: null,
    }


    /////////////////////////////////////////////////////////////////////////

    //Get the definition
    var definition = $scope.to.definition;

    //Minimum and maximum
    var minimum = definition.minimum;
    var maximum = definition.maximum;

    if(!minimum) {
        minimum = 0;
    }

    if(!maximum) {
        maximim = 0;
    }

    $scope.multiple = (maximum != 1);


    /////////////////////////////////////////////////////////////////////////

    $scope.dragControlListeners = {
        //accept: function (sourceItemHandleScope, destSortableScope) {return boolean}//override to determine drag is allowed or not. default is true.
        //itemMoved: function (event) {//Do what you want},
        orderChanged: function(event) {
            //Do what you want
            $scope.model[opts.key] = angular.copy($scope.selection.values);
        },
        //containment: '#board'//optional param.
        //clone: true //optional param for clone feature.
        //allowDuplicates: false //optional param allows duplicates to be dropped.
    };


    /////////////////////////////////////////////////////////////////////////

    $scope.selectBox = {}

    $scope.selectUpdate = function() {
        if(!$scope.selectBox.item) {
            return;
        }
        $scope.selection.values.push($scope.selectBox.item);
        $scope.model[opts.key] = angular.copy($scope.selection.values);
    }

    /////////////////////////////////////////////////////////////////////////




    $scope.canAddMore = function() {

        if(!maximum) {
            return true;
        }
       
        if($scope.multiple) {
            return ($scope.selection.values.length < maximum);
        } else {
            if(!$scope.selection.value) {
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

    $scope.select = function(value) {

        if ($scope.multiple) {
            if (!$scope.canAddMore()) {
                return;
            }
            $scope.selection.values.push(value);
        } else {
            $scope.selection.value = value;
        }
    }

    /////////////////////////////////////////////////////////////////////////

    $scope.deselect = function(value) {
        if ($scope.multiple) {
            _.pull($scope.selection.values, value);
        } else {
            $scope.selection.value = null;
        }
    }

    /////////////////////////////////////////////////////////////////////////

    $scope.toggle = function(reference) {

        if ($scope.contains(reference)) {
            $scope.deselect(reference);
        } else {
            $scope.select(reference);
        }

        //Update model
        setModel();
    }


    /////////////////////////////////////////////////////////////////////////

    // initialize the checkboxes check property
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

    function setModel() {
        if ($scope.multiple) {
            $scope.model[opts.key] = angular.copy($scope.selection.values);
        } else {
            $scope.model[opts.key] = angular.copy($scope.selection.value);
        }

        if ($scope.fc) {
            $scope.fc.$setTouched();
        }

        //console.log('Model set!', $scope.model[opts.key]);
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
})