app.directive('fluroPreloader', function() {
    return {
        restrict: 'E',
        replace:true,
        scope:{},
        templateUrl:'fluro-preloader/fluro-preloader.html',
        controller:'FluroPreloaderController',
        link: function(scope, element, attrs) {
            
        }
    };
});

app.controller('FluroPreloaderController', function($scope, $state, $rootScope, $timeout) {
    

    //////////////////////////////////////////////////////////////////

    var preloadTimer;

    $scope.preloader = {
        class:'reset'
    }

    console.log('yep im here')
    //////////////////////////////////////////////////////////////////

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, error) {

        //If dont show a preloader then just go woot and continue
        // if($rootScope.noPreloader) {
        //     $rootScope.noPreloader = false;
        //     return;
        // }

        $scope.preloader.class = 'reset';
        preloadTimer = $timeout(function() {
            $scope.preloader.class = 'loading';
        });

        // 
        // console.log('Pause state change')
        // //We want to pause the stateChange
        // event.preventDefault();

        // //Preloader class set to reset
        // $scope.preloader.class = 'reset';

        // //Then set the preloader to loading
        // preloadTimer = $timeout(function() {
        //     $scope.preloader.class = 'loading';
        // }, 0)

        // //Then wait a second
        // $timeout(function() {

        //     console.log('Continue loading state')
        //     //This time no preloader
        //     $rootScope.noPreloader = true;

        //     //Now go to go the state
        //     $state.go(toState, toParams);

        // }, 200)

    });

    //////////////////////////////////////////////////////////////////

    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {

        ////////////////////////////////////////////////////
        //If the preloader wasn't fast enough to start cancel it
        if (preloadTimer) {
            $timeout.cancel(preloadTimer);
            preloadTimer = null;
        }

        //Reset Preloader
        $scope.preloader.class = 'reset';

    });

    //////////////////////////////////////////////////////////////////

    $rootScope.$on('$preloaderHide', hidePreloader);
    $rootScope.$on('$stateChangeSuccess', hidePreloader);

    //Hide the preloader
    function hidePreloader(event, toState, toParams, fromState, fromParams, error) {
            // console.log('hide preloader')
        ////////////////////////////////////////////////////

        //If the preloader wasn't fast enough to start cancel it
        if (preloadTimer) {
            $timeout.cancel(preloadTimer);
            preloadTimer = null;
        }

        //If the preloader did show
        if ($scope.preloader.class == 'loading') {
            //Wait a little bit then hide the preloader
            $timeout(function() {
                // console.log('preloader has loaded');
                $scope.preloader.class = 'loaded';
            }, 600)
        }

    };


    //////////////////////////////////////////////////////////////////

    // $scope.clicked = function($event) {
    //     if($scope.asLink) {
    //         $state.go('watchVideo',{id:$scope.model._id, from:$scope.fromProduct})
    //     }
    // }


});