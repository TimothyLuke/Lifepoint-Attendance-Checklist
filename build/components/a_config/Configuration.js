var app = angular.module('fluro', [
    'ngAnimate',
    'ngResource',
    'ui.router',
    'ngTouch',
    'fluro.config',
    'fluro.access',
    'fluro.validate',
    'fluro.interactions',
    'fluro.content',
    'fluro.asset',
    'fluro.socket',
    'fluro.video',
    'angular.filter',
    'angulartics', 
    'angulartics.google.analytics',    
    'formly',
    'formlyBootstrap',
    'ui.bootstrap'
])



/////////////////////////////////////////////////////////////////////

function getMetaKey(stringKey) {
    var metas = document.getElementsByTagName('meta');

    for (i = 0; i < metas.length; i++) {
        if (metas[i].getAttribute("property") == stringKey) {
            return metas[i].getAttribute("content");
        }
    }
    return "";
}


/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

app.config(function($stateProvider, $httpProvider, FluroProvider, $urlRouterProvider, $locationProvider, $analyticsProvider) {

    ///////////////////////////////////////////////////

    var access_token = getMetaKey('fluro_application_key');


    // make sure include default tracker and fluro tracker
    $analyticsProvider.settings.ga.additionalAccountNames = ['fluro'];
    // send user properties as well
    $analyticsProvider.settings.ga.additionalAccountHitTypes.setUserProperties = true;
    // when using user timing/duration
    $analyticsProvider.settings.ga.additionalAccountHitTypes.userTiming = true;


    //API URL
    var api_url = getMetaKey('fluro_url');

    FluroProvider.set({
        apiURL: api_url,
        token: access_token,
        sessionStorage: true,
    });

    ///////////////////////////////////////////

    //Http Intercpetor to check auth failures for xhr requests
    if (!access_token) {
        $httpProvider.defaults.withCredentials = true;
    }

    $httpProvider.interceptors.push('FluroAuthentication');

    ///////////////////////////////////////////

    $locationProvider.html5Mode(true);

    ///////////////////////////////////////////
    ///////////////////////////////////////////

    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'routes/events/events.html',
        controller: 'EventsController',
        resolve: {
            events: function($stateParams, FluroContentRetrieval) {

             
                // //Get end of today
                var tonight = new Date();
                tonight.setHours(23,59,0,0);


                var queryDetails = {
                    "_type":"event",
                    "startDate": {
                        "$lte": "date('"+tonight+"')"
                    }
                }

                /////////////////////////////////////////

                return FluroContentRetrieval.query(queryDetails, null, null, {}, null);
            },
        }
    });

    ///////////////////////////////////////////

    $stateProvider.state('checklist', {
        url: '/event/:id',
        templateUrl: 'routes/checklist/checklist.html',
        controller: 'ChecklistController',
        resolve: {
            event: function($stateParams, FluroContent) {
                console.log('got specified id', $stateParams.id)
                return FluroContent.resource('event/'+ $stateParams.id).get({
                    allDefinitions: true,
                }).$promise;
            },
            contacts: function(FluroContent) {
                return FluroContent.resource('contact', false, true).query({
                    noCache: true,
                    appendTeams: 'all',
                }).$promise;
            },
        }
    });

    ///////////////////////////////////////////

    $stateProvider.state('new', {
        url: '/new?returnTo&realm',
        templateUrl: 'routes/new/new.html',
        controller: 'CreateContactController',
    });

    ///////////////////////////////////////////

    $urlRouterProvider.otherwise("/");


});

/////////////////////////////////////////////////////////////////////

app.run(function($rootScope, $sessionStorage, Asset, NotificationService, FluroContent, FluroBreadcrumbService, FluroScrollService, $location, $timeout, $state, $analytics) {

    //Global variable for if we are testing live
    //or locally
    $rootScope.staging = true;


    $rootScope.asset = Asset;
    $rootScope.$state = $state;
    $rootScope.session = $sessionStorage;
    $rootScope.breadcrumb = FluroBreadcrumbService;
    $rootScope.notificationService = NotificationService;

    //////////////////////////////////////////////////////////////////

    //Get the session of the current user
    FluroContent.endpoint('session')
    .get()
    .$promise.then(function(res) {
        $rootScope.user = res;
    }, function(err) {
        console.log('ERROR LOADING USER');
        $rootScope.user = null;
    });

    //////////////////////////////////////////////////////////////////

    if (applicationUser && applicationUser._id) {
        $rootScope.user = applicationUser;

        $analytics.setUsername(applicationUser._id); // fluro id
        $analytics.setAlias(applicationUser.email); // user email
        $analytics.setUserProperties({
            dimension1: applicationUser.account._id // fluro account id
        });
    }

    //////////////////////////////////////////////////////////////////

    $rootScope.logout = function() {
        //Sign out
        $rootScope.user = null;
    }

    //////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, error) {
        //Close the sidebar
        $rootScope.sidebarExpanded = false;
    });


    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        throw error;
    });

    //////////////////////////////////////////////////////////////////

    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams, error) {
        $rootScope.currentState = toState.name;
    });

    //////////////////////////////////////////////////////////////////


    $rootScope.getTypeOrDefinition = function(item, defaultIfNoneProvided) {
        if (item.definition && item.definition.length) {
            return item.definition;
        }

        if (!item._type && defaultIfNoneProvided) {
            return defaultIfNoneProvided;
        }


        return item._type;
    }

   

    //////////////////////////////////////////////////////

    //Make touch devices more responsive
    FastClick.attach(document.body);

});