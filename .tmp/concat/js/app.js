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
app.directive('accordion', function() {
    return {
        restrict: 'E',
        replace: true,
        transclude: {
            'title': 'accordionTitle',
            'body': 'accordionBody',
          },
        // template: '<div ng-transclude></div>',
        scope: {
          wide:'=wide'
        },
        templateUrl: 'accordion/accordion.html',
        link: function(scope, element, attrs, ctrl) {

            scope.settings = {}
          // transclude(scope, function(clone, scope) {
            
          //   var tcElement =element.find('#transclude-here');

          //   console.log(tcElement);
          //   tcElement.append(clone);
          // });
        }
    }
});


app.directive('dateselect', function($document) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'admin-date-select/admin-date-select.html',
        scope: {
            boundModel: '=ngModel',
            label: '=ngLabel',
            minDate: '=minDate',
            initDate: '=initDate',
            useTime: '=useTime',
            required: '=',
            rounding: '=',
            forceDate: '=',
        },
        link: function($scope, element, attr) {


            ////////////////////////////////////////////////

            function elementClick(event) {
                //Clicked inside
                event.stopPropagation();
            }

            function documentClick(event) {
                //Clicked outside
                $scope.$apply(function() {
                    $scope.open = false;
                });
            }

            //Listen for when this date select is open
            $scope.$watch('settings.open', function(bol) {
                if (bol) {
                    element.on('click', elementClick);
                    $document.on('click', documentClick);
                } else {
                    element.off('click', elementClick);
                    $document.off('click', documentClick);
                }
            })

        },
        controller: function($scope, $timeout) {

            $scope.settings = {
                dateModel:new Date()
            }

            if($scope.forceDate && !$scope.boundModel) {
                $scope.boundModel = new Date();
            }

            ///////////////////////////////////////

            //Rounding factor
            var coeff = 1000 * 60 * 5;

            // if ($scope.boundModel) {

            //     $scope.settings.model = new Date($scope.boundModel);
            // } else {
            //     $scope.settings.model = new Date();
            // }

            ///////////////////////////////////////

            // $scope.$watch('settings.open', function(open) {
            //     if (open) {
            //         if(!$scope.boundModel) {
            //             $scope.boundModel = new Date($scope.settings.model);
            //         }
            //     }
            // })

            ///////////////////////////////////////

            $scope.removeDate = function() {
                $scope.boundModel = null;
                //console.log('Remove Date')
            }

            ///////////////////////////////////////

            //round to nearest 5mins
            if ($scope.rounding) {
                // if (_.isDate($scope.settings.model)) {
                    // $scope.settings.model = new Date(Math.round($scope.settings.model.getTime() / coeff) * coeff)
                // }
                if (_.isDate($scope.boundModel)) {
                    $scope.boundModel = new Date(Math.round($scope.boundModel.getTime() / coeff) * coeff)
                }
            }

            ///////////////////////////////////////
            ///////////////////////////////////////

            function updateLabel() {
                // console.log('RESET Bound Model',$scope.boundModel)
                if ($scope.boundModel) {
                    var date = new Date($scope.boundModel);
                    if (!$scope.useTime) {
                        $scope.readable = date.format('D j F');
                    } else {
                        $scope.readable = date.format('D j F g:i') + '<span class="meridian">' + date.format('a') + '</span>';
                    }
                    //$scope.readable = date.format('D j F g:i') + '<span class="meridian">' + date.format('a') +'</span>';
                } else {
                    if ($scope.label) {
                        $scope.readable = $scope.label;
                    } else {
                        $scope.readable = 'None provided';
                    }
                }
            }

            /**
            var cancelWatch;

            function stopWatchingBoundModel() {
                if(cancelWatch) {
                   cancelWatch();
                }
            }

            function startWatchingBoundModel() {
                cancelWatch = $scope.$watch('boundModel', boundModelUpdated);
            }
            

            function boundModelUpdated() {
                stopWatchingBoundModel();

                console.log('BOUND MODEL CHANGED', $scope.boundModel);
                $scope.settings.model = angular.copy($scope.boundModel);
                updateLabel();

                startWatchingBoundModel();
            }

            //Start watching to start with
            startWatchingBoundModel();
            /**/


            $scope.$watch('boundModel', boundModelChanged, true);
            $scope.$watch('settings.dateModel', dateModelChanged, true);

            function boundModelChanged() {
                if($scope.settings.dateModel != $scope.boundModel) {
                    $scope.settings.dateModel = $scope.boundModel = new Date($scope.boundModel)
                }
                updateLabel();
            }

            function dateModelChanged() {
                if($scope.boundModel != $scope.settings.dateModel) {
                $scope.boundModel = $scope.settings.dateModel = new Date($scope.settings.dateModel)
                }
                updateLabel();
            }

            /**
            //Watch for changes
            $scope.$watch('settings.dateModel', function() {
                // console.log('MODEL CHANGE', data);
                // //Link to the bound model`
                if ($scope.settings.open) {
                    $scope.boundModel = angular.copy($scope.settings.dateModel);
                }

                updateLabel();

            }, true)
            /**/
        }

    };

});

(function() {
    
    Date.shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    Date.longMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    Date.shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    Date.longDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // defining patterns
    var replaceChars = {
        // Day
        d: function() { return (this.getDate() < 10 ? '0' : '') + this.getDate(); },
        D: function() { return Date.shortDays[this.getDay()]; },
        j: function() { return this.getDate(); },
        l: function() { return Date.longDays[this.getDay()]; },
        N: function() { return (this.getDay() == 0 ? 7 : this.getDay()); },
        S: function() { return (this.getDate() % 10 == 1 && this.getDate() != 11 ? 'st' : (this.getDate() % 10 == 2 && this.getDate() != 12 ? 'nd' : (this.getDate() % 10 == 3 && this.getDate() != 13 ? 'rd' : 'th'))); },
        w: function() { return this.getDay(); },
        z: function() { var d = new Date(this.getFullYear(),0,1); return Math.ceil((this - d) / 86400000); }, // Fixed now
        // Week
        W: function() { 
            var target = new Date(this.valueOf());
            var dayNr = (this.getDay() + 6) % 7;
            target.setDate(target.getDate() - dayNr + 3);
            var firstThursday = target.valueOf();
            target.setMonth(0, 1);
            if (target.getDay() !== 4) {
                target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
            }
            return 1 + Math.ceil((firstThursday - target) / 604800000);
        },
        // Month
        F: function() { return Date.longMonths[this.getMonth()]; },
        m: function() { return (this.getMonth() < 9 ? '0' : '') + (this.getMonth() + 1); },
        M: function() { return Date.shortMonths[this.getMonth()]; },
        n: function() { return this.getMonth() + 1; },
        t: function() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 0).getDate() }, // Fixed now, gets #days of date
        // Year
        L: function() { var year = this.getFullYear(); return (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)); },   // Fixed now
        o: function() { var d  = new Date(this.valueOf());  d.setDate(d.getDate() - ((this.getDay() + 6) % 7) + 3); return d.getFullYear();}, //Fixed now
        Y: function() { return this.getFullYear(); },
        y: function() { return ('' + this.getFullYear()).substr(2); },
        // Time
        a: function() { return this.getHours() < 12 ? 'am' : 'pm'; },
        A: function() { return this.getHours() < 12 ? 'AM' : 'PM'; },
        B: function() { return Math.floor((((this.getUTCHours() + 1) % 24) + this.getUTCMinutes() / 60 + this.getUTCSeconds() / 3600) * 1000 / 24); }, // Fixed now
        g: function() { return this.getHours() % 12 || 12; },
        G: function() { return this.getHours(); },
        h: function() { return ((this.getHours() % 12 || 12) < 10 ? '0' : '') + (this.getHours() % 12 || 12); },
        H: function() { return (this.getHours() < 10 ? '0' : '') + this.getHours(); },
        i: function() { return (this.getMinutes() < 10 ? '0' : '') + this.getMinutes(); },
        s: function() { return (this.getSeconds() < 10 ? '0' : '') + this.getSeconds(); },
        u: function() { var m = this.getMilliseconds(); return (m < 10 ? '00' : (m < 100 ?
    '0' : '')) + m; },
        // Timezone
        e: function() { return "Not Yet Supported"; },
        I: function() {
            var DST = null;
                for (var i = 0; i < 12; ++i) {
                        var d = new Date(this.getFullYear(), i, 1);
                        var offset = d.getTimezoneOffset();
    
                        if (DST === null) DST = offset;
                        else if (offset < DST) { DST = offset; break; }                     else if (offset > DST) break;
                }
                return (this.getTimezoneOffset() == DST) | 0;
            },
        O: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + '00'; },
        P: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + ':00'; }, // Fixed now
        T: function() { return this.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/, '$1'); },
        Z: function() { return -this.getTimezoneOffset() * 60; },
        // Full Date/Time
        c: function() { return this.format("Y-m-d\\TH:i:sP"); }, // Fixed now
        r: function() { return this.toString(); },
        U: function() { return this.getTime() / 1000; }
    };

    // Simulates PHP's date function
    Date.prototype.format = function(format) {
        var date = this;
        return format.replace(/(\\?)(.)/g, function(_, esc, chr) {
            return (esc === '' && replaceChars[chr]) ? replaceChars[chr].call(date) : chr;
        });
    };

}).call(this);

(function () {
	'use strict';
	
	/**
	 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
	 *
	 * @version 1.0.3
	 * @codingstandard ftlabs-jsv2
	 * @copyright The Financial Times Limited [All Rights Reserved]
	 * @license MIT License (see LICENSE.txt)
	 */
	
	/*jslint browser:true, node:true*/
	/*global define, Event, Node*/
	
	
	/**
	 * Instantiate fast-clicking listeners on the specified layer.
	 *
	 * @constructor
	 * @param {Element} layer The layer to listen on
	 * @param {Object} options The options to override the defaults
	 */
	function FastClick(layer, options) {
		var oldOnClick;
	
		options = options || {};
	
		/**
		 * Whether a click is currently being tracked.
		 *
		 * @type boolean
		 */
		this.trackingClick = false;
	
	
		/**
		 * Timestamp for when click tracking started.
		 *
		 * @type number
		 */
		this.trackingClickStart = 0;
	
	
		/**
		 * The element being tracked for a click.
		 *
		 * @type EventTarget
		 */
		this.targetElement = null;
	
	
		/**
		 * X-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartX = 0;
	
	
		/**
		 * Y-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartY = 0;
	
	
		/**
		 * ID of the last touch, retrieved from Touch.identifier.
		 *
		 * @type number
		 */
		this.lastTouchIdentifier = 0;
	
	
		/**
		 * Touchmove boundary, beyond which a click will be cancelled.
		 *
		 * @type number
		 */
		this.touchBoundary = options.touchBoundary || 10;
	
	
		/**
		 * The FastClick layer.
		 *
		 * @type Element
		 */
		this.layer = layer;
	
		/**
		 * The minimum time between tap(touchstart and touchend) events
		 *
		 * @type number
		 */
		this.tapDelay = options.tapDelay || 200;
	
		if (FastClick.notNeeded(layer)) {
			return;
		}
	
		// Some old versions of Android don't have Function.prototype.bind
		function bind(method, context) {
			return function() { return method.apply(context, arguments); };
		}
	
	
		var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
		var context = this;
		for (var i = 0, l = methods.length; i < l; i++) {
			context[methods[i]] = bind(context[methods[i]], context);
		}
	
		// Set up event handlers as required
		if (deviceIsAndroid) {
			layer.addEventListener('mouseover', this.onMouse, true);
			layer.addEventListener('mousedown', this.onMouse, true);
			layer.addEventListener('mouseup', this.onMouse, true);
		}
	
		layer.addEventListener('click', this.onClick, true);
		layer.addEventListener('touchstart', this.onTouchStart, false);
		layer.addEventListener('touchmove', this.onTouchMove, false);
		layer.addEventListener('touchend', this.onTouchEnd, false);
		layer.addEventListener('touchcancel', this.onTouchCancel, false);
	
		// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
		// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
		// layer when they are cancelled.
		if (!Event.prototype.stopImmediatePropagation) {
			layer.removeEventListener = function(type, callback, capture) {
				var rmv = Node.prototype.removeEventListener;
				if (type === 'click') {
					rmv.call(layer, type, callback.hijacked || callback, capture);
				} else {
					rmv.call(layer, type, callback, capture);
				}
			};
	
			layer.addEventListener = function(type, callback, capture) {
				var adv = Node.prototype.addEventListener;
				if (type === 'click') {
					adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
						if (!event.propagationStopped) {
							callback(event);
						}
					}), capture);
				} else {
					adv.call(layer, type, callback, capture);
				}
			};
		}
	
		// If a handler is already declared in the element's onclick attribute, it will be fired before
		// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
		// adding it as listener.
		if (typeof layer.onclick === 'function') {
	
			// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
			// - the old one won't work if passed to addEventListener directly.
			oldOnClick = layer.onclick;
			layer.addEventListener('click', function(event) {
				oldOnClick(event);
			}, false);
			layer.onclick = null;
		}
	}
	
	
	/**
	 * Android requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;
	
	
	/**
	 * iOS requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
	
	
	/**
	 * iOS 4 requires an exception for select elements.
	 *
	 * @type boolean
	 */
	var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);
	
	
	/**
	 * iOS 6.0(+?) requires the target element to be manually derived
	 *
	 * @type boolean
	 */
	var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS ([6-9]|\d{2})_\d/).test(navigator.userAgent);
	
	/**
	 * BlackBerry requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;
	
	/**
	 * Determine whether a given element requires a native click.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element needs a native click
	 */
	FastClick.prototype.needsClick = function(target) {
		switch (target.nodeName.toLowerCase()) {
	
		// Don't send a synthetic click to disabled inputs (issue #62)
		case 'button':
		case 'select':
		case 'textarea':
			if (target.disabled) {
				return true;
			}
	
			break;
		case 'input':
	
			// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
			if ((deviceIsIOS && target.type === 'file') || target.disabled) {
				return true;
			}
	
			break;
		case 'label':
		case 'video':
			return true;
		}
	
		return (/\bneedsclick\b/).test(target.className);
	};
	
	
	/**
	 * Determine whether a given element requires a call to focus to simulate click into element.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
	 */
	FastClick.prototype.needsFocus = function(target) {
		switch (target.nodeName.toLowerCase()) {
		case 'textarea':
			return true;
		case 'select':
			return !deviceIsAndroid;
		case 'input':
			switch (target.type) {
			case 'button':
			case 'checkbox':
			case 'file':
			case 'image':
			case 'radio':
			case 'submit':
				return false;
			}
	
			// No point in attempting to focus disabled inputs
			return !target.disabled && !target.readOnly;
		default:
			return (/\bneedsfocus\b/).test(target.className);
		}
	};
	
	
	/**
	 * Send a click event to the specified element.
	 *
	 * @param {EventTarget|Element} targetElement
	 * @param {Event} event
	 */
	FastClick.prototype.sendClick = function(targetElement, event) {
		var clickEvent, touch;
	
		// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
		if (document.activeElement && document.activeElement !== targetElement) {
			document.activeElement.blur();
		}
	
		touch = event.changedTouches[0];
	
		// Synthesise a click event, with an extra attribute so it can be tracked
		clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
		clickEvent.forwardedTouchEvent = true;
		targetElement.dispatchEvent(clickEvent);
	};
	
	FastClick.prototype.determineEventType = function(targetElement) {
	
		//Issue #159: Android Chrome Select Box does not open with a synthetic click event
		if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
			return 'mousedown';
		}
	
		return 'click';
	};
	
	
	/**
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.focus = function(targetElement) {
		var length;
	
		// Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
		if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
			length = targetElement.value.length;
			targetElement.setSelectionRange(length, length);
		} else {
			targetElement.focus();
		}
	};
	
	
	/**
	 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
	 *
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.updateScrollParent = function(targetElement) {
		var scrollParent, parentElement;
	
		scrollParent = targetElement.fastClickScrollParent;
	
		// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
		// target element was moved to another parent.
		if (!scrollParent || !scrollParent.contains(targetElement)) {
			parentElement = targetElement;
			do {
				if (parentElement.scrollHeight > parentElement.offsetHeight) {
					scrollParent = parentElement;
					targetElement.fastClickScrollParent = parentElement;
					break;
				}
	
				parentElement = parentElement.parentElement;
			} while (parentElement);
		}
	
		// Always update the scroll top tracker if possible.
		if (scrollParent) {
			scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
		}
	};
	
	
	/**
	 * @param {EventTarget} targetElement
	 * @returns {Element|EventTarget}
	 */
	FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
	
		// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
		if (eventTarget.nodeType === Node.TEXT_NODE) {
			return eventTarget.parentNode;
		}
	
		return eventTarget;
	};
	
	
	/**
	 * On touch start, record the position and scroll offset.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchStart = function(event) {
		var targetElement, touch, selection;
	
		// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
		if (event.targetTouches.length > 1) {
			return true;
		}
	
		targetElement = this.getTargetElementFromEventTarget(event.target);
		touch = event.targetTouches[0];
	
		if (deviceIsIOS) {
	
			// Only trusted events will deselect text on iOS (issue #49)
			selection = window.getSelection();
			if (selection.rangeCount && !selection.isCollapsed) {
				return true;
			}
	
			if (!deviceIsIOS4) {
	
				// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
				// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
				// with the same identifier as the touch event that previously triggered the click that triggered the alert.
				// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
				// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
				// Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
				// which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
				// random integers, it's safe to to continue if the identifier is 0 here.
				if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
					event.preventDefault();
					return false;
				}
	
				this.lastTouchIdentifier = touch.identifier;
	
				// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
				// 1) the user does a fling scroll on the scrollable layer
				// 2) the user stops the fling scroll with another tap
				// then the event.target of the last 'touchend' event will be the element that was under the user's finger
				// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
				// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
				this.updateScrollParent(targetElement);
			}
		}
	
		this.trackingClick = true;
		this.trackingClickStart = event.timeStamp;
		this.targetElement = targetElement;
	
		this.touchStartX = touch.pageX;
		this.touchStartY = touch.pageY;
	
		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			event.preventDefault();
		}
	
		return true;
	};
	
	
	/**
	 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.touchHasMoved = function(event) {
		var touch = event.changedTouches[0], boundary = this.touchBoundary;
	
		if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
			return true;
		}
	
		return false;
	};
	
	
	/**
	 * Update the last position.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchMove = function(event) {
		if (!this.trackingClick) {
			return true;
		}
	
		// If the touch has moved, cancel the click tracking
		if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
			this.trackingClick = false;
			this.targetElement = null;
		}
	
		return true;
	};
	
	
	/**
	 * Attempt to find the labelled control for the given label element.
	 *
	 * @param {EventTarget|HTMLLabelElement} labelElement
	 * @returns {Element|null}
	 */
	FastClick.prototype.findControl = function(labelElement) {
	
		// Fast path for newer browsers supporting the HTML5 control attribute
		if (labelElement.control !== undefined) {
			return labelElement.control;
		}
	
		// All browsers under test that support touch events also support the HTML5 htmlFor attribute
		if (labelElement.htmlFor) {
			return document.getElementById(labelElement.htmlFor);
		}
	
		// If no for attribute exists, attempt to retrieve the first labellable descendant element
		// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
		return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
	};
	
	
	/**
	 * On touch end, determine whether to send a click event at once.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchEnd = function(event) {
		var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;
	
		if (!this.trackingClick) {
			return true;
		}
	
		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			this.cancelNextClick = true;
			return true;
		}
	
		// Reset to prevent wrong click cancel on input (issue #156).
		this.cancelNextClick = false;
	
		this.lastClickTime = event.timeStamp;
	
		trackingClickStart = this.trackingClickStart;
		this.trackingClick = false;
		this.trackingClickStart = 0;
	
		// On some iOS devices, the targetElement supplied with the event is invalid if the layer
		// is performing a transition or scroll, and has to be re-detected manually. Note that
		// for this to function correctly, it must be called *after* the event target is checked!
		// See issue #57; also filed as rdar://13048589 .
		if (deviceIsIOSWithBadTarget) {
			touch = event.changedTouches[0];
	
			// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
			targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
			targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
		}
	
		targetTagName = targetElement.tagName.toLowerCase();
		if (targetTagName === 'label') {
			forElement = this.findControl(targetElement);
			if (forElement) {
				this.focus(targetElement);
				if (deviceIsAndroid) {
					return false;
				}
	
				targetElement = forElement;
			}
		} else if (this.needsFocus(targetElement)) {
	
			// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
			// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
			if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
				this.targetElement = null;
				return false;
			}
	
			this.focus(targetElement);
			this.sendClick(targetElement, event);
	
			// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
			// Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
			if (!deviceIsIOS || targetTagName !== 'select') {
				this.targetElement = null;
				event.preventDefault();
			}
	
			return false;
		}
	
		if (deviceIsIOS && !deviceIsIOS4) {
	
			// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
			// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
			scrollParent = targetElement.fastClickScrollParent;
			if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
				return true;
			}
		}
	
		// Prevent the actual click from going though - unless the target node is marked as requiring
		// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
		if (!this.needsClick(targetElement)) {
			event.preventDefault();
			this.sendClick(targetElement, event);
		}
	
		return false;
	};
	
	
	/**
	 * On touch cancel, stop tracking the click.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.onTouchCancel = function() {
		this.trackingClick = false;
		this.targetElement = null;
	};
	
	
	/**
	 * Determine mouse events which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onMouse = function(event) {
	
		// If a target element was never set (because a touch event was never fired) allow the event
		if (!this.targetElement) {
			return true;
		}
	
		if (event.forwardedTouchEvent) {
			return true;
		}
	
		// Programmatically generated events targeting a specific element should be permitted
		if (!event.cancelable) {
			return true;
		}
	
		// Derive and check the target element to see whether the mouse event needs to be permitted;
		// unless explicitly enabled, prevent non-touch click events from triggering actions,
		// to prevent ghost/doubleclicks.
		if (!this.needsClick(this.targetElement) || this.cancelNextClick) {
	
			// Prevent any user-added listeners declared on FastClick element from being fired.
			if (event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			} else {
	
				// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
				event.propagationStopped = true;
			}
	
			// Cancel the event
			event.stopPropagation();
			event.preventDefault();
	
			return false;
		}
	
		// If the mouse event is permitted, return true for the action to go through.
		return true;
	};
	
	
	/**
	 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
	 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
	 * an actual click which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onClick = function(event) {
		var permitted;
	
		// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
		if (this.trackingClick) {
			this.targetElement = null;
			this.trackingClick = false;
			return true;
		}
	
		// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
		if (event.target.type === 'submit' && event.detail === 0) {
			return true;
		}
	
		permitted = this.onMouse(event);
	
		// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
		if (!permitted) {
			this.targetElement = null;
		}
	
		// If clicks are permitted, return true for the action to go through.
		return permitted;
	};
	
	
	/**
	 * Remove all FastClick's event listeners.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.destroy = function() {
		var layer = this.layer;
	
		if (deviceIsAndroid) {
			layer.removeEventListener('mouseover', this.onMouse, true);
			layer.removeEventListener('mousedown', this.onMouse, true);
			layer.removeEventListener('mouseup', this.onMouse, true);
		}
	
		layer.removeEventListener('click', this.onClick, true);
		layer.removeEventListener('touchstart', this.onTouchStart, false);
		layer.removeEventListener('touchmove', this.onTouchMove, false);
		layer.removeEventListener('touchend', this.onTouchEnd, false);
		layer.removeEventListener('touchcancel', this.onTouchCancel, false);
	};
	
	
	/**
	 * Check whether FastClick is needed.
	 *
	 * @param {Element} layer The layer to listen on
	 */
	FastClick.notNeeded = function(layer) {
		var metaViewport;
		var chromeVersion;
		var blackberryVersion;
	
		// Devices that don't support touch don't need FastClick
		if (typeof window.ontouchstart === 'undefined') {
			return true;
		}
	
		// Chrome version - zero for other browsers
		chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];
	
		if (chromeVersion) {
	
			if (deviceIsAndroid) {
				metaViewport = document.querySelector('meta[name=viewport]');
	
				if (metaViewport) {
					// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// Chrome 32 and above with width=device-width or less don't need FastClick
					if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}
	
			// Chrome desktop doesn't need FastClick (issue #15)
			} else {
				return true;
			}
		}
	
		if (deviceIsBlackBerry10) {
			blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);
	
			// BlackBerry 10.3+ does not require Fastclick library.
			// https://github.com/ftlabs/fastclick/issues/251
			if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
				metaViewport = document.querySelector('meta[name=viewport]');
	
				if (metaViewport) {
					// user-scalable=no eliminates click delay.
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// width=device-width (or less than device-width) eliminates click delay.
					if (document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}
			}
		}
	
		// IE10 with -ms-touch-action: none, which disables double-tap-to-zoom (issue #97)
		if (layer.style.msTouchAction === 'none') {
			return true;
		}
	
		return false;
	};
	
	
	/**
	 * Factory method for creating a FastClick object
	 *
	 * @param {Element} layer The layer to listen on
	 * @param {Object} options The options to override the defaults
	 */
	FastClick.attach = function(layer, options) {
		return new FastClick(layer, options);
	};
	
	
	if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
	
		// AMD. Register as an anonymous module.
		define(function() {
			return FastClick;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = FastClick.attach;
		module.exports.FastClick = FastClick;
	} else {
		window.FastClick = FastClick;
	}
}());

app.directive('extendedFieldRender', function($compile, $templateCache) {

    return {
        restrict: 'E',
        replace: true,
        scope: {
            field: '=ngField', //Field information -- this is what the field looks like
            model: '=ngModel', //Host object we look for the data on (the data object) -- this is the data in the field
        },
        templateUrl: 'extended-field-render/extended-field-render.html',
        link: function($scope, $element, $attrs) {

            //Get the model
            //$scope.model = $scope.host[$scope.field.key];

            $scope.showField = true;
            ////////////////////////////////////////

            // $scope.viewInModal = function(item) {
            //     console.log('View in modal', item)
            //     // ModalService.view(item);
            // }

            // $scope.editInModal = function(item) {
            //     console.log('Edit in modal', item)
            //     // ModalService.edit(item);
            // }

            ////////////////////////////////////////

            var template = '';


            switch ($scope.field.type) {
                case 'void':
                case 'null':
                case '':
                    return $element.empty();
                    break;
            }


            // if(!$scope.model[$scope.field.key]) {
            //     return $scope.showField = false;
            // }
            ////////////////////////////////////////


            if ($scope.field.type == 'group') {

                if ($scope.field.asObject) {

                    //Check if multi group or singular
                    if (_.isArray($scope.model[$scope.field.key])) {

                        // template = '<pre ng-repeat="group in model">{{group | json}}</pre>';
                        template = '<div ng-repeat="group in model[field.key]" class="panel panel-default"><div class="panel-heading">{{field.title}} {{$index + 1}}</div><div class="panel-body"><extended-field-render ng-model="group" ng-field="subField" ng-repeat="subField in field.fields"/></div></div>';
                    } else {
                        template = '<extended-field-render ng-model="model[field.key]" ng-field="subField" ng-repeat="subField in field.fields"/>';
                    }
                } else {
                    template = '<extended-field-render ng-model="model" ng-field="subField" ng-repeat="subField in field.fields"/>';

                    //<div ng-repeat="subField in field.fields"> <extended-field-render ng-host="host" ng-model="model" ng-field="subField"></extended-field-render> </div>'; // <extended-field-render ng-host="host" ng-model="group[subField.key]" ng-field="subField"></extended-field-render>
                    // template = '<div class="{{field.className}}"><div ng-repeat="subField in field.fields" class="{{subField.className}}"><pre>{{field | json}}</pre><extended-field-render ng-host="host" ng-model="host[subField.key]" ng-field="subField" ></extended-field-render></div></div>';

                }
            } else {
                //console.log('BOOOOM', $scope.field.key, $scope.model, $scope.model[$scope.field.key])
                //

                if (_.isArray($scope.model[$scope.field.key]) && $scope.model[$scope.field.key].length) {

                    template = $templateCache.get('extended-field-render/field-types/multiple-value.html');
                    //template = '<ol><li class="value in model[field.key]">{{value}}</li></ol>';
                } else {

                    if($scope.model[$scope.field.key] && !_.isArray($scope.model[$scope.field.key])) {
                        template = $templateCache.get('extended-field-render/field-types/value.html');
                    }

                    //template = '<div>{{model[field.key]}}</div>';
                }

                /*
                if (_.isArray($scope.model[$scope.field.key])) {
                    template = '<ol><li class="value in model[field.key]">{{value}}</li></ol>';
                } else {
                    template = '<div>{{model}}</div>';
                }
                */
            }



            ////////////////////////////////////////

            if (template.length) {

                var cTemplate = $compile(template)($scope);

                var contentHolder = $element.find('[field-transclude]');


                if ($scope.field.type == 'group') {
                    contentHolder.addClass($scope.field.className).append(cTemplate);
                } else {
                    $element.addClass($scope.field.className);
                    contentHolder.replaceWith(cTemplate);
                }
            } else {

                $scope.showField = false;
                $element.empty();
            }


        }
    };
})

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
app.controller('FluroInteractionButtonSelectController', function($scope, FluroValidate) {


    /////////////////////////////////////////////////////////////////////////

    var to = $scope.to;
    var opts = $scope.options;

    $scope.selection = {
        values: [],
        value: null,
    }


    /////////////////////////////////////////////////////////////////////////

    //Get the definition
    var definition = $scope.to.definition;

    //Minimum and maximum
    var minimum = definition.minimum;
    var maximum = definition.maximum;

    if(!minimum) {
        minimum = 0;
    }

    if(!maximum) {
        maximim = 0;
    }

    $scope.multiple = (maximum != 1);


    /////////////////////////////////////////////////////////////////////////

    $scope.dragControlListeners = {
        //accept: function (sourceItemHandleScope, destSortableScope) {return boolean}//override to determine drag is allowed or not. default is true.
        //itemMoved: function (event) {//Do what you want},
        orderChanged: function(event) {
            //Do what you want
            $scope.model[opts.key] = angular.copy($scope.selection.values);
        },
        //containment: '#board'//optional param.
        //clone: true //optional param for clone feature.
        //allowDuplicates: false //optional param allows duplicates to be dropped.
    };


    /////////////////////////////////////////////////////////////////////////

    $scope.selectBox = {}

    $scope.selectUpdate = function() {
        if(!$scope.selectBox.item) {
            return;
        }
        $scope.selection.values.push($scope.selectBox.item);
        $scope.model[opts.key] = angular.copy($scope.selection.values);
    }

    /////////////////////////////////////////////////////////////////////////




    $scope.canAddMore = function() {

        if(!maximum) {
            return true;
        }
       
        if($scope.multiple) {
            return ($scope.selection.values.length < maximum);
        } else {
            if(!$scope.selection.value) {
                return true;
            }
        }
        
    }

    /////////////////////////////////////////////////////////////////////////

    $scope.contains = function(value) {
        if ($scope.multiple) {
            //Check if the values are selected
            return _.includes($scope.selection.values, value);
        } else {
            return $scope.selection.value == value;
        }
    }

    /////////////////////////////////////////////////////////////////////////

    $scope.select = function(value) {

        if ($scope.multiple) {
            if (!$scope.canAddMore()) {
                return;
            }
            $scope.selection.values.push(value);
        } else {
            $scope.selection.value = value;
        }
    }

    /////////////////////////////////////////////////////////////////////////

    $scope.deselect = function(value) {
        if ($scope.multiple) {
            _.pull($scope.selection.values, value);
        } else {
            $scope.selection.value = null;
        }
    }

    /////////////////////////////////////////////////////////////////////////

    $scope.toggle = function(reference) {

        if ($scope.contains(reference)) {
            $scope.deselect(reference);
        } else {
            $scope.select(reference);
        }

        //Update model
        setModel();
    }


    /////////////////////////////////////////////////////////////////////////

    // initialize the checkboxes check property
    $scope.$watch('model', function(newModelValue, oldModelValue) {


        if (newModelValue != oldModelValue) {
            var modelValue;

            //If there is properties in the FORM model
            if (_.keys(newModelValue).length) {

                //Get the model for this particular field
                modelValue = newModelValue[opts.key];

                if ($scope.multiple) {
                    if (modelValue && _.isArray(modelValue)) {
                        $scope.selection.values = angular.copy(modelValue);
                    } else {
                        $scope.selection.values = [];
                    }
                } else {
                    $scope.selection.value = angular.copy(modelValue);
                }
            }
        }
    }, true);


    /////////////////////////////////////////////////////////////////////////

    function checkValidity() {

        var validRequired;
        var validInput = FluroValidate.validate($scope.model[$scope.options.key], definition);

        //Check if multiple
        if ($scope.multiple) {
            if ($scope.to.required) {
                validRequired = _.isArray($scope.model[opts.key]) && $scope.model[opts.key].length > 0;
            }
        } else {
            if ($scope.to.required) {
                if ($scope.model[opts.key]) {
                    validRequired = true;
                }
            }
        }

        if ($scope.fc) {
            $scope.fc.$setValidity('required', validRequired);
            $scope.fc.$setValidity('validInput', validInput);
        }
    }

    /////////////////////////////////////////////////////////////////////////

    function setModel() {
        if ($scope.multiple) {
            $scope.model[opts.key] = angular.copy($scope.selection.values);
        } else {
            $scope.model[opts.key] = angular.copy($scope.selection.value);
        }

        if ($scope.fc) {
            $scope.fc.$setTouched();
        }

        //console.log('Model set!', $scope.model[opts.key]);
        checkValidity();
    }

    /////////////////////////////////////////////////////////////////////////

    if (opts.expressionProperties && opts.expressionProperties['templateOptions.required']) {
        $scope.$watch(function() {
            return $scope.to.required;
        }, function(newValue) {
            checkValidity();
        });
    }

    /////////////////////////////////////////////////////////////////////////

    if ($scope.to.required) {
        var unwatchFormControl = $scope.$watch('fc', function(newValue) {
            if (!newValue) {
                return;
            }
            checkValidity();
            unwatchFormControl();
        });
    }

    /////////////////////////////////////////////////////////////////////////
})
app.run(function(formlyConfig, $templateCache) {

    formlyConfig.setType({
        name: 'dob-select',
        templateUrl: 'fluro-interaction-form/dob-select/fluro-dob-select.html',
        //controller: 'FluroInteractionDobSelectController',
        wrapper: ['bootstrapHasError'],
    });

});

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
app.directive('postThread', function(FluroContent) {
    return {
        restrict: 'E',
        transclude:true,
        scope:{
          definitionName:"=?type",
          host:"=?hostId",
          thread:"=?thread",
        },
        // template:'<div class="post-thread" ng-transclude></div>',
        link:function($scope, $element, $attrs, $ctrl, $transclude) {
            $transclude($scope, function (clone, $scope) {
                $element.replaceWith(clone); // <-- will transclude it's own scope
            });
        },
        controller:function($scope, $filter) {

        	$scope.outer = $scope.$parent;

            if(!$scope.thread) {
                $scope.thread = [];
            }
            
            //////////////////////////////////////////////////

        	$scope.$watch('host + definitionName', function() {

                var hostID = $scope.host;
                var definitionName = $scope.definitionName;

                if(!hostID || !definitionName) {
                    return;
                } 

                var request = FluroContent.endpoint('post/' + hostID + '/' + definitionName)
                .query()
                .$promise;

                function postsLoaded(res) {
                    // console.log('Posts', res);
                    var allPosts = res;


                    $scope.thread = _.chain(res)
                    .map(function(post) {

                        // console.log('POST', post._id, post.reply);
                        //Find all replies to this post
                        post.thread = _.filter(allPosts, function(sub) {
                            return (sub.reply == post._id);
                        });

                        // console.log('THREAD TEST', post.thread);

                        // console.log('find all replies that match', post._id)

                        //If it's a top level post then send it back
                        if(!post.reply) {
                            return post;
                        }
                    })
                    .compact()
                    .value();

                    // console.log('Load up the nested thread', $scope.thread);

                    // console.log('Posts loaded', res)
                    
                }

                function postsError(res) {
                    // console.log('Error loading posts', res);
                    $scope.thread = []
                }

                //Load the posts
                request.then(postsLoaded, postsError);
        	})
        },
    }
});
/**/
app.run(function(formlyConfig, $templateCache) {

    formlyConfig.setType({
        name: 'nested',
        templateUrl: 'fluro-interaction-form/nested/fluro-nested.html',
        controller: 'FluroInteractionNestedController',
    });

});

//////////////////////////////////////////////////////////

app.controller('FluroInteractionNestedController', function($scope) {


    //Definition
    var def = $scope.to.definition;

    ////////////////////////////////////

    var minimum = def.minimum;
    var maximum = def.maximum;

    ////////////////////////////////////

    $scope.$watch('model[options.key]', function(model) {
        if (!model) {
            console.log('Reset Model cos no value!')
            resetDefaultValue();
        }
    });

    ////////////////////////////////////


    function resetDefaultValue() {
        var defaultValue = angular.copy($scope.to.baseDefaultValue);
        if(!$scope.model) {
            console.log('NO RESET Reset Model Values', $scope.options.key, defaultValue);
        }
        $scope.model[$scope.options.key] = defaultValue;
    }

    ////////////////////////////////////

    //Listen for a reset event
    $scope.$on('form-reset', resetDefaultValue);

    ////////////////////////////////////

    $scope.addAnother = function() {

        console.log('Add another')
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

        var copiedFields = angular.copy($scope.options.data.fields);
        $scope.options.data.replicatedFields.push(copiedFields);

        return copiedFields;
    }

    $scope.copyDataFields = function() {
        var copiedFields = angular.copy($scope.options.data.dataFields);
        $scope.options.data.replicatedFields.push(copiedFields);
        return copiedFields;
    }
});
/**/
app.run(function(formlyConfig, $templateCache) {

    formlyConfig.setType({
        name: 'search-select',
        templateUrl: 'fluro-interaction-form/search-select/fluro-search-select.html',
        controller: 'FluroSearchSelectController',
        wrapper: ['bootstrapLabel', 'bootstrapHasError'],
    });

});

app.controller('FluroSearchSelectController', function($scope, $http, Fluro, $filter, FluroValidate) {


    /////////////////////////////////////////////////////////////////////////

    //Search Object
    $scope.search = {};

    //Proposed value
    $scope.proposed = {}

    /////////////////////////////////////////////////////////////////////////

    var to = $scope.to;
    var opts = $scope.options;

    //Selection Object
    $scope.selection = {};

    /////////////////////////////////////////////////////////////////////////

    //Get the definition
    var definition = $scope.to.definition;


    /////////////////////////////////////////////////////////////////////////

    if (!definition.params) {
        definition.params = {};
    }

    /////////////////////////////////////////////////////////////////////////

    var restrictType = definition.params.restrictType;

    //Add maximum search results
    var searchLimit = definition.params.searchLimit;
    if (!searchLimit) {
        searchLimit = 10;
    }

    /////////////////////////////////////////////////////////////////////////

    //console.log('DEFINITION', definition);

    //Minimum and maximum
    var minimum = definition.minimum;
    var maximum = definition.maximum;

    if (!minimum) {
        minimum = 0;
    }

    if (!maximum) {
        maximim = 0;
    }

    $scope.multiple = (maximum != 1);

    if($scope.multiple) {
        if($scope.model[opts.key] && _.isArray($scope.model[opts.key])) {
            $scope.selection.values = angular.copy($scope.model[opts.key]);
        }
    } else {
        if($scope.model[opts.key]) {
            $scope.selection.value = $scope.model[opts.key];
        }
    }

    /////////////////////////////////////////////////////////////////////////


    $scope.canAddMore = function() {

        if (!maximum) {
            return true;
        }

        if ($scope.multiple) {
            return ($scope.selection.values.length < maximum);
        } else {
            if (!$scope.selection.value) {
                return true;
            }
        }
    }


    /////////////////////////////////////////////////////////////////////////

    $scope.contains = function(value) {
        if ($scope.multiple) {
            //Check if the values are selected
            return _.includes($scope.selection.values, value);
        } else {
            return $scope.selection.value == value;
        }
    }

    /////////////////////////////////////////////////////////////////////////

    $scope.$watch('model', function(newModelValue, oldModelValue) {
        if (newModelValue != oldModelValue) {

            var modelValue;


            //If there is properties in the FORM model
            if (_.keys(newModelValue).length) {

                //Get the model for this particular field
                modelValue = newModelValue[opts.key];


               

                if ($scope.multiple) {
                    if (modelValue && _.isArray(modelValue)) {
                        $scope.selection.values = angular.copy(modelValue);
                    } else {
                        $scope.selection.values = [];
                    }
                } else {
                    $scope.selection.value = angular.copy(modelValue);
                }
            }
        }
    }, true);

    /////////////////////////////////////////////////////////////////////////

    function setModel() {

        if ($scope.multiple) {
            $scope.model[opts.key] = angular.copy($scope.selection.values);
        } else {
            $scope.model[opts.key] = angular.copy($scope.selection.value);
        }

        if ($scope.fc) {
            $scope.fc.$setTouched();
        }


        checkValidity();
    }

    /////////////////////////////////////////////////////////////////////////

    if (opts.expressionProperties && opts.expressionProperties['templateOptions.required']) {
        $scope.$watch(function() {
            return $scope.to.required;
        }, function(newValue) {
            checkValidity();
        });
    }

    /////////////////////////////////////////////////////////////////////////

    if ($scope.to.required) {
        var unwatchFormControl = $scope.$watch('fc', function(newValue) {
            if (!newValue) {
                return;
            }
            checkValidity();
            unwatchFormControl();
        });
    }

    /////////////////////////////////////////////////////////////////////////

    function checkValidity() {


        var validRequired;
        var validInput = FluroValidate.validate($scope.model[$scope.options.key], definition);

        //Check if multiple
        if ($scope.multiple) {
            if ($scope.to.required) {
                validRequired = _.isArray($scope.model[opts.key]) && $scope.model[opts.key].length > 0;
            }
        } else {
            if ($scope.to.required) {
                if ($scope.model[opts.key]) {
                    validRequired = true;
                }
            }
        }

        if ($scope.fc) {

            $scope.fc.$setValidity('required', validRequired);
            $scope.fc.$setValidity('validInput', validInput);
        }
    }

    /////////////////////////////////////////////////////////////////////////

    $scope.select = function(value) {

        //console.log('SELECT', value)

        if ($scope.multiple) {
            if (!$scope.canAddMore()) {
                return;
            }
            $scope.selection.values.push(value);


        } else {
            $scope.selection.value = value;

        }

        //Clear proposed item
        $scope.proposed = {};

        //Set the model
        setModel();


    }

    /////////////////////////////////////////////////////////

    $scope.retrieveReferenceOptions = function(val) {


        ////////////////////////

        //Create Search Url
        var searchUrl = Fluro.apiURL + '/content';
        if (restrictType) {
            searchUrl += '/' + restrictType;
        }
        searchUrl += '/search';

        ////////////////////////

        return $http.get(searchUrl + '/' + val, {
            ignoreLoadingBar: true,
            params: {
                limit: searchLimit,
            }
        }).then(function(response) {

            //Got the results
            var results = response.data;

            return _.reduce(results, function(filtered, item) {
                var exists = _.some($scope.selection.values, {
                    '_id': item._id
                });
                if (!exists) {
                    filtered.push(item);
                }
                return filtered;
            }, []);

        });

    }

    ////////////////////////////////////////////////////////////

    $scope.getValueLabel = function(value) {
        if(definition.options && definition.options.length) {
            var match = _.find(definition.options, {value:value});
            if(match && match.name) {
                return match.name;
            }
        }

        return value;
    }

    ////////////////////////////////////////////////////////////

    $scope.retrieveValueOptions = function(val) {

        if (definition.options && definition.options.length) {

            var options = _.reduce(definition.options, function(results, item) {

                var exists;

                if ($scope.multiple) {
                    exists = _.includes($scope.selection.values, item.value);
                } else {
                    exists = $scope.selection.value == item.value;
                }

                if (!exists) {
                    results.push({
                        name:item.name,
                        value:item.value,
                    });
                }

                return results;
            }, []);


            return $filter('filter')(options, val);

        } else if (definition.allowedValues && definition.allowedValues.length) {

            var options = _.reduce(definition.allowedValues, function(results, allowedValue) {

                var exists;

                if ($scope.multiple) {
                    exists = _.includes($scope.selection.values, allowedValue);
                } else {
                    exists = $scope.selection.value == allowedValue;
                }

                if (!exists) {
                    results.push({
                        name:allowedValue,
                        value:allowedValue,
                    });
                }

                return results;
            }, []);

            console.log('Options', options)

            return $filter('filter')(options, val);
        }
    }

    /////////////////////////////////////////////////////////////////////////

    $scope.deselect = function(value) {
        if ($scope.multiple) {
            _.pull($scope.selection.values, value);
        } else {
            delete $scope.selection.value;
        }

        setModel();
    }

    /////////////////////////////////////////////////////////////////////////

    $scope.toggle = function(reference) {
        if ($scope.contains(reference)) {
            $scope.deselect(reference);
        } else {
            $scope.select(reference);
        }

        //Update model
        //setModel();
    }

})
app.run(function(formlyConfig, $templateCache) {

    formlyConfig.setType({
        name: 'value',
        templateUrl: 'fluro-interaction-form/value/value.html',
        //controller: 'FluroInteractionDobSelectController',
        wrapper: ['bootstrapHasError'],
    });

});

app.service('NotificationService', function($timeout) {


	var controller = {
		messages:[],
	};

	/////////////////////////////////////
	
	controller.lastMessage = function() {
		return _.last(controller.messages);
	}
	/////////////////////////////////////

	controller.message = function(string, style, duration) {

		if(!style) {
			style = 'info';
		}

		if(!duration) {
			duration = 3000;
		}

		var message = {
			text:string,
			style:style,
			duration:duration,
		}

		//Add the message to the list
		controller.messages.push(message);

		//Remove it after duration
		$timeout(function() {
			_.pull(controller.messages, message);
		}, message.duration);

	}
	/////////////////////////////////////

	return controller;
})
app.directive('preloadImage', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          scope.aspect = angular.isDefined(attrs.aspect) ? scope.$parent.$eval(attrs.aspect) : 0;

            if(scope.aspect) {
                element.wrap('<div class="preload-image-outer aspect-ratio" style="padding-bottom:'+ scope.aspect+'%"></div>');
            } else {
                element.wrap('<div class="preload-image-outer"></div>');
            }
            
            var preloader = angular.element('<span class="image-preloader"><i class="fa fa-spinner fa-spin"/></span>');

            element.on('load', function() {
                element.removeClass('preload-hide');
                element.addClass('preload-show');

                preloader.remove();
            });

            element.on('error', function() {
                // element.removeClass('preload-hide');
                // element.addClass('preload-show');

                preloader.remove();
            });

            scope.$watch('ngSrc', function() {
                // Set visibility: false + inject temporary spinner overlay
                element.addClass('preload-hide');


                element.parent().append(preloader);
            });
        }
    };
});
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
app.directive('scrollActive', function($compile, $timeout, $window, FluroScrollService) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs) {

            ////////////////////////////////////////////////

            var onActive;
            var onBefore;
            var onAfter;
            var onAnchor;

            ////////////////////////////////////////////////

            var currentContext = '';
            var anchored;

            ////////////////////////////////////////////////

            if ($attrs.onActive) {
                onActive = function() {
                    $scope.$eval($attrs.onActive);
                }
            }

            if ($attrs.onAnchor) {
                onAnchor = function() {
                    $scope.$eval($attrs.onAnchor);
                }
            }

            if ($attrs.onAfter) {
                onAfter = function() {
                    $scope.$eval($attrs.onAfter);
                }
            }

            if ($attrs.onBefore) {
                onBefore = function() {
                    $scope.$eval($attrs.onBefore);
                }
            }


            ////////////////////////////////////////////////


            //Check if there is a parent we should be looking at instead of the body
            var parent = $element.closest('[scroll-active-parent]');
            var body = angular.element('body');

            ////////////////////////////////////////////////
            ////////////////////////////////////////////////

            if (parent.length) {
                //Listen for the parent scroll value
                parent.bind("scroll", updateParentScroll);
                $timeout(updateParentScroll, 10);
            } else {
                //Watch for changes to the main scroll value
                $scope.$watch(function() {
                    return FluroScrollService.getScroll();
                }, updateFromMainScroll);

                //Fire one for good measure
                $timeout(updateFromMainScroll, 10);
            }

            ////////////////////////////////////////////////
            ////////////////////////////////////////////////
            ////////////////////////////////////////////////
            ////////////////////////////////////////////////
            ////////////////////////////////////////////////

            function setScrollContext(context) {
                if (currentContext != context) {
                    currentContext = context;

                    $timeout(function() {

                        switch (context) {
                            case 'active':
                                $element.removeClass('scroll-after');
                                $element.removeClass('scroll-before');
                                $element.addClass('scroll-active');
                                $scope.scrollActive = true;
                                $scope.scrollBefore = false;
                                $scope.scrollAfter = false;

                                if (onActive) {
                                    onActive();
                                }

                                break;
                            case 'before':
                                $element.removeClass('scroll-after');
                                $element.addClass('scroll-before');
                                $element.removeClass('scroll-active');
                                $scope.scrollActive = false;
                                $scope.scrollBefore = true;
                                $scope.scrollAfter = false;

                                if (onBefore) {
                                    onBefore();
                                }

                                break;
                            case 'after':
                                $element.addClass('scroll-after');
                                $element.removeClass('scroll-before');
                                $element.removeClass('scroll-active');
                                $scope.scrollActive = false;
                                $scope.scrollBefore = false;
                                $scope.scrollAfter = true;

                                if (onAfter) {
                                    onAfter();
                                }

                                break;
                        }
                    })
                }
            }



            //////////////////////////////////////////////
            //////////////////////////////////////////////

            function updateParentScroll() {


                //Get the scroll value
                var scrollValue = parent.scrollTop();

                /////////////////////////

                //constants
                var viewportHeight = parent.height();
                var contentHeight = parent.get(0).scrollHeight;

                //////////////////////////////////////////////

                //Limits and markers
                var viewportHalf = (viewportHeight / 2);
                var maxScroll = contentHeight - viewportHeight;

                //Scroll
                var startView = 0;
                var endView = startView + viewportHeight;
                var halfView = endView - (viewportHeight / 2);


                /////////////////////////

                //Element Dimensions
                var elementHeight = $element.outerHeight();
                var elementStart = $element.position().top;
                var elementEnd = elementStart + elementHeight;
                var elementHalf = elementStart + (elementHeight / 4);

                ///////////////////////////////////////////////////
                ///////////////////////////////////////////////////

                //If an anchor callback has been specified
                if (onAnchor) {
                    var start = parseInt(startView);
                    var rangeStart = parseInt(elementStart);
                    var rangeEnd = parseInt(elementHalf);
                    
                    console.log(rangeStart, start, rangeEnd);
                    
                    if (start >= rangeStart && start < rangeEnd) {
                        if(!anchored) {
                            anchored = true;
                            if (anchored) {
                                onAnchor();
                            }
                        }
                    } else {
                        anchored = false;
                    }
                }


                ///////////////////////////////////////////////////

                //Check if the entire element is viewable on screen
                var entirelyViewable = (elementStart >= startView) && (elementEnd <= endView);

                ///////////////////////////////////////////////////

                //console.log('Scroll Value', entirelyViewable, scrollValue, halfView);
                if (entirelyViewable) {
                    return setScrollContext('active');
                }

                //Scrolled past the content so set to after
                if (halfView >= elementEnd) {
                    return setScrollContext('after');
                }

                //If element reaches half of the screen viewport
                if (halfView >= elementStart) {
                    return setScrollContext('active');
                }

                //If we reach the end of the page
                if (startView >= (maxScroll - 200)) {
                    return setScrollContext('active');
                }

                //Otherwise we havent reached the element yet
                return setScrollContext('before');



            }

            //////////////////////////////////////////////
            //////////////////////////////////////////////

            function updateFromMainScroll(scrollValue) {


                //constants
                var windowHeight = $window.innerHeight;
                var documentHeight = body.height();

                //////////////////////////////////////////////

                //Limits and markers
                var windowHalf = (windowHeight / 2);
                var maxScroll = documentHeight - windowHeight;

                //Scroll
                var startView = scrollValue;
                if(!startView) {
                    startView = 0;
                }
                var endView = startView + windowHeight;
                var halfView = endView - (windowHeight / 2)

                ///////////////////////////////////////////////////

                //Element
                var elementHeight = $element.outerHeight();
                var elementStart = $element.offset().top;
                var elementEnd = elementStart + elementHeight;
                var elementHalf = elementStart + (elementHeight / 4);

                ///////////////////////////////////////////////////
                ///////////////////////////////////////////////////

                //If an anchor callback has been specified
                if (onAnchor) {
                    var start = parseInt(startView);
                    var rangeStart = parseInt(elementStart);
                    var rangeEnd = parseInt(elementHalf);

                    console.log(rangeStart, start, rangeEnd);
                    
                    if (start >= rangeStart && start < rangeEnd) {
                        if(!anchored) {
                            anchored = true;
                            if (anchored) {
                                onAnchor();
                            }
                        }
                    } else {
                        anchored = false;
                    }
                }
                

                ///////////////////////////////////////////////////

                //Check if the entire element is viewable on screen
                var entirelyViewable = (elementStart >= startView) && (elementEnd <= endView);

                ///////////////////////////////////////////////////

                //console.log('Scroll Value', entirelyViewable, scrollValue, halfView);
                if (entirelyViewable) {
                    return setScrollContext('active');
                }

                //Scrolled past the content so set to after
                if (halfView >= elementEnd) {
                    return setScrollContext('after');
                }

                //If element reaches half of the screen viewport
                if (halfView >= elementStart) {
                    return setScrollContext('active');
                }

                //If we reach the end of the page
                if (startView >= (maxScroll - 200)) {
                    return setScrollContext('active');
                }


                //Otherwise we havent reached the element yet
                return setScrollContext('before');

            }

        }
    };
});
app.service('FluroScrollService', function($window, $location, $timeout) {

    var controller = {};
    
    /////////////////////////////////////
    
    controller.cache = {}
    
    /////////////////////////////////////

    controller.direction = 'down';

    /////////////////////////////////////

    var _value = 0;
    var body = angular.element('html,body');

     /////////////////////////////////////
   
    /////////////////////////////////////

    // angular.element($window).on('hashchange', function (event) {
    //     console.log('Event', window.location.hash);
    //     //var previousValue = _value;

    //     // Do what you need to do here like... getting imageId from #
    //     //var currentImageId = $location.search().imageId;
    //    // event.preventDefault();
    //    // event.stopPropagation();

    //     //Set scroll to previous value
    //     body.scrollTop(_value);

    //     var hash = $location.hash();
    //     controller.scrollToId(hash, 'slow');
    //     console.log('Hashchanged', hash, 'slow');


    //     //return false;
    // });


    /////////////////////////////////////

    controller.setAnchor = function(id) {
        $location.hash('jump-to-' + id);
    }

    /////////////////////////////////////

    controller.getAnchor = function() {
        var hash = $location.hash();
        if (_.startsWith(hash, 'jump-to-')) {
            return hash.substring(8);
        } else {
            return hash;
        }
    }

    /////////////////////////////////////

    function updateScroll() {
        var v = this.pageYOffset;

        if (_value != this.pageYOffset) {
            if (v < _value) {
                controller.direction = 'up';
            } else {
                controller.direction = 'down';
            }


            $timeout(function() {
                _value = this.pageYOffset;
            });
        }
    }

    /////////////////////////////////////

    controller.scrollToID =
        controller.scrollToId = function(id, speed, selector, offset) {

            if (speed != 0 && !speed) {
                speed = 'fast';
            }

            var $target = angular.element('#' + id);

            if ($target && $target.offset && $target.offset()) {
                if (!selector) {
                    selector = 'body,html';
                }


                var pos = $target.offset().top;

                //If theres an offset
                if(offset) {
                    pos += Number(offset);
                }

                angular.element(selector).animate({
                    scrollTop: pos
                }, speed);
            }

    }

    /////////////////////////////////////

    controller.scrollToPosition =
        controller.scrollTo = function(pos, speed, selector, offset) {

            if (speed != 0 && !speed) {
                speed = 'fast';
            }

            if (!selector) {
                selector = 'body,html';
            }


             //If theres an offset
            if(offset) {
                pos += Number(offset);
            }

            angular.element(selector).animate({
                scrollTop: pos
            }, speed);
    }

    /////////////////////////////////////

    controller.get =
    controller.getScroll = function() {
        return _value;
    }

    /////////////////////////////////////

    controller.getMax = function(selector) {

        if (!selector) {
            selector = 'body,html';
        }

        var bodyHeight = angular.element(selector).height();
        var windowHeight = $window.innerHeight;

        return (bodyHeight - windowHeight);
    }


    controller.getHalfPoint = function() {
        return ($window.innerHeight / 2);
    }

    controller.getWindowHeight = function() {
        return $window.innerHeight;
    }

    /////////////////////////////////////

    angular.element($window).bind("scroll", updateScroll);

    //Update the scroll on init
    updateScroll();

    /////////////////////////////////////

    return controller;

});
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
app.controller('UserLoginController', function($scope, $http, FluroTokenService, NotificationService) {
    

    ////////////////////////////////////////

    $scope.credentials = {}
    
    $scope.status = 'ready';
    
    ////////////////////////////////////////

    $scope.signup = function(options) {
        
        $scope.status = 'processing';
     
     	//Signup for a new persona
        var request = FluroTokenService.signup($scope.credentials, options)
        
        request.then(function(res) {
            $scope.status = 'ready';
            NotificationService.message('Hi ' + res.data.firstName)
        }, function(res) {
            $scope.status = 'ready';
            NotificationService.message(String(res.data), 'danger')
        })
    }
    
    ////////////////////////////////////////

    $scope.login = function(options) {
        
        $scope.status = 'processing';
        var request = FluroTokenService.login($scope.credentials, options);

        request.then(function(res) {
            $scope.status = 'ready';
            NotificationService.message('Welcome back ' + res.data.firstName)
        }, function(res) {
            $scope.status = 'ready';
            console.log('FAILED', res);
            NotificationService.message(String(res.data), 'danger')
        })
    }
   
});


app.directive('hamburger', function() {
    return {
        restrict: 'E', 
        replace:true, 
        template:'<div class="hamburger"> \
		  <span></span> \
		  <span></span> \
		  <span></span> \
		  <span></span> \
		</div>', 
        link: function($scope, $elem, $attr) {
        } 
    } 
});
app.directive('compileHtml', function($compile) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            scope.$watch(function() {
                return scope.$eval(attrs.compileHtml);
            }, function(value) {



                element.html(value);
                $compile(element.contents())(scope);
            });
        }
    };
});
app.directive('infinitePager', function($timeout, $sessionStorage) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attr) {
            var perPage = 16;
            
            if($attr.perPage) {
                perPage = parseInt($attr.perPage);
            }
            
            $scope.pager = {
                currentPage: 0,
                limit: perPage,
            };

            $scope.pages = [];

    
            /////////////////////////////////////////////////////
            
            $scope.$watch($attr.items, function(items) {
                
                $scope.allItems = items;
                
                if($scope.allItems) {
                    $scope.pages.length = 0;
                    $scope.pager.currentPage = 0;
                   
                    $scope.totalPages = Math.ceil($scope.allItems.length / $scope.pager.limit) - 1;
                      $scope.updateCurrentPage();
                }
            });
    
            /////////////////////////////////////////////////////
           
            //Update the current page
            $scope.updateCurrentPage = function() {


                
                if ($scope.allItems.length < ($scope.pager.limit * ($scope.pager.currentPage - 1))) {
                    $scope.pager.currentPage = 0;
                }
        
                var start = ($scope.pager.currentPage * $scope.pager.limit);
                var end = start + $scope.pager.limit;
        
                //Slice into seperate chunks
                var sliced = _.slice($scope.allItems, start, end);
                $scope.pages.push(sliced);
            }
    
            /////////////////////////////////////////////////////
             var timer;
            
            $scope.nextPage = function() {
                if ($scope.pager.currentPage < $scope.totalPages) {
                    $timeout.cancel(timer);
                    timer = $timeout(function() {
                        $scope.pager.currentPage = ($scope.pager.currentPage + 1);
                        $scope.updateCurrentPage();
                    });
                } else {
                    $scope.updateCurrentPage();
                }
            }
            
            /////////////////////////////////////////////////////
        }
    };
    
})
app.filter('capitalise', function() {
	return function (str) {
		return _.upperCase(str);
	}
})
app.filter('commaSummary', function() {
    return function (arrayOfObjects, limit, delimiter) {

        if(!limit) {
            limit = 20;
        }

        if(!delimiter || !delimiter.length) {
           delimiter = ', ';
        }

        var names = _.chain(arrayOfObjects)
        .map(function(object) {
            return object.title;
        })
        .compact()
        .value();

        var string = names.join(delimiter);

        if(string.length >=limit) {
            string = string.substr(0,limit) + '...';
        }

        return string;
    }
})
app.filter('maplink', function() {
    return function(location) {



        var pieces = [];

        if (location.title && location.title.length) {
            pieces.push(location.title);
        }

        if (location.addressLine1 && location.addressLine1.length) {
            pieces.push(location.addressLine1);
        }

        if (location.addressLine2 && location.addressLine2.length) {
            pieces.push(location.addressLine2);
        }

        if (location.state && location.state.length) {
            pieces.push(location.state);
        }

        if (location.suburb && location.suburb.length) {
            pieces.push(location.suburb);
        }

        if (location.postalCode && location.postalCode.length) {
            pieces.push(location.postalCode);
        }

        var url = 'https://www.google.com/maps/place/' + pieces.join('+');


        return url;
    }
})
app.filter('readableDate', function() {
    return function(event, style) {


        if(!event.startDate) {
            return;
        }

        var startDate = new Date(event.startDate);
        var endDate = new Date(event.endDate);

       

        ///////////////////////////////////////////////

        var noEndDate = startDate.format('g:ia j M Y') == endDate.format('g:ia j M Y');
        var sameYear = (startDate.format('Y') == endDate.format('Y'));
        var sameMonth = (startDate.format('M Y') == endDate.format('M Y'));
        var sameDay = (startDate.format('j M Y') == endDate.format('j M Y'));

        switch (style) {
            case 'short':
                // console.log('SHORT', startDate, endDate);
                if (noEndDate) {
                    return startDate.format('j M')
                }

                if (sameDay) {
                    //8am - 9am Thursday 21 May 2016
                    return startDate.format('j M')
                }

                if (sameMonth) {
                    //20 - 21 May 2016
                    return startDate.format('j') + ' - ' + endDate.format('j M')
                }

                if (sameYear) {
                    //20 Aug - 21 Sep 2016
                    return startDate.format('j') + ' - ' + endDate.format('j M')
                }

                //20 Aug 2015 - 21 Sep 2016
                return startDate.format('j M Y') + ' - ' + endDate.format('j M Y')

                break;
            default:
                if (noEndDate) {
                    return startDate.format('g:ia l j M Y')
                }

                if (sameDay) {
                    //8am - 9am Thursday 21 May 2016
                    return startDate.format('g:ia') + ' - ' + endDate.format('g:ia l j M Y')
                }

                if (sameMonth) {
                    //20 - 21 May 2016
                    return startDate.format('j') + ' - ' + endDate.format('j M Y')
                }

                if (sameYear) {
                    //20 Aug - 21 Sep 2016
                    return startDate.format('j M') + ' - ' + endDate.format('j M Y')
                }

                //20 Aug 2015 - 21 Sep 2016
                return startDate.format('j M Y') + ' - ' + endDate.format('j M Y')

                break;
        }

    };
});

app.filter('timeago', function(){
  return function(date){
    return moment(date).fromNow();
  };
});

app.controller('ChecklistController', function($scope, FluroContent, $filter, NotificationService, $localStorage, event, contacts, $analytics) {


    // console.log('contacts', contacts);
    // console.log('event', event);

    $scope.event = event;


    if ($localStorage['checklistSearch']) {
        $scope.search = $localStorage['checklistSearch'];
    } else {
        $scope.search = $localStorage['checklistSearch'] =  {terms:''};
    }
    $scope.search.contactstatus = 'active'

    ////////////////////////////////////////////////

    $scope.report = {
        items:[]
    };

    // $scope.scrollTop = function () {
    //     window.scroll(0,0)
    // }


    $scope.selected = function(item) {
        return  _.includes($scope.report.items, item._id);
    }

    $scope.select = function(item) {
        if(!$scope.isCheckedIn(item)) {
            return  $scope.report.items.push(item._id);
        }
    }

    $scope.deselect = function(item) {
        return   _.pull($scope.report.items, item._id);
    }

    $scope.toggle = function(item) {
        if ($scope.selected(item)) {
            $scope.deselect(item);
        } else {
            $scope.select(item)
        }
    }

    $scope.reset = function () {

        $scope.report = {
            items:[]
        }
    }


    /////////////////////////////////////////

    $scope.isCheckedIn = function(contact) {


        return _.some($scope.checkins, function(checkin) {
            //  console.log('Check checkin', contact._id, checkin.contact._id, checkin.contact._id == contact._id)
            return (checkin.contact._id == contact._id);
        })

    }

    //Send the report data to api
    $scope.$watch('event._id', function(eventID) {
        $scope.refreshCurrentCheckins();
    })


    $scope.refreshCurrentCheckins = function() {
        //Callback on success
        function success(res) {
            $scope.checkins = res;
        }

        function fail(res) {
             console.log('the request didnt work', res);
        }


        if(!$scope.event) {
            return console.log('No event to refresh');
        }

        var eventId = $scope.event._id;

        //Request a certain type of content from the Fluro API
        FluroContent.endpoint('checkin/event/' + eventId, true, true).query({all:true}).$promise.then(success, fail);
    }


    /////////////////////////////////////////


    $scope.submitReport = function() {

        var eventId = $scope.event._id;
        var items = $scope.report.items;
        var successCount = 0;

        NotificationService.message('Submitting checkins', 'info')

        async.each(items, function(_id, next) {

            //Request a certain type of content from the Fluro API
            var promise = FluroContent.endpoint('checkin/' + eventId).save({
                contact:_id
            }).$promise.then(success, fail);


            //Callback on success_id
            function success(res) {
                // Google Analytics
                $analytics.eventTrack('checkin success', {
                    category: 'Contact',
                    label: res.firstName + ' ' + res.lastName, // Contact name
                    value: 1 // number
                });
                successCount += 1;

                return next();
            }

            function fail(err) {
                // Google Analytics
                $analytics.eventTrack('checkin failed', {
                    category: 'Contact',
                    label: 'Checkin submit fail',
                    value: 1 // number
                });

                return next(err);
            }

        }, finished );


        function finished (err) {

            if (err) {
                return NotificationService.message('Error saving checkins!', 'danger')
            }

            $scope.refreshCurrentCheckins();
            $scope.reset();
            NotificationService.message('Checkins saved', 'success')


            // Google Analytics
            $analytics.eventTrack('submit multiple checkins success', {
                category: 'Contact',
                label: 'Multiple Checkins Succeeded', // Contact name
                value: successCount // number
            });

        }
    }





/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////



    /////////////////////////////

    //Watch if anything changes and update results
    $scope.$watch(contacts, updateSearchOptions)
    $scope.$watch('search', updateSearchOptions, true)

    //////////////////////////////

    $scope.toggleFilter = function(key, value) {
        if($scope.search[key] == value) {
            return delete $scope.search[key];
        }

        $scope.search[key] = value;

    }

    ////////////////////////////////////////////////////////

    //Update search options
    function updateSearchOptions() {
        // console.log('Updating the search options')

        /////////////////////////

        var filteredContacts = contacts;

        ///////////////////////////

        //Filter items by search terms
        if($scope.search.terms && $scope.search.terms.length) {
            filteredContacts = $filter('filter')(filteredContacts, $scope.search.terms);
        }

        //////////////////////////

        //Now apply selectable filters
        if ($scope.search.realms) {
            filteredContacts = _.filter(filteredContacts, function(contact) {

                var selectedRealmID = $scope.search.realms;
                return _.some(contact.realms, {_id:selectedRealmID})
            });
        }

        if ($scope.search.tags) {
            filteredContacts = _.filter(filteredContacts, function(contact) {

                var selectedTagID = $scope.search.tags;
                return _.some(contact.tags, {_id:selectedTagID})
            });
        }
        if ($scope.search.contactstatus) {
            filteredContacts = _.filter(filteredContacts, function(contact) {

                var selectedStatusID = $scope.search.contactstatus;
                return (contact.status == selectedStatusID)
            });
        }
        if ($scope.search.groups) {
            filteredContacts = _.filter(filteredContacts, function(contact) {

                var selectedGroupID = $scope.search.groups;
                return _.some(contact.teams, {_id:selectedGroupID})
            });
        }



        //////////////////////////////////////////

        // console.log('filtered groups', $scope.search.groups)
        // console.log('filtered realms', $scope.search.realms)
        // console.log('filtered tags', $scope.search.tags)


        // if ($scope.search.style) {
        //     filteredContacts = _.filter(filteredContacts, function(contact) {
        //         return contact.data.publicData.style == $scope.search.style;
        //     });
        // }

        /////////////////////////////////////////////////////


        $scope.tags = _.chain(filteredContacts)
        .map(function(contact) {
            if(contact.tags.length) {
                return contact.tags;
            }
        })
        .flatten()
        .compact()
        .uniqBy(function(tag) {
            return tag.title;
        })
        .value();

        // ///////////////////////////

        $scope.status = _.chain(filteredContacts)
        .map(function(contact) {
            if(contact.status) {
                return contact.status;
            }
        })
        .flatten()
        .compact()
        .uniqBy(function(status) {
          return status;
        })
        .value();

        // ///////////////////////////

        $scope.realms = _.chain(filteredContacts)
        .map(function(contact) {
            if(contact.realms.length) {
                return contact.realms;
            }
        })
        .flatten()
        .compact()
        .uniqBy(function(realm) {
            return realm._id;
        })
        .value();

        // console.log('realms are', $scope.realms)

        // /////////////////////////////

        $scope.groups = _.chain(filteredContacts)
        .map(function(contact) {
            return contact.teams;
        })
        .flatten()
        .compact()
        .uniqBy(function(team) {
            return team._id;
        })
        .reduce(function(results, team) {

            var definition = 'Generic';
            if(team.definition) {
                definition = team.definition.charAt(0).toUpperCase() + team.definition.slice(1);
            }

            //Definition here will be '' or 'lifegroup'

            //Check to see if our new list has an entry already for 'lifegroup'
            var existing = _.find(results, {definition:definition});

            if(!existing) {
                existing = {
                    title:definition,
                    definition:definition,
                    groups:[]
                }

                results.push(existing);
            }


            //By this stage existing will either be the existing definition in the results set
            //Or an entry we just created
            existing.groups.push(team);

            return results;
        }, [])
        .value();


        console.log('groups', $scope.groups)
        // console.log('Updated filteredContacts')

        //Update the items with our search
        $scope.filteredContacts = _.orderBy(filteredContacts, function(contact) {
            return contact.lastName;
        });

        if(($scope.filteredContacts.length < $scope.pager.itemsPerPage)) {
            console.log('set current')
            $scope.pager.current = 1;
        }


    }

    ////////////////////////////////////////////////

    $scope.pager = {
        current:1,
        itemsPerPage:50,
        items:[]
    };

    $scope.$watch('filteredContacts + pager.current', function() {

        console.log('filtered contacts is', $scope.filteredContacts.length)
        $scope.pager.total = $scope.filteredContacts.length;

        var start = ($scope.pager.current-1) * $scope.pager.itemsPerPage;
        var end = start + $scope.pager.itemsPerPage;

        $scope.pager.pages = Math.ceil($scope.filteredContacts.length / $scope.pager.itemsPerPage)
        $scope.pager.items = $scope.filteredContacts.slice(start, end)
    })

        ////////////////////////////////////////////////


})

app.controller('ViewContentController', function($scope, item, definition) {


	$scope.definition = definition;
	$scope.item = item;


})
app.controller('EventsController', function($scope, events, $localStorage, $filter) {

	//Grab all events
    $scope.events = events;


    if ($localStorage['eventSearch']) {
        $scope.search = $localStorage['eventSearch'];
    } else {
       $scope.search = $localStorage['eventSearch'] = {};
    }

    ///////////////////////////////////////

    // $scope.$watch('search', updateFilters, true);
    $scope.$watch('search.filters.tags + search.filters.realms + search.terms', updateFilters);




    function updateFilters() {
        // console.log('yep')

        //Start with all the results
        var filteredItems = events;


        //Filter search terms
        if ($scope.search.terms && $scope.search.terms.length) {
            filteredItems = $filter('filter')(filteredItems, $scope.search.terms);
        }


        if ($scope.search.filters) {
            if ($scope.search.filters.realms && $scope.search.filters.realms.length) {
                filteredItems = _.filter(filteredItems, function(item) {
                    return _.some(item.realms, function(realm) {
                        return realm._id == $scope.search.filters.realms;
                    })
                })
            }

            if ($scope.search.filters.tags && $scope.search.filters.tags.length) {
                filteredItems = _.filter(filteredItems, function(item) {
                    return _.some(item.tags, function(tag) {
                        return tag._id == $scope.search.filters.tags;
                    })
                })
            }
        }

        $scope.filteredItems = filteredItems;

        ///////////////////////////////////////

        $scope.dates = _.chain(filteredItems)
        .orderBy(function(event) {
            var date = new Date(event.startDate);

            return date.getTime();
        })
        .reverse()
            .reduce(function(results, event) {

                //Unique date key
                var date = new Date(event.startDate);
                date.setHours(0, 0, 0, 0);

                var dateKey = date.format('j M Y');

                //Get existing if this date is already in the set
                var existing = _.find(results, {
                    dateKey: dateKey
                });

                //If its not, then create the date for the set
                if (!existing) {
                    existing = {
                        dateKey: dateKey,
                        date: date,
                        // events:[],
                        times: [],
                    }
                    results.push(existing);
                }

                var time = new Date(event.startDate).format('g:ia');

                var existingTimeRow = _.find(existing.times, {
                    time: time
                });

                if (!existingTimeRow) {
                    existingTimeRow = {
                        time: time,
                        events: []
                    }

                    existing.times.push(existingTimeRow);
                }

                //Add the event to the list
                existingTimeRow.events.push(event);

                return results;

            }, [])
        .value();



        // console.log('dates', $scope.dates)
    }
 

    updateFilters();   

    ///////////////////////////////////

    $scope.realms = _.chain(events)
    .map(function(song) {
        return song.realms;
    })
    .flatten()
    .compact()
    .uniqBy(function(realm) {
        return realm._id;
    })
    .orderBy(function(item) {
        return item.title;
    })
    .value()

    ///////////////////////////////////

    $scope.tags = _.chain(events)
    .map(function(song) {
        return song.tags;
    })
    .flatten()
    .compact()
    .uniqBy(function(tag) {
        // console.log('Tag', tag);
        return tag._id;
    })
    .orderBy(function(item) {
        return item.title;
    })
    .value()





    $scope.openModalCreateEvent = function() {
        var modalInstance = $uibModal.open({
          animation: true,
          component: 'modalCreateEvent',
          size: 'lg',
          keyboard: false,
          backdrop: 'static',
          resolve: {
          }
        });

        modalInstance.result.then(function(event) {

            // console.log('EVENT', event);
            if(!event){return;}
            // $log.info('event created', event);
            // 
            var eventDefinition = 'event';
            if(eventDefinition.definition) {
                eventDefinition = eventDefinition.definition;
            }

            $state.go('upload', {id: event._id, definition:eventDefinition});
        }, function() {
            $log.info('modal-component dismissed at: ' + new Date());
        });
    }

});
app.controller('CreateContactController', function($scope, $stateParams, FluroContent, $analytics) {


    $scope.returnTo = $stateParams.returnTo;

    $scope.settings = {};
 
    ///////////////////////////////////

    $scope.contact = newContact();

    ///////////////////////////////////

    function newContact() {
        return {
            emails:[],
            phoneNumbers:[],
            realms:[$stateParams.realm]
        }
    }
    
    ///////////////////////////////////
    
    $scope.submitForm = function() {
        
        $scope.settings.state = 'processing';

        //Callback on success
        function success(res) {

            $scope.contact = newContact();

            console.log('Contact saved', res);
            $scope.settings.state = 'success';
            $scope.settings.result = res;

            // Google Analytics
            $analytics.eventTrack('contact created', {
                category: 'Contact',
                label: res.title, // Contact name
                value: 1 // number
            });
        }
        
        function fail(res) {
            console.log('Contact failed to save', res);
            $scope.settings.state = 'failed';
        }
        
        ///////////////////////////////////

        var promise = FluroContent.resource('contact').save($scope.contact).$promise.then(success, fail);
        
    }
});
app.service('NotificationService', function($timeout) {


	var controller = {
		messages:[],
	};

	/////////////////////////////////////
	
	controller.lastMessage = function() {
		return _.last(controller.messages);
	}
	/////////////////////////////////////

	controller.message = function(string, style, duration) {

		if(!style) {
			style = 'info';
		}

		if(!duration) {
			duration = 3000;
		}

		var message = {
			text:string,
			style:style,
			duration:duration,
		}

		//Add the message to the list
		controller.messages.push(message);

		console.log('message', controller.messages)

		//Remove it after duration
		$timeout(function() {
			_.pull(controller.messages, message);
		}, message.duration);

	}

	controller.dismiss = function() {
		controller.messages = [];
	}
	/////////////////////////////////////

	return controller;
})



angular.module('fluro').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('accordion/accordion.html',
    "<div class=accordion ng-class={expanded:settings.expanded}><div class=accordion-title ng-click=\"settings.expanded = !settings.expanded\"><div class=container-fluid><div class=text-wrap><h3 class=title><i class=\"fa fa-angle-right pull-right\" ng-class=\"{'fa-rotate-90':settings.expanded}\"></i> <span ng-transclude=title></span></h3></div></div></div><div class=accordion-body><div ng-class=\"{'container':wide, 'container-fluid':!wide}\"><div ng-class=\"{'text-wrap':!wide}\" ng-transclude=body></div></div></div></div>"
  );


  $templateCache.put('admin-date-select/admin-date-select.html',
    "<div class=dateselect ng-class={open:settings.open}><div class=btn-group><a class=\"btn btn-default\" ng-class={active:settings.open} ng-click=\"settings.open = !settings.open\"><i class=\"fa fa-calendar\"></i> <span ng-bind-html=\"readable | trusted\"></span></a></div><dpiv class=popup><div class=datetime><div uib-datepicker class=datepicker datepicker-options=datePickerOptions ng-model=settings.dateModel></div></div></dpiv></div>"
  );


  $templateCache.put('extended-field-render/extended-field-render.html',
    "<div class=\"extended-field-render form-group\"><label ng-if=\"field.type != 'group'\">{{field.title}}</label><div field-transclude></div></div>"
  );


  $templateCache.put('extended-field-render/field-types/multiple-value.html',
    "<div ng-switch=field.type><div class=content-select ng-switch-when=reference><div class=\"content-list list-group\"><div class=\"list-group-item clearfix\" ng-repeat=\"item in model[field.key]\"><a ui-sref=viewContent({id:item._id})><div class=pull-left><img ng-if=\"item._type == 'image'\" ng-src=\"{{$root.getThumbnailUrl(item._id)}}\"> <i ng-if=\"item._type != 'image'\" class=\"fa fa-{{item._type}}\"></i> <i ng-if=\"item.definition == 'song'\" class=\"fa fa-music\" style=padding-right:10px></i> <span>{{item.title}}</span></div></a><div class=\"actions pull-right btn-group\"><a class=\"btn btn-tiny btn-xs\" ng-if=\"item.assetType == 'upload'\" target=_blank ng-href={{$root.getDownloadUrl(item._id)}}><i class=\"fa fa-download\"></i></a> <a class=\"btn btn-tiny btn-xs\" ng-if=canEdit(item) ng-click=editInModal(item)><i class=\"fa fa-edit\"></i></a></div></div></div></div><div ng-switch-default><ul><li ng-repeat=\"value in model[field.key]\">{{value}}</li></ul></div></div>"
  );


  $templateCache.put('extended-field-render/field-types/value.html',
    "<div ng-switch=field.type><div class=content-select ng-switch-when=reference><div class=\"content-list list-group\"><div class=\"list-group-item clearfix\" ng-init=\"item = model[field.key]\"><a ui-sref=viewContent({id:item._id})><div class=pull-left><img ng-if=\"item._type == 'image'\" ng-src=\"{{$root.getThumbnailUrl(item._id)}}\"> <i ng-if=\"item._type != 'image'\" class=\"fa fa-{{item._type}}\"></i> <span>{{item.title}}</span></div></a><div class=\"actions pull-right btn-group\"><a class=\"btn btn-tiny btn-xs\" ng-if=\"item.assetType == 'upload'\" target=_blank ng-href={{$root.getDownloadUrl(item._id)}}><i class=\"fa fa-download\"></i></a></div></div></div></div><div ng-switch-when=date>{{model[field.key] | formatDate:'j M Y'}}</div><div ng-switch-when=image><img ng-src=\"{{$root.asset.imageUrl(item._id)}}\"></div><div ng-switch-default><div ng-bind-html=\"model[field.key] | trusted\"></div></div></div>"
  );


  $templateCache.put('fluro-interaction-form/button-select/fluro-button-select.html',
    "<div id={{options.id}} class=\"button-select {{to.definition.directive}}-buttons\" ng-model=model[options.key]><a ng-repeat=\"(key, option) in to.options\" ng-class={active:contains(option.value)} class=\"btn btn-default\" id=\"{{id + '_'+ $index}}\" ng-click=toggle(option.value)><span>{{option.name}}</span><i class=\"fa fa-check\"></i></a></div>"
  );


  $templateCache.put('fluro-interaction-form/custom.html',
    "<div ng-model=model[options.key] compile-html=to.definition.template></div>"
  );


  $templateCache.put('fluro-interaction-form/date-select/fluro-date-select.html',
    "<div ng-controller=FluroDateSelectController><div class=input-group><input class=form-control datepicker-popup={{format}} ng-model=model[options.key] is-open=opened min-date=to.minDate max-date=to.maxDate datepicker-options=dateOptions date-disabled=\"disabled(date, mode)\" ng-required=to.required close-text=\"Close\"> <span class=input-group-btn><button type=button class=\"btn btn-default\" ng-click=open($event)><i class=\"fa fa-calendar\"></i></button></span></div></div>"
  );


  $templateCache.put('fluro-interaction-form/dob-select/fluro-dob-select.html',
    "<div class=fluro-interaction-dob-select><dob-select ng-model=model[options.key] hide-age=to.params.hideAge hide-dates=to.params.hideDates></dob-select></div>"
  );


  $templateCache.put('fluro-interaction-form/embedded/fluro-embedded.html',
    "<div class=fluro-embedded-form><div class=form-multi-group ng-if=\"to.definition.maximum != 1\"><div class=\"panel panel-default\" ng-init=\"fields = copyFields(); dataFields = copyDataFields(); \" ng-repeat=\"entry in model[options.key] track by $index\"><div class=\"panel-heading clearfix\"><a ng-if=canRemove() class=\"btn btn-danger btn-sm pull-right\" ng-click=\"model[options.key].splice($index, 1)\"><span>Remove {{to.label}}</span><i class=\"fa fa-times\"></i></a><h5>{{to.label}} {{$index + 1}}</h5></div><div class=panel-body><formly-form model=entry fields=fields></formly-form><formly-form model=entry.data fields=dataFields></formly-form></div></div><a class=\"btn btn-primary btn-sm\" ng-if=canAdd() ng-click=addAnother()><span>Add <span ng-if=model[options.key].length>another</span> {{to.label}}</span><i class=\"fa fa-plus\"></i></a></div><div ng-if=\"to.definition.maximum == 1 && options.key\"><formly-form model=model[options.key] fields=options.data.fields></formly-form><formly-form model=model[options.key].data fields=options.data.dataFields></formly-form></div></div>"
  );


  $templateCache.put('fluro-interaction-form/field-errors.html',
    "<div class=field-errors ng-if=\"fc.$touched && fc.$invalid\"><div ng-show=fc.$error.required class=\"alert alert-danger\" role=alert><span class=\"fa fa-exclamation\" aria-hidden=true></span> <span class=sr-only>Error:</span> {{to.label}} is required.</div><div ng-show=fc.$error.validInput class=\"alert alert-danger\" role=alert><span class=\"fa fa-exclamation\" aria-hidden=true></span> <span class=sr-only>Error:</span> <span ng-if=!to.errorMessage.length>'{{fc.$viewValue}}' is not a valid value</span> <span ng-if=to.errorMessage.length>{{to.errorMessage}}</span></div><div ng-show=fc.$error.email class=\"alert alert-danger\" role=alert><span class=\"fa fa-exclamation\" aria-hidden=true></span> <span class=sr-only>Error:</span> <span>'{{fc.$viewValue}}' is not a valid email address</span></div></div>"
  );


  $templateCache.put('fluro-interaction-form/fluro-interaction-input.html',
    "<div class=\"fluro-input form-group\" scroll-active ng-class=\"{'fluro-valid':isValid(), 'fluro-dirty':isDirty, 'fluro-invalid':!isValid()}\"><label><i class=\"fa fa-check\" ng-if=isValid()></i><i class=\"fa fa-exclamation\" ng-if=!isValid()></i><span>{{field.title}}</span></label><div class=\"error-message help-block\"><span ng-if=field.errorMessage>{{field.errorMessage}}</span> <span ng-if=!field.errorMessage>Please provide valid input for this field</span></div><span class=help-block ng-if=\"field.description && field.type != 'boolean'\">{{field.description}}</span><div class=fluro-input-wrapper></div></div>"
  );


  $templateCache.put('fluro-interaction-form/fluro-terms.html',
    "<div class=terms-checkbox><div class=checkbox><label><input type=checkbox ng-model=\"model[options.key]\"> {{to.definition.params.storeData}}</label></div></div>"
  );


  $templateCache.put('fluro-interaction-form/fluro-web-form.html',
    "<div class=fluro-interaction-form><div ng-if=!correctPermissions class=form-permission-warning><div class=\"alert alert-warning small\"><i class=\"fa fa-warning\"></i> <span>You do not have permission to post {{model.plural}}</span></div></div><div ng-if=\"promisesResolved && correctPermissions\"><div ng-if=debugMode><div class=\"btn-group btn-group-justified\"><a ng-click=\"vm.state = 'ready'\" class=\"btn btn-default\">State to ready</a> <a ng-click=\"vm.state = 'complete'\" class=\"btn btn-default\">State to complete</a> <a ng-click=reset() class=\"btn btn-default\">Reset</a></div><hr></div><div ng-show=\"vm.state != 'complete'\"><form novalidate ng-submit=vm.onSubmit()><formly-form model=vm.model fields=vm.modelFields form=vm.modelForm options=vm.options><div ng-if=model.data.recaptcha><div recaptcha-render></div></div><div class=\"form-error-summary form-client-error alert alert-warning\" ng-if=\"vm.modelForm.$invalid && !vm.modelForm.$pristine\"><div class=form-error-summary-item ng-repeat=\"field in errorList\" ng-if=field.formControl.$invalid><i class=\"fa fa-exclamation\"></i> <span ng-if=field.templateOptions.definition.errorMessage.length>{{field.templateOptions.definition.errorMessage}}</span> <span ng-if=!field.templateOptions.definition.errorMessage.length>{{field.templateOptions.label}} has not been provided.</span></div></div><div ng-switch=vm.state><div ng-switch-when=sending><a class=\"btn btn-primary\" ng-disabled=true><span>Processing</span> <i class=\"fa fa-spinner fa-spin\"></i></a></div><div ng-switch-when=error><div class=\"form-error-summary form-server-error alert alert-danger\" ng-if=processErrorMessages.length><div class=form-error-summary-item ng-repeat=\"error in processErrorMessages track by $index\"><i class=\"fa fa-exclamation\"></i> <span>Error processing your submission: {{error}}</span></div></div><button type=submit class=\"btn btn-primary\" ng-disabled=!readyToSubmit><span>Try Again</span> <i class=\"fa fa-angle-right\"></i></button></div><div ng-switch-default><button type=submit class=\"btn btn-primary\" ng-disabled=!readyToSubmit><span>{{submitLabel}}</span> <i class=\"fa fa-angle-right\"></i></button></div></div></formly-form></form></div><div ng-show=\"vm.state == 'complete'\"><div compile-html=transcludedContent></div></div></div></div>"
  );


  $templateCache.put('fluro-interaction-form/nested/fluro-nested.html',
    "<div><div class=form-multi-group ng-if=\"to.definition.maximum != 1\"><div class=\"panel panel-default\" ng-init=\"fields = copyFields()\" ng-repeat=\"entry in model[options.key] track by $index\"><div class=\"panel-heading clearfix\"><a ng-if=canRemove() class=\"btn btn-danger btn-sm pull-right\" ng-click=\"model[options.key].splice($index, 1)\"><span>Remove {{to.label}}</span><i class=\"fa fa-times\"></i></a><h5>{{to.label}} {{$index + 1}}</h5></div><div class=panel-body><formly-form model=entry fields=fields></formly-form></div></div><a class=\"btn btn-primary btn-sm\" ng-if=canAdd() ng-click=addAnother()><span>Add <span ng-if=model[options.key].length>another</span> {{to.label}}</span><i class=\"fa fa-plus\"></i></a></div><div ng-if=\"to.definition.maximum == 1 && options.key\"><formly-form model=model[options.key] fields=options.data.fields></formly-form></div></div>"
  );


  $templateCache.put('fluro-interaction-form/order-select/fluro-order-select.html',
    "<div id={{options.id}} class=fluro-order-select><div ng-if=selection.values.length><p class=help-block>Drag to reorder your choices</p></div><div class=list-group as-sortable=dragControlListeners formly-skip-ng-model-attrs-manipulator ng-model=selection.values><div class=\"list-group-item clearfix\" as-sortable-item ng-repeat=\"item in selection.values\"><div class=pull-left as-sortable-item-handle><i class=\"fa fa-arrows order-select-handle\"></i> <span class=\"order-number text-muted\">{{$index+1}}</span> <span>{{item}}</span></div><div class=\"pull-right order-select-remove\" ng-click=deselect(item)><i class=\"fa fa-times\"></i></div></div></div><div ng-if=canAddMore()><p class=help-block>Choose by selecting options below</p><select class=form-control ng-model=selectBox.item ng-change=selectUpdate()><option ng-repeat=\"(key, option) in to.options | orderBy:'value'\" ng-if=!contains(option.value) value={{option.value}}>{{option.value}}</option></select></div></div>"
  );


  $templateCache.put('fluro-interaction-form/payment/payment-method.html',
    "<hr><div class=payment-method-select><div ng-if=!settings.showOptions><h3 class=clearfix>{{selected.method.title}} <em class=\"pull-right small\" ng-click=\"settings.showOptions = !settings.showOptions\">Other payment options <i class=\"fa fa-angle-right\"></i></em></h3></div><div ng-if=settings.showOptions><h3 class=clearfix>Select payment method <em ng-click=\"settings.showOptions = false\" class=\"pull-right small\">Back <i class=\"fa fa-angle-up\"></i></em></h3><div class=\"payment-method-list list-group\"><div class=\"payment-method-list-item list-group-item\" ng-class=\"{active:method == selected.method}\" ng-click=selectMethod(method) ng-repeat=\"method in methodOptions\"><h5 class=title>{{method.title}}</h5></div></div></div><div ng-if=!settings.showOptions><div ng-if=\"selected.method.key == 'card'\"><formly-form model=model fields=options.data.fields></formly-form></div><div ng-if=\"selected.method == method && selected.method.description.length\" ng-repeat=\"method in methodOptions\"><div compile-html=method.description></div></div></div></div><hr>"
  );


  $templateCache.put('fluro-interaction-form/payment/payment-summary.html',
    "<hr><div class=payment-summary><h3>Payment details</h3><div class=form-group><div ng-if=modifications.length class=payment-running-total><div class=\"row payment-base-row\"><div class=col-xs-6><strong>Base Price</strong></div><div class=\"col-xs-3 col-xs-offset-3\">{{paymentDetails.amount / 100 | currency}}</div></div><div class=\"row text-muted\" ng-repeat=\"mod in modifications\"><div class=col-xs-6><em>{{mod.title}}</em></div><div class=\"col-xs-3 text-right\"><em>{{mod.description}}</em></div><div class=col-xs-3><em class=text-muted>{{mod.total / 100 | currency}}</em></div></div><div class=\"row payment-total-row\"><div class=col-xs-6><h4>Total</h4></div><div class=\"col-xs-3 col-xs-offset-3\"><h4>{{calculatedTotal /100 |currency}} <span class=\"text-uppercase text-muted\">{{paymentDetails.currency}}</span></h4></div></div></div><div class=payment-amount ng-if=!modifications.length>{{calculatedTotal /100 |currency}} <span class=text-uppercase>({{paymentDetails.currency}})</span></div></div></div>"
  );


  $templateCache.put('fluro-interaction-form/search-select/fluro-search-select-item.html',
    "<a class=clearfix><i class=\"fa fa-{{match.model._type}}\"></i> <span ng-bind-html=\"match.label | trusted | typeaheadHighlight:query\"></span> <span ng-if=\"match.model._type == 'event' || match.model._type == 'plan'\" class=\"small text-muted\">// {{match.model.startDate | formatDate:'jS F Y - g:ia'}}</span></a>"
  );


  $templateCache.put('fluro-interaction-form/search-select/fluro-search-select-value.html',
    "<a class=clearfix><span ng-bind-html=\"match.label | trusted | typeaheadHighlight:query\"></span></a>"
  );


  $templateCache.put('fluro-interaction-form/search-select/fluro-search-select.html',
    "<div class=fluro-search-select><div ng-if=\"to.definition.type == 'reference'\"><div class=list-group ng-if=\"multiple && selection.values.length\"><div class=list-group-item ng-repeat=\"item in selection.values\"><i class=\"fa fa-times pull-right\" ng-click=deselect(item)></i> {{item.title}}</div></div><div class=list-group ng-if=\"!multiple && selection.value\"><div class=\"list-group-item clearfix\"><i class=\"fa fa-times pull-right\" ng-click=deselect(selection.value)></i> {{selection.value.title}}</div></div><div ng-if=canAddMore()><div class=input-group><input class=form-control formly-skip-ng-model-attrs-manipulator ng-model=proposed.value typeahead-template-url=fluro-interaction-form/search-select/fluro-search-select-item.html typeahead-on-select=select($item) placeholder=Search typeahead=\"item.title for item in retrieveReferenceOptions($viewValue)\" typeahead-loading=\"search.loading\"><div class=input-group-addon ng-if=!search.loading ng-click=\"search.terms = ''\"><i class=fa ng-class=\"{'fa-search':!search.terms.length, 'fa-times':search.terms.length}\"></i></div><div class=input-group-addon ng-if=search.loading><i class=\"fa fa-spin fa-spinner\"></i></div></div></div></div><div ng-if=\"to.definition.type != 'reference'\"><div class=list-group ng-if=\"multiple && selection.values.length\"><div class=list-group-item ng-repeat=\"value in selection.values\"><i class=\"fa fa-times pull-right\" ng-click=deselect(value)></i> {{getValueLabel(value)}}</div></div><div class=list-group ng-if=\"!multiple && selection.value\"><div class=\"list-group-item clearfix\"><i class=\"fa fa-times pull-right\" ng-click=deselect(selection.value)></i> {{getValueLabel(selection.value)}}</div></div><div ng-if=canAddMore()><div class=input-group><input class=form-control formly-skip-ng-model-attrs-manipulator ng-model=proposed.value typeahead-template-url=fluro-interaction-form/search-select/fluro-search-select-value.html typeahead-on-select=select($item.value) placeholder=Search typeahead=\"item.name for item in retrieveValueOptions($viewValue)\" typeahead-loading=\"search.loading\"><div class=input-group-addon ng-if=!search.loading ng-click=\"search.terms = ''\"><i class=fa ng-class=\"{'fa-search':!search.terms.length, 'fa-times':search.terms.length}\"></i></div><div class=input-group-addon ng-if=search.loading><i class=\"fa fa-spin fa-spinner\"></i></div></div></div></div></div>"
  );


  $templateCache.put('fluro-interaction-form/value/value.html',
    "<div class=fluro-interaction-value style=display:none><pre>{{model[options.key] | json}}</pre></div>"
  );


  $templateCache.put('fluro-preloader/fluro-preloader.html',
    "<div class=\"preloader {{preloader.class}}\"><div class=preloader-bg></div><div class=preloader-fg><div class=spinner><svg version=1.1 id=loader-1 xmlns=http://www.w3.org/2000/svg xmlns:xlink=http://www.w3.org/1999/xlink x=0px y=0px width=40px height=40px viewbox=\"0 0 50 50\" style=\"enable-background:new 0 0 50 50\" xml:space=preserve><path fill=#000 d=M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z transform=\"rotate(170 25 25)\"><animatetransform attributetype=xml attributename=transform type=rotate from=\"0 25 25\" to=\"360 25 25\" dur=0.6s repeatcount=indefinite></animatetransform></path></svg></div></div></div>"
  );


  $templateCache.put('routes/checklist/checklist.html',
    "<div class=\"wrapper-sm border-bottom bg-white\"><div class=container><div class=text-wrap><div class=row><div class=col-xs-9><h1 class=title>{{event.title}}</h1><h6 class=text-muted>{{event.startDate | formatDate:'g:ia j M Y'}} <em>({{event.startDate | timeago}})</em></h6></div><div class=\"col-xs-3 text-right\"><a class=\"btn btn-primary btn-sm\" ui-sref=\"new({returnTo:event._id, realm:event.realms[0]._id})\"><i class=\"fa fa-plus\"></i></a></div></div></div></div></div><div class=\"search-row border-bottom\"><div class=text-wrap><div class=input-group style=\"margin-bottom: 0\"><input class=form-control ng-model=search.terms placeholder=\"Search contacts\"><div class=input-group-addon ng-click=\"search.terms = ''\"><i class=fa ng-class=\"{'fa-search':!search.terms.length, 'fa-times':search.terms.length}\"></i></div><div class=input-group-addon ng-class={active:$root.filterPanel} ng-click=\"$root.filterPanel = !$root.filterPanel\"><i class=\"fa fa-ellipsis-v\"></i></div></div></div></div><div class=filters ng-if=$root.filterPanel><div class=\"wrapper-xs bg-white\"><div class=container><div class=text-wrap><h4 class=\"strong title\">Filters</h4><div class=\"row clearfix\"><div class=\"col-xs-12 col-sm-4\"><div class=filter-block><h6>Groups</h6><select ng-model=search.groups class=form-control><option value=\"\">Any</option><optgroup label={{existing.title}} ng-repeat=\"existing in groups track by existing.definition\"><option value={{option._id}} ng-repeat=\"option in existing.groups | orderBy:'title' track by option._id\">{{option.title}}</option></optgroup></select></div></div><div class=\"col-xs-6 col-sm-4\"><div class=filter-block><h6>Realms</h6><select ng-model=search.realms class=form-control><option value=\"\">Any</option><option value={{option._id}} ng-repeat=\"option in realms | orderBy:'title'\">{{option.title}}</option></select></div></div><div class=\"col-xs-6 col-sm-4\"><div class=filter-block><h6>Tags</h6><select ng-model=search.tags class=form-control><option value=\"\">Any</option><option value={{option._id}} ng-repeat=\"option in tags | orderBy:'title'\">{{option.title}}</option></select></div></div><div class=\"col-xs-6 col-sm-4\"><div class=filter-block><h6>Status</h6><select ng-model=search.contactstatus class=form-control><option value=\"\">Any</option><option value={{option}} ng-repeat=\"option in status\">{{option}}</option></select></div></div></div></div></div></div></div><div class=wrapper-sm id=contacts><div class=container><div class=text-wrap><div class=\"wrapper-sm text-center\" ng-if=\"search.terms.length && !(filteredContacts).length\"><p class=\"small text-muted\">Sorry no contacts found for '{{search.terms}}'</p><a class=\"btn btn-default\" ng-click=\"search.terms = ''\"><span>Cancel search</span></a></div><div ng-repeat=\"item in pager.items\"><div class=\"row individual\" ng-class=\"{'active': selected(item)}\"><div class=\"col-xs-9 col-sm-8\"><h5 class=text-capitalize><strong>{{item.lastName}},</strong>&nbsp;{{item.firstName}}</h5></div><div class=\"col-xs-3 col-sm-offset-2 col-sm-2 text-right\" ng-click=toggle(item)><i class=\"fa fa-2x fa-fw\" ng-class=\"{'fa-check-circle':selected(item),  'fa-circle-o':!selected(item) && !isCheckedIn(item), 'fa-check text-muted':isCheckedIn(item)}\"></i></div></div></div><div class=text-center ng-if=\"pager.total > pager.itemsPerPage\"><ul uib-pagination class=hidden-xs total-items=pager.total items-per-page=pager.itemsPerPage ng-change=\"$root.scroll.scrollTo(0, 'slow')\" ng-model=pager.current max-size=5 boundary-links=true></ul><ul uib-pagination class=visible-xs-inline-block items-per-page=pager.itemsPerPage total-items=pager.total ng-change=\"$root.scroll.scrollTo(0, 'slow')\" ng-model=pager.current max-size=5 previous-text=Prev></ul></div></div></div></div><div class=footer-spacer ng-if=\"report.items.length > 0\"></div><div class=footer ng-if=report.items.length><div class=container><div class=text-wrap><a class=\"btn btn-primary btn-block\" ng-click=submitReport()>Submit {{report.items.length}} checkin<span ng-if=\"report.items.length != 1\">s</span></a></div></div></div>"
  );


  $templateCache.put('routes/content/view.html',
    "<div class=\"bg-white border-bottom\"><div class=wrapper-xs><div class=container-fluid><div class=text-wrap><h1><div class=pull-right><i class=\"fa fa-circle\" ng-repeat=\"realm in item.realms\" style=\"margin-left:-30px; color: {{realm.bgColor}}\"></i></div>{{item.title}}</h1><h4 class=text-muted ng-show=definition.title.length>{{definition.title}}</h4><h4 class=text-muted ng-show=!definition.title.length>{{item._type}}</h4><h4 ng-show=\"item.definition == 'song'\"><span class=text-muted>By {{item.data.artist}}</span></h4></div></div></div></div><div ng-switch=item.definition><div ng-switch-when=song><accordion><accordion-title>Song Details</accordion-title><accordion-body><div class=row><div class=\"form-group col-xs-6 col-sm-3\" ng-show=item.data.mm><label>Metronome</label><p>{{item.data.mm}} bpm</p></div><div class=\"form-group col-xs-6 col-sm-3\" ng-show=item.data.key><label>Keys</label><p>{{item.data.key}}</p></div><div class=\"form-group col-xs-12 col-sm-6\" ng-show=item.data.standardStructure><label>Structure</label><p>{{item.data.standardStructure}}</p></div></div><div class=form-group ng-show=item.data.firstLine.length><label>First Line</label><p>{{item.data.firstline}}</p></div></accordion-body></accordion><accordion ng-show=item.data.sheetMusic.length><accordion-title>Sheet Music</accordion-title><accordion-body><div class=list-group><a class=list-group-item ng-repeat=\"file in item.data.sheetMusic\" ng-href=\"{{$root.asset.downloadUrl(file._id, {extension:file.extension})}}\" target=_blank><i class=\"fa fa-download pull-right\"></i> {{file.title}}</a></div></accordion-body></accordion><accordion ng-show=item.data.videos.length><accordion-title>Videos</accordion-title><accordion-body><div ng-repeat=\"video in item.data.videos\"><fluro-video ng-model=video></fluro-video></div></accordion-body></accordion><accordion ng-show=item.data.lyrics.length><accordion-title>Lyrics</accordion-title><accordion-body><div class=list-group-item ng-repeat=\"section in item.data.lyrics\"><h5>{{section.title}}</h5><div compile-html=section.words style=white-space:pre></div></div></accordion-body></accordion></div><div ng-switch-default><div class=wrapper-sm><div class=container-fluid><div class=text-wrap><div view-extended-fields item=item definition=definition></div></div></div></div></div></div>"
  );


  $templateCache.put('routes/events/events.html',
    "<div class=\"bg-white border-bottom\"><div class=wrapper-sm><div class=container-fluid><div class=text-wrap><h1 class=title>Select event</h1><p class=help-block>Select an event below to mark attendance</p></div></div></div></div><div class=\"search-row border-bottom\"><div class=text-wrap><div class=input-group style=\"margin-bottom: 0\"><input ng-model=search.terms class=form-control placeholder=\"Search {{::events.length}} events\"><div class=input-group-addon ng-click=\"search.terms = ''\"><i class=fa ng-class=\"{'fa-search':!search.terms.length, 'fa-times':search.terms.length}\"></i></div><div class=input-group-addon ng-class={active:search.showFilters} ng-click=\"search.showFilters = !search.showFilters\"><i class=\"fa fa-ellipsis-v\"></i></div></div></div></div><div class=\"wrapper-sm filter-bg border-bottom\" ng-if=search.showFilters><div class=container><div class=text-wrap><div class=\"row row-inline\"><div class=\"form-group col-xs-6\"><label>Tags <span class=text-muted>{{::tags.length}}</span></label><select ng-model=search.filters.tags class=form-control><option value=\"\">Any</option><option value={{::tag._id}} ng-repeat=\"tag in tags\">{{::tag.title}}</option></select></div><div class=\"form-group col-xs-6\"><label>Realms <span class=text-muted>{{::realms.length}}</span></label><select ng-model=search.filters.realms class=form-control><option value=\"\">Any</option><option value={{::realm._id}} ng-repeat=\"realm in realms\">{{::realm.title}}</option></select></div></div></div></div></div><div class=wrapper-sm><div class=container-fluid><div class=text-wrap><div class=search-help ng-show=\"filteredItems.length < 1\">{{filteredItems.length}} match<span ng-if=\"filteredItems.length != 1\">es</span> <span ng-show=search.terms.length>'{{search.terms}}'</span></div><div infinite-pager items=dates per-page=10><div ng-repeat=\"page in pages\"><div class=\"panel panel-event-day\" ng-repeat=\"day in page\"><div class=panel-heading><i class=\"fa fa-calendar fa-fw\"></i> {{::day.date | formatDate:'l j M Y'}}</div><div><div class=\"row row-flex panel-event-day-row\" ng-repeat=\"timeslot in day.times | filter:search.terms track by timeslot.time\"><div class=\"col-xs-2 bg-light\"><div class=assignment-time>{{::timeslot.time}}</div></div><div class=\"col-xs-10 border-left\"><div><a ui-sref=checklist({id:event._id}) ng-repeat=\"event in timeslot.events | filter:search.terms track by event._id\" class=timeslot-row><div ng-repeat=\"realm in event.realms\" class=realm-bar style=background-color:{{::realm.bgColor}}></div><h6 class=title><strong>{{::event.title}}</strong></h6><div class=\"small text-muted\">{{::event.firstLine}}</div></a></div></div></div></div></div></div></div></div></div></div>"
  );


  $templateCache.put('routes/new/new.html',
    "<div class=\"wrapper new\"><div ng-switch=settings.state><div ng-switch-when=processing><div class=text-center><i class=\"fa fa-spinner fa-spin fa-3x\"></i></div><div class=container><div class=text-center><div class=wrapper><h2>Processing</h2><p class=\"text-muted help-block\"><em>Please wait</em></p></div></div></div></div><div ng-switch-when=failed><div class=text-center><i class=\"fa fa-frown-o fa-3x\"></i></div><div class=container><div class=text-center><div class=wrapper><h2>There was a problem saving new contact</h2><p class=\"text-muted help-block\"><em>Click below to return to the previous screen</em></p></div><a class=\"btn btn-primary btn-sm\" ng-click=\"settings.state = 'ready'\">Go back</a></div></div></div><div ng-switch-when=success><div class=text-center><i class=\"fa fa-smile-o fa-3x\"></i></div><div class=container><div class=text-center><div class=wrapper><h2>Contact created successfully</h2><p class=\"text-muted help-block\"><em>You can now check in {{settings.result.firstName}}</em></p></div><a class=\"btn btn-primary btn-sm\" ng-click=$root.breadcrumb.back()>Return to event</a> <a class=\"btn btn-default btn-sm\" ng-click=\"settings.state = 'ready'\">Add another contact</a></div></div></div><div ng-switch-default class=container><div class=text-wrap><h3>Add a new contact</h3><br><form ng-submit=submitForm()><div class=row><div class=\"form-group col-sm-4\"><label>First Name</label><input placeholder=\"First Name\" ng-model=contact.firstName class=\"form-control\"></div><div class=\"form-group col-sm-5\"><label>Last Name</label><input placeholder=\"Last Name\" ng-model=contact.lastName class=\"form-control\"></div><div class=\"form-group col-sm-3\"><label>Gender</label><select ng-model=contact.gender class=form-control><option value=male>Male</option><option value=female>Female</option></select></div></div><div class=row><div class=\"form-group col-sm-6\"><label>Phone Number</label><input placeholder=\"Phone Number\" ng-model=contact.phoneNumbers[0] class=\"form-control\"></div><div class=\"form-group col-sm-6\"><label>Email Address</label><input placeholder=\"Email Address\" type=email ng-model=contact.emails[0] class=\"form-control\"></div></div><button class=\"btn btn-primary\"><span>Submit</span> <i class=\"fa fa-angle-right\"></i></button> <a class=\"btn btn-default\" ng-click=$root.breadcrumb.back()><span>Cancel</span></a></form></div></div></div></div>"
  );

}]);
