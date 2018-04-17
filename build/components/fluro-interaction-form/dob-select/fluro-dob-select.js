app.run(function(formlyConfig, $templateCache) {

    formlyConfig.setType({
        name: 'dob-select',
        templateUrl: 'fluro-interaction-form/dob-select/fluro-dob-select.html',
        //controller: 'FluroInteractionDobSelectController',
        wrapper: ['bootstrapHasError'],
    });

});
