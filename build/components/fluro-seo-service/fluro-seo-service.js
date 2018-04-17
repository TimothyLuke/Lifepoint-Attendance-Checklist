app.service('FluroSEOService', function($rootScope, $location) {

    var controller = {
    }

    ///////////////////////////////////////
    ///////////////////////////////////////
    ///////////////////////////////////////
    ///////////////////////////////////////

    $rootScope.$watch(function() {
        return controller.siteTitle + ' | ' + controller.pageTitle;
    }, function() {
        controller.headTitle = '';

        if(controller.siteTitle && controller.siteTitle.length) {
            controller.headTitle += controller.siteTitle;

            if(controller.pageTitle && controller.pageTitle.length) {
                controller.headTitle += ' | ' + controller.pageTitle;
            }
        } else {
            if(controller.pageTitle && controller.pageTitle.length) {
                controller.headTitle = controller.pageTitle;
            }
        }
    });

    ///////////////////////////////////////
    ///////////////////////////////////////

    controller.getImageURL = function() {

        //Get the default image URL
        var url = controller.defaultImageURL;

        if(controller.imageURL && controller.imageURL.length) {
            url = controller.imageURL;
        }

        return url;
    }

    ///////////////////////////////////////
    ///////////////////////////////////////

    controller.getDescription = function() {

        //Get the default image URL
        var description = controller.defaultDescription;

        if(controller.description) {
            description = controller.description;
        }

        if(description && description.length) {
            return description;
        } else {
            return '';
        }
    }


    //////////////////////////////////////////////////////////////////

    //Get the default site wide Social sharing image
    
    


    ///////////////////////////////////////
    ///////////////////////////////////////

    //Listen to change in the state
    $rootScope.$on('$stateChangeSuccess', function() {
        controller.url = $location.$$absUrl;
    });

    //Listen to change in the state
    $rootScope.$on('$stateChangeStart', function() {

        //Reset SEO stuff
        controller.description = null;
        controller.imageURL = null;

        console.log('REset SEO');
    });


    ///////////////////////////////////////

    return controller;

});