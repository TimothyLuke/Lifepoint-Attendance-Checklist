/**/
app.run(function(formlyConfig, $templateCache) {

    formlyConfig.setType({
        name: 'nested',
        templateUrl: 'fluro-interaction-form/nested/fluro-nested.html',
        controller: 'FluroInteractionNestedController',
    });

});

//////////////////////////////////////////////////////////

app.controller('FluroInteractionNestedController', function($scope) {


    //Definition
    var def = $scope.to.definition;

    ////////////////////////////////////

    var minimum = def.minimum;
    var maximum = def.maximum;

    ////////////////////////////////////

    $scope.$watch('model[options.key]', function(model) {
        if (!model) {
            console.log('Reset Model cos no value!')
            resetDefaultValue();
        }
    });

    ////////////////////////////////////


    function resetDefaultValue() {
        var defaultValue = angular.copy($scope.to.baseDefaultValue);
        if(!$scope.model) {
            console.log('NO RESET Reset Model Values', $scope.options.key, defaultValue);
        }
        $scope.model[$scope.options.key] = defaultValue;
    }

    ////////////////////////////////////

    //Listen for a reset event
    $scope.$on('form-reset', resetDefaultValue);

    ////////////////////////////////////

    $scope.addAnother = function() {

        console.log('Add another')
        $scope.model[$scope.options.key].push({});
    }

    ////////////////////////////////////

    $scope.canRemove = function() {
        if (minimum) {
            if ($scope.model[$scope.options.key].length > minimum) {
                return true;
            }
        } else {
            return true;
        }
    }

    ////////////////////////////////////

    $scope.canAdd = function() {
        if (maximum) {
            if ($scope.model[$scope.options.key].length < maximum) {
                return true;
            }
        } else {
            return true;
        }
    }


    $scope.copyFields = function() {

        var copiedFields = angular.copy($scope.options.data.fields);
        $scope.options.data.replicatedFields.push(copiedFields);

        return copiedFields;
    }

    $scope.copyDataFields = function() {
        var copiedFields = angular.copy($scope.options.data.dataFields);
        $scope.options.data.replicatedFields.push(copiedFields);
        return copiedFields;
    }
});
/**/