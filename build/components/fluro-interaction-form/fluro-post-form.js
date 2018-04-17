////////////////////////////////////////////////////////////////////////

app.directive('postForm', function($compile) {
    return {
        restrict: 'E',
        //replace: true,
        scope: {
            model: '=ngModel',
            host: '=hostId',
            reply: '=?reply',
            thread: '=?thread',
            userStore: '=?user',
            vm: '=?config',
            debugMode: '=?debugMode',
            callback:'=?callback',
        },
        transclude: true,
        controller: 'PostFormController',
        templateUrl: 'fluro-interaction-form/fluro-web-form.html',
        link: function($scope, $element, $attrs, $ctrl, $transclude) {
            $transclude($scope, function(clone, $scope) {
                $scope.transcludedContent = clone;
            });
        },
    };
});


app.directive('recaptchaRender', function($window) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs, $ctrl) {

            //Check if we need to use recaptcha
            if ($scope.model.data && $scope.model.data.recaptcha) {

                //Recaptcha
                var element = $element[0];

                ////////////////////////////////////////////////

                var cancelWatch;

                //If recaptcha hasn't loaded yet wait for it to load
                if (window.grecaptcha) {
                    activateRecaptcha(window.grecaptcha)
                } else {

                    //Listen for when recaptcha exists
                    cancelWatch = $scope.$watch(function() {
                        return window.grecaptcha;
                    }, activateRecaptcha);
                }

                ////////////////////////////////////////////////

                function activateRecaptcha(recaptcha) {

                    console.log('Activate recaptcha!!');
                    if (cancelWatch) {
                        cancelWatch();
                    }

                    if (recaptcha) {
                        $scope.vm.recaptchaID = recaptcha.render(element, {
                            sitekey: '6LelOyUTAAAAADSACojokFPhb9AIzvrbGXyd-33z'
                        });
                    }
                }
            }

            ////////////////////////////////////////////////

        },
    };
});

app.controller('PostFormController', function($scope, $rootScope, $q, $http, Fluro, FluroAccess, $parse, $filter, formlyValidationMessages, FluroContent, FluroContentRetrieval, FluroValidate, FluroInteraction) {





    /////////////////////////////////////////////////////////////////

    if (!$scope.thread) {
        $scope.thread = [];
    }

    /////////////////////////////////////////////////////////////////

    if (!$scope.vm) {
        $scope.vm = {}
    }
    /////////////////////////////////////////////////////////////////
    //Attach unique ID of this forms scope
    // $scope.vm.formScopeID = $scope.$id;




    //Resolve promises by default
    $scope.promisesResolved = true;
    $scope.correctPermissions = true;

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

    //  $scope.$watch('vm.modelForm', function(form) {
    //     console.log('Form Validation', form);
    // }, true)

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
    /////////////////////////////////////////////////////////////////

    function resetCaptcha() {


        //Recaptcha ID
        var recaptchaID = $scope.vm.recaptchaID;

        console.log('Reset Captcha', recaptchaID);

        if (window.grecaptcha && recaptchaID) {
            window.grecaptcha.reset(recaptchaID);
        }
    }

    /////////////////////////////////////////////////////////////////
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

        //Reset the captcha
        resetCaptcha();

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
        if (!$scope.model || $scope.model.parentType != 'post') {
            return; //$scope.model = {};
        }

        /////////////////////////////////////////////////////////////////

        //check if we have the correct permissions
        // checkPermissions();

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
        $scope.vm.onSubmit = submitPost;

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

        /////////////////////////////////////////////////////////////////
        /**/
        //Email Address
        // // if (interactionFormSettings.askEmail || interactionFormSettings.requireEmail) {
        // var newField = {
        //     key: 'body',
        //     type: 'textarea',
        //     templateOptions: {
        //         // type: 'email',
        //         label: 'Body',
        //         placeholder: 'Enter your comment here',
        //         required: true,
        //         // required: interactionFormSettings.requireEmail,
        //         onBlur: 'to.focused=false',
        //         onFocus: 'to.focused=true',
        //         rows: 4,
        //         cols: 15
        //     },
        // }

        //Push the body
        // $scope.vm.modelFields.push(newField);
        // }
        /**/

        /////////////////////////////////////////////////////////////////

        //Push the extra data object
        // var dataObject = {
        //     key: 'data',
        //     type:'nested',
        //     fieldGroup: [],
        //     // templateOptions:{
        //     //     baseDefaultValue:{}
        //     // }
        // }


        // $scope.vm.modelFields.push(dataObject);

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
            if(fieldDefinition.attributes && _.keys(fieldDefinition.attributes).length) {
                newField.ngModelAttrs = _.reduce(fieldDefinition.attributes, function(results, attr, key) {
                    var customKey = 'customAttr' + key;
                    results[customKey] = {
                        attribute:key
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

                        // console.log('EXCLUSIONS', fieldDefinition.params.excludeKeys, childFields);
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

    //Submit the
    function submitPost() {

        //Sending
        $scope.vm.state = 'sending';

        var submissionKey = $scope.model.definitionName;
        var submissionModel = {
            data: angular.copy($scope.vm.model)
        }

        /////////////////////////////////////////////////////////

        var hostID = $scope.host;

        /////////////////////////////////////////////////////////

        //If its a reply then mark it as such
        if ($scope.reply) {
            submissionModel.reply = $scope.reply;
        }

        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////

        //If we have a recaptcha id present then use it
        if (typeof $scope.vm.recaptchaID !== 'undefined') {
            var response = window.grecaptcha.getResponse($scope.vm.recaptchaID);
            submissionModel['g-recaptcha-response'] = response;
        }

        /////////////////////////////////////////////////////////


        var request;

        //If a user store has been provided
        if ($scope.userStore) {

            //Get the required config
            $scope.userStore.config().then(function(config) {


                var postURL = Fluro.apiURL + '/post/' + hostID + '/' + submissionKey;

                //Make the request using the user stores configuration
                request = $http.post(postURL, submissionModel, config)

                //When the promise results fire the callbacks
                request.then(function(res) {
                    return submissionSuccess(res.data);
                }, function(res) {
                    return submissionFail(res.data);
                })
            });

        } else {

            //Attempt to send information to post endpoint
            request = FluroContent.endpoint('post/' + hostID + '/' + submissionKey).save(submissionModel).$promise;

            //When the promise results fire the callbacks
            request.then(submissionSuccess, submissionFail)
        }

        //////////////////////////////////        

        function submissionSuccess(res) {
            //Reset
            if ($scope.vm.defaultModel) {
                $scope.vm.model = angular.copy($scope.vm.defaultModel);
            } else {
                $scope.vm.model = {
                    data: {}
                };
            }
            $scope.vm.modelForm.$setPristine();
            $scope.vm.options.resetModel();

            //Reset the captcha
            resetCaptcha();

            // $scope.vm.model = {}
            // $scope.vm.modelForm.$setPristine();
            // $scope.vm.options.resetModel();

            //Response from server incase we want to use it on the thank you page
            $scope.response = res;

            //If there is a thread push this into it
            if ($scope.thread) {
                $scope.thread.push(res);
            }

            //Change state
            $scope.vm.state = 'complete';
        }

        //////////////////////////////////
        //////////////////////////////////
        //////////////////////////////////
        //////////////////////////////////
        //////////////////////////////////

        function submissionFail(res) {
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
        }
    }

});