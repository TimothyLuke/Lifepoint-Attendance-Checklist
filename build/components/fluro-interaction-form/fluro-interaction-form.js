app.directive('interactionForm', function($compile) {
    return {
        restrict: 'E',
        //replace: true,
        scope: {
            model: '=ngModel',
            integration: '=ngPaymentIntegration',
            vm: '=?config',
            callback: '=?callback',
        },
        transclude: true,
        controller: 'InteractionFormController',
        template: '<div class="fluro-interaction-form" ng-transclude-here />',
        link: function($scope, $element, $attrs, $ctrl, $transclude) {
            $transclude($scope, function(clone, $scope) {
                $element.find('[ng-transclude-here]').append(clone); // <-- will transclude it's own scope
            });
        },
    };
});

////////////////////////////////////////////////////////////////////////

app.directive('webform', function($compile) {
    return {
        restrict: 'E',
        //replace: true,
        scope: {
            model: '=ngModel',
            integration: '=ngPaymentIntegration',
            vm: '=?config',
            debugMode: '=?debugMode',
            callback: '=?callback',
            linkedEvent: '=?linkedEvent',
        },
        transclude: true,
        controller: 'InteractionFormController',
        templateUrl: 'fluro-interaction-form/fluro-web-form.html',
        link: function($scope, $element, $attrs, $ctrl, $transclude) {
            console.log('CLONING')
            $transclude($scope, function(clone, $scope) {


                $scope.transcludedContent = clone;

                //$element.find('[ng-transclude-here]').append(clone); // <-- will transclude it's own scope
            });
        },
    };
});


app.config(function(formlyConfigProvider) {

    /*
    formlyConfigProvider.setWrapper({
      name: 'validation',
      types: ['currency'],
      templateUrl: 'error-messages.html'
    });
*/





    formlyConfigProvider.setType({
        name: 'currency',
        extends: 'input',
        controller: function($scope) {
            /*
            console.log('CURRENCY SCOPE', $scope);

            $scope.$watch('model[options.key]', function(val) {

                if(!$scope.model[$scope.options.key] && $scope.model[$scope.options.key] != 0 ) {
                    console.log('Set!')
                    $scope.model[$scope.options.key] = 0;
                }
            })
            /**/
        },

        wrapper: ['bootstrapLabel', 'bootstrapHasError'],
        defaultOptions: {
            ngModelAttrs: {
                currencyDirective: {
                    attribute: 'ng-currency'
                },
                fractionValue: {
                    attribute: 'fraction',
                    bound: 'fraction'
                },
                minimum: {
                    attribute: 'min',
                    bound: 'min'
                },
                maximum: {
                    attribute: 'max',
                    bound: 'max'
                }
            },
            templateOptions: {
                customAttrVal: '',
                required: true,
                fraction: 2,
            },
            validators: {
                validInput: {
                    expression: function($viewValue, $modelValue, scope) {

                        var numericValue = Number($modelValue);

                        if (isNaN(numericValue)) {
                            return false;
                        }

                        //Get Minimum and Maximum Amounts
                        var minimumAmount = scope.options.data.minimumAmount;
                        var maximumAmount = scope.options.data.maximumAmount;

                        if (minimumAmount && numericValue < minimumAmount) {
                            return false;
                        }

                        if (maximumAmount && numericValue > maximumAmount) {
                            return false;
                        }

                        return true;
                    }
                }
            }
        }
    });


})

////////////////////////////////////////////////////////////////////////

app.run(function(formlyConfig, $templateCache) {

    formlyConfig.templateManipulators.postWrapper.push(function(template, options, scope) {
        var fluroErrorTemplate = $templateCache.get('fluro-interaction-form/field-errors.html');
        return '<div>' + template + fluroErrorTemplate + '</div>';
    });

    //////////////////////////////////

    /*
    formlyConfig.setType({
        name: 'value-select',
        templateUrl: 'fluro-interaction-form/fluro-value-select.html',
        controller: 'FluroValueSelectController',
        defaultOptions: {
            //noFormControl: true,
        },
    });
*/




    formlyConfig.setType({
        name: 'multiInput',
        templateUrl: 'fluro-interaction-form/multi.html',
        defaultOptions: {
            noFormControl: true,
            wrapper: ['bootstrapLabel', 'bootstrapHasError'],
            templateOptions: {
                inputOptions: {
                    wrapper: null
                }
            }
        },
        controller: /* @ngInject */ function($scope) {
            $scope.copyItemOptions = copyItemOptions;

            function copyItemOptions() {
                return angular.copy($scope.to.inputOptions);
            }
        }
    });

    /**
    // set templates here
    formlyConfig.setType({
        name: 'nested',
        templateUrl: 'fluro-interaction-form/nested/fluro-nested.html',
        controller: function($scope) {

            $scope.$watch('model[options.key]', function(keyModel) {
                if (!keyModel) {
                    $scope.model[$scope.options.key] = [];
                }
            })

            ////////////////////////////////////

            //Definition
            var def = $scope.to.definition;

            var minimum = def.minimum;
            var maximum = def.maximum;
            var askCount = def.askCount;

            if (!minimum) {
                minimum = 0;
            }

            if (!maximum) {
                maximum = 0;
            }

            if (!askCount) {
                askCount = 0;
            }

            //////////////////////////////////////

            if (minimum && askCount < minimum) {
                askCount = minimum;
            }

            if (maximum && askCount > maximum) {
                askCount = maximum;
            }

            //////////////////////////////////////

            if (maximum == 1 && minimum == 1 && $scope.options.key) {
                //console.log('Only 1!!!', $scope.options)
            } else {
                if (askCount && !$scope.model[$scope.options.key].length) {
                    _.times(askCount, function() {
                        $scope.model[$scope.options.key].push({});
                    });
                }
            }

            $scope.addAnother = function() {
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
                return angular.copy($scope.options.data.fields);
            }
        }
        //defaultValue:[],
        //noFormControl: true,
        //template: '<formly-form model="model[options.key]" fields="options.data.fields"></formly-form>'
    });

/**/

    //////////////////////////////////

    formlyConfig.setType({
        name: 'payment',
        templateUrl: 'fluro-interaction-form/payment/payment.html',
        //controller: 'FluroPaymentController',
        defaultOptions: {
            noFormControl: true,
        },
    });

    /**/
    formlyConfig.setType({
        name: 'custom',
        templateUrl: 'fluro-interaction-form/custom.html',
        controller: 'CustomInteractionFieldController',
        wrapper: ['bootstrapHasError']
    });

    formlyConfig.setType({
        name: 'button-select',
        templateUrl: 'fluro-interaction-form/button-select/fluro-button-select.html',
        controller: 'FluroInteractionButtonSelectController',
        wrapper: ['bootstrapLabel', 'bootstrapHasError'],
    });



    formlyConfig.setType({
        name: 'date-select',
        templateUrl: 'fluro-interaction-form/date-select/fluro-date-select.html',
        wrapper: ['bootstrapLabel', 'bootstrapHasError']
    });



    formlyConfig.setType({
        name: 'terms',
        templateUrl: 'fluro-interaction-form/fluro-terms.html',
        wrapper: ['bootstrapLabel', 'bootstrapHasError'],
    });


    formlyConfig.setType({
        name: 'order-select',
        templateUrl: 'fluro-interaction-form/order-select/fluro-order-select.html',
        controller: 'FluroInteractionButtonSelectController',
        wrapper: ['bootstrapLabel', 'bootstrapHasError'],
    });

    /**/

});

////////////////////////////////////////////////////////////////////////

app.controller('CustomInteractionFieldController', function($scope, FluroValidate) {
    $scope.$watch('model[options.key]', function(value) {
        if (value) {
            if ($scope.fc) {
                $scope.fc.$setTouched();
            }
        }
    }, true);
});

/*
////////////////////////////////////////////////////////////////////////

app.controller('FluroValueSelectController', function($scope, FluroValidate) {

    //Minimum and maximum
    var minimum = $scope.to.definition.minimum;
    var maximum = $scope.to.definition.maximum;

    //multiple
    var multiple = (maximum != 1)

    if (!$scope.model[$scope.options.key]) {
        if (multiple) {
            $scope.model[$scope.options.key] = [];
        }
    }

    /////////////////////////////////////////////////////////////////////////

    $scope.$watch('model[options.key]', function(value) {
        if (value) {
            $scope.fc.$setTouched();
        }
    }, true);

    /////////////////////////////////////////////////////////////////////////

    $scope.contains = function(value) {

        if (multiple) {
            return _.contains($scope.model[$scope.options.key], value);
        } else {
            return ($scope.model[$scope.options.key] == value);
        }
    }

    /////////////////////////////////////////////////////////////////////////

    function checkValidity() {
        var valid = FluroValidate.validate($scope.model[$scope.options.key], $scope.to.definition);

        //Set the valid vaue
        $scope.fc.$setValidity('validInput', valid);
    }

    /////////////////////////////////////////////////////////////////////////

    $scope.toggle = function(value) {


        if (!$scope.contains(value)) {
            if (multiple) {
                $scope.model[$scope.options.key].push(value);
            } else {
                //Make this value the active value
                $scope.model[$scope.options.key] = value;
            }
        } else {
            if (multiple) {
                _.pull($scope.model[$scope.options.key], value);
            } else {
                $scope.model[$scope.options.key] = null;
            }
        }

        $scope.fc.$setTouched();
        checkValidity();
    }
});
*/

/*
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

function setTouched(fc) {
    if (fc) {
        if (fc.$setTouched) {
            fc.$setTouched();
        } else {
            _.each(fc, function(f) {
                f.$setTouched();
            })
        }
    }
}

////////////////////////////////////////////////////////////////////////

function setUntouched(fc) {
    if (fc) {
        if (fc.$setUntouched) {
            fc.$setUntouched();
        } else {
            _.each(fc, function(f) {
                f.$setUntouched();
            })
        }
    }
}

////////////////////////////////////////////////////////////////////////


function setDirty(fc) {
    if (fc) {
        if (fc.$setDirty) {
            fc.$setDirty();
        } else {
            _.each(fc, function(f) {
                f.$setDirty();
            })
        }
    }
}

////////////////////////////////////////////////////////////////////////

function setValidity(fc, str, valid) {
    if (fc) {
        if (fc.$setValidity) {
            fc.$setValidity(str, valid);
        } else {
            _.each(fc, function(f) {
                f.$setValidity(str, valid);
            })
        }
    }
}

*/

////////////////////////////////////////////////////////////////////////



/*
app.controller('FluroInteractionReferenceSelectController', function($scope, FluroValidate, FluroContent) {

    //Get the definition
    var definition = $scope.to.definition;

    //Minimum and maximum
    var minimum = definition.minimum;
    var maximum = definition.maximum;

    /////////////////////////////////////////////////////////////////////////

    //Setup Model as array if multiple
    var multiple = (maximum != 1)

    if (!$scope.model[$scope.options.key]) {
        if (multiple) {
            $scope.model[$scope.options.key] = [];
        }
    }

    /////////////////////////////////////////////////////////////////////////

    $scope.$watch('model[options.key]', function() {
        checkValidity();
    })

    /////////////////////////////////////////////////////////////////////////

    $scope.contains = function(value) {
        if (!$scope.model[$scope.options.key]) {
            $scope.model[$scope.options.key] = [];
        }
        if (multiple) {
            return _.contains($scope.model[$scope.options.key], value);
        } else {
            return ($scope.model[$scope.options.key] == value);
        }
    }

   
    
    /////////////////////////////////////////////////////////////////////////

    function checkValidity() {
        var valid = FluroValidate.validate($scope.model[$scope.options.key], definition);
        console.log('VALID?', valid)
        //Set the valid vaue
        setValidity($scope.fc, 'validInput', valid);
    }


    /////////////////////////////////////////////////////////////////////////

    $scope.toggle = function(value) {
        if (!$scope.contains(value)) {
            if (multiple) {
                if (!$scope.model[$scope.options.key]) {
                    $scope.model[$scope.options.key] = [];
                }
                $scope.model[$scope.options.key].push(value);
            } else {
                //Make this value the active value
                $scope.model[$scope.options.key] = value;
            }
        } else {
            if (multiple) {
                if (!$scope.model[$scope.options.key]) {
                    $scope.model[$scope.options.key] = [];
                }
                _.pull($scope.model[$scope.options.key], value);
            } else {
                $scope.model[$scope.options.key] = null;
            }
        }
       
        setTouched($scope.fc);
        checkValidity();
    }

    /////////////////////////////////////////////////////////////////////////

    if (definition.allowedReferences && definition.allowedReferences.length) {
        $scope.references = definition.allowedReferences;
    } else {
        //Load up the options by querying the database
        FluroContent.resource(definition.params.restrictType).query().$promise.then(function(res) {
            $scope.references = res;
        }, function(res) {
            console.log('Error retrieving references')
        });
    }

    /////////////////////////////////////////////////////////////////////////

});

*/


////////////////////////////////////////////////////////////////////////

app.controller('FluroDateSelectController', function($scope) {

    $scope.today = function() {
        $scope.model[$scope.options.key] = new Date();
    };


    $scope.open = function($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.opened = true;
    };

    $scope.dateOptions = {
        formatYear: 'yy',
        startingDay: 1
    };

    $scope.formats = ['dd/MM/yyyy'];
    $scope.format = $scope.formats[0];


});


////////////////////////////////////////////////////////////////////////


app.controller('InteractionFormController', function($scope, $q, $rootScope, FluroAccess, $parse, $filter, formlyValidationMessages, FluroContent, FluroContentRetrieval, FluroValidate, FluroInteraction) {

    /////////////////////////////////////////////////////////////////

    if (!$scope.vm) {
        $scope.vm = {}
    }

    /////////////////////////////////////////////////////////////////

    // The model object that we reference
    // on the  element in index.html
    if ($scope.vm.defaultModel) {
        $scope.vm.model = angular.copy($scope.vm.defaultModel);
    } else {
        $scope.vm.model = {};
    }

    /////////////////////////////////////////////////////////////////

    // An array of our form fields with configuration
    // and options set. We make reference to this in
    // the 'fields' attribute on the  element
    $scope.vm.modelFields = [];

    /////////////////////////////////////////////////////////////////

    //Keep track of the state of the form
    $scope.vm.state = 'ready';


    /////////////////////////////////////////////////////////////////

    $scope.correctPermissions = true;

    /////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////

    $scope.readyToSubmit = false;

    $scope.$watch('vm.modelForm.$invalid + vm.modelForm.$error', function() {


        // $scope.readyToSubmit = true;
        // return;

        //Interaction Form
        var interactionForm = $scope.vm.modelForm;

        if (!interactionForm) {
            // console.log('Invalid no form')
            return $scope.readyToSubmit = false;
        }

        if (interactionForm.$invalid) {
            // console.log('Invalid because its invalid', interactionForm);
            return $scope.readyToSubmit = false;
        }

        if (interactionForm.$error) {

            // console.log('Has an error', interactionForm.$error);

            if (interactionForm.$error.required && interactionForm.$error.required.length) {
                // console.log('required input not provided');
                return $scope.readyToSubmit = false;
            }

            if (interactionForm.$error.validInput && interactionForm.$error.validInput.length) {
                // console.log('valid input not provided');
                return $scope.readyToSubmit = false;
            }
        }

        // console.log('Form should be good to go')

        //It all worked so set to true
        $scope.readyToSubmit = true;

    }, true)

    /////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////

    formlyValidationMessages.addStringMessage('required', 'This field is required');

    /*
    formlyValidationMessages.messages.required = function($viewValue, $modelValue, scope) {
        return scope.to.label + ' is required';
    }
    */

    formlyValidationMessages.messages.validInput = function($viewValue, $modelValue, scope) {
        return scope.to.label + ' is not a valid value';
    }

    formlyValidationMessages.messages.date = function($viewValue, $modelValue, scope) {
        return scope.to.label + ' is not a valid date';
    }

    /////////////////////////////////////////////////////////////////

    $scope.reset = function() {

        //Reset
        if ($scope.vm.defaultModel) {
            $scope.vm.model = angular.copy($scope.vm.defaultModel);
        } else {
            $scope.vm.model = {};
        }
        $scope.vm.modelForm.$setPristine();
        $scope.vm.options.resetModel();




        //Clear the response from previous submission
        $scope.response = null;
        $scope.vm.state = 'ready';


        //Reset after state change
        console.log('Broadcast reset')
        $scope.$broadcast('form-reset');

    }

    /////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////

    //Function to run on permissions
    // function checkPermissions() {
    //     if ($rootScope.user) {
    //         //Check if we have the correct permissions
    //         var canCreate = FluroAccess.can('create', $scope.model.definitionName);
    //         var canSubmit = FluroAccess.can('submit', $scope.model.definitionName);

    //         //Allow if the user can create or submit
    //         $scope.correctPermissions = (canCreate | canSubmit);
    //     } else {
    //         //Just do this by default
    //         $scope.correctPermissions = true;
    //     }
    // }

    // /////////////////////////////////////////////////////////////////

    // //Watch if user login changes
    // $scope.$watch(function() {
    //     return $rootScope.user;
    // }, checkPermissions)

    /////////////////////////////////////////////////////////////////

    $scope.$watch('model', function(newData, oldData) {


        // console.log('Model changed');
        if (!$scope.model || $scope.model.parentType != 'interaction') {
            return; //$scope.model = {};
        }

        /////////////////////////////////////////////////////////////////

        //check if we have the correct permissions
        // checkPermissions();

        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////

        // The model object that we reference
        // on the  element in index.html
        // $scope.vm.model = {};
        if ($scope.vm.defaultModel) {
            $scope.vm.model = angular.copy($scope.vm.defaultModel);
        } else {
            $scope.vm.model = {};
        }


        // An array of our form fields with configuration
        // and options set. We make reference to this in
        // the 'fields' attribute on the  element
        $scope.vm.modelFields = [];

        /////////////////////////////////////////////////////////////////

        //Keep track of the state of the form
        $scope.vm.state = 'ready';

        /////////////////////////////////////////////////////////////////

        //Add the submit function
        $scope.vm.onSubmit = submitInteraction;

        /////////////////////////////////////////////////////////////////

        //Keep track of any async promises we need to wait for
        $scope.promises = [];

        /////////////////////////////////////////////////////////////////

        //Submit is finished
        $scope.submitLabel = 'Submit';

        if ($scope.model && $scope.model.data && $scope.model.data.submitLabel && $scope.model.data.submitLabel.length) {
            $scope.submitLabel = $scope.model.data.submitLabel;
        }

        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////

        //Add the required contact details
        var interactionFormSettings = $scope.model.data;

        if (!interactionFormSettings) {
            interactionFormSettings = {};
        }

        if (!interactionFormSettings.allowAnonymous && !interactionFormSettings.disableDefaultFields) {
            interactionFormSettings.requireFirstName = true;
            interactionFormSettings.requireLastName = true;
            interactionFormSettings.requireGender = true;
            interactionFormSettings.requireEmail = true;

            switch (interactionFormSettings.identifier) {
                case 'both':
                    interactionFormSettings.requireEmail =
                        interactionFormSettings.requirePhone = true;
                    break;
                case 'email':
                    interactionFormSettings.requireEmail = true;
                    break;
                case 'phone':
                    interactionFormSettings.requirePhone = true;
                    break;
                case 'either':
                    interactionFormSettings.askPhone = true;
                    interactionFormSettings.askEmail = true;
                    break;
            }
        }


        /////////////////////////////////////////////////////////////////

        var firstNameField;
        var lastNameField;
        var genderField;

        /////////////////////////////////////////////////////////////////

        //Gender
        if (interactionFormSettings.askGender || interactionFormSettings.requireGender) {
            genderField = {
                    key: '_gender',
                    type: 'select',
                    templateOptions: {
                        type: 'email',
                        label: 'Title',
                        placeholder: 'Please select a title',
                        options: [{
                            name: 'Mr',
                            value: 'male'
                        }, {
                            name: 'Ms / Mrs',
                            value: 'female'
                        }],
                        required: interactionFormSettings.requireGender,
                        onBlur: 'to.focused=false',
                        onFocus: 'to.focused=true',
                    },
                    validators: {
                        validInput: function($viewValue, $modelValue, scope) {
                            var value = $modelValue || $viewValue;
                            return (value == 'male' || value == 'female');
                        }
                    }
                }
                //$scope.vm.modelFields.push(newField);
        }

        /////////////////////////////////////////////////////////////////

        //First Name
        if (interactionFormSettings.askFirstName || interactionFormSettings.requireFirstName) {
            firstNameField = {
                key: '_firstName',
                type: 'input',
                templateOptions: {
                    type: 'text',
                    label: 'First Name',
                    placeholder: 'Please enter your first name',
                    required: interactionFormSettings.requireFirstName,
                    onBlur: 'to.focused=false',
                    onFocus: 'to.focused=true',
                }
            }

        }

        /////////////////////////////////////////////////////////////////

        //Last Name
        if (interactionFormSettings.askLastName || interactionFormSettings.requireLastName) {
            lastNameField = {
                key: '_lastName',
                type: 'input',
                templateOptions: {
                    type: 'text',
                    label: 'Last Name',
                    placeholder: 'Please enter your last name',
                    required: interactionFormSettings.requireLastName,
                    onBlur: 'to.focused=false',
                    onFocus: 'to.focused=true',
                }
            }

        }

        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////

        if (genderField && firstNameField && lastNameField) {

            genderField.className = 'col-sm-2';

            firstNameField.className =
                lastNameField.className = 'col-sm-5';

            $scope.vm.modelFields.push({
                fieldGroup: [genderField, firstNameField, lastNameField],
                className: 'row'
            });
        } else if (firstNameField && lastNameField && !genderField) {
            firstNameField.className =
                lastNameField.className = 'col-sm-6';

            $scope.vm.modelFields.push({
                fieldGroup: [firstNameField, lastNameField],
                className: 'row'
            });
        } else {
            if (genderField) {
                $scope.vm.modelFields.push(genderField);
            }

            if (firstNameField) {
                $scope.vm.modelFields.push(firstNameField);
            }

            if (lastNameField) {
                $scope.vm.modelFields.push(lastNameField);
            }
        }



        /////////////////////////////////////////////////////////////////

        //Email Address
        if (interactionFormSettings.askEmail || interactionFormSettings.requireEmail) {
            var newField = {
                key: '_email',
                type: 'input',
                templateOptions: {
                    type: 'email',
                    label: 'Email Address',
                    placeholder: 'Please enter a valid email address',
                    required: interactionFormSettings.requireEmail,
                    onBlur: 'to.focused=false',
                    onFocus: 'to.focused=true',
                },
                validators: {
                    validInput: function($viewValue, $modelValue, scope) {
                        var value = $modelValue || $viewValue;
                        return validator.isEmail(value);
                    }
                }
            }

            if (interactionFormSettings.identifier == 'either') {
                newField.expressionProperties = {
                    'templateOptions.required': function($viewValue, $modelValue, scope) {
                        if (!scope.model._phoneNumber || !scope.model._phoneNumber.length) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            }

            $scope.vm.modelFields.push(newField);
        }


        /////////////////////////////////////////////////////////////////

        //Ask Phone Number
        if (interactionFormSettings.askPhone || interactionFormSettings.requirePhone) {
            var newField = {
                key: '_phoneNumber',
                type: 'input',
                templateOptions: {
                    type: 'tel',
                    label: 'Contact Phone Number',
                    placeholder: 'Please enter a contact phone number',
                    required: interactionFormSettings.requirePhone,
                    onBlur: 'to.focused=false',
                    onFocus: 'to.focused=true',
                }
            }

            if (interactionFormSettings.identifier == 'either') {
                newField.expressionProperties = {
                    'templateOptions.required': function($viewValue, $modelValue, scope) {
                        if (!scope.model._email || !scope.model._email.length) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }

            }


            $scope.vm.modelFields.push(newField);
        }

        /////////////////////////////////////////////////////////////////

        //Age / Date of birth
        if (interactionFormSettings.askDOB || interactionFormSettings.requireDOB) {
            var newField = {
                key: '_dob',
                type: 'dob-select',
                templateOptions: {
                    label: 'Date of birth',
                    placeholder: 'Please provide your date of birth',
                    required: interactionFormSettings.requireDOB,
                    maxDate: new Date(),
                    onBlur: 'to.focused=false',
                    onFocus: 'to.focused=true',
                    // params:{
                    //     hideAge:true,
                    // }

                }
            }

            $scope.vm.modelFields.push(newField);
        }

        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////

        function addFieldDefinition(array, fieldDefinition) {


            if (fieldDefinition.params && fieldDefinition.params.disableWebform) {
                //If we are hiding this field then just do nothing and return here
                return;
            }

            /////////////////////////////
            /////////////////////////////
            /////////////////////////////
            /////////////////////////////

            //Create a new field
            var newField = {};
            newField.key = fieldDefinition.key;

            /////////////////////////////

            //Add the class name if applicable
            if (fieldDefinition.className) {
                newField.className = fieldDefinition.className;
            }

            /////////////////////////////

            //Template Options
            var templateOptions = {};
            templateOptions.type = 'text';
            templateOptions.label = fieldDefinition.title;
            templateOptions.description = fieldDefinition.description;
            templateOptions.params = fieldDefinition.params;

            //Attach a custom error message
            if (fieldDefinition.errorMessage) {
                templateOptions.errorMessage = fieldDefinition.errorMessage;
            }

            //Include the definition itself
            templateOptions.definition = fieldDefinition;

            /////////////////////////////

            //Add a placeholder
            if (fieldDefinition.placeholder && fieldDefinition.placeholder.length) {
                templateOptions.placeholder = fieldDefinition.placeholder;
            } else if (fieldDefinition.description && fieldDefinition.description.length) {
                templateOptions.placeholder = fieldDefinition.description;
            } else {
                templateOptions.placeholder = fieldDefinition.title;
            }

            /////////////////////////////

            //Require if minimum is greater than 1 and not a field group
            templateOptions.required = (fieldDefinition.minimum > 0);

            /////////////////////////////

            templateOptions.onBlur = 'to.focused=false';
            templateOptions.onFocus = 'to.focused=true';

            /////////////////////////////

            //Directive or widget
            switch (fieldDefinition.directive) {
                case 'reference-select':
                case 'value-select':
                    //Detour here
                    newField.type = 'button-select';
                    break;
                case 'select':
                    newField.type = 'select';
                    break;
                case 'wysiwyg':
                    newField.type = 'textarea';
                    break;
                default:
                    newField.type = fieldDefinition.directive;
                    break;
            }


            /////////////////////////////
            /////////////////////////////
            /////////////////////////////

            //Allowed Options

            switch (fieldDefinition.type) {

                case 'reference':
                    //If we have allowed references specified
                    if (fieldDefinition.allowedReferences && fieldDefinition.allowedReferences.length) {
                        templateOptions.options = _.map(fieldDefinition.allowedReferences, function(ref) {
                            return {
                                name: ref.title,
                                value: ref._id,
                            }
                        });
                    } else {
                        //We want to load all the options from the server
                        templateOptions.options = [];

                        if (fieldDefinition.sourceQuery) {

                            //We use the query to find all the references we can find
                            var queryId = fieldDefinition.sourceQuery;
                            if (queryId._id) {
                                queryId = queryId._id;
                            }

                            /////////////////////////

                            var options = {};

                            //If we need to template the query
                            if (fieldDefinition.queryTemplate) {
                                options.template = fieldDefinition.queryTemplate;
                                if (options.template._id) {
                                    options.template = options.template._id;
                                }
                            }

                            /////////////////////////

                            //Now retrieve the query
                            var promise = FluroContentRetrieval.getQuery(queryId, options);

                            //Now get the results from the query
                            promise.then(function(res) {
                                //console.log('Options', res);
                                templateOptions.options = _.map(res, function(ref) {
                                    return {
                                        name: ref.title,
                                        value: ref._id,
                                    }
                                })
                            });
                        } else {

                            if (fieldDefinition.directive != 'embedded') {
                                if (fieldDefinition.params.restrictType && fieldDefinition.params.restrictType.length) {
                                    //We want to load all the possible references we can select
                                    FluroContent.resource(fieldDefinition.params.restrictType).query().$promise.then(function(res) {
                                        templateOptions.options = _.map(res, function(ref) {
                                            return {
                                                name: ref.title,
                                                value: ref._id,
                                            }
                                        })
                                    });
                                }
                            }
                        }
                    }
                    break;
                default:
                    //Just list the options specified
                    if (fieldDefinition.options && fieldDefinition.options.length) {
                        templateOptions.options = fieldDefinition.options;
                    } else {
                        templateOptions.options = _.map(fieldDefinition.allowedValues, function(val) {
                            return {
                                name: val,
                                value: val
                            }
                        });
                    }
                    break;
            }

            /////////////////////////////
            /////////////////////////////
            /////////////////////////////

            //If there is custom attributes
            if (fieldDefinition.attributes && _.keys(fieldDefinition.attributes).length) {
                newField.ngModelAttrs = _.reduce(fieldDefinition.attributes, function(results, attr, key) {
                    var customKey = 'customAttr' + key;
                    results[customKey] = {
                        attribute: key
                    };

                    //Custom Key
                    templateOptions[customKey] = attr;

                    return results;
                }, {});
            }

            /////////////////////////////
            /////////////////////////////
            /////////////////////////////

            //What kind of data type, override for things like checkbox
            //if (fieldDefinition.type == 'boolean') {
            if (fieldDefinition.directive != 'custom') {
                switch (fieldDefinition.type) {
                    case 'boolean':
                        if (fieldDefinition.params && fieldDefinition.params.storeCopy) {
                            newField.type = 'terms';
                        } else {
                            newField.type = 'checkbox';
                        }

                        break;
                    case 'number':
                    case 'float':
                    case 'integer':
                    case 'decimal':
                        templateOptions.type = 'input';
                        // templateOptions.step = 'any';

                        if (!newField.ngModelAttrs) {
                            newField.ngModelAttrs = {};
                        }

                        /////////////////////////////////////////////

                        //Only do this if its an integer cos iOS SUCKS!
                        if (fieldDefinition.type == 'integer') {
                            // console.log('Is integer');

                            templateOptions.type = 'number';
                            templateOptions.baseDefaultValue = 0;
                            //Force numeric keyboard
                            newField.ngModelAttrs.customAttrpattern = {
                                attribute: 'pattern',
                            }

                            newField.ngModelAttrs.customAttrinputmode = {
                                attribute: 'inputmode',
                            }

                            //Force numeric keyboard
                            templateOptions.customAttrpattern = "[0-9]*";
                            templateOptions.customAttrinputmode = "numeric"


                            /////////////////////////////////////////////

                            // console.log('SET NUMERICINPUT')

                            if (fieldDefinition.params) {
                                if (parseInt(fieldDefinition.params.maxValue) !== 0) {
                                    templateOptions.max = fieldDefinition.params.maxValue;
                                }

                                if (parseInt(fieldDefinition.params.minValue) !== 0) {
                                    templateOptions.min = fieldDefinition.params.minValue;
                                } else {
                                    templateOptions.min = 0;
                                }
                            }

                        }
                        break;
                }

            }

            /////////////////////////////
            /////////////////////////////
            /////////////////////////////

            //Default Options

            if (fieldDefinition.maximum == 1) {
                if (fieldDefinition.type == 'reference' && fieldDefinition.directive != 'embedded') {
                    if (fieldDefinition.defaultReferences && fieldDefinition.defaultReferences.length) {

                        if (fieldDefinition.directive == 'search-select') {
                            templateOptions.baseDefaultValue = fieldDefinition.defaultReferences[0];
                        } else {
                            templateOptions.baseDefaultValue = fieldDefinition.defaultReferences[0]._id;
                        }
                    }
                } else {
                    if (fieldDefinition.defaultValues && fieldDefinition.defaultValues.length) {

                        if (templateOptions.type == 'number') {
                            templateOptions.baseDefaultValue = Number(fieldDefinition.defaultValues[0]);
                        } else {
                            templateOptions.baseDefaultValue = fieldDefinition.defaultValues[0];
                        }
                    }
                }
            } else {
                if (fieldDefinition.type == 'reference' && fieldDefinition.directive != 'embedded') {
                    if (fieldDefinition.defaultReferences && fieldDefinition.defaultReferences.length) {
                        if (fieldDefinition.directive == 'search-select') {
                            templateOptions.baseDefaultValue = fieldDefinition.defaultReferences;
                        } else {
                            templateOptions.baseDefaultValue = _.map(fieldDefinition.defaultReferences, function(ref) {
                                return ref._id;
                            });
                        }
                    } else {
                        templateOptions.baseDefaultValue = [];
                    }
                } else {
                    if (fieldDefinition.defaultValues && fieldDefinition.defaultValues.length) {

                        if (templateOptions.type == 'number') {
                            templateOptions.baseDefaultValue = _.map(fieldDefinition.defaultValues, function(val) {
                                return Number(val);
                            });
                        } else {
                            templateOptions.baseDefaultValue = fieldDefinition.defaultValues;
                        }
                    }
                }
            }


            /////////////////////////////

            //Append the template options
            newField.templateOptions = templateOptions;

            /////////////////////////////
            /////////////////////////////
            /////////////////////////////

            newField.validators = {
                validInput: function($viewValue, $modelValue, scope) {
                    var value = $modelValue || $viewValue;

                    if (!value) {
                        return true;
                    }


                    var valid = FluroValidate.validate(value, fieldDefinition);

                    if (!valid) {
                        //console.log('Check validation', fieldDefinition.title, value)
                    }
                    return valid;
                }
            }

            ///////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////


            if (fieldDefinition.directive == 'embedded') {
                newField.type = 'embedded';

                //Check if its an array or an object
                if (fieldDefinition.maximum == 1 && fieldDefinition.minimum == 1) {
                    templateOptions.baseDefaultValue = {
                        data: {}
                    };
                } else {

                    var askCount = 0;

                    if (fieldDefinition.askCount) {
                        askCount = fieldDefinition.askCount;
                    }

                    //console.log('ASK COUNT PLEASE', askCount);

                    //////////////////////////////////////

                    if (fieldDefinition.minimum && askCount < fieldDefinition.minimum) {
                        askCount = fieldDefinition.minimum;
                    }

                    if (fieldDefinition.maximum && askCount > fieldDefinition.maximum) {
                        askCount = fieldDefinition.maximum;
                    }

                    //////////////////////////////////////

                    var initialArray = [];

                    //Fill with the asking amount of objects
                    if (askCount) {
                        _.times(askCount, function() {
                            initialArray.push({});
                        });
                    }

                    //console.log('initial array', initialArray);
                    //Now set the default value
                    templateOptions.baseDefaultValue = initialArray;
                }

                //////////////////////////////////////////

                //Create the new data object to store the fields
                newField.data = {
                    fields: [],
                    dataFields: [],
                    replicatedFields: []
                }

                //////////////////////////////////////////

                //Link to the definition of this nested object
                var fieldContainer = newField.data.fields;
                var dataFieldContainer = newField.data.dataFields;


                //////////////////////////////////////////

                //Loop through each sub field inside a group
                if (fieldDefinition.fields && fieldDefinition.fields.length) {
                    _.each(fieldDefinition.fields, function(sub) {
                        addFieldDefinition(fieldContainer, sub);
                    });
                }

                //////////////////////////////////////////

                var promise = FluroContent.endpoint('defined/' + fieldDefinition.params.restrictType).get().$promise;

                promise.then(function(embeddedDefinition) {

                    //Now loop through and all all the embedded definition fields
                    if (embeddedDefinition && embeddedDefinition.fields && embeddedDefinition.fields.length) {
                        var childFields = embeddedDefinition.fields;

                        //Exclude all specified fields
                        if (fieldDefinition.params.excludeKeys && fieldDefinition.params.excludeKeys.length) {
                            childFields = _.reject(childFields, function(f) {
                                return _.includes(fieldDefinition.params.excludeKeys, f.key);
                            });
                        }


                        console.log('EXCLUSIONS', fieldDefinition.params.excludeKeys, childFields);

                        //Loop through each sub field inside a group
                        _.each(childFields, function(sub) {
                            addFieldDefinition(dataFieldContainer, sub);
                        })
                    }
                });

                //////////////////////////////////////////

                //Keep track of the promise
                $scope.promises.push(promise);

                //////////////////////////////////////////

                // //Need to keep it dynamic so we know when its done
                // newField.expressionProperties = {
                //     'templateOptions.embedded': function() {
                //         return promise;
                //     }
                // }



            }

            ///////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////

            if (fieldDefinition.type == 'group' && fieldDefinition.fields && fieldDefinition.fields.length || fieldDefinition.asObject) {


                var fieldContainer;

                if (fieldDefinition.asObject) {

                    /*
                    newField = {
                        type: 'nested',
                        className: fieldDefinition.className,
                        data: {
                            fields: []
                        }
                    }
                    */
                    newField.type = 'nested';

                    //Check if its an array or an object
                    if (fieldDefinition.key && fieldDefinition.maximum == 1 && fieldDefinition.minimum == 1) {
                        templateOptions.baseDefaultValue = {};
                    } else {

                        var askCount = 0;

                        if (fieldDefinition.askCount) {
                            askCount = fieldDefinition.askCount;
                        }

                        //////////////////////////////////////

                        if (fieldDefinition.minimum && askCount < fieldDefinition.minimum) {
                            askCount = fieldDefinition.minimum;
                        }

                        if (fieldDefinition.maximum && askCount > fieldDefinition.maximum) {
                            askCount = fieldDefinition.maximum;
                        }

                        //////////////////////////////////////

                        var initialArray = [];

                        //Fill with the asking amount of objects
                        if (askCount) {
                            _.times(askCount, function() {
                                initialArray.push({});
                            });
                        }

                        // console.log('initial array', initialArray);
                        //Now set the default value
                        templateOptions.baseDefaultValue = initialArray;
                    }

                    newField.data = {
                        fields: [],
                        replicatedFields: [],
                    }

                    //Link to the definition of this nested object
                    fieldContainer = newField.data.fields;

                } else {
                    //Start again
                    newField = {
                        fieldGroup: [],
                        className: fieldDefinition.className,
                    }

                    //Link to the sub fields
                    fieldContainer = newField.fieldGroup;
                }

                //Loop through each sub field inside a group
                _.each(fieldDefinition.fields, function(sub) {
                    addFieldDefinition(fieldContainer, sub);
                });
            }

            /////////////////////////////

            //Check if there are any expressions added to this field


            if (fieldDefinition.expressions && _.keys(fieldDefinition.expressions).length) {

                //Include Expression Properties
                // if (!newField.expressionProperties) {
                //     newField.expressionProperties = {};
                // }

                //////////////////////////////////////////

                //Add the hide expression if added through another method
                if (fieldDefinition.hideExpression && fieldDefinition.hideExpression.length) {
                    fieldDefinition.expressions.hide = fieldDefinition.hideExpression;
                }

                //////////////////////////////////////////

                //Get all expressions and join them together so we just listen once
                var allExpressions = _.values(fieldDefinition.expressions).join('+');

                //////////////////////////////////////////

                //Now create a watcher
                newField.watcher = {
                    expression: function(field, scope) {
                        //Return the result
                        return $parse(allExpressions)(scope);
                    },
                    listener: function(field, newValue, oldValue, scope, stopWatching) {

                        //Parse the expression on the root scope vm
                        if (!scope.interaction) {
                            scope.interaction = $scope.vm.model;
                        }

                        //Loop through each expression that needs to be evaluated
                        _.each(fieldDefinition.expressions, function(expression, key) {

                            //Get the value
                            var retrievedValue = $parse(expression)(scope);

                            //Get the field key
                            var fieldKey = field.key;

                            ///////////////////////////////////////

                            switch (key) {
                                case 'defaultValue':
                                    if (!field.formControl || !field.formControl.$dirty) {
                                        return scope.model[fieldKey] = retrievedValue;
                                    }
                                    break;
                                case 'value':
                                    return scope.model[fieldKey] = retrievedValue;
                                    break;
                                case 'required':
                                    return field.templateOptions.required = retrievedValue;
                                    break;
                                case 'hide':
                                    return field.hide = retrievedValue;
                                    break;
                                    // case 'label':
                                    //     if(retrievedValue) {
                                    //         var string = String(retrievedValue);
                                    //         return field.templateOptions.label = String(retrievedValue);
                                    //     }
                                    //     break;
                            }

                        });

                    }



                    ///////////////////////////////////////
                }


                //Replace expression
                //var replaceExpression = expression.replace(new RegExp('model', 'g'), 'vm.model');



                /*
                    //Add the expression properties
                    newField.expressionProperties[key] = function($viewValue, $modelValue, scope) {


                        //Replace expression
                        var replaceExpression = expression.replace(new RegExp('model', 'g'), 'vm.model');

           


                       // var retrievedValue = $parse(replaceExpression)($scope);
                        var retrievedValue = _.get($scope, replaceExpression);

                         console.log('Testing retrieved value from GET', retrievedValue, replaceExpression);

                        ////////////////////////////////////////

                        

                        return retrievedValue;
                    }
                    /**/
                //});
            }

            /////////////////////////////

            if (fieldDefinition.hideExpression) {
                newField.hideExpression = fieldDefinition.hideExpression;
            }

            /////////////////////////////

            if (!newField.fieldGroup) {
                //Create a copy of the default value
                newField.defaultValue = angular.copy(templateOptions.baseDefaultValue);
            }


            /////////////////////////////

            if (newField.type == 'pathlink') {
                return;
            }

            /////////////////////////////
            //Push our new field into the array
            array.push(newField);


        }

        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////

        //Loop through each defined field and add it to our form
        _.each($scope.model.fields, function(fieldDefinition) {
            addFieldDefinition($scope.vm.modelFields, fieldDefinition);
        });

        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////

        //Add the required contact details

        if (!$scope.model.paymentDetails) {
            $scope.model.paymentDetails = {};
        }

        var paymentSettings = $scope.model.paymentDetails;

        /////////////////////////////////////////////////////////////////

        //Credit Card Details
        if (paymentSettings.required || paymentSettings.allow) {

            //Setup the wrapper fields
            var paymentWrapperFields = [];
            var paymentCardFields = [];

            // paymentWrapperFields.push({
            //     template: '<h4><i class="fa fa-credit-card"></i> Payment details</h4>'
            // });

            if (paymentSettings.required) {

                //Add the payment summary
                paymentWrapperFields.push({
                    templateUrl: 'fluro-interaction-form/payment/payment-summary.html',
                    controller: function($scope, $parse) {

                        //Add the payment details to the scope
                        $scope.paymentDetails = paymentSettings;


                        //Start with the required amount
                        var requiredAmount = paymentSettings.amount;

                        //Store the calculatedAmount on the scope
                        $scope.calculatedTotal = requiredAmount;

                        /////////////////////////////////////////////////////


                        var watchString = '';

                        /**
                        _.each(paymentSettings.modifiers, function(paymentModifier) {

                            if (watchString.length) {
                                watchString += ' + ';
                            }



                            var re = /(?:^|\W)model.(\w+)(?!\w)/g, match;
                            var  matches = [];
                            while (match = re.exec(s)) {
                              matches.push(match[1]);
                            }



                            watchString += '(' + paymentModifier.condition + ') + (' + paymentModifier.expression + ')';
                        })
                        /**/


                        ////////////////////////////////////////
                        ////////////////////////////////////////

                        var modelVariables = _.chain(paymentSettings.modifiers)
                            .map(function(paymentModifier) {

                                var string = '(' + paymentModifier.expression + ') + (' + paymentModifier.condition + ')';

                                return string;
                                /**
                                var matches = string.match(/model.\w+/g);

                                console.log('Before string', string, matches);
                                return matches;
                                /**/
                            })
                            .flatten()
                            .compact()
                            .uniq()
                            .value();


                        if (modelVariables.length) {
                            watchString = modelVariables.join(' + ');
                        }

                        ////////////////////////////////////////

                        if (watchString.length) {
                            if($scope.debugMode) {
                                console.log('Watching changes', watchString);
                            }
                            
                            $scope.$watch(watchString, calculateTotal);
                        } else {
                            //Store the calculatedAmount on the scope
                            $scope.calculatedTotal = requiredAmount;
                            $scope.modifications = [];
                        }

                        //Watch for changes that might affect the total
                        //$scope.$watch('model', calculateTotal, true)

                        /////////////////////////////////////////////////////

                        function calculateTotal() {

                            if($scope.debugMode) {
                                console.log('Recalculate total');
                            }

                            //Store the calculatedAmount on the scope
                            $scope.calculatedTotal = requiredAmount;

                            $scope.modifications = [];


                            if (!paymentSettings.modifiers || !paymentSettings.modifiers.length) {

                                if($scope.debugMode) {
                                    console.log('No payment modifiers set');
                                }

                                return;
                            }

                            //Loop through each modifier
                            _.each(paymentSettings.modifiers, function(modifier) {

                                var parsedValue = $parse(modifier.expression)($scope);
                                parsedValue = Number(parsedValue);

                                if (isNaN(parsedValue)) {

                                    if($scope.debugMode) {
                                        console.log('Payment modifier error', modifier.title, parsedValue);
                                    }
                                    

                                    //throw Error('Invalid or non-numeric pricing modifier ' + modifier.title);
                                    return;
                                }


                                /////////////////////////////////////////

                                var parsedCondition = true;

                                if (modifier.condition && String(modifier.condition).length) {
                                    parsedCondition = $parse(modifier.condition)($scope);
                                }

                                //If the condition returns false then just stop here and go to the next modifier
                                if (!parsedCondition) {
                                    if($scope.debugMode) {
                                        console.log('inactive', modifier.title, modifier, $scope);
                                    }
                                    return 
                                }

                                /////////////////////////////////////////

                                var operator = '';
                                var operatingValue = '$' + parseFloat(parsedValue / 100).toFixed(2);

                                switch (modifier.operation) {
                                    case 'add':
                                        operator = '+';
                                        $scope.calculatedTotal = $scope.calculatedTotal + parsedValue;
                                        break;
                                    case 'subtract':
                                        operator = '-';
                                        $scope.calculatedTotal = $scope.calculatedTotal - parsedValue;
                                        break;
                                    case 'divide':
                                        operator = '÷';
                                        operatingValue = parsedValue;
                                        $scope.calculatedTotal = $scope.calculatedTotal / parsedValue;
                                        break;
                                    case 'multiply':
                                        operator = '×';
                                        operatingValue = parsedValue;
                                        $scope.calculatedTotal = $scope.calculatedTotal * parsedValue;
                                        break;
                                    case 'set':
                                        $scope.calculatedTotal = parsedValue;
                                        break;
                                }


                                


                                //Let the front end know that this modification was made
                                $scope.modifications.push({
                                    title: modifier.title,
                                    total: $scope.calculatedTotal,
                                    description: operator + ' ' + operatingValue,
                                    operation: modifier.operation,
                                });
                            })


                            //If the modifiers change the price below 0 then change the total back to 0
                            if (isNaN($scope.calculatedTotal) || $scope.calculatedTotal < 0) {
                                $scope.calculatedTotal = 0;
                            }

                            //Keep the payment settings calculated todal 
                            // paymentSettings.calculatedTotal = $scope.calculatedTotal;
                        }
                    },
                });
            } else {

                var amountDescription = 'Please enter an amount (' + String(paymentSettings.currency).toUpperCase() + ')';


                //Limits of amount
                var minimum = paymentSettings.minAmount;
                var maximum = paymentSettings.maxAmount;
                var defaultAmount = paymentSettings.amount;

                ///////////////////////////////////////////

                var paymentErrorMessage = 'Invalid amount';

                ///////////////////////////////////////////

                if (minimum) {
                    minimum = (parseInt(minimum) / 100);
                    paymentErrorMessage = 'Amount must be a number at least ' + $filter('currency')(minimum, '$');

                    amountDescription += 'Enter at least ' + $filter('currency')(minimum, '$') + ' ' + String(paymentSettings.currency).toUpperCase();
                }

                if (maximum) {
                    maximum = (parseInt(maximum) / 100);
                    paymentErrorMessage = 'Amount must be a number less than ' + $filter('currency')(maximum, '$');

                    amountDescription += 'Enter up to ' + $filter('currency')(maximum, '$') + ' ' + String(paymentSettings.currency).toUpperCase();;
                }


                if (minimum && maximum) {
                    amountDescription = 'Enter a numeric amount between ' + $filter('currency')(minimum) + ' and  ' + $filter('currency')(maximum) + ' ' + String(paymentSettings.currency).toUpperCase();;
                    paymentErrorMessage = 'Amount must be a number between ' + $filter('currency')(minimum) + ' and ' + $filter('currency')(maximum);
                }

                ///////////////////////////////////////////

                //Add the option for putting in a custom amount of money
                var fieldConfig = {
                    key: '_paymentAmount',
                    type: 'currency',
                    //defaultValue: 'Cade Embery',
                    templateOptions: {
                        type: 'text',
                        label: 'Amount',
                        description: amountDescription,
                        placeholder: '0.00',
                        required: true,
                        errorMessage: paymentErrorMessage,
                        min: minimum,
                        max: maximum,
                        onBlur: 'to.focused=false',
                        onFocus: 'to.focused=true',
                    },
                    data: {
                        customMaxLength: 8,
                        minimumAmount: minimum,
                        maximumAmount: maximum,
                    },
                };

                if (minimum) {
                    fieldConfig.defaultValue = minimum;
                }

                paymentWrapperFields.push({
                    'template': '<hr/><h3>Payment Details</h3>'
                });
                paymentWrapperFields.push(fieldConfig);
            }

            //////////////////////////////////////////////////////////
            //////////////////////////////////////////////////////////
            //////////////////////////////////////////////////////////
            //////////////////////////////////////////////////////////

            //Setup debug card details
            var defaultCardName;
            var defaultCardNumber;
            var defaultCardExpMonth;
            var defaultCardExpYear;
            var defaultCardCVN;

            //If testing mode
            if ($scope.debugMode) {
                defaultCardName = 'John Citizen';
                defaultCardNumber = '4242424242424242';
                defaultCardExpMonth = '05';
                defaultCardExpYear = '2020';
                defaultCardCVN = '123';
            }

            //////////////////////////////////////////////////////////

            paymentCardFields.push({
                key: '_paymentCardName',
                type: 'input',
                defaultValue: defaultCardName,
                templateOptions: {
                    type: 'text',
                    label: 'Card Name',
                    placeholder: 'Card Name',
                    required: paymentSettings.required,
                    onBlur: 'to.focused=false',
                    onFocus: 'to.focused=true',
                }
            });

            /////////////////////////////////////////

            paymentCardFields.push({
                key: '_paymentCardNumber',
                type: 'input',
                defaultValue: defaultCardNumber,
                templateOptions: {
                    type: 'text',
                    label: 'Card Number',
                    placeholder: 'Card Number',
                    required: paymentSettings.required,
                    onBlur: 'to.focused=false',
                    onFocus: 'to.focused=true',
                },
                validators: {
                    validInput: function($viewValue, $modelValue, scope) {

                        /////////////////////////////////////////////
                        var luhnChk = function(a) {
                            return function(c) {

                                if (!c) {
                                    return false;
                                }
                                for (var l = c.length, b = 1, s = 0, v; l;) v = parseInt(c.charAt(--l), 10), s += (b ^= 1) ? a[v] : v;
                                return s && 0 === s % 10
                            }
                        }([0, 2, 4, 6, 8, 1, 3, 5, 7, 9]);

                        /////////////////////////////////////////////

                        var value = $modelValue || $viewValue;
                        var valid = luhnChk(value);
                        return valid;
                    }
                }
            });

            paymentCardFields.push({
                className: 'row clearfix',
                fieldGroup: [{
                    key: '_paymentCardExpMonth',
                    className: "col-xs-6 col-sm-5",
                    type: 'input',
                    defaultValue: defaultCardExpMonth,
                    templateOptions: {
                        type: 'text',
                        label: 'Expiry Month',
                        placeholder: 'MM',
                        required: paymentSettings.required,
                        onBlur: 'to.focused=false',
                        onFocus: 'to.focused=true',
                    }
                }, {
                    key: '_paymentCardExpYear',
                    className: "col-xs-6 col-sm-5",
                    type: 'input',
                    defaultValue: defaultCardExpYear,
                    templateOptions: {
                        type: 'text',
                        label: 'Expiry Year',
                        placeholder: 'YYYY',
                        required: paymentSettings.required,
                        onBlur: 'to.focused=false',
                        onFocus: 'to.focused=true',
                    }
                }, {
                    key: '_paymentCardCVN',
                    className: "col-xs-4 col-sm-2",
                    type: 'input',
                    defaultValue: defaultCardCVN,
                    templateOptions: {
                        type: 'text',
                        label: 'CVN',
                        placeholder: 'CVN',
                        required: paymentSettings.required,
                        onBlur: 'to.focused=false',
                        onFocus: 'to.focused=true',
                    }
                }]
            });

            //////////////////////////////////////////////////////////
            //////////////////////////////////////////////////////////

            //Create the credit card field group
            var cardDetailsField = {
                className: "payment-details",
                fieldGroup: paymentCardFields,
            };

            if (paymentSettings.allowAlternativePayments && paymentSettings.paymentMethods && paymentSettings.paymentMethods.length) {

                //Create a method selection widget
                var methodSelection = {
                    className: "payment-method-select",
                    //defaultValue:{},
                    //key:'methods',
                    // fieldGroup:cardDetailsField,
                    data: {
                        fields: [cardDetailsField],
                        settings: paymentSettings,
                    },
                    controller: function($scope) {

                        //Payment Settings on scope
                        $scope.settings = paymentSettings;

                        //Options
                        $scope.methodOptions = _.map(paymentSettings.paymentMethods, function(method) {
                            return method;
                        });

                        //Add card at the start
                        $scope.methodOptions.unshift({
                            title: 'Pay with Card',
                            key: 'card',
                        });

                        ////////////////////////////////////////

                        if (!$scope.model._paymentMethod) {
                            $scope.model._paymentMethod = 'card';
                        }

                        //Select the first method by default
                        $scope.selected = {
                            method: $scope.methodOptions[0]
                        };

                        $scope.selectMethod = function(method) {
                            $scope.settings.showOptions = false;
                            $scope.selected.method = method;
                            $scope.model._paymentMethod = method.key;
                        }
                    },
                    templateUrl: 'fluro-interaction-form/payment/payment-method.html'
                };

                paymentWrapperFields.push(methodSelection);

            } else {
                //Push the card details
                paymentWrapperFields.push(cardDetailsField);
            }

            //////////////////////////////////////////////////////////

            // $scope.vm.modelFields = $scope.vm.modelFields.concat(paymentWrapperFields);

            //////////////////////////////////////////////////////////
            //////////////////////////////////////////////////////////
            //////////////////////////////////////////////////////////
            //////////////////////////////////////////////////////////

            $scope.vm.modelFields.push({
                fieldGroup: paymentWrapperFields,
            });
        }

        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////

        //Wait for all async promises to resolve

        if (!$scope.promises.length) {
            $scope.promisesResolved = true;
        } else {
            $scope.promisesResolved = false;

            $q.all($scope.promises).then(function() {
                $scope.promisesResolved = true;

                //updateErrorList();
                //Update the error list
                // $scope.errorList = getAllErrorFields($scope.vm.modelFields);
                // console.log('All promises resolved', $scope.errorList);

                // _.each($scope.errorList, function(field) {
                //     console.log('FIELD', field.templateOptions.label, field.formControl)
                // })

            });
        }
    });




    /////////////////////////////////////////////////////////////////

    function getAllErrorFields(array) {
        return _.chain(array).map(function(field) {
                if (field.fieldGroup && field.fieldGroup.length) {

                    return getAllErrorFields(field.fieldGroup);

                } else if (field.data && ((field.data.fields && field.data.fields.length) || (field.data.dataFields && field.data.dataFields) || (field.data.replicatedFields && field.data.replicatedFields))) {
                    var combined = [];
                    combined = combined.concat(field.data.fields, field.data.dataFields, field.data.replicatedFields);
                    combined = _.compact(combined);
                    return getAllErrorFields(combined);
                } else {
                    return field;
                }
            })
            .flatten()
            .value();
    }

    /////////////////////////////////////////////////////////////////

    $scope.$watch('vm.modelFields', function(fields) {
        //console.log('Interaction Fields changed')
        $scope.errorList = getAllErrorFields(fields);

        //console.log('Error List', $scope.errorList);
    }, true)


    /////////////////////////////////////////////////////////////////


    function submitInteraction() {

        // console.log('Submitting interaction')

        //Sending
        $scope.vm.state = 'sending';

        var interactionKey = $scope.model.definitionName;
        var interactionDetails = angular.copy($scope.vm.model);

        /////////////////////////////////////////////////////////

        //Asking for Payment
        var requiresPayment;
        var allowsPayment;

        /////////////////////////////////////////////////////////

        var paymentConfiguration = $scope.model.paymentDetails;

        //Check if we have supplied payment details
        if (paymentConfiguration) {
            requiresPayment = paymentConfiguration.required;
            allowsPayment = paymentConfiguration.allow;
        }

        /////////////////////////////////////////////////////////

        //Check if we need a payment
        if (requiresPayment || allowsPayment) {

            ////////////////////////////////////

            var paymentDetails = {};

            ////////////////////////////////////

            //Check if we can use alternative payment methods
            if (paymentConfiguration.allowAlternativePayments && paymentConfiguration.paymentMethods) {

                var selectedMethod = interactionDetails._paymentMethod;
                //If the user chose an alternative payment
                if (selectedMethod && selectedMethod != 'card') {

                    //Mark which method we are using as an alternative method
                    paymentDetails.method = selectedMethod;

                    //Skip straight through to process the request
                    return processRequest();
                }
            }

            ////////////////////////////////////

            //Get the payment integration 
            var paymentIntegration = $scope.integration;

            if (!paymentIntegration || !paymentIntegration.publicDetails) {

                if (paymentConfiguration.required) {
                    console.log('No payment integration was supplied for this interaction but payments are required');
                } else {
                    console.log('No payment integration was supplied for this interaction but payments are set to be allowed');
                }

                alert('This form has not been configured properly. Please notify the administrator of this website immediately.')
                $scope.vm.state = 'ready';
                return;
            }

            /////////////////////////////////////////////////////////

            //var paymentDetails = {};

            //Ensure we tell the server which integration to use to process payment
            paymentDetails.integration = paymentIntegration._id;

            //Now get the required details for making the transaction
            switch (paymentIntegration.module) {
                case 'eway':

                    if (!window.eCrypt) {
                        console.log('ERROR: Eway is selected for payment but the eCrypt script has not been included in this application visit https://eway.io/api-v3/#encrypt-function for more information');
                        return $scope.vm.state = 'ready';
                    }

                    //Get encrypted token from eWay
                    //var liveUrl = 'https://api.ewaypayments.com/DirectPayment.json';
                    //var sandboxUrl = 'https://api.sandbox.ewaypayments.com/DirectPayment.json';

                    /////////////////////////////////////////////

                    //Get the Public Encryption Key
                    var key = paymentIntegration.publicDetails.publicKey;

                    /////////////////////////////////////////////

                    //Get the card details from our form
                    var cardDetails = {};
                    cardDetails.name = interactionDetails._paymentCardName;
                    cardDetails.number = eCrypt.encryptValue(interactionDetails._paymentCardNumber, key);
                    cardDetails.cvc = eCrypt.encryptValue(interactionDetails._paymentCardCVN, key);

                    var expiryMonth = String(interactionDetails._paymentCardExpMonth);
                    var expiryYear = String(interactionDetails._paymentCardExpYear);

                    if (expiryMonth.length < 1) {
                        expiryMonth = '0' + expiryMonth;
                    }
                    cardDetails.exp_month = expiryMonth;
                    cardDetails.exp_year = expiryYear.slice(-2);

                    //Send encrypted details to the server
                    paymentDetails.details = cardDetails;

                    //Process the request
                    return processRequest();

                    break;
                case 'stripe':

                    if (!window.Stripe) {
                        console.log('ERROR: Stripe is selected for payment but the Stripe API has not been included in this application');
                        return $scope.vm.state = 'ready';
                    }
                    //Get encrypted token from Stripe
                    var liveKey = paymentIntegration.publicDetails.livePublicKey;
                    var sandboxKey = paymentIntegration.publicDetails.testPublicKey;

                    var key = liveKey;

                    /////////////////////////////////////////////

                    if (paymentIntegration.publicDetails.sandbox) {
                        key = sandboxKey;
                    }

                    /////////////////////////////////////////////

                    //Set the stripe key
                    Stripe.setPublishableKey(key);

                    /////////////////////////////////////////////

                    //Get the card details from our form
                    var cardDetails = {};
                    cardDetails.name = interactionDetails._paymentCardName;
                    cardDetails.number = interactionDetails._paymentCardNumber;
                    cardDetails.cvc = interactionDetails._paymentCardCVN;
                    cardDetails.exp_month = interactionDetails._paymentCardExpMonth;
                    cardDetails.exp_year = interactionDetails._paymentCardExpYear;

                    /////////////////////////////////////////////

                    Stripe.card.createToken(cardDetails, function(status, response) {
                        if (response.error) {
                            //Error creating token
                            // Notifications.error(response.error);
                            console.log('Stripe token error', response);
                            $scope.processErrorMessages = [response.error.message];
                            $scope.vm.state = 'error';


                        } else {
                            //Include the payment details
                            paymentDetails.details = response;
                            return processRequest();
                        }
                    });
                    break;
            }
        } else {
            return processRequest();
        }


        ///////////////////////////////////////////////////////////////////////

        function processRequest() {

            /////////////////////////////////////////////////////////

            //Delete payment details (we don't send these to fluro)
            delete interactionDetails._paymentCardCVN;
            delete interactionDetails._paymentCardExpMonth;
            delete interactionDetails._paymentCardExpYear;
            delete interactionDetails._paymentCardName;
            delete interactionDetails._paymentCardNumber;

            /////////////////////////////////////////////////////////

            //Log the request
            //console.log('Process request', interactionKey, interactionDetails, paymentDetails);

            /////////////////////////////////////////////////////////

            //Allow user specified payment
            if (interactionDetails._paymentAmount) {
                paymentDetails.amount = (parseFloat(interactionDetails._paymentAmount) * 100);
            }

            /////////////////////////////////////////////////////////

            //Attempt to send information to interact endpoint
            var request = FluroInteraction.interact($scope.model.title, interactionKey, interactionDetails, paymentDetails, $scope.linkedEvent);


            //////////////////////////////////

            //When the promise results fire the callbacks
            request.then(submissionSuccess, submissionFail)

            //////////////////////////////////
            //////////////////////////////////
            //////////////////////////////////
            //////////////////////////////////

            function submissionSuccess(res) {
                /**
                //TESTING
                $scope.vm.state = 'ready';
                return console.log('RES TEST', res);
                /**/

                //Reset
                if ($scope.vm.defaultModel) {
                    $scope.vm.model = angular.copy($scope.vm.defaultModel);
                } else {
                    $scope.vm.model = {};
                }
                $scope.vm.modelForm.$setPristine();
                $scope.vm.options.resetModel();

                // $scope.vm.model = {}
                // $scope.vm.modelForm.$setPristine();
                // $scope.vm.options.resetModel();

                //Response from server incase we want to use it on the thank you page
                $scope.response = res;

                //Change state
                $scope.vm.state = 'complete';
            }

            //////////////////////////////////
            //////////////////////////////////
            //////////////////////////////////
            //////////////////////////////////
            //////////////////////////////////


            function submissionFail(res) {


                console.log('Interaction Failed', res);
                // Notifications.error(res.data);

                $scope.vm.state = 'error';

                if (!res.data) {
                    return $scope.processErrorMessages = ['Error: ' + res];
                }

                if (res.data.error) {
                    if (res.data.error.message) {
                        return $scope.processErrorMessages = [res.error.message];
                    } else {
                        return $scope.processErrorMessages = [res.error];
                    }
                }

                if (res.data.errors) {
                    return $scope.processErrorMessages = _.map(res.data.errors, function(error) {
                        return error.message;
                    });
                }

                if (_.isArray(res.data)) {
                    return $scope.processErrorMessages = res.data;
                } else {
                    $scope.processErrorMessages = [res.data];
                }



                //$scope.vm.state = 'ready';
            }


        }
    }

});