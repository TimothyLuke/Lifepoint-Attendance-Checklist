app.run(function(formlyConfig, $templateCache) {

    formlyConfig.setType({
        name: 'value',
        templateUrl: 'fluro-interaction-form/value/value.html',
        //controller: 'FluroInteractionDobSelectController',
        wrapper: ['bootstrapHasError'],
    });

});
