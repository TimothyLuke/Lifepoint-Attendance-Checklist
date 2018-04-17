app.run(function(formlyConfig, $templateCache) {

    formlyConfig.setType({
        name: 'embedded',
        templateUrl: 'fluro-interaction-form/embedded/fluro-embedded.html',
        controller: 'FluroInteractionNestedController',
        wrapper: ['bootstrapHasError'],
    });

});

/**

app.controller('FluroEmbeddedDefinitionController', function($scope, $http, Fluro, $filter, FluroValidate) {


})

/**/