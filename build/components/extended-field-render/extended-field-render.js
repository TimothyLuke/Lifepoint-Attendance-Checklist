app.directive('extendedFieldRender', function($compile, $templateCache) {

    return {
        restrict: 'E',
        replace: true,
        scope: {
            field: '=ngField', //Field information -- this is what the field looks like
            model: '=ngModel', //Host object we look for the data on (the data object) -- this is the data in the field
        },
        templateUrl: 'extended-field-render/extended-field-render.html',
        link: function($scope, $element, $attrs) {

            //Get the model
            //$scope.model = $scope.host[$scope.field.key];

            $scope.showField = true;
            ////////////////////////////////////////

            // $scope.viewInModal = function(item) {
            //     console.log('View in modal', item)
            //     // ModalService.view(item);
            // }

            // $scope.editInModal = function(item) {
            //     console.log('Edit in modal', item)
            //     // ModalService.edit(item);
            // }

            ////////////////////////////////////////

            var template = '';


            switch ($scope.field.type) {
                case 'void':
                case 'null':
                case '':
                    return $element.empty();
                    break;
            }


            // if(!$scope.model[$scope.field.key]) {
            //     return $scope.showField = false;
            // }
            ////////////////////////////////////////


            if ($scope.field.type == 'group') {

                if ($scope.field.asObject) {

                    //Check if multi group or singular
                    if (_.isArray($scope.model[$scope.field.key])) {

                        // template = '<pre ng-repeat="group in model">{{group | json}}</pre>';
                        template = '<div ng-repeat="group in model[field.key]" class="panel panel-default"><div class="panel-heading">{{field.title}} {{$index + 1}}</div><div class="panel-body"><extended-field-render ng-model="group" ng-field="subField" ng-repeat="subField in field.fields"/></div></div>';
                    } else {
                        template = '<extended-field-render ng-model="model[field.key]" ng-field="subField" ng-repeat="subField in field.fields"/>';
                    }
                } else {
                    template = '<extended-field-render ng-model="model" ng-field="subField" ng-repeat="subField in field.fields"/>';

                    //<div ng-repeat="subField in field.fields"> <extended-field-render ng-host="host" ng-model="model" ng-field="subField"></extended-field-render> </div>'; // <extended-field-render ng-host="host" ng-model="group[subField.key]" ng-field="subField"></extended-field-render>
                    // template = '<div class="{{field.className}}"><div ng-repeat="subField in field.fields" class="{{subField.className}}"><pre>{{field | json}}</pre><extended-field-render ng-host="host" ng-model="host[subField.key]" ng-field="subField" ></extended-field-render></div></div>';

                }
            } else {
                //console.log('BOOOOM', $scope.field.key, $scope.model, $scope.model[$scope.field.key])
                //

                if (_.isArray($scope.model[$scope.field.key]) && $scope.model[$scope.field.key].length) {

                    template = $templateCache.get('extended-field-render/field-types/multiple-value.html');
                    //template = '<ol><li class="value in model[field.key]">{{value}}</li></ol>';
                } else {

                    if($scope.model[$scope.field.key] && !_.isArray($scope.model[$scope.field.key])) {
                        template = $templateCache.get('extended-field-render/field-types/value.html');
                    }

                    //template = '<div>{{model[field.key]}}</div>';
                }

                /*
                if (_.isArray($scope.model[$scope.field.key])) {
                    template = '<ol><li class="value in model[field.key]">{{value}}</li></ol>';
                } else {
                    template = '<div>{{model}}</div>';
                }
                */
            }



            ////////////////////////////////////////

            if (template.length) {

                var cTemplate = $compile(template)($scope);

                var contentHolder = $element.find('[field-transclude]');


                if ($scope.field.type == 'group') {
                    contentHolder.addClass($scope.field.className).append(cTemplate);
                } else {
                    $element.addClass($scope.field.className);
                    contentHolder.replaceWith(cTemplate);
                }
            } else {

                $scope.showField = false;
                $element.empty();
            }


        }
    };
})

/////////////////////////////////////////////////////////////////


app.directive('extendedFields', function($compile) {

    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {

            if ($scope.definition) {
                //Flatten all the fields that are defined
                $scope.flattenedFields = getFlattenedFields($scope.definition.fields);
            }
            var template = '<field-edit-render ng-model="item.data[field.key]" ng-field="field" ng-repeat="field in flattenedFields"></field-edit-render>';

            //Compile the template and replace
            var cTemplate = $compile(template)($scope);
            $element.append(cTemplate);

        }
    };
});