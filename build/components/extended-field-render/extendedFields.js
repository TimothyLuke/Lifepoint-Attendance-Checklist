function getFlattenedFields(array) {
    return _.chain(array).map(function(field) {
        if (field.type == 'group') {

            console.log('GROUP', field);
            return getFlattenedFields(field.fields);
        } else {
            return field;
        }
    }).flatten().value();
}

/////////////////////////////////////////////////////////////////

// app.directive('viewExtendedFields', function($compile) {
//     return {
//         restrict: 'A',
//         link: function($scope, $element, $attrs) {
//             if($scope.definition) {
//                 $scope.flattenedFields = getFlattenedFields($scope.definition.fields);
//             }
//             var template = '<field-view-render ng-model="item.data[field.key]" ng-field="field" ng-repeat="field in flattenedFields"></field-view-render>';

//             //Compile the template and replace
//             var cTemplate = $compile(template)($scope);
//             $element.append(cTemplate);

//         }
//     };
// });


/////////////////////////////////////////////////////////////////

app.directive('viewExtendedFields', function($compile) {
    return {
        restrict: 'A',
        scope:{
            item:'=',
            definition:'=',
        },
        link: function($scope, $element, $attrs) {

            if($scope.definition) {

            
            $scope.fields = $scope.definition.fields;
            console.log('what are the fields?', $scope.fields)
            console.log('current definition', $scope.definition)

            var template = '<extended-field-render ng-model="item.data" ng-field="field" ng-repeat="field in fields"></extended-field-render>';
            var cTemplate = $compile(template)($scope);
            $element.append(cTemplate);

            }





            /**
            if($scope.definition) {
                $scope.flattenedFields = getFlattenedFields($scope.definition.fields);
            }
            var template = '<field-view-render ng-model="item.data[field.key]" ng-field="field" ng-repeat="field in flattenedFields"></field-view-render>';

            //Compile the template and replace
            var cTemplate = $compile(template)($scope);
            $element.append(cTemplate);

            /**/

        }
    };
});


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

/////////////////////////////////////////////////////////////////


app.directive('fieldViewRender', function($compile) {

    return {
        restrict: 'E',
        replace: true,
        scope: {
            field: '=ngField',
            model: '=ngModel'
        },
        templateUrl: 'views/ui/field-view-render.html',
        controller: function($scope, ModalService) {


            $scope.viewInModal = function(item) {
                console.log('View in modal', item)
                ModalService.view(item);
            }

            $scope.editInModal = function(item) {
                console.log('Edit in modal', item)
                ModalService.edit(item);
            }


            if (_.isArray($scope.model)) {
                $scope.multiple = true;
            }





            if ($scope.field.minimum == 1 && $scope.field.maximum == 1) {
                $scope.viewModel = [$scope.model];
            } else {
                $scope.viewModel = $scope.model;
            }
        }
    };
});


app.directive('fieldObjectRender', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            model: '=ngModel'
        },
        link: function($scope) {
            $scope.create = function() {
                if (!$scope.model) {
                    $scope.model = {}
                }
            }


        },
        template: '<div><pre>{{model | json}}</pre><a class="btn btn-default" ng-click="create()" ng-if="!model"><span>Add</span><i class="fa fa-plus"></i></a><div ng-if="model"><json-editor config="model"/></div></div>',
    }
});

app.directive('fieldEditRender', function($compile) {

    return {
        restrict: 'E',
        replace: true,
        scope: {
            field: '=ngField',
            model: '=ngModel'
        },
        link: function($scope, $element, $attrs) {


            var template = '<div class="form-group"><label>{{field.title}}</label><input ng-model="model" class="form-control" placeholder="{{field.title}}"></div>';


            if ($scope.field.params) {
                $scope.config = $scope.field.params;
            } else {
                $scope.config = {};
            }

            if ($scope.config.restrictType) {
                $scope.config.type = $scope.config.restrictType;
            }




            $scope.config.minimum = $scope.field.minimum;
            $scope.config.maximum = $scope.field.maximum;

            //What directive should we use to render the input
            var renderName = $scope.field.directive;

            switch ($scope.field.type) {
                case 'reference':
                    $scope.config.allowedValues = $scope.field.allowedReferences;
                    $scope.config.defaultValues = $scope.field.defaultReferences;
                    //$scope.config.type = $scope.field.defaultReferences;
                    $scope.config.canCreate = true;
                    renderName = 'content-select';
                    break;
                default:
                    $scope.config.allowedValues = $scope.field.allowedValues;
                    $scope.config.defaultValues = $scope.field.defaultValues;
                    break;
            }

            var attributes = '';

            switch ($scope.field.type) {
                case 'boolean':
                    attributes = 'type="checkbox" ';
                    break;
                case 'float':
                case 'integer':
                case 'number':
                    attributes = 'type="number" ';
                    break;
                case 'email':
                    attributes = 'type="email" ';
                    break;
                case 'date':
                    attributes = 'type="date" ';
                    break;
                case 'reference':
                case 'string':
                    attributes = 'type="text" ';
                    break;
                case 'object':
                    renderName = 'field-object-render';
                    break;

                case 'void':
                    return
                    break;
            }

            if (!renderName) {
                renderName = 'input';
            }

            if (renderName == 'date-select') {
                renderName = 'dateselect';
            }



            switch (renderName) {
                case 'input':
                    if ($scope.field.type == 'boolean') {
                        template = '<div class="form-group"><div class="checkbox"><label><' + renderName + ' ' + attributes + ' ng-model="model"/>{{field.title}}</label></div></div>';
                    } else {
                        template = '<div class="form-group"><label>{{field.title}}</label><' + renderName + ' ' + attributes + ' ng-model="model" placeholder="{{field.title}}" class="form-control" ng-params="config"/></div>';
                    }
                    break;
                case 'textarea':
                    template = '<div class="form-group"><label>{{field.title}}</label><' + renderName + ' ' + attributes + ' ng-model="model" placeholder="{{field.title}}" class="form-control" ng-params="config"/></div>';
                    break;
                case 'select':
                    template = '<div class="form-group"><label>{{field.title}}</label><select ' + attributes + ' ng-model="model" class="form-control" ng-params="config">';
                    _.each($scope.field.options, function(option) {
                        template += '<option value="' + option.value + '">' + option.name + '</option>';
                    })

                    template += '</select></div>';
                    break;
                default:
                    template = '<div class="form-group"><label>{{field.title}}</label><' + renderName + ' ' + attributes + ' ng-model="model" ng-params="config"/></div>';
                    break;

            }


            if (template && template.length) {
                //Compile the template and replace
                var cTemplate = $compile(template)($scope);
                $element.replaceWith(cTemplate);
            }

        }
    };
});