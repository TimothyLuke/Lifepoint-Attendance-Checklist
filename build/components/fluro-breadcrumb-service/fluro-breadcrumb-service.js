app.service('FluroBreadcrumbService', function($rootScope, $state, $timeout) {

    var controller = {
        trail: [],
    };

    ///////////////////////////////////////

    //Private variables
    var backButtonPress;
    var scrollPositions = {};

    ///////////////////////////////////////

    //Initialize a breadcrumb trail
    controller.trail = [];

    ///////////////////////////////////////

    //Change of state started
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, error) {
        //Get the href for the url we're going to
        var path = $state.href(fromState, fromParams);

        //Store the scroll position of where we are currently
        var previousScrollPosition = document.body.scrollTop;
        scrollPositions[path] = previousScrollPosition;
        
    });

    ///////////////////////////////////////

    //Listen for a change to the current state
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams, error) {
        //If the user is navigating back
        if (backButtonPress) {

            //Get the href for the url we're going to
            var path = $state.href(toState, toParams);

            //Get the last scroll position
            var previousScrollPosition = scrollPositions[path];

            //If there is a scroll position previously set
            if (previousScrollPosition) {
                //Move to that scroll position
                $timeout(function() {
                    document.body.scrollTop = previousScrollPosition;
                })
            } else {
                //Otherwise set scroll to 0
                document.body.scrollTop = 0;
            }

            //Remove the previous set breadcrumb
            controller.trail.pop();
            controller.trail.pop();

            //Reset the back button variable
            backButtonPress = false;
        } else {
            //New state so set scroll to 0
            document.body.scrollTop = 0;
        }

        // if(toState)
        //Override here to 
        // switch (toState.name) {
        //     case 'home':
        //     case 'songs':
        //     case 'events':
        //         controller.trail.length = 0;
        //         break;
        // }


        //Add the current state with its parameters to the breadcrumb
        controller.trail.push({
            name: toState.name,
            params: toParams
        });
    });




    ///////////////////////////////////////

    //Get the first defined state with a name from the router
    controller.topState = _.find($state.get(), function(state) {
        return (state.name && state.name.length);
    })

    ///////////////////////////////////////

    controller.top = function() {

        controller.trail.length = 0;

        if (controller.topState) {
            //Go to the home state
            $state.go(controller.topState);
        }
    }

    ///////////////////////////////////////

    controller.clear = function() {
        controller.trail.length = 0;
    }

    ///////////////////////////////////////

    controller.back = function() {

        //If we only have one breadcrumb in the list then we can't go back any further
        if (!controller.trail.length) {
            return;
        }

        /////////////////////////////

        //And get the last in the breadcrumb
        backButtonPress = true;

        var count = controller.trail.length;
        var previousState = controller.trail[count - 2];


        //If we have a state to go back to
        if (previousState) {
            //Go to the previous state
            $state.go(previousState.name, previousState.params);
        } else {
            //Go up a level if we can
            if ($state.$current.parent && $state.$current.parent.self.name.length) {
                $state.go('^');
            } else {
                //Otherwise just go to the top state
                $state.go(controller.topState);
            }
        }
    }

    ///////////////////////////////////////

    return controller;

});