function getMetaKey(stringKey) {
    var metas = document.getElementsByTagName("meta");
    for (i = 0; i < metas.length; i++) if (metas[i].getAttribute("property") == stringKey) return metas[i].getAttribute("content");
    return "";
}

function getFlattenedFields(array) {
    return _.chain(array).map(function(field) {
        return "group" == field.type ? (console.log("GROUP", field), getFlattenedFields(field.fields)) : field;
    }).flatten().value();
}

var app = angular.module("fluro", [ "ngAnimate", "ngResource", "ui.router", "ngTouch", "fluro.config", "fluro.access", "fluro.validate", "fluro.interactions", "fluro.content", "fluro.asset", "fluro.socket", "fluro.video", "angular.filter", "angulartics", "angulartics.google.analytics", "formly", "formlyBootstrap", "ui.bootstrap" ]);

app.config(function($stateProvider, $httpProvider, FluroProvider, $urlRouterProvider, $locationProvider, $analyticsProvider) {
    var access_token = getMetaKey("fluro_application_key");
    $analyticsProvider.settings.ga.additionalAccountNames = [ "fluro" ], $analyticsProvider.settings.ga.additionalAccountHitTypes.setUserProperties = !0, 
    $analyticsProvider.settings.ga.additionalAccountHitTypes.userTiming = !0;
    var api_url = getMetaKey("fluro_url");
    FluroProvider.set({
        apiURL: api_url,
        token: access_token,
        sessionStorage: !0
    }), access_token || ($httpProvider.defaults.withCredentials = !0), $httpProvider.interceptors.push("FluroAuthentication"), 
    $locationProvider.html5Mode(!0), $stateProvider.state("home", {
        url: "/",
        templateUrl: "routes/events/events.html",
        controller: "EventsController",
        resolve: {
            events: function($stateParams, FluroContentRetrieval) {
                var tonight = new Date();
                tonight.setHours(23, 59, 0, 0);
                var queryDetails = {
                    _type: "event",
                    startDate: {
                        $lte: "date('" + tonight + "')"
                    }
                };
                return FluroContentRetrieval.query(queryDetails, null, null, {}, null);
            }
        }
    }), $stateProvider.state("checklist", {
        url: "/event/:id",
        templateUrl: "routes/checklist/checklist.html",
        controller: "ChecklistController",
        resolve: {
            event: function($stateParams, FluroContent) {
                return console.log("got specified id", $stateParams.id), FluroContent.resource("event/" + $stateParams.id).get({
                    allDefinitions: !0
                }).$promise;
            },
            contacts: function(FluroContent) {
                return FluroContent.resource("contact", !1, !0).query({
                    noCache: !0,
                    appendTeams: "all"
                }).$promise;
            }
        }
    }), $stateProvider.state("new", {
        url: "/new?returnTo&realm",
        templateUrl: "routes/new/new.html",
        controller: "CreateContactController"
    }), $urlRouterProvider.otherwise("/");
}), app.run(function($rootScope, $sessionStorage, Asset, NotificationService, FluroContent, FluroBreadcrumbService, FluroScrollService, $location, $timeout, $state, $analytics) {
    $rootScope.staging = !0, $rootScope.asset = Asset, $rootScope.$state = $state, $rootScope.session = $sessionStorage, 
    $rootScope.breadcrumb = FluroBreadcrumbService, $rootScope.notificationService = NotificationService, 
    FluroContent.endpoint("session").get().$promise.then(function(res) {
        $rootScope.user = res;
    }, function(err) {
        console.log("ERROR LOADING USER"), $rootScope.user = null;
    }), applicationUser && applicationUser._id && ($rootScope.user = applicationUser, 
    $analytics.setUsername(applicationUser._id), $analytics.setAlias(applicationUser.email), 
    $analytics.setUserProperties({
        dimension1: applicationUser.account._id
    })), $rootScope.logout = function() {
        $rootScope.user = null;
    }, $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams, error) {
        $rootScope.sidebarExpanded = !1;
    }), $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
        throw error;
    }), $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams, error) {
        $rootScope.currentState = toState.name;
    }), $rootScope.getTypeOrDefinition = function(item, defaultIfNoneProvided) {
        return item.definition && item.definition.length ? item.definition : !item._type && defaultIfNoneProvided ? defaultIfNoneProvided : item._type;
    }, FastClick.attach(document.body);
}), app.directive("accordion", function() {
    return {
        restrict: "E",
        replace: !0,
        transclude: {
            title: "accordionTitle",
            body: "accordionBody"
        },
        scope: {
            wide: "=wide"
        },
        templateUrl: "accordion/accordion.html",
        link: function(scope, element, attrs, ctrl) {
            scope.settings = {};
        }
    };
}), app.directive("dateselect", function($document) {
    return {
        restrict: "E",
        replace: !0,
        templateUrl: "admin-date-select/admin-date-select.html",
        scope: {
            boundModel: "=ngModel",
            label: "=ngLabel",
            minDate: "=minDate",
            initDate: "=initDate",
            useTime: "=useTime",
            required: "=",
            rounding: "=",
            forceDate: "="
        },
        link: function($scope, element, attr) {
            function elementClick(event) {
                event.stopPropagation();
            }
            function documentClick(event) {
                $scope.$apply(function() {
                    $scope.open = !1;
                });
            }
            $scope.$watch("settings.open", function(bol) {
                bol ? (element.on("click", elementClick), $document.on("click", documentClick)) : (element.off("click", elementClick), 
                $document.off("click", documentClick));
            });
        },
        controller: function($scope, $timeout) {
            function updateLabel() {
                if ($scope.boundModel) {
                    var date = new Date($scope.boundModel);
                    $scope.useTime ? $scope.readable = date.format("D j F g:i") + '<span class="meridian">' + date.format("a") + "</span>" : $scope.readable = date.format("D j F");
                } else $scope.label ? $scope.readable = $scope.label : $scope.readable = "None provided";
            }
            function boundModelChanged() {
                $scope.settings.dateModel != $scope.boundModel && ($scope.settings.dateModel = $scope.boundModel = new Date($scope.boundModel)), 
                updateLabel();
            }
            function dateModelChanged() {
                $scope.boundModel != $scope.settings.dateModel && ($scope.boundModel = $scope.settings.dateModel = new Date($scope.settings.dateModel)), 
                updateLabel();
            }
            $scope.settings = {
                dateModel: new Date()
            }, $scope.forceDate && !$scope.boundModel && ($scope.boundModel = new Date());
            var coeff = 3e5;
            $scope.removeDate = function() {
                $scope.boundModel = null;
            }, $scope.rounding && _.isDate($scope.boundModel) && ($scope.boundModel = new Date(Math.round($scope.boundModel.getTime() / coeff) * coeff)), 
            $scope.$watch("boundModel", boundModelChanged, !0), $scope.$watch("settings.dateModel", dateModelChanged, !0);
        }
    };
}), function() {
    Date.shortMonths = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ], 
    Date.longMonths = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ], 
    Date.shortDays = [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ], Date.longDays = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];
    var replaceChars = {
        d: function() {
            return (this.getDate() < 10 ? "0" : "") + this.getDate();
        },
        D: function() {
            return Date.shortDays[this.getDay()];
        },
        j: function() {
            return this.getDate();
        },
        l: function() {
            return Date.longDays[this.getDay()];
        },
        N: function() {
            return 0 == this.getDay() ? 7 : this.getDay();
        },
        S: function() {
            return this.getDate() % 10 == 1 && 11 != this.getDate() ? "st" : this.getDate() % 10 == 2 && 12 != this.getDate() ? "nd" : this.getDate() % 10 == 3 && 13 != this.getDate() ? "rd" : "th";
        },
        w: function() {
            return this.getDay();
        },
        z: function() {
            var d = new Date(this.getFullYear(), 0, 1);
            return Math.ceil((this - d) / 864e5);
        },
        W: function() {
            var target = new Date(this.valueOf()), dayNr = (this.getDay() + 6) % 7;
            target.setDate(target.getDate() - dayNr + 3);
            var firstThursday = target.valueOf();
            return target.setMonth(0, 1), 4 !== target.getDay() && target.setMonth(0, 1 + (4 - target.getDay() + 7) % 7), 
            1 + Math.ceil((firstThursday - target) / 6048e5);
        },
        F: function() {
            return Date.longMonths[this.getMonth()];
        },
        m: function() {
            return (this.getMonth() < 9 ? "0" : "") + (this.getMonth() + 1);
        },
        M: function() {
            return Date.shortMonths[this.getMonth()];
        },
        n: function() {
            return this.getMonth() + 1;
        },
        t: function() {
            var d = new Date();
            return new Date(d.getFullYear(), d.getMonth(), 0).getDate();
        },
        L: function() {
            var year = this.getFullYear();
            return year % 400 == 0 || year % 100 != 0 && year % 4 == 0;
        },
        o: function() {
            var d = new Date(this.valueOf());
            return d.setDate(d.getDate() - (this.getDay() + 6) % 7 + 3), d.getFullYear();
        },
        Y: function() {
            return this.getFullYear();
        },
        y: function() {
            return ("" + this.getFullYear()).substr(2);
        },
        a: function() {
            return this.getHours() < 12 ? "am" : "pm";
        },
        A: function() {
            return this.getHours() < 12 ? "AM" : "PM";
        },
        B: function() {
            return Math.floor(1e3 * ((this.getUTCHours() + 1) % 24 + this.getUTCMinutes() / 60 + this.getUTCSeconds() / 3600) / 24);
        },
        g: function() {
            return this.getHours() % 12 || 12;
        },
        G: function() {
            return this.getHours();
        },
        h: function() {
            return ((this.getHours() % 12 || 12) < 10 ? "0" : "") + (this.getHours() % 12 || 12);
        },
        H: function() {
            return (this.getHours() < 10 ? "0" : "") + this.getHours();
        },
        i: function() {
            return (this.getMinutes() < 10 ? "0" : "") + this.getMinutes();
        },
        s: function() {
            return (this.getSeconds() < 10 ? "0" : "") + this.getSeconds();
        },
        u: function() {
            var m = this.getMilliseconds();
            return (10 > m ? "00" : 100 > m ? "0" : "") + m;
        },
        e: function() {
            return "Not Yet Supported";
        },
        I: function() {
            for (var DST = null, i = 0; 12 > i; ++i) {
                var d = new Date(this.getFullYear(), i, 1), offset = d.getTimezoneOffset();
                if (null === DST) DST = offset; else {
                    if (DST > offset) {
                        DST = offset;
                        break;
                    }
                    if (offset > DST) break;
                }
            }
            return this.getTimezoneOffset() == DST | 0;
        },
        O: function() {
            return (-this.getTimezoneOffset() < 0 ? "-" : "+") + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? "0" : "") + Math.abs(this.getTimezoneOffset() / 60) + "00";
        },
        P: function() {
            return (-this.getTimezoneOffset() < 0 ? "-" : "+") + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? "0" : "") + Math.abs(this.getTimezoneOffset() / 60) + ":00";
        },
        T: function() {
            return this.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/, "$1");
        },
        Z: function() {
            return 60 * -this.getTimezoneOffset();
        },
        c: function() {
            return this.format("Y-m-d\\TH:i:sP");
        },
        r: function() {
            return this.toString();
        },
        U: function() {
            return this.getTime() / 1e3;
        }
    };
    Date.prototype.format = function(format) {
        var date = this;
        return format.replace(/(\\?)(.)/g, function(_, esc, chr) {
            return "" === esc && replaceChars[chr] ? replaceChars[chr].call(date) : chr;
        });
    };
}.call(this), function() {
    "use strict";
    function FastClick(layer, options) {
        function bind(method, context) {
            return function() {
                return method.apply(context, arguments);
            };
        }
        var oldOnClick;
        if (options = options || {}, this.trackingClick = !1, this.trackingClickStart = 0, 
        this.targetElement = null, this.touchStartX = 0, this.touchStartY = 0, this.lastTouchIdentifier = 0, 
        this.touchBoundary = options.touchBoundary || 10, this.layer = layer, this.tapDelay = options.tapDelay || 200, 
        !FastClick.notNeeded(layer)) {
            for (var methods = [ "onMouse", "onClick", "onTouchStart", "onTouchMove", "onTouchEnd", "onTouchCancel" ], context = this, i = 0, l = methods.length; l > i; i++) context[methods[i]] = bind(context[methods[i]], context);
            deviceIsAndroid && (layer.addEventListener("mouseover", this.onMouse, !0), layer.addEventListener("mousedown", this.onMouse, !0), 
            layer.addEventListener("mouseup", this.onMouse, !0)), layer.addEventListener("click", this.onClick, !0), 
            layer.addEventListener("touchstart", this.onTouchStart, !1), layer.addEventListener("touchmove", this.onTouchMove, !1), 
            layer.addEventListener("touchend", this.onTouchEnd, !1), layer.addEventListener("touchcancel", this.onTouchCancel, !1), 
            Event.prototype.stopImmediatePropagation || (layer.removeEventListener = function(type, callback, capture) {
                var rmv = Node.prototype.removeEventListener;
                "click" === type ? rmv.call(layer, type, callback.hijacked || callback, capture) : rmv.call(layer, type, callback, capture);
            }, layer.addEventListener = function(type, callback, capture) {
                var adv = Node.prototype.addEventListener;
                "click" === type ? adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
                    event.propagationStopped || callback(event);
                }), capture) : adv.call(layer, type, callback, capture);
            }), "function" == typeof layer.onclick && (oldOnClick = layer.onclick, layer.addEventListener("click", function(event) {
                oldOnClick(event);
            }, !1), layer.onclick = null);
        }
    }
    var deviceIsAndroid = navigator.userAgent.indexOf("Android") > 0, deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent), deviceIsIOS4 = deviceIsIOS && /OS 4_\d(_\d)?/.test(navigator.userAgent), deviceIsIOSWithBadTarget = deviceIsIOS && /OS ([6-9]|\d{2})_\d/.test(navigator.userAgent), deviceIsBlackBerry10 = navigator.userAgent.indexOf("BB10") > 0;
    FastClick.prototype.needsClick = function(target) {
        switch (target.nodeName.toLowerCase()) {
          case "button":
          case "select":
          case "textarea":
            if (target.disabled) return !0;
            break;

          case "input":
            if (deviceIsIOS && "file" === target.type || target.disabled) return !0;
            break;

          case "label":
          case "video":
            return !0;
        }
        return /\bneedsclick\b/.test(target.className);
    }, FastClick.prototype.needsFocus = function(target) {
        switch (target.nodeName.toLowerCase()) {
          case "textarea":
            return !0;

          case "select":
            return !deviceIsAndroid;

          case "input":
            switch (target.type) {
              case "button":
              case "checkbox":
              case "file":
              case "image":
              case "radio":
              case "submit":
                return !1;
            }
            return !target.disabled && !target.readOnly;

          default:
            return /\bneedsfocus\b/.test(target.className);
        }
    }, FastClick.prototype.sendClick = function(targetElement, event) {
        var clickEvent, touch;
        document.activeElement && document.activeElement !== targetElement && document.activeElement.blur(), 
        touch = event.changedTouches[0], clickEvent = document.createEvent("MouseEvents"), 
        clickEvent.initMouseEvent(this.determineEventType(targetElement), !0, !0, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, !1, !1, !1, !1, 0, null), 
        clickEvent.forwardedTouchEvent = !0, targetElement.dispatchEvent(clickEvent);
    }, FastClick.prototype.determineEventType = function(targetElement) {
        return deviceIsAndroid && "select" === targetElement.tagName.toLowerCase() ? "mousedown" : "click";
    }, FastClick.prototype.focus = function(targetElement) {
        var length;
        deviceIsIOS && targetElement.setSelectionRange && 0 !== targetElement.type.indexOf("date") && "time" !== targetElement.type && "month" !== targetElement.type ? (length = targetElement.value.length, 
        targetElement.setSelectionRange(length, length)) : targetElement.focus();
    }, FastClick.prototype.updateScrollParent = function(targetElement) {
        var scrollParent, parentElement;
        if (scrollParent = targetElement.fastClickScrollParent, !scrollParent || !scrollParent.contains(targetElement)) {
            parentElement = targetElement;
            do {
                if (parentElement.scrollHeight > parentElement.offsetHeight) {
                    scrollParent = parentElement, targetElement.fastClickScrollParent = parentElement;
                    break;
                }
                parentElement = parentElement.parentElement;
            } while (parentElement);
        }
        scrollParent && (scrollParent.fastClickLastScrollTop = scrollParent.scrollTop);
    }, FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
        return eventTarget.nodeType === Node.TEXT_NODE ? eventTarget.parentNode : eventTarget;
    }, FastClick.prototype.onTouchStart = function(event) {
        var targetElement, touch, selection;
        if (event.targetTouches.length > 1) return !0;
        if (targetElement = this.getTargetElementFromEventTarget(event.target), touch = event.targetTouches[0], 
        deviceIsIOS) {
            if (selection = window.getSelection(), selection.rangeCount && !selection.isCollapsed) return !0;
            if (!deviceIsIOS4) {
                if (touch.identifier && touch.identifier === this.lastTouchIdentifier) return event.preventDefault(), 
                !1;
                this.lastTouchIdentifier = touch.identifier, this.updateScrollParent(targetElement);
            }
        }
        return this.trackingClick = !0, this.trackingClickStart = event.timeStamp, this.targetElement = targetElement, 
        this.touchStartX = touch.pageX, this.touchStartY = touch.pageY, event.timeStamp - this.lastClickTime < this.tapDelay && event.preventDefault(), 
        !0;
    }, FastClick.prototype.touchHasMoved = function(event) {
        var touch = event.changedTouches[0], boundary = this.touchBoundary;
        return Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary ? !0 : !1;
    }, FastClick.prototype.onTouchMove = function(event) {
        return this.trackingClick ? ((this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) && (this.trackingClick = !1, 
        this.targetElement = null), !0) : !0;
    }, FastClick.prototype.findControl = function(labelElement) {
        return void 0 !== labelElement.control ? labelElement.control : labelElement.htmlFor ? document.getElementById(labelElement.htmlFor) : labelElement.querySelector("button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea");
    }, FastClick.prototype.onTouchEnd = function(event) {
        var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;
        if (!this.trackingClick) return !0;
        if (event.timeStamp - this.lastClickTime < this.tapDelay) return this.cancelNextClick = !0, 
        !0;
        if (this.cancelNextClick = !1, this.lastClickTime = event.timeStamp, trackingClickStart = this.trackingClickStart, 
        this.trackingClick = !1, this.trackingClickStart = 0, deviceIsIOSWithBadTarget && (touch = event.changedTouches[0], 
        targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement, 
        targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent), 
        targetTagName = targetElement.tagName.toLowerCase(), "label" === targetTagName) {
            if (forElement = this.findControl(targetElement)) {
                if (this.focus(targetElement), deviceIsAndroid) return !1;
                targetElement = forElement;
            }
        } else if (this.needsFocus(targetElement)) return event.timeStamp - trackingClickStart > 100 || deviceIsIOS && window.top !== window && "input" === targetTagName ? (this.targetElement = null, 
        !1) : (this.focus(targetElement), this.sendClick(targetElement, event), deviceIsIOS && "select" === targetTagName || (this.targetElement = null, 
        event.preventDefault()), !1);
        return deviceIsIOS && !deviceIsIOS4 && (scrollParent = targetElement.fastClickScrollParent, 
        scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) ? !0 : (this.needsClick(targetElement) || (event.preventDefault(), 
        this.sendClick(targetElement, event)), !1);
    }, FastClick.prototype.onTouchCancel = function() {
        this.trackingClick = !1, this.targetElement = null;
    }, FastClick.prototype.onMouse = function(event) {
        return this.targetElement ? event.forwardedTouchEvent ? !0 : event.cancelable && (!this.needsClick(this.targetElement) || this.cancelNextClick) ? (event.stopImmediatePropagation ? event.stopImmediatePropagation() : event.propagationStopped = !0, 
        event.stopPropagation(), event.preventDefault(), !1) : !0 : !0;
    }, FastClick.prototype.onClick = function(event) {
        var permitted;
        return this.trackingClick ? (this.targetElement = null, this.trackingClick = !1, 
        !0) : "submit" === event.target.type && 0 === event.detail ? !0 : (permitted = this.onMouse(event), 
        permitted || (this.targetElement = null), permitted);
    }, FastClick.prototype.destroy = function() {
        var layer = this.layer;
        deviceIsAndroid && (layer.removeEventListener("mouseover", this.onMouse, !0), layer.removeEventListener("mousedown", this.onMouse, !0), 
        layer.removeEventListener("mouseup", this.onMouse, !0)), layer.removeEventListener("click", this.onClick, !0), 
        layer.removeEventListener("touchstart", this.onTouchStart, !1), layer.removeEventListener("touchmove", this.onTouchMove, !1), 
        layer.removeEventListener("touchend", this.onTouchEnd, !1), layer.removeEventListener("touchcancel", this.onTouchCancel, !1);
    }, FastClick.notNeeded = function(layer) {
        var metaViewport, chromeVersion, blackberryVersion;
        if ("undefined" == typeof window.ontouchstart) return !0;
        if (chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [ , 0 ])[1]) {
            if (!deviceIsAndroid) return !0;
            if (metaViewport = document.querySelector("meta[name=viewport]")) {
                if (-1 !== metaViewport.content.indexOf("user-scalable=no")) return !0;
                if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) return !0;
            }
        }
        if (deviceIsBlackBerry10 && (blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/), 
        blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3 && (metaViewport = document.querySelector("meta[name=viewport]")))) {
            if (-1 !== metaViewport.content.indexOf("user-scalable=no")) return !0;
            if (document.documentElement.scrollWidth <= window.outerWidth) return !0;
        }
        return "none" === layer.style.msTouchAction ? !0 : !1;
    }, FastClick.attach = function(layer, options) {
        return new FastClick(layer, options);
    }, "function" == typeof define && "object" == typeof define.amd && define.amd ? define(function() {
        return FastClick;
    }) : "undefined" != typeof module && module.exports ? (module.exports = FastClick.attach, 
    module.exports.FastClick = FastClick) : window.FastClick = FastClick;
}(), app.directive("extendedFieldRender", function($compile, $templateCache) {
    return {
        restrict: "E",
        replace: !0,
        scope: {
            field: "=ngField",
            model: "=ngModel"
        },
        templateUrl: "extended-field-render/extended-field-render.html",
        link: function($scope, $element, $attrs) {
            $scope.showField = !0;
            var template = "";
            switch ($scope.field.type) {
              case "void":
              case "null":
              case "":
                return $element.empty();
            }
            if ("group" == $scope.field.type ? template = $scope.field.asObject ? _.isArray($scope.model[$scope.field.key]) ? '<div ng-repeat="group in model[field.key]" class="panel panel-default"><div class="panel-heading">{{field.title}} {{$index + 1}}</div><div class="panel-body"><extended-field-render ng-model="group" ng-field="subField" ng-repeat="subField in field.fields"/></div></div>' : '<extended-field-render ng-model="model[field.key]" ng-field="subField" ng-repeat="subField in field.fields"/>' : '<extended-field-render ng-model="model" ng-field="subField" ng-repeat="subField in field.fields"/>' : _.isArray($scope.model[$scope.field.key]) && $scope.model[$scope.field.key].length ? template = $templateCache.get("extended-field-render/field-types/multiple-value.html") : $scope.model[$scope.field.key] && !_.isArray($scope.model[$scope.field.key]) && (template = $templateCache.get("extended-field-render/field-types/value.html")), 
            template.length) {
                var cTemplate = $compile(template)($scope), contentHolder = $element.find("[field-transclude]");
                "group" == $scope.field.type ? contentHolder.addClass($scope.field.className).append(cTemplate) : ($element.addClass($scope.field.className), 
                contentHolder.replaceWith(cTemplate));
            } else $scope.showField = !1, $element.empty();
        }
    };
}), app.directive("extendedFields", function($compile) {
    return {
        restrict: "A",
        link: function($scope, $element, $attrs) {
            $scope.definition && ($scope.flattenedFields = getFlattenedFields($scope.definition.fields));
            var template = '<field-edit-render ng-model="item.data[field.key]" ng-field="field" ng-repeat="field in flattenedFields"></field-edit-render>', cTemplate = $compile(template)($scope);
            $element.append(cTemplate);
        }
    };
}), app.directive("viewExtendedFields", function($compile) {
    return {
        restrict: "A",
        scope: {
            item: "=",
            definition: "="
        },
        link: function($scope, $element, $attrs) {
            if ($scope.definition) {
                $scope.fields = $scope.definition.fields, console.log("what are the fields?", $scope.fields), 
                console.log("current definition", $scope.definition);
                var template = '<extended-field-render ng-model="item.data" ng-field="field" ng-repeat="field in fields"></extended-field-render>', cTemplate = $compile(template)($scope);
                $element.append(cTemplate);
            }
        }
    };
}), app.directive("extendedFields", function($compile) {
    return {
        restrict: "A",
        link: function($scope, $element, $attrs) {
            $scope.definition && ($scope.flattenedFields = getFlattenedFields($scope.definition.fields));
            var template = '<field-edit-render ng-model="item.data[field.key]" ng-field="field" ng-repeat="field in flattenedFields"></field-edit-render>', cTemplate = $compile(template)($scope);
            $element.append(cTemplate);
        }
    };
}), app.directive("fieldViewRender", function($compile) {
    return {
        restrict: "E",
        replace: !0,
        scope: {
            field: "=ngField",
            model: "=ngModel"
        },
        templateUrl: "views/ui/field-view-render.html",
        controller: function($scope, ModalService) {
            $scope.viewInModal = function(item) {
                console.log("View in modal", item), ModalService.view(item);
            }, $scope.editInModal = function(item) {
                console.log("Edit in modal", item), ModalService.edit(item);
            }, _.isArray($scope.model) && ($scope.multiple = !0), 1 == $scope.field.minimum && 1 == $scope.field.maximum ? $scope.viewModel = [ $scope.model ] : $scope.viewModel = $scope.model;
        }
    };
}), app.directive("fieldObjectRender", function() {
    return {
        restrict: "E",
        replace: !0,
        scope: {
            model: "=ngModel"
        },
        link: function($scope) {
            $scope.create = function() {
                $scope.model || ($scope.model = {});
            };
        },
        template: '<div><pre>{{model | json}}</pre><a class="btn btn-default" ng-click="create()" ng-if="!model"><span>Add</span><i class="fa fa-plus"></i></a><div ng-if="model"><json-editor config="model"/></div></div>'
    };
}), app.directive("fieldEditRender", function($compile) {
    return {
        restrict: "E",
        replace: !0,
        scope: {
            field: "=ngField",
            model: "=ngModel"
        },
        link: function($scope, $element, $attrs) {
            var template = '<div class="form-group"><label>{{field.title}}</label><input ng-model="model" class="form-control" placeholder="{{field.title}}"></div>';
            $scope.field.params ? $scope.config = $scope.field.params : $scope.config = {}, 
            $scope.config.restrictType && ($scope.config.type = $scope.config.restrictType), 
            $scope.config.minimum = $scope.field.minimum, $scope.config.maximum = $scope.field.maximum;
            var renderName = $scope.field.directive;
            switch ($scope.field.type) {
              case "reference":
                $scope.config.allowedValues = $scope.field.allowedReferences, $scope.config.defaultValues = $scope.field.defaultReferences, 
                $scope.config.canCreate = !0, renderName = "content-select";
                break;

              default:
                $scope.config.allowedValues = $scope.field.allowedValues, $scope.config.defaultValues = $scope.field.defaultValues;
            }
            var attributes = "";
            switch ($scope.field.type) {
              case "boolean":
                attributes = 'type="checkbox" ';
                break;

              case "float":
              case "integer":
              case "number":
                attributes = 'type="number" ';
                break;

              case "email":
                attributes = 'type="email" ';
                break;

              case "date":
                attributes = 'type="date" ';
                break;

              case "reference":
              case "string":
                attributes = 'type="text" ';
                break;

              case "object":
                renderName = "field-object-render";
                break;

              case "void":
                return;
            }
            switch (renderName || (renderName = "input"), "date-select" == renderName && (renderName = "dateselect"), 
            renderName) {
              case "input":
                template = "boolean" == $scope.field.type ? '<div class="form-group"><div class="checkbox"><label><' + renderName + " " + attributes + ' ng-model="model"/>{{field.title}}</label></div></div>' : '<div class="form-group"><label>{{field.title}}</label><' + renderName + " " + attributes + ' ng-model="model" placeholder="{{field.title}}" class="form-control" ng-params="config"/></div>';
                break;

              case "textarea":
                template = '<div class="form-group"><label>{{field.title}}</label><' + renderName + " " + attributes + ' ng-model="model" placeholder="{{field.title}}" class="form-control" ng-params="config"/></div>';
                break;

              case "select":
                template = '<div class="form-group"><label>{{field.title}}</label><select ' + attributes + ' ng-model="model" class="form-control" ng-params="config">', 
                _.each($scope.field.options, function(option) {
                    template += '<option value="' + option.value + '">' + option.name + "</option>";
                }), template += "</select></div>";
                break;

              default:
                template = '<div class="form-group"><label>{{field.title}}</label><' + renderName + " " + attributes + ' ng-model="model" ng-params="config"/></div>';
            }
            if (template && template.length) {
                var cTemplate = $compile(template)($scope);
                $element.replaceWith(cTemplate);
            }
        }
    };
}), app.service("FluroBreadcrumbService", function($rootScope, $state, $timeout) {
    var backButtonPress, controller = {
        trail: []
    }, scrollPositions = {};
    return controller.trail = [], $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams, error) {
        var path = $state.href(fromState, fromParams), previousScrollPosition = document.body.scrollTop;
        scrollPositions[path] = previousScrollPosition;
    }), $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams, error) {
        if (backButtonPress) {
            var path = $state.href(toState, toParams), previousScrollPosition = scrollPositions[path];
            previousScrollPosition ? $timeout(function() {
                document.body.scrollTop = previousScrollPosition;
            }) : document.body.scrollTop = 0, controller.trail.pop(), controller.trail.pop(), 
            backButtonPress = !1;
        } else document.body.scrollTop = 0;
        controller.trail.push({
            name: toState.name,
            params: toParams
        });
    }), controller.topState = _.find($state.get(), function(state) {
        return state.name && state.name.length;
    }), controller.top = function() {
        controller.trail.length = 0, controller.topState && $state.go(controller.topState);
    }, controller.clear = function() {
        controller.trail.length = 0;
    }, controller.back = function() {
        if (controller.trail.length) {
            backButtonPress = !0;
            var count = controller.trail.length, previousState = controller.trail[count - 2];
            previousState ? $state.go(previousState.name, previousState.params) : $state.$current.parent && $state.$current.parent.self.name.length ? $state.go("^") : $state.go(controller.topState);
        }
    }, controller;
}), app.controller("FluroInteractionButtonSelectController", function($scope, FluroValidate) {
    function checkValidity() {
        var validRequired, validInput = FluroValidate.validate($scope.model[$scope.options.key], definition);
        $scope.multiple ? $scope.to.required && (validRequired = _.isArray($scope.model[opts.key]) && $scope.model[opts.key].length > 0) : $scope.to.required && $scope.model[opts.key] && (validRequired = !0), 
        $scope.fc && ($scope.fc.$setValidity("required", validRequired), $scope.fc.$setValidity("validInput", validInput));
    }
    function setModel() {
        $scope.multiple ? $scope.model[opts.key] = angular.copy($scope.selection.values) : $scope.model[opts.key] = angular.copy($scope.selection.value), 
        $scope.fc && $scope.fc.$setTouched(), checkValidity();
    }
    var opts = ($scope.to, $scope.options);
    $scope.selection = {
        values: [],
        value: null
    };
    var definition = $scope.to.definition, minimum = definition.minimum, maximum = definition.maximum;
    if (minimum || (minimum = 0), maximum || (maximim = 0), $scope.multiple = 1 != maximum, 
    $scope.dragControlListeners = {
        orderChanged: function(event) {
            $scope.model[opts.key] = angular.copy($scope.selection.values);
        }
    }, $scope.selectBox = {}, $scope.selectUpdate = function() {
        $scope.selectBox.item && ($scope.selection.values.push($scope.selectBox.item), $scope.model[opts.key] = angular.copy($scope.selection.values));
    }, $scope.canAddMore = function() {
        return maximum ? $scope.multiple ? $scope.selection.values.length < maximum : $scope.selection.value ? void 0 : !0 : !0;
    }, $scope.contains = function(value) {
        return $scope.multiple ? _.includes($scope.selection.values, value) : $scope.selection.value == value;
    }, $scope.select = function(value) {
        if ($scope.multiple) {
            if (!$scope.canAddMore()) return;
            $scope.selection.values.push(value);
        } else $scope.selection.value = value;
    }, $scope.deselect = function(value) {
        $scope.multiple ? _.pull($scope.selection.values, value) : $scope.selection.value = null;
    }, $scope.toggle = function(reference) {
        $scope.contains(reference) ? $scope.deselect(reference) : $scope.select(reference), 
        setModel();
    }, $scope.$watch("model", function(newModelValue, oldModelValue) {
        if (newModelValue != oldModelValue) {
            var modelValue;
            _.keys(newModelValue).length && (modelValue = newModelValue[opts.key], $scope.multiple ? modelValue && _.isArray(modelValue) ? $scope.selection.values = angular.copy(modelValue) : $scope.selection.values = [] : $scope.selection.value = angular.copy(modelValue));
        }
    }, !0), opts.expressionProperties && opts.expressionProperties["templateOptions.required"] && $scope.$watch(function() {
        return $scope.to.required;
    }, function(newValue) {
        checkValidity();
    }), $scope.to.required) var unwatchFormControl = $scope.$watch("fc", function(newValue) {
        newValue && (checkValidity(), unwatchFormControl());
    });
}), app.run(function(formlyConfig, $templateCache) {
    formlyConfig.setType({
        name: "dob-select",
        templateUrl: "fluro-interaction-form/dob-select/fluro-dob-select.html",
        wrapper: [ "bootstrapHasError" ]
    });
}), app.run(function(formlyConfig, $templateCache) {
    formlyConfig.setType({
        name: "embedded",
        templateUrl: "fluro-interaction-form/embedded/fluro-embedded.html",
        controller: "FluroInteractionNestedController",
        wrapper: [ "bootstrapHasError" ]
    });
}), app.directive("interactionForm", function($compile) {
    return {
        restrict: "E",
        scope: {
            model: "=ngModel",
            integration: "=ngPaymentIntegration",
            vm: "=?config",
            callback: "=?callback"
        },
        transclude: !0,
        controller: "InteractionFormController",
        template: '<div class="fluro-interaction-form" ng-transclude-here />',
        link: function($scope, $element, $attrs, $ctrl, $transclude) {
            $transclude($scope, function(clone, $scope) {
                $element.find("[ng-transclude-here]").append(clone);
            });
        }
    };
}), app.directive("webform", function($compile) {
    return {
        restrict: "E",
        scope: {
            model: "=ngModel",
            integration: "=ngPaymentIntegration",
            vm: "=?config",
            debugMode: "=?debugMode",
            callback: "=?callback",
            linkedEvent: "=?linkedEvent"
        },
        transclude: !0,
        controller: "InteractionFormController",
        templateUrl: "fluro-interaction-form/fluro-web-form.html",
        link: function($scope, $element, $attrs, $ctrl, $transclude) {
            console.log("CLONING"), $transclude($scope, function(clone, $scope) {
                $scope.transcludedContent = clone;
            });
        }
    };
}), app.config(function(formlyConfigProvider) {
    formlyConfigProvider.setType({
        name: "currency",
        "extends": "input",
        controller: function($scope) {},
        wrapper: [ "bootstrapLabel", "bootstrapHasError" ],
        defaultOptions: {
            ngModelAttrs: {
                currencyDirective: {
                    attribute: "ng-currency"
                },
                fractionValue: {
                    attribute: "fraction",
                    bound: "fraction"
                },
                minimum: {
                    attribute: "min",
                    bound: "min"
                },
                maximum: {
                    attribute: "max",
                    bound: "max"
                }
            },
            templateOptions: {
                customAttrVal: "",
                required: !0,
                fraction: 2
            },
            validators: {
                validInput: {
                    expression: function($viewValue, $modelValue, scope) {
                        var numericValue = Number($modelValue);
                        if (isNaN(numericValue)) return !1;
                        var minimumAmount = scope.options.data.minimumAmount, maximumAmount = scope.options.data.maximumAmount;
                        return minimumAmount && minimumAmount > numericValue ? !1 : maximumAmount && numericValue > maximumAmount ? !1 : !0;
                    }
                }
            }
        }
    });
}), app.run(function(formlyConfig, $templateCache) {
    formlyConfig.templateManipulators.postWrapper.push(function(template, options, scope) {
        var fluroErrorTemplate = $templateCache.get("fluro-interaction-form/field-errors.html");
        return "<div>" + template + fluroErrorTemplate + "</div>";
    }), formlyConfig.setType({
        name: "multiInput",
        templateUrl: "fluro-interaction-form/multi.html",
        defaultOptions: {
            noFormControl: !0,
            wrapper: [ "bootstrapLabel", "bootstrapHasError" ],
            templateOptions: {
                inputOptions: {
                    wrapper: null
                }
            }
        },
        controller: function($scope) {
            function copyItemOptions() {
                return angular.copy($scope.to.inputOptions);
            }
            $scope.copyItemOptions = copyItemOptions;
        }
    }), formlyConfig.setType({
        name: "payment",
        templateUrl: "fluro-interaction-form/payment/payment.html",
        defaultOptions: {
            noFormControl: !0
        }
    }), formlyConfig.setType({
        name: "custom",
        templateUrl: "fluro-interaction-form/custom.html",
        controller: "CustomInteractionFieldController",
        wrapper: [ "bootstrapHasError" ]
    }), formlyConfig.setType({
        name: "button-select",
        templateUrl: "fluro-interaction-form/button-select/fluro-button-select.html",
        controller: "FluroInteractionButtonSelectController",
        wrapper: [ "bootstrapLabel", "bootstrapHasError" ]
    }), formlyConfig.setType({
        name: "date-select",
        templateUrl: "fluro-interaction-form/date-select/fluro-date-select.html",
        wrapper: [ "bootstrapLabel", "bootstrapHasError" ]
    }), formlyConfig.setType({
        name: "terms",
        templateUrl: "fluro-interaction-form/fluro-terms.html",
        wrapper: [ "bootstrapLabel", "bootstrapHasError" ]
    }), formlyConfig.setType({
        name: "order-select",
        templateUrl: "fluro-interaction-form/order-select/fluro-order-select.html",
        controller: "FluroInteractionButtonSelectController",
        wrapper: [ "bootstrapLabel", "bootstrapHasError" ]
    });
}), app.controller("CustomInteractionFieldController", function($scope, FluroValidate) {
    $scope.$watch("model[options.key]", function(value) {
        value && $scope.fc && $scope.fc.$setTouched();
    }, !0);
}), app.controller("FluroDateSelectController", function($scope) {
    $scope.today = function() {
        $scope.model[$scope.options.key] = new Date();
    }, $scope.open = function($event) {
        $event.preventDefault(), $event.stopPropagation(), $scope.opened = !0;
    }, $scope.dateOptions = {
        formatYear: "yy",
        startingDay: 1
    }, $scope.formats = [ "dd/MM/yyyy" ], $scope.format = $scope.formats[0];
}), app.controller("InteractionFormController", function($scope, $q, $rootScope, FluroAccess, $parse, $filter, formlyValidationMessages, FluroContent, FluroContentRetrieval, FluroValidate, FluroInteraction) {
    function getAllErrorFields(array) {
        return _.chain(array).map(function(field) {
            if (field.fieldGroup && field.fieldGroup.length) return getAllErrorFields(field.fieldGroup);
            if (field.data && (field.data.fields && field.data.fields.length || field.data.dataFields && field.data.dataFields || field.data.replicatedFields && field.data.replicatedFields)) {
                var combined = [];
                return combined = combined.concat(field.data.fields, field.data.dataFields, field.data.replicatedFields), 
                combined = _.compact(combined), getAllErrorFields(combined);
            }
            return field;
        }).flatten().value();
    }
    function submitInteraction() {
        function processRequest() {
            function submissionSuccess(res) {
                $scope.vm.defaultModel ? $scope.vm.model = angular.copy($scope.vm.defaultModel) : $scope.vm.model = {}, 
                $scope.vm.modelForm.$setPristine(), $scope.vm.options.resetModel(), $scope.response = res, 
                $scope.vm.state = "complete";
            }
            function submissionFail(res) {
                return console.log("Interaction Failed", res), $scope.vm.state = "error", res.data ? res.data.error ? res.data.error.message ? $scope.processErrorMessages = [ res.error.message ] : $scope.processErrorMessages = [ res.error ] : res.data.errors ? $scope.processErrorMessages = _.map(res.data.errors, function(error) {
                    return error.message;
                }) : _.isArray(res.data) ? $scope.processErrorMessages = res.data : void ($scope.processErrorMessages = [ res.data ]) : $scope.processErrorMessages = [ "Error: " + res ];
            }
            delete interactionDetails._paymentCardCVN, delete interactionDetails._paymentCardExpMonth, 
            delete interactionDetails._paymentCardExpYear, delete interactionDetails._paymentCardName, 
            delete interactionDetails._paymentCardNumber, interactionDetails._paymentAmount && (paymentDetails.amount = 100 * parseFloat(interactionDetails._paymentAmount));
            var request = FluroInteraction.interact($scope.model.title, interactionKey, interactionDetails, paymentDetails, $scope.linkedEvent);
            request.then(submissionSuccess, submissionFail);
        }
        $scope.vm.state = "sending";
        var requiresPayment, allowsPayment, interactionKey = $scope.model.definitionName, interactionDetails = angular.copy($scope.vm.model), paymentConfiguration = $scope.model.paymentDetails;
        if (paymentConfiguration && (requiresPayment = paymentConfiguration.required, allowsPayment = paymentConfiguration.allow), 
        !requiresPayment && !allowsPayment) return processRequest();
        var paymentDetails = {};
        if (paymentConfiguration.allowAlternativePayments && paymentConfiguration.paymentMethods) {
            var selectedMethod = interactionDetails._paymentMethod;
            if (selectedMethod && "card" != selectedMethod) return paymentDetails.method = selectedMethod, 
            processRequest();
        }
        var paymentIntegration = $scope.integration;
        if (!paymentIntegration || !paymentIntegration.publicDetails) return paymentConfiguration.required ? console.log("No payment integration was supplied for this interaction but payments are required") : console.log("No payment integration was supplied for this interaction but payments are set to be allowed"), 
        alert("This form has not been configured properly. Please notify the administrator of this website immediately."), 
        void ($scope.vm.state = "ready");
        switch (paymentDetails.integration = paymentIntegration._id, paymentIntegration.module) {
          case "eway":
            if (!window.eCrypt) return console.log("ERROR: Eway is selected for payment but the eCrypt script has not been included in this application visit https://eway.io/api-v3/#encrypt-function for more information"), 
            $scope.vm.state = "ready";
            var key = paymentIntegration.publicDetails.publicKey, cardDetails = {};
            cardDetails.name = interactionDetails._paymentCardName, cardDetails.number = eCrypt.encryptValue(interactionDetails._paymentCardNumber, key), 
            cardDetails.cvc = eCrypt.encryptValue(interactionDetails._paymentCardCVN, key);
            var expiryMonth = String(interactionDetails._paymentCardExpMonth), expiryYear = String(interactionDetails._paymentCardExpYear);
            return expiryMonth.length < 1 && (expiryMonth = "0" + expiryMonth), cardDetails.exp_month = expiryMonth, 
            cardDetails.exp_year = expiryYear.slice(-2), paymentDetails.details = cardDetails, 
            processRequest();

          case "stripe":
            if (!window.Stripe) return console.log("ERROR: Stripe is selected for payment but the Stripe API has not been included in this application"), 
            $scope.vm.state = "ready";
            var liveKey = paymentIntegration.publicDetails.livePublicKey, sandboxKey = paymentIntegration.publicDetails.testPublicKey, key = liveKey;
            paymentIntegration.publicDetails.sandbox && (key = sandboxKey), Stripe.setPublishableKey(key);
            var cardDetails = {};
            cardDetails.name = interactionDetails._paymentCardName, cardDetails.number = interactionDetails._paymentCardNumber, 
            cardDetails.cvc = interactionDetails._paymentCardCVN, cardDetails.exp_month = interactionDetails._paymentCardExpMonth, 
            cardDetails.exp_year = interactionDetails._paymentCardExpYear, Stripe.card.createToken(cardDetails, function(status, response) {
                return response.error ? (console.log("Stripe token error", response), $scope.processErrorMessages = [ response.error.message ], 
                $scope.vm.state = "error", void 0) : (paymentDetails.details = response, processRequest());
            });
        }
    }
    $scope.vm || ($scope.vm = {}), $scope.vm.defaultModel ? $scope.vm.model = angular.copy($scope.vm.defaultModel) : $scope.vm.model = {}, 
    $scope.vm.modelFields = [], $scope.vm.state = "ready", $scope.correctPermissions = !0, 
    $scope.readyToSubmit = !1, $scope.$watch("vm.modelForm.$invalid + vm.modelForm.$error", function() {
        var interactionForm = $scope.vm.modelForm;
        if (!interactionForm) return $scope.readyToSubmit = !1;
        if (interactionForm.$invalid) return $scope.readyToSubmit = !1;
        if (interactionForm.$error) {
            if (interactionForm.$error.required && interactionForm.$error.required.length) return $scope.readyToSubmit = !1;
            if (interactionForm.$error.validInput && interactionForm.$error.validInput.length) return $scope.readyToSubmit = !1;
        }
        $scope.readyToSubmit = !0;
    }, !0), formlyValidationMessages.addStringMessage("required", "This field is required"), 
    formlyValidationMessages.messages.validInput = function($viewValue, $modelValue, scope) {
        return scope.to.label + " is not a valid value";
    }, formlyValidationMessages.messages.date = function($viewValue, $modelValue, scope) {
        return scope.to.label + " is not a valid date";
    }, $scope.reset = function() {
        $scope.vm.defaultModel ? $scope.vm.model = angular.copy($scope.vm.defaultModel) : $scope.vm.model = {}, 
        $scope.vm.modelForm.$setPristine(), $scope.vm.options.resetModel(), $scope.response = null, 
        $scope.vm.state = "ready", console.log("Broadcast reset"), $scope.$broadcast("form-reset");
    }, $scope.$watch("model", function(newData, oldData) {
        function addFieldDefinition(array, fieldDefinition) {
            if (!fieldDefinition.params || !fieldDefinition.params.disableWebform) {
                var newField = {};
                newField.key = fieldDefinition.key, fieldDefinition.className && (newField.className = fieldDefinition.className);
                var templateOptions = {};
                switch (templateOptions.type = "text", templateOptions.label = fieldDefinition.title, 
                templateOptions.description = fieldDefinition.description, templateOptions.params = fieldDefinition.params, 
                fieldDefinition.errorMessage && (templateOptions.errorMessage = fieldDefinition.errorMessage), 
                templateOptions.definition = fieldDefinition, fieldDefinition.placeholder && fieldDefinition.placeholder.length ? templateOptions.placeholder = fieldDefinition.placeholder : fieldDefinition.description && fieldDefinition.description.length ? templateOptions.placeholder = fieldDefinition.description : templateOptions.placeholder = fieldDefinition.title, 
                templateOptions.required = fieldDefinition.minimum > 0, templateOptions.onBlur = "to.focused=false", 
                templateOptions.onFocus = "to.focused=true", fieldDefinition.directive) {
                  case "reference-select":
                  case "value-select":
                    newField.type = "button-select";
                    break;

                  case "select":
                    newField.type = "select";
                    break;

                  case "wysiwyg":
                    newField.type = "textarea";
                    break;

                  default:
                    newField.type = fieldDefinition.directive;
                }
                switch (fieldDefinition.type) {
                  case "reference":
                    if (fieldDefinition.allowedReferences && fieldDefinition.allowedReferences.length) templateOptions.options = _.map(fieldDefinition.allowedReferences, function(ref) {
                        return {
                            name: ref.title,
                            value: ref._id
                        };
                    }); else if (templateOptions.options = [], fieldDefinition.sourceQuery) {
                        var queryId = fieldDefinition.sourceQuery;
                        queryId._id && (queryId = queryId._id);
                        var options = {};
                        fieldDefinition.queryTemplate && (options.template = fieldDefinition.queryTemplate, 
                        options.template._id && (options.template = options.template._id));
                        var promise = FluroContentRetrieval.getQuery(queryId, options);
                        promise.then(function(res) {
                            templateOptions.options = _.map(res, function(ref) {
                                return {
                                    name: ref.title,
                                    value: ref._id
                                };
                            });
                        });
                    } else "embedded" != fieldDefinition.directive && fieldDefinition.params.restrictType && fieldDefinition.params.restrictType.length && FluroContent.resource(fieldDefinition.params.restrictType).query().$promise.then(function(res) {
                        templateOptions.options = _.map(res, function(ref) {
                            return {
                                name: ref.title,
                                value: ref._id
                            };
                        });
                    });
                    break;

                  default:
                    fieldDefinition.options && fieldDefinition.options.length ? templateOptions.options = fieldDefinition.options : templateOptions.options = _.map(fieldDefinition.allowedValues, function(val) {
                        return {
                            name: val,
                            value: val
                        };
                    });
                }
                if (fieldDefinition.attributes && _.keys(fieldDefinition.attributes).length && (newField.ngModelAttrs = _.reduce(fieldDefinition.attributes, function(results, attr, key) {
                    var customKey = "customAttr" + key;
                    return results[customKey] = {
                        attribute: key
                    }, templateOptions[customKey] = attr, results;
                }, {})), "custom" != fieldDefinition.directive) switch (fieldDefinition.type) {
                  case "boolean":
                    fieldDefinition.params && fieldDefinition.params.storeCopy ? newField.type = "terms" : newField.type = "checkbox";
                    break;

                  case "number":
                  case "float":
                  case "integer":
                  case "decimal":
                    templateOptions.type = "input", newField.ngModelAttrs || (newField.ngModelAttrs = {}), 
                    "integer" == fieldDefinition.type && (templateOptions.type = "number", templateOptions.baseDefaultValue = 0, 
                    newField.ngModelAttrs.customAttrpattern = {
                        attribute: "pattern"
                    }, newField.ngModelAttrs.customAttrinputmode = {
                        attribute: "inputmode"
                    }, templateOptions.customAttrpattern = "[0-9]*", templateOptions.customAttrinputmode = "numeric", 
                    fieldDefinition.params && (0 !== parseInt(fieldDefinition.params.maxValue) && (templateOptions.max = fieldDefinition.params.maxValue), 
                    0 !== parseInt(fieldDefinition.params.minValue) ? templateOptions.min = fieldDefinition.params.minValue : templateOptions.min = 0));
                }
                if (1 == fieldDefinition.maximum ? "reference" == fieldDefinition.type && "embedded" != fieldDefinition.directive ? fieldDefinition.defaultReferences && fieldDefinition.defaultReferences.length && ("search-select" == fieldDefinition.directive ? templateOptions.baseDefaultValue = fieldDefinition.defaultReferences[0] : templateOptions.baseDefaultValue = fieldDefinition.defaultReferences[0]._id) : fieldDefinition.defaultValues && fieldDefinition.defaultValues.length && ("number" == templateOptions.type ? templateOptions.baseDefaultValue = Number(fieldDefinition.defaultValues[0]) : templateOptions.baseDefaultValue = fieldDefinition.defaultValues[0]) : "reference" == fieldDefinition.type && "embedded" != fieldDefinition.directive ? fieldDefinition.defaultReferences && fieldDefinition.defaultReferences.length ? "search-select" == fieldDefinition.directive ? templateOptions.baseDefaultValue = fieldDefinition.defaultReferences : templateOptions.baseDefaultValue = _.map(fieldDefinition.defaultReferences, function(ref) {
                    return ref._id;
                }) : templateOptions.baseDefaultValue = [] : fieldDefinition.defaultValues && fieldDefinition.defaultValues.length && ("number" == templateOptions.type ? templateOptions.baseDefaultValue = _.map(fieldDefinition.defaultValues, function(val) {
                    return Number(val);
                }) : templateOptions.baseDefaultValue = fieldDefinition.defaultValues), newField.templateOptions = templateOptions, 
                newField.validators = {
                    validInput: function($viewValue, $modelValue, scope) {
                        var value = $modelValue || $viewValue;
                        if (!value) return !0;
                        var valid = FluroValidate.validate(value, fieldDefinition);
                        return valid;
                    }
                }, "embedded" == fieldDefinition.directive) {
                    if (newField.type = "embedded", 1 == fieldDefinition.maximum && 1 == fieldDefinition.minimum) templateOptions.baseDefaultValue = {
                        data: {}
                    }; else {
                        var askCount = 0;
                        fieldDefinition.askCount && (askCount = fieldDefinition.askCount), fieldDefinition.minimum && askCount < fieldDefinition.minimum && (askCount = fieldDefinition.minimum), 
                        fieldDefinition.maximum && askCount > fieldDefinition.maximum && (askCount = fieldDefinition.maximum);
                        var initialArray = [];
                        askCount && _.times(askCount, function() {
                            initialArray.push({});
                        }), templateOptions.baseDefaultValue = initialArray;
                    }
                    newField.data = {
                        fields: [],
                        dataFields: [],
                        replicatedFields: []
                    };
                    var fieldContainer = newField.data.fields, dataFieldContainer = newField.data.dataFields;
                    fieldDefinition.fields && fieldDefinition.fields.length && _.each(fieldDefinition.fields, function(sub) {
                        addFieldDefinition(fieldContainer, sub);
                    });
                    var promise = FluroContent.endpoint("defined/" + fieldDefinition.params.restrictType).get().$promise;
                    promise.then(function(embeddedDefinition) {
                        if (embeddedDefinition && embeddedDefinition.fields && embeddedDefinition.fields.length) {
                            var childFields = embeddedDefinition.fields;
                            fieldDefinition.params.excludeKeys && fieldDefinition.params.excludeKeys.length && (childFields = _.reject(childFields, function(f) {
                                return _.includes(fieldDefinition.params.excludeKeys, f.key);
                            })), console.log("EXCLUSIONS", fieldDefinition.params.excludeKeys, childFields), 
                            _.each(childFields, function(sub) {
                                addFieldDefinition(dataFieldContainer, sub);
                            });
                        }
                    }), $scope.promises.push(promise);
                }
                if ("group" == fieldDefinition.type && fieldDefinition.fields && fieldDefinition.fields.length || fieldDefinition.asObject) {
                    var fieldContainer;
                    if (fieldDefinition.asObject) {
                        if (newField.type = "nested", fieldDefinition.key && 1 == fieldDefinition.maximum && 1 == fieldDefinition.minimum) templateOptions.baseDefaultValue = {}; else {
                            var askCount = 0;
                            fieldDefinition.askCount && (askCount = fieldDefinition.askCount), fieldDefinition.minimum && askCount < fieldDefinition.minimum && (askCount = fieldDefinition.minimum), 
                            fieldDefinition.maximum && askCount > fieldDefinition.maximum && (askCount = fieldDefinition.maximum);
                            var initialArray = [];
                            askCount && _.times(askCount, function() {
                                initialArray.push({});
                            }), templateOptions.baseDefaultValue = initialArray;
                        }
                        newField.data = {
                            fields: [],
                            replicatedFields: []
                        }, fieldContainer = newField.data.fields;
                    } else newField = {
                        fieldGroup: [],
                        className: fieldDefinition.className
                    }, fieldContainer = newField.fieldGroup;
                    _.each(fieldDefinition.fields, function(sub) {
                        addFieldDefinition(fieldContainer, sub);
                    });
                }
                if (fieldDefinition.expressions && _.keys(fieldDefinition.expressions).length) {
                    fieldDefinition.hideExpression && fieldDefinition.hideExpression.length && (fieldDefinition.expressions.hide = fieldDefinition.hideExpression);
                    var allExpressions = _.values(fieldDefinition.expressions).join("+");
                    newField.watcher = {
                        expression: function(field, scope) {
                            return $parse(allExpressions)(scope);
                        },
                        listener: function(field, newValue, oldValue, scope, stopWatching) {
                            scope.interaction || (scope.interaction = $scope.vm.model), _.each(fieldDefinition.expressions, function(expression, key) {
                                var retrievedValue = $parse(expression)(scope), fieldKey = field.key;
                                switch (key) {
                                  case "defaultValue":
                                    if (!field.formControl || !field.formControl.$dirty) return scope.model[fieldKey] = retrievedValue;
                                    break;

                                  case "value":
                                    return scope.model[fieldKey] = retrievedValue;

                                  case "required":
                                    return field.templateOptions.required = retrievedValue;

                                  case "hide":
                                    return field.hide = retrievedValue;
                                }
                            });
                        }
                    };
                }
                fieldDefinition.hideExpression && (newField.hideExpression = fieldDefinition.hideExpression), 
                newField.fieldGroup || (newField.defaultValue = angular.copy(templateOptions.baseDefaultValue)), 
                "pathlink" != newField.type && array.push(newField);
            }
        }
        if ($scope.model && "interaction" == $scope.model.parentType) {
            $scope.vm.defaultModel ? $scope.vm.model = angular.copy($scope.vm.defaultModel) : $scope.vm.model = {}, 
            $scope.vm.modelFields = [], $scope.vm.state = "ready", $scope.vm.onSubmit = submitInteraction, 
            $scope.promises = [], $scope.submitLabel = "Submit", $scope.model && $scope.model.data && $scope.model.data.submitLabel && $scope.model.data.submitLabel.length && ($scope.submitLabel = $scope.model.data.submitLabel);
            var interactionFormSettings = $scope.model.data;
            if (interactionFormSettings || (interactionFormSettings = {}), !interactionFormSettings.allowAnonymous && !interactionFormSettings.disableDefaultFields) switch (interactionFormSettings.requireFirstName = !0, 
            interactionFormSettings.requireLastName = !0, interactionFormSettings.requireGender = !0, 
            interactionFormSettings.requireEmail = !0, interactionFormSettings.identifier) {
              case "both":
                interactionFormSettings.requireEmail = interactionFormSettings.requirePhone = !0;
                break;

              case "email":
                interactionFormSettings.requireEmail = !0;
                break;

              case "phone":
                interactionFormSettings.requirePhone = !0;
                break;

              case "either":
                interactionFormSettings.askPhone = !0, interactionFormSettings.askEmail = !0;
            }
            var firstNameField, lastNameField, genderField;
            if ((interactionFormSettings.askGender || interactionFormSettings.requireGender) && (genderField = {
                key: "_gender",
                type: "select",
                templateOptions: {
                    type: "email",
                    label: "Title",
                    placeholder: "Please select a title",
                    options: [ {
                        name: "Mr",
                        value: "male"
                    }, {
                        name: "Ms / Mrs",
                        value: "female"
                    } ],
                    required: interactionFormSettings.requireGender,
                    onBlur: "to.focused=false",
                    onFocus: "to.focused=true"
                },
                validators: {
                    validInput: function($viewValue, $modelValue, scope) {
                        var value = $modelValue || $viewValue;
                        return "male" == value || "female" == value;
                    }
                }
            }), (interactionFormSettings.askFirstName || interactionFormSettings.requireFirstName) && (firstNameField = {
                key: "_firstName",
                type: "input",
                templateOptions: {
                    type: "text",
                    label: "First Name",
                    placeholder: "Please enter your first name",
                    required: interactionFormSettings.requireFirstName,
                    onBlur: "to.focused=false",
                    onFocus: "to.focused=true"
                }
            }), (interactionFormSettings.askLastName || interactionFormSettings.requireLastName) && (lastNameField = {
                key: "_lastName",
                type: "input",
                templateOptions: {
                    type: "text",
                    label: "Last Name",
                    placeholder: "Please enter your last name",
                    required: interactionFormSettings.requireLastName,
                    onBlur: "to.focused=false",
                    onFocus: "to.focused=true"
                }
            }), genderField && firstNameField && lastNameField ? (genderField.className = "col-sm-2", 
            firstNameField.className = lastNameField.className = "col-sm-5", $scope.vm.modelFields.push({
                fieldGroup: [ genderField, firstNameField, lastNameField ],
                className: "row"
            })) : firstNameField && lastNameField && !genderField ? (firstNameField.className = lastNameField.className = "col-sm-6", 
            $scope.vm.modelFields.push({
                fieldGroup: [ firstNameField, lastNameField ],
                className: "row"
            })) : (genderField && $scope.vm.modelFields.push(genderField), firstNameField && $scope.vm.modelFields.push(firstNameField), 
            lastNameField && $scope.vm.modelFields.push(lastNameField)), interactionFormSettings.askEmail || interactionFormSettings.requireEmail) {
                var newField = {
                    key: "_email",
                    type: "input",
                    templateOptions: {
                        type: "email",
                        label: "Email Address",
                        placeholder: "Please enter a valid email address",
                        required: interactionFormSettings.requireEmail,
                        onBlur: "to.focused=false",
                        onFocus: "to.focused=true"
                    },
                    validators: {
                        validInput: function($viewValue, $modelValue, scope) {
                            var value = $modelValue || $viewValue;
                            return validator.isEmail(value);
                        }
                    }
                };
                "either" == interactionFormSettings.identifier && (newField.expressionProperties = {
                    "templateOptions.required": function($viewValue, $modelValue, scope) {
                        return scope.model._phoneNumber && scope.model._phoneNumber.length ? !1 : !0;
                    }
                }), $scope.vm.modelFields.push(newField);
            }
            if (interactionFormSettings.askPhone || interactionFormSettings.requirePhone) {
                var newField = {
                    key: "_phoneNumber",
                    type: "input",
                    templateOptions: {
                        type: "tel",
                        label: "Contact Phone Number",
                        placeholder: "Please enter a contact phone number",
                        required: interactionFormSettings.requirePhone,
                        onBlur: "to.focused=false",
                        onFocus: "to.focused=true"
                    }
                };
                "either" == interactionFormSettings.identifier && (newField.expressionProperties = {
                    "templateOptions.required": function($viewValue, $modelValue, scope) {
                        return scope.model._email && scope.model._email.length ? !1 : !0;
                    }
                }), $scope.vm.modelFields.push(newField);
            }
            if (interactionFormSettings.askDOB || interactionFormSettings.requireDOB) {
                var newField = {
                    key: "_dob",
                    type: "dob-select",
                    templateOptions: {
                        label: "Date of birth",
                        placeholder: "Please provide your date of birth",
                        required: interactionFormSettings.requireDOB,
                        maxDate: new Date(),
                        onBlur: "to.focused=false",
                        onFocus: "to.focused=true"
                    }
                };
                $scope.vm.modelFields.push(newField);
            }
            _.each($scope.model.fields, function(fieldDefinition) {
                addFieldDefinition($scope.vm.modelFields, fieldDefinition);
            }), $scope.model.paymentDetails || ($scope.model.paymentDetails = {});
            var paymentSettings = $scope.model.paymentDetails;
            if (paymentSettings.required || paymentSettings.allow) {
                var paymentWrapperFields = [], paymentCardFields = [];
                if (paymentSettings.required) paymentWrapperFields.push({
                    templateUrl: "fluro-interaction-form/payment/payment-summary.html",
                    controller: function($scope, $parse) {
                        function calculateTotal() {
                            return $scope.debugMode && console.log("Recalculate total"), $scope.calculatedTotal = requiredAmount, 
                            $scope.modifications = [], paymentSettings.modifiers && paymentSettings.modifiers.length ? (_.each(paymentSettings.modifiers, function(modifier) {
                                var parsedValue = $parse(modifier.expression)($scope);
                                if (parsedValue = Number(parsedValue), isNaN(parsedValue)) return void ($scope.debugMode && console.log("Payment modifier error", modifier.title, parsedValue));
                                var parsedCondition = !0;
                                if (modifier.condition && String(modifier.condition).length && (parsedCondition = $parse(modifier.condition)($scope)), 
                                !parsedCondition) return void ($scope.debugMode && console.log("inactive", modifier.title, modifier, $scope));
                                var operator = "", operatingValue = "$" + parseFloat(parsedValue / 100).toFixed(2);
                                switch (modifier.operation) {
                                  case "add":
                                    operator = "+", $scope.calculatedTotal = $scope.calculatedTotal + parsedValue;
                                    break;

                                  case "subtract":
                                    operator = "-", $scope.calculatedTotal = $scope.calculatedTotal - parsedValue;
                                    break;

                                  case "divide":
                                    operator = "÷", operatingValue = parsedValue, $scope.calculatedTotal = $scope.calculatedTotal / parsedValue;
                                    break;

                                  case "multiply":
                                    operator = "×", operatingValue = parsedValue, $scope.calculatedTotal = $scope.calculatedTotal * parsedValue;
                                    break;

                                  case "set":
                                    $scope.calculatedTotal = parsedValue;
                                }
                                $scope.modifications.push({
                                    title: modifier.title,
                                    total: $scope.calculatedTotal,
                                    description: operator + " " + operatingValue,
                                    operation: modifier.operation
                                });
                            }), void ((isNaN($scope.calculatedTotal) || $scope.calculatedTotal < 0) && ($scope.calculatedTotal = 0))) : void ($scope.debugMode && console.log("No payment modifiers set"));
                        }
                        $scope.paymentDetails = paymentSettings;
                        var requiredAmount = paymentSettings.amount;
                        $scope.calculatedTotal = requiredAmount;
                        var watchString = "", modelVariables = _.chain(paymentSettings.modifiers).map(function(paymentModifier) {
                            var string = "(" + paymentModifier.expression + ") + (" + paymentModifier.condition + ")";
                            return string;
                        }).flatten().compact().uniq().value();
                        modelVariables.length && (watchString = modelVariables.join(" + ")), watchString.length ? ($scope.debugMode && console.log("Watching changes", watchString), 
                        $scope.$watch(watchString, calculateTotal)) : ($scope.calculatedTotal = requiredAmount, 
                        $scope.modifications = []);
                    }
                }); else {
                    var amountDescription = "Please enter an amount (" + String(paymentSettings.currency).toUpperCase() + ")", minimum = paymentSettings.minAmount, maximum = paymentSettings.maxAmount, paymentErrorMessage = (paymentSettings.amount, 
                    "Invalid amount");
                    minimum && (minimum = parseInt(minimum) / 100, paymentErrorMessage = "Amount must be a number at least " + $filter("currency")(minimum, "$"), 
                    amountDescription += "Enter at least " + $filter("currency")(minimum, "$") + " " + String(paymentSettings.currency).toUpperCase()), 
                    maximum && (maximum = parseInt(maximum) / 100, paymentErrorMessage = "Amount must be a number less than " + $filter("currency")(maximum, "$"), 
                    amountDescription += "Enter up to " + $filter("currency")(maximum, "$") + " " + String(paymentSettings.currency).toUpperCase()), 
                    minimum && maximum && (amountDescription = "Enter a numeric amount between " + $filter("currency")(minimum) + " and  " + $filter("currency")(maximum) + " " + String(paymentSettings.currency).toUpperCase(), 
                    paymentErrorMessage = "Amount must be a number between " + $filter("currency")(minimum) + " and " + $filter("currency")(maximum));
                    var fieldConfig = {
                        key: "_paymentAmount",
                        type: "currency",
                        templateOptions: {
                            type: "text",
                            label: "Amount",
                            description: amountDescription,
                            placeholder: "0.00",
                            required: !0,
                            errorMessage: paymentErrorMessage,
                            min: minimum,
                            max: maximum,
                            onBlur: "to.focused=false",
                            onFocus: "to.focused=true"
                        },
                        data: {
                            customMaxLength: 8,
                            minimumAmount: minimum,
                            maximumAmount: maximum
                        }
                    };
                    minimum && (fieldConfig.defaultValue = minimum), paymentWrapperFields.push({
                        template: "<hr/><h3>Payment Details</h3>"
                    }), paymentWrapperFields.push(fieldConfig);
                }
                var defaultCardName, defaultCardNumber, defaultCardExpMonth, defaultCardExpYear, defaultCardCVN;
                $scope.debugMode && (defaultCardName = "John Citizen", defaultCardNumber = "4242424242424242", 
                defaultCardExpMonth = "05", defaultCardExpYear = "2020", defaultCardCVN = "123"), 
                paymentCardFields.push({
                    key: "_paymentCardName",
                    type: "input",
                    defaultValue: defaultCardName,
                    templateOptions: {
                        type: "text",
                        label: "Card Name",
                        placeholder: "Card Name",
                        required: paymentSettings.required,
                        onBlur: "to.focused=false",
                        onFocus: "to.focused=true"
                    }
                }), paymentCardFields.push({
                    key: "_paymentCardNumber",
                    type: "input",
                    defaultValue: defaultCardNumber,
                    templateOptions: {
                        type: "text",
                        label: "Card Number",
                        placeholder: "Card Number",
                        required: paymentSettings.required,
                        onBlur: "to.focused=false",
                        onFocus: "to.focused=true"
                    },
                    validators: {
                        validInput: function($viewValue, $modelValue, scope) {
                            var luhnChk = function(a) {
                                return function(c) {
                                    if (!c) return !1;
                                    for (var v, l = c.length, b = 1, s = 0; l; ) v = parseInt(c.charAt(--l), 10), s += (b ^= 1) ? a[v] : v;
                                    return s && 0 === s % 10;
                                };
                            }([ 0, 2, 4, 6, 8, 1, 3, 5, 7, 9 ]), value = $modelValue || $viewValue, valid = luhnChk(value);
                            return valid;
                        }
                    }
                }), paymentCardFields.push({
                    className: "row clearfix",
                    fieldGroup: [ {
                        key: "_paymentCardExpMonth",
                        className: "col-xs-6 col-sm-5",
                        type: "input",
                        defaultValue: defaultCardExpMonth,
                        templateOptions: {
                            type: "text",
                            label: "Expiry Month",
                            placeholder: "MM",
                            required: paymentSettings.required,
                            onBlur: "to.focused=false",
                            onFocus: "to.focused=true"
                        }
                    }, {
                        key: "_paymentCardExpYear",
                        className: "col-xs-6 col-sm-5",
                        type: "input",
                        defaultValue: defaultCardExpYear,
                        templateOptions: {
                            type: "text",
                            label: "Expiry Year",
                            placeholder: "YYYY",
                            required: paymentSettings.required,
                            onBlur: "to.focused=false",
                            onFocus: "to.focused=true"
                        }
                    }, {
                        key: "_paymentCardCVN",
                        className: "col-xs-4 col-sm-2",
                        type: "input",
                        defaultValue: defaultCardCVN,
                        templateOptions: {
                            type: "text",
                            label: "CVN",
                            placeholder: "CVN",
                            required: paymentSettings.required,
                            onBlur: "to.focused=false",
                            onFocus: "to.focused=true"
                        }
                    } ]
                });
                var cardDetailsField = {
                    className: "payment-details",
                    fieldGroup: paymentCardFields
                };
                if (paymentSettings.allowAlternativePayments && paymentSettings.paymentMethods && paymentSettings.paymentMethods.length) {
                    var methodSelection = {
                        className: "payment-method-select",
                        data: {
                            fields: [ cardDetailsField ],
                            settings: paymentSettings
                        },
                        controller: function($scope) {
                            $scope.settings = paymentSettings, $scope.methodOptions = _.map(paymentSettings.paymentMethods, function(method) {
                                return method;
                            }), $scope.methodOptions.unshift({
                                title: "Pay with Card",
                                key: "card"
                            }), $scope.model._paymentMethod || ($scope.model._paymentMethod = "card"), $scope.selected = {
                                method: $scope.methodOptions[0]
                            }, $scope.selectMethod = function(method) {
                                $scope.settings.showOptions = !1, $scope.selected.method = method, $scope.model._paymentMethod = method.key;
                            };
                        },
                        templateUrl: "fluro-interaction-form/payment/payment-method.html"
                    };
                    paymentWrapperFields.push(methodSelection);
                } else paymentWrapperFields.push(cardDetailsField);
                $scope.vm.modelFields.push({
                    fieldGroup: paymentWrapperFields
                });
            }
            $scope.promises.length ? ($scope.promisesResolved = !1, $q.all($scope.promises).then(function() {
                $scope.promisesResolved = !0;
            })) : $scope.promisesResolved = !0;
        }
    }), $scope.$watch("vm.modelFields", function(fields) {
        $scope.errorList = getAllErrorFields(fields);
    }, !0);
}), app.directive("postForm", function($compile) {
    return {
        restrict: "E",
        scope: {
            model: "=ngModel",
            host: "=hostId",
            reply: "=?reply",
            thread: "=?thread",
            userStore: "=?user",
            vm: "=?config",
            debugMode: "=?debugMode",
            callback: "=?callback"
        },
        transclude: !0,
        controller: "PostFormController",
        templateUrl: "fluro-interaction-form/fluro-web-form.html",
        link: function($scope, $element, $attrs, $ctrl, $transclude) {
            $transclude($scope, function(clone, $scope) {
                $scope.transcludedContent = clone;
            });
        }
    };
}), app.directive("recaptchaRender", function($window) {
    return {
        restrict: "A",
        link: function($scope, $element, $attrs, $ctrl) {
            function activateRecaptcha(recaptcha) {
                console.log("Activate recaptcha!!"), cancelWatch && cancelWatch(), recaptcha && ($scope.vm.recaptchaID = recaptcha.render(element, {
                    sitekey: "6LelOyUTAAAAADSACojokFPhb9AIzvrbGXyd-33z"
                }));
            }
            if ($scope.model.data && $scope.model.data.recaptcha) {
                var cancelWatch, element = $element[0];
                window.grecaptcha ? activateRecaptcha(window.grecaptcha) : cancelWatch = $scope.$watch(function() {
                    return window.grecaptcha;
                }, activateRecaptcha);
            }
        }
    };
}), app.controller("PostFormController", function($scope, $rootScope, $q, $http, Fluro, FluroAccess, $parse, $filter, formlyValidationMessages, FluroContent, FluroContentRetrieval, FluroValidate, FluroInteraction) {
    function resetCaptcha() {
        var recaptchaID = $scope.vm.recaptchaID;
        console.log("Reset Captcha", recaptchaID), window.grecaptcha && recaptchaID && window.grecaptcha.reset(recaptchaID);
    }
    function getAllErrorFields(array) {
        return _.chain(array).map(function(field) {
            if (field.fieldGroup && field.fieldGroup.length) return getAllErrorFields(field.fieldGroup);
            if (field.data && (field.data.fields && field.data.fields.length || field.data.dataFields && field.data.dataFields || field.data.replicatedFields && field.data.replicatedFields)) {
                var combined = [];
                return combined = combined.concat(field.data.fields, field.data.dataFields, field.data.replicatedFields), 
                combined = _.compact(combined), getAllErrorFields(combined);
            }
            return field;
        }).flatten().value();
    }
    function submitPost() {
        function submissionSuccess(res) {
            $scope.vm.defaultModel ? $scope.vm.model = angular.copy($scope.vm.defaultModel) : $scope.vm.model = {
                data: {}
            }, $scope.vm.modelForm.$setPristine(), $scope.vm.options.resetModel(), resetCaptcha(), 
            $scope.response = res, $scope.thread && $scope.thread.push(res), $scope.vm.state = "complete";
        }
        function submissionFail(res) {
            return $scope.vm.state = "error", res.data ? res.data.error ? res.data.error.message ? $scope.processErrorMessages = [ res.error.message ] : $scope.processErrorMessages = [ res.error ] : res.data.errors ? $scope.processErrorMessages = _.map(res.data.errors, function(error) {
                return error.message;
            }) : _.isArray(res.data) ? $scope.processErrorMessages = res.data : void ($scope.processErrorMessages = [ res.data ]) : $scope.processErrorMessages = [ "Error: " + res ];
        }
        $scope.vm.state = "sending";
        var submissionKey = $scope.model.definitionName, submissionModel = {
            data: angular.copy($scope.vm.model)
        }, hostID = $scope.host;
        if ($scope.reply && (submissionModel.reply = $scope.reply), "undefined" != typeof $scope.vm.recaptchaID) {
            var response = window.grecaptcha.getResponse($scope.vm.recaptchaID);
            submissionModel["g-recaptcha-response"] = response;
        }
        var request;
        $scope.userStore ? $scope.userStore.config().then(function(config) {
            var postURL = Fluro.apiURL + "/post/" + hostID + "/" + submissionKey;
            request = $http.post(postURL, submissionModel, config), request.then(function(res) {
                return submissionSuccess(res.data);
            }, function(res) {
                return submissionFail(res.data);
            });
        }) : (request = FluroContent.endpoint("post/" + hostID + "/" + submissionKey).save(submissionModel).$promise, 
        request.then(submissionSuccess, submissionFail));
    }
    $scope.thread || ($scope.thread = []), $scope.vm || ($scope.vm = {}), $scope.promisesResolved = !0, 
    $scope.correctPermissions = !0, $scope.vm.defaultModel ? $scope.vm.model = angular.copy($scope.vm.defaultModel) : $scope.vm.model = {}, 
    $scope.vm.modelFields = [], $scope.vm.state = "ready", $scope.readyToSubmit = !1, 
    $scope.$watch("vm.modelForm.$invalid + vm.modelForm.$error", function() {
        var interactionForm = $scope.vm.modelForm;
        if (!interactionForm) return $scope.readyToSubmit = !1;
        if (interactionForm.$invalid) return $scope.readyToSubmit = !1;
        if (interactionForm.$error) {
            if (interactionForm.$error.required && interactionForm.$error.required.length) return $scope.readyToSubmit = !1;
            if (interactionForm.$error.validInput && interactionForm.$error.validInput.length) return $scope.readyToSubmit = !1;
        }
        $scope.readyToSubmit = !0;
    }, !0), formlyValidationMessages.addStringMessage("required", "This field is required"), 
    formlyValidationMessages.messages.validInput = function($viewValue, $modelValue, scope) {
        return scope.to.label + " is not a valid value";
    }, formlyValidationMessages.messages.date = function($viewValue, $modelValue, scope) {
        return scope.to.label + " is not a valid date";
    }, $scope.reset = function() {
        $scope.vm.defaultModel ? $scope.vm.model = angular.copy($scope.vm.defaultModel) : $scope.vm.model = {}, 
        $scope.vm.modelForm.$setPristine(), $scope.vm.options.resetModel(), resetCaptcha(), 
        $scope.response = null, $scope.vm.state = "ready", console.log("Broadcast reset"), 
        $scope.$broadcast("form-reset");
    }, $scope.$watch("model", function(newData, oldData) {
        function addFieldDefinition(array, fieldDefinition) {
            if (!fieldDefinition.params || !fieldDefinition.params.disableWebform) {
                var newField = {};
                newField.key = fieldDefinition.key, fieldDefinition.className && (newField.className = fieldDefinition.className);
                var templateOptions = {};
                switch (templateOptions.type = "text", templateOptions.label = fieldDefinition.title, 
                templateOptions.description = fieldDefinition.description, templateOptions.params = fieldDefinition.params, 
                fieldDefinition.errorMessage && (templateOptions.errorMessage = fieldDefinition.errorMessage), 
                templateOptions.definition = fieldDefinition, fieldDefinition.placeholder && fieldDefinition.placeholder.length ? templateOptions.placeholder = fieldDefinition.placeholder : fieldDefinition.description && fieldDefinition.description.length ? templateOptions.placeholder = fieldDefinition.description : templateOptions.placeholder = fieldDefinition.title, 
                templateOptions.required = fieldDefinition.minimum > 0, templateOptions.onBlur = "to.focused=false", 
                templateOptions.onFocus = "to.focused=true", fieldDefinition.directive) {
                  case "reference-select":
                  case "value-select":
                    newField.type = "button-select";
                    break;

                  case "select":
                    newField.type = "select";
                    break;

                  case "wysiwyg":
                    newField.type = "textarea";
                    break;

                  default:
                    newField.type = fieldDefinition.directive;
                }
                switch (fieldDefinition.type) {
                  case "reference":
                    if (fieldDefinition.allowedReferences && fieldDefinition.allowedReferences.length) templateOptions.options = _.map(fieldDefinition.allowedReferences, function(ref) {
                        return {
                            name: ref.title,
                            value: ref._id
                        };
                    }); else if (templateOptions.options = [], fieldDefinition.sourceQuery) {
                        var queryId = fieldDefinition.sourceQuery;
                        queryId._id && (queryId = queryId._id);
                        var options = {};
                        fieldDefinition.queryTemplate && (options.template = fieldDefinition.queryTemplate, 
                        options.template._id && (options.template = options.template._id));
                        var promise = FluroContentRetrieval.getQuery(queryId, options);
                        promise.then(function(res) {
                            templateOptions.options = _.map(res, function(ref) {
                                return {
                                    name: ref.title,
                                    value: ref._id
                                };
                            });
                        });
                    } else "embedded" != fieldDefinition.directive && fieldDefinition.params.restrictType && fieldDefinition.params.restrictType.length && FluroContent.resource(fieldDefinition.params.restrictType).query().$promise.then(function(res) {
                        templateOptions.options = _.map(res, function(ref) {
                            return {
                                name: ref.title,
                                value: ref._id
                            };
                        });
                    });
                    break;

                  default:
                    fieldDefinition.options && fieldDefinition.options.length ? templateOptions.options = fieldDefinition.options : templateOptions.options = _.map(fieldDefinition.allowedValues, function(val) {
                        return {
                            name: val,
                            value: val
                        };
                    });
                }
                if (fieldDefinition.attributes && _.keys(fieldDefinition.attributes).length && (newField.ngModelAttrs = _.reduce(fieldDefinition.attributes, function(results, attr, key) {
                    var customKey = "customAttr" + key;
                    return results[customKey] = {
                        attribute: key
                    }, templateOptions[customKey] = attr, results;
                }, {})), "custom" != fieldDefinition.directive) switch (fieldDefinition.type) {
                  case "boolean":
                    fieldDefinition.params && fieldDefinition.params.storeCopy ? newField.type = "terms" : newField.type = "checkbox";
                    break;

                  case "number":
                  case "float":
                  case "integer":
                  case "decimal":
                    templateOptions.type = "input", newField.ngModelAttrs || (newField.ngModelAttrs = {}), 
                    "integer" == fieldDefinition.type && (templateOptions.type = "number", templateOptions.baseDefaultValue = 0, 
                    newField.ngModelAttrs.customAttrpattern = {
                        attribute: "pattern"
                    }, newField.ngModelAttrs.customAttrinputmode = {
                        attribute: "inputmode"
                    }, templateOptions.customAttrpattern = "[0-9]*", templateOptions.customAttrinputmode = "numeric", 
                    fieldDefinition.params && (0 !== parseInt(fieldDefinition.params.maxValue) && (templateOptions.max = fieldDefinition.params.maxValue), 
                    0 !== parseInt(fieldDefinition.params.minValue) ? templateOptions.min = fieldDefinition.params.minValue : templateOptions.min = 0));
                }
                if (1 == fieldDefinition.maximum ? "reference" == fieldDefinition.type && "embedded" != fieldDefinition.directive ? fieldDefinition.defaultReferences && fieldDefinition.defaultReferences.length && ("search-select" == fieldDefinition.directive ? templateOptions.baseDefaultValue = fieldDefinition.defaultReferences[0] : templateOptions.baseDefaultValue = fieldDefinition.defaultReferences[0]._id) : fieldDefinition.defaultValues && fieldDefinition.defaultValues.length && ("number" == templateOptions.type ? templateOptions.baseDefaultValue = Number(fieldDefinition.defaultValues[0]) : templateOptions.baseDefaultValue = fieldDefinition.defaultValues[0]) : "reference" == fieldDefinition.type && "embedded" != fieldDefinition.directive ? fieldDefinition.defaultReferences && fieldDefinition.defaultReferences.length ? "search-select" == fieldDefinition.directive ? templateOptions.baseDefaultValue = fieldDefinition.defaultReferences : templateOptions.baseDefaultValue = _.map(fieldDefinition.defaultReferences, function(ref) {
                    return ref._id;
                }) : templateOptions.baseDefaultValue = [] : fieldDefinition.defaultValues && fieldDefinition.defaultValues.length && ("number" == templateOptions.type ? templateOptions.baseDefaultValue = _.map(fieldDefinition.defaultValues, function(val) {
                    return Number(val);
                }) : templateOptions.baseDefaultValue = fieldDefinition.defaultValues), newField.templateOptions = templateOptions, 
                newField.validators = {
                    validInput: function($viewValue, $modelValue, scope) {
                        var value = $modelValue || $viewValue;
                        if (!value) return !0;
                        var valid = FluroValidate.validate(value, fieldDefinition);
                        return valid;
                    }
                }, "embedded" == fieldDefinition.directive) {
                    if (newField.type = "embedded", 1 == fieldDefinition.maximum && 1 == fieldDefinition.minimum) templateOptions.baseDefaultValue = {
                        data: {}
                    }; else {
                        var askCount = 0;
                        fieldDefinition.askCount && (askCount = fieldDefinition.askCount), fieldDefinition.minimum && askCount < fieldDefinition.minimum && (askCount = fieldDefinition.minimum), 
                        fieldDefinition.maximum && askCount > fieldDefinition.maximum && (askCount = fieldDefinition.maximum);
                        var initialArray = [];
                        askCount && _.times(askCount, function() {
                            initialArray.push({});
                        }), templateOptions.baseDefaultValue = initialArray;
                    }
                    newField.data = {
                        fields: [],
                        dataFields: [],
                        replicatedFields: []
                    };
                    var fieldContainer = newField.data.fields, dataFieldContainer = newField.data.dataFields;
                    fieldDefinition.fields && fieldDefinition.fields.length && _.each(fieldDefinition.fields, function(sub) {
                        addFieldDefinition(fieldContainer, sub);
                    });
                    var promise = FluroContent.endpoint("defined/" + fieldDefinition.params.restrictType).get().$promise;
                    promise.then(function(embeddedDefinition) {
                        if (embeddedDefinition && embeddedDefinition.fields && embeddedDefinition.fields.length) {
                            var childFields = embeddedDefinition.fields;
                            fieldDefinition.params.excludeKeys && fieldDefinition.params.excludeKeys.length && (childFields = _.reject(childFields, function(f) {
                                return _.includes(fieldDefinition.params.excludeKeys, f.key);
                            })), _.each(childFields, function(sub) {
                                addFieldDefinition(dataFieldContainer, sub);
                            });
                        }
                    }), $scope.promises.push(promise);
                }
                if ("group" == fieldDefinition.type && fieldDefinition.fields && fieldDefinition.fields.length || fieldDefinition.asObject) {
                    var fieldContainer;
                    if (fieldDefinition.asObject) {
                        if (newField.type = "nested", fieldDefinition.key && 1 == fieldDefinition.maximum && 1 == fieldDefinition.minimum) templateOptions.baseDefaultValue = {}; else {
                            var askCount = 0;
                            fieldDefinition.askCount && (askCount = fieldDefinition.askCount), fieldDefinition.minimum && askCount < fieldDefinition.minimum && (askCount = fieldDefinition.minimum), 
                            fieldDefinition.maximum && askCount > fieldDefinition.maximum && (askCount = fieldDefinition.maximum);
                            var initialArray = [];
                            askCount && _.times(askCount, function() {
                                initialArray.push({});
                            }), templateOptions.baseDefaultValue = initialArray;
                        }
                        newField.data = {
                            fields: [],
                            replicatedFields: []
                        }, fieldContainer = newField.data.fields;
                    } else newField = {
                        fieldGroup: [],
                        className: fieldDefinition.className
                    }, fieldContainer = newField.fieldGroup;
                    _.each(fieldDefinition.fields, function(sub) {
                        addFieldDefinition(fieldContainer, sub);
                    });
                }
                if (fieldDefinition.expressions && _.keys(fieldDefinition.expressions).length) {
                    fieldDefinition.hideExpression && fieldDefinition.hideExpression.length && (fieldDefinition.expressions.hide = fieldDefinition.hideExpression);
                    var allExpressions = _.values(fieldDefinition.expressions).join("+");
                    newField.watcher = {
                        expression: function(field, scope) {
                            return $parse(allExpressions)(scope);
                        },
                        listener: function(field, newValue, oldValue, scope, stopWatching) {
                            scope.interaction || (scope.interaction = $scope.vm.model), _.each(fieldDefinition.expressions, function(expression, key) {
                                var retrievedValue = $parse(expression)(scope), fieldKey = field.key;
                                switch (key) {
                                  case "defaultValue":
                                    if (!field.formControl || !field.formControl.$dirty) return scope.model[fieldKey] = retrievedValue;
                                    break;

                                  case "value":
                                    return scope.model[fieldKey] = retrievedValue;

                                  case "required":
                                    return field.templateOptions.required = retrievedValue;

                                  case "hide":
                                    return field.hide = retrievedValue;
                                }
                            });
                        }
                    };
                }
                fieldDefinition.hideExpression && (newField.hideExpression = fieldDefinition.hideExpression), 
                newField.fieldGroup || (newField.defaultValue = angular.copy(templateOptions.baseDefaultValue)), 
                "pathlink" != newField.type && array.push(newField);
            }
        }
        if ($scope.model && "post" == $scope.model.parentType) {
            $scope.vm.defaultModel ? $scope.vm.model = angular.copy($scope.vm.defaultModel) : $scope.vm.model = {}, 
            $scope.vm.modelFields = [], $scope.vm.state = "ready", $scope.vm.onSubmit = submitPost, 
            $scope.promises = [], $scope.submitLabel = "Submit", $scope.model && $scope.model.data && $scope.model.data.submitLabel && $scope.model.data.submitLabel.length && ($scope.submitLabel = $scope.model.data.submitLabel);
            var interactionFormSettings = $scope.model.data;
            interactionFormSettings || (interactionFormSettings = {}), _.each($scope.model.fields, function(fieldDefinition) {
                addFieldDefinition($scope.vm.modelFields, fieldDefinition);
            });
        }
    }), $scope.$watch("vm.modelFields", function(fields) {
        $scope.errorList = getAllErrorFields(fields);
    }, !0);
}), app.directive("postThread", function(FluroContent) {
    return {
        restrict: "E",
        transclude: !0,
        scope: {
            definitionName: "=?type",
            host: "=?hostId",
            thread: "=?thread"
        },
        link: function($scope, $element, $attrs, $ctrl, $transclude) {
            $transclude($scope, function(clone, $scope) {
                $element.replaceWith(clone);
            });
        },
        controller: function($scope, $filter) {
            $scope.outer = $scope.$parent, $scope.thread || ($scope.thread = []), $scope.$watch("host + definitionName", function() {
                function postsLoaded(res) {
                    var allPosts = res;
                    $scope.thread = _.chain(res).map(function(post) {
                        return post.thread = _.filter(allPosts, function(sub) {
                            return sub.reply == post._id;
                        }), post.reply ? void 0 : post;
                    }).compact().value();
                }
                function postsError(res) {
                    $scope.thread = [];
                }
                var hostID = $scope.host, definitionName = $scope.definitionName;
                if (hostID && definitionName) {
                    var request = FluroContent.endpoint("post/" + hostID + "/" + definitionName).query().$promise;
                    request.then(postsLoaded, postsError);
                }
            });
        }
    };
}), app.run(function(formlyConfig, $templateCache) {
    formlyConfig.setType({
        name: "nested",
        templateUrl: "fluro-interaction-form/nested/fluro-nested.html",
        controller: "FluroInteractionNestedController"
    });
}), app.controller("FluroInteractionNestedController", function($scope) {
    function resetDefaultValue() {
        var defaultValue = angular.copy($scope.to.baseDefaultValue);
        $scope.model || console.log("NO RESET Reset Model Values", $scope.options.key, defaultValue), 
        $scope.model[$scope.options.key] = defaultValue;
    }
    var def = $scope.to.definition, minimum = def.minimum, maximum = def.maximum;
    $scope.$watch("model[options.key]", function(model) {
        model || (console.log("Reset Model cos no value!"), resetDefaultValue());
    }), $scope.$on("form-reset", resetDefaultValue), $scope.addAnother = function() {
        console.log("Add another"), $scope.model[$scope.options.key].push({});
    }, $scope.canRemove = function() {
        return minimum ? $scope.model[$scope.options.key].length > minimum ? !0 : void 0 : !0;
    }, $scope.canAdd = function() {
        return maximum ? $scope.model[$scope.options.key].length < maximum ? !0 : void 0 : !0;
    }, $scope.copyFields = function() {
        var copiedFields = angular.copy($scope.options.data.fields);
        return $scope.options.data.replicatedFields.push(copiedFields), copiedFields;
    }, $scope.copyDataFields = function() {
        var copiedFields = angular.copy($scope.options.data.dataFields);
        return $scope.options.data.replicatedFields.push(copiedFields), copiedFields;
    };
}), app.run(function(formlyConfig, $templateCache) {
    formlyConfig.setType({
        name: "search-select",
        templateUrl: "fluro-interaction-form/search-select/fluro-search-select.html",
        controller: "FluroSearchSelectController",
        wrapper: [ "bootstrapLabel", "bootstrapHasError" ]
    });
}), app.controller("FluroSearchSelectController", function($scope, $http, Fluro, $filter, FluroValidate) {
    function setModel() {
        $scope.multiple ? $scope.model[opts.key] = angular.copy($scope.selection.values) : $scope.model[opts.key] = angular.copy($scope.selection.value), 
        $scope.fc && $scope.fc.$setTouched(), checkValidity();
    }
    function checkValidity() {
        var validRequired, validInput = FluroValidate.validate($scope.model[$scope.options.key], definition);
        $scope.multiple ? $scope.to.required && (validRequired = _.isArray($scope.model[opts.key]) && $scope.model[opts.key].length > 0) : $scope.to.required && $scope.model[opts.key] && (validRequired = !0), 
        $scope.fc && ($scope.fc.$setValidity("required", validRequired), $scope.fc.$setValidity("validInput", validInput));
    }
    $scope.search = {}, $scope.proposed = {};
    var opts = ($scope.to, $scope.options);
    $scope.selection = {};
    var definition = $scope.to.definition;
    definition.params || (definition.params = {});
    var restrictType = definition.params.restrictType, searchLimit = definition.params.searchLimit;
    searchLimit || (searchLimit = 10);
    var minimum = definition.minimum, maximum = definition.maximum;
    if (minimum || (minimum = 0), maximum || (maximim = 0), $scope.multiple = 1 != maximum, 
    $scope.multiple ? $scope.model[opts.key] && _.isArray($scope.model[opts.key]) && ($scope.selection.values = angular.copy($scope.model[opts.key])) : $scope.model[opts.key] && ($scope.selection.value = $scope.model[opts.key]), 
    $scope.canAddMore = function() {
        return maximum ? $scope.multiple ? $scope.selection.values.length < maximum : $scope.selection.value ? void 0 : !0 : !0;
    }, $scope.contains = function(value) {
        return $scope.multiple ? _.includes($scope.selection.values, value) : $scope.selection.value == value;
    }, $scope.$watch("model", function(newModelValue, oldModelValue) {
        if (newModelValue != oldModelValue) {
            var modelValue;
            _.keys(newModelValue).length && (modelValue = newModelValue[opts.key], $scope.multiple ? modelValue && _.isArray(modelValue) ? $scope.selection.values = angular.copy(modelValue) : $scope.selection.values = [] : $scope.selection.value = angular.copy(modelValue));
        }
    }, !0), opts.expressionProperties && opts.expressionProperties["templateOptions.required"] && $scope.$watch(function() {
        return $scope.to.required;
    }, function(newValue) {
        checkValidity();
    }), $scope.to.required) var unwatchFormControl = $scope.$watch("fc", function(newValue) {
        newValue && (checkValidity(), unwatchFormControl());
    });
    $scope.select = function(value) {
        if ($scope.multiple) {
            if (!$scope.canAddMore()) return;
            $scope.selection.values.push(value);
        } else $scope.selection.value = value;
        $scope.proposed = {}, setModel();
    }, $scope.retrieveReferenceOptions = function(val) {
        var searchUrl = Fluro.apiURL + "/content";
        return restrictType && (searchUrl += "/" + restrictType), searchUrl += "/search", 
        $http.get(searchUrl + "/" + val, {
            ignoreLoadingBar: !0,
            params: {
                limit: searchLimit
            }
        }).then(function(response) {
            var results = response.data;
            return _.reduce(results, function(filtered, item) {
                var exists = _.some($scope.selection.values, {
                    _id: item._id
                });
                return exists || filtered.push(item), filtered;
            }, []);
        });
    }, $scope.getValueLabel = function(value) {
        if (definition.options && definition.options.length) {
            var match = _.find(definition.options, {
                value: value
            });
            if (match && match.name) return match.name;
        }
        return value;
    }, $scope.retrieveValueOptions = function(val) {
        if (definition.options && definition.options.length) {
            var options = _.reduce(definition.options, function(results, item) {
                var exists;
                return exists = $scope.multiple ? _.includes($scope.selection.values, item.value) : $scope.selection.value == item.value, 
                exists || results.push({
                    name: item.name,
                    value: item.value
                }), results;
            }, []);
            return $filter("filter")(options, val);
        }
        if (definition.allowedValues && definition.allowedValues.length) {
            var options = _.reduce(definition.allowedValues, function(results, allowedValue) {
                var exists;
                return exists = $scope.multiple ? _.includes($scope.selection.values, allowedValue) : $scope.selection.value == allowedValue, 
                exists || results.push({
                    name: allowedValue,
                    value: allowedValue
                }), results;
            }, []);
            return console.log("Options", options), $filter("filter")(options, val);
        }
    }, $scope.deselect = function(value) {
        $scope.multiple ? _.pull($scope.selection.values, value) : delete $scope.selection.value, 
        setModel();
    }, $scope.toggle = function(reference) {
        $scope.contains(reference) ? $scope.deselect(reference) : $scope.select(reference);
    };
}), app.run(function(formlyConfig, $templateCache) {
    formlyConfig.setType({
        name: "value",
        templateUrl: "fluro-interaction-form/value/value.html",
        wrapper: [ "bootstrapHasError" ]
    });
}), app.service("NotificationService", function($timeout) {
    var controller = {
        messages: []
    };
    return controller.lastMessage = function() {
        return _.last(controller.messages);
    }, controller.message = function(string, style, duration) {
        style || (style = "info"), duration || (duration = 3e3);
        var message = {
            text: string,
            style: style,
            duration: duration
        };
        controller.messages.push(message), $timeout(function() {
            _.pull(controller.messages, message);
        }, message.duration);
    }, controller;
}), app.directive("preloadImage", function() {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            scope.aspect = angular.isDefined(attrs.aspect) ? scope.$parent.$eval(attrs.aspect) : 0, 
            scope.aspect ? element.wrap('<div class="preload-image-outer aspect-ratio" style="padding-bottom:' + scope.aspect + '%"></div>') : element.wrap('<div class="preload-image-outer"></div>');
            var preloader = angular.element('<span class="image-preloader"><i class="fa fa-spinner fa-spin"/></span>');
            element.on("load", function() {
                element.removeClass("preload-hide"), element.addClass("preload-show"), preloader.remove();
            }), element.on("error", function() {
                preloader.remove();
            }), scope.$watch("ngSrc", function() {
                element.addClass("preload-hide"), element.parent().append(preloader);
            });
        }
    };
}), app.directive("fluroPreloader", function() {
    return {
        restrict: "E",
        replace: !0,
        scope: {},
        templateUrl: "fluro-preloader/fluro-preloader.html",
        controller: "FluroPreloaderController",
        link: function(scope, element, attrs) {}
    };
}), app.controller("FluroPreloaderController", function($scope, $state, $rootScope, $timeout) {
    function hidePreloader(event, toState, toParams, fromState, fromParams, error) {
        preloadTimer && ($timeout.cancel(preloadTimer), preloadTimer = null), "loading" == $scope.preloader["class"] && $timeout(function() {
            $scope.preloader["class"] = "loaded";
        }, 600);
    }
    var preloadTimer;
    $scope.preloader = {
        "class": "reset"
    }, console.log("yep im here"), $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams, error) {
        $scope.preloader["class"] = "reset", preloadTimer = $timeout(function() {
            $scope.preloader["class"] = "loading";
        });
    }), $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
        preloadTimer && ($timeout.cancel(preloadTimer), preloadTimer = null), $scope.preloader["class"] = "reset";
    }), $rootScope.$on("$preloaderHide", hidePreloader), $rootScope.$on("$stateChangeSuccess", hidePreloader);
}), app.directive("scrollActive", function($compile, $timeout, $window, FluroScrollService) {
    return {
        restrict: "A",
        link: function($scope, $element, $attrs) {
            function setScrollContext(context) {
                currentContext != context && (currentContext = context, $timeout(function() {
                    switch (context) {
                      case "active":
                        $element.removeClass("scroll-after"), $element.removeClass("scroll-before"), $element.addClass("scroll-active"), 
                        $scope.scrollActive = !0, $scope.scrollBefore = !1, $scope.scrollAfter = !1, onActive && onActive();
                        break;

                      case "before":
                        $element.removeClass("scroll-after"), $element.addClass("scroll-before"), $element.removeClass("scroll-active"), 
                        $scope.scrollActive = !1, $scope.scrollBefore = !0, $scope.scrollAfter = !1, onBefore && onBefore();
                        break;

                      case "after":
                        $element.addClass("scroll-after"), $element.removeClass("scroll-before"), $element.removeClass("scroll-active"), 
                        $scope.scrollActive = !1, $scope.scrollBefore = !1, $scope.scrollAfter = !0, onAfter && onAfter();
                    }
                }));
            }
            function updateParentScroll() {
                var viewportHeight = (parent.scrollTop(), parent.height()), contentHeight = parent.get(0).scrollHeight, maxScroll = contentHeight - viewportHeight, startView = 0, endView = startView + viewportHeight, halfView = endView - viewportHeight / 2, elementHeight = $element.outerHeight(), elementStart = $element.position().top, elementEnd = elementStart + elementHeight, elementHalf = elementStart + elementHeight / 4;
                if (onAnchor) {
                    var start = parseInt(startView), rangeStart = parseInt(elementStart), rangeEnd = parseInt(elementHalf);
                    console.log(rangeStart, start, rangeEnd), start >= rangeStart && rangeEnd > start ? anchored || (anchored = !0, 
                    anchored && onAnchor()) : anchored = !1;
                }
                var entirelyViewable = elementStart >= startView && endView >= elementEnd;
                return setScrollContext(entirelyViewable ? "active" : halfView >= elementEnd ? "after" : halfView >= elementStart ? "active" : startView >= maxScroll - 200 ? "active" : "before");
            }
            function updateFromMainScroll(scrollValue) {
                var windowHeight = $window.innerHeight, documentHeight = body.height(), maxScroll = documentHeight - windowHeight, startView = scrollValue;
                startView || (startView = 0);
                var endView = startView + windowHeight, halfView = endView - windowHeight / 2, elementHeight = $element.outerHeight(), elementStart = $element.offset().top, elementEnd = elementStart + elementHeight, elementHalf = elementStart + elementHeight / 4;
                if (onAnchor) {
                    var start = parseInt(startView), rangeStart = parseInt(elementStart), rangeEnd = parseInt(elementHalf);
                    console.log(rangeStart, start, rangeEnd), start >= rangeStart && rangeEnd > start ? anchored || (anchored = !0, 
                    anchored && onAnchor()) : anchored = !1;
                }
                var entirelyViewable = elementStart >= startView && endView >= elementEnd;
                return setScrollContext(entirelyViewable ? "active" : halfView >= elementEnd ? "after" : halfView >= elementStart ? "active" : startView >= maxScroll - 200 ? "active" : "before");
            }
            var onActive, onBefore, onAfter, onAnchor, anchored, currentContext = "";
            $attrs.onActive && (onActive = function() {
                $scope.$eval($attrs.onActive);
            }), $attrs.onAnchor && (onAnchor = function() {
                $scope.$eval($attrs.onAnchor);
            }), $attrs.onAfter && (onAfter = function() {
                $scope.$eval($attrs.onAfter);
            }), $attrs.onBefore && (onBefore = function() {
                $scope.$eval($attrs.onBefore);
            });
            var parent = $element.closest("[scroll-active-parent]"), body = angular.element("body");
            parent.length ? (parent.bind("scroll", updateParentScroll), $timeout(updateParentScroll, 10)) : ($scope.$watch(function() {
                return FluroScrollService.getScroll();
            }, updateFromMainScroll), $timeout(updateFromMainScroll, 10));
        }
    };
}), app.service("FluroScrollService", function($window, $location, $timeout) {
    function updateScroll() {
        var v = this.pageYOffset;
        _value != this.pageYOffset && (_value > v ? controller.direction = "up" : controller.direction = "down", 
        $timeout(function() {
            _value = this.pageYOffset;
        }));
    }
    var controller = {};
    controller.cache = {}, controller.direction = "down";
    var _value = 0;
    angular.element("html,body");
    return controller.setAnchor = function(id) {
        $location.hash("jump-to-" + id);
    }, controller.getAnchor = function() {
        var hash = $location.hash();
        return _.startsWith(hash, "jump-to-") ? hash.substring(8) : hash;
    }, controller.scrollToID = controller.scrollToId = function(id, speed, selector, offset) {
        0 == speed || speed || (speed = "fast");
        var $target = angular.element("#" + id);
        if ($target && $target.offset && $target.offset()) {
            selector || (selector = "body,html");
            var pos = $target.offset().top;
            offset && (pos += Number(offset)), angular.element(selector).animate({
                scrollTop: pos
            }, speed);
        }
    }, controller.scrollToPosition = controller.scrollTo = function(pos, speed, selector, offset) {
        0 == speed || speed || (speed = "fast"), selector || (selector = "body,html"), offset && (pos += Number(offset)), 
        angular.element(selector).animate({
            scrollTop: pos
        }, speed);
    }, controller.get = controller.getScroll = function() {
        return _value;
    }, controller.getMax = function(selector) {
        selector || (selector = "body,html");
        var bodyHeight = angular.element(selector).height(), windowHeight = $window.innerHeight;
        return bodyHeight - windowHeight;
    }, controller.getHalfPoint = function() {
        return $window.innerHeight / 2;
    }, controller.getWindowHeight = function() {
        return $window.innerHeight;
    }, angular.element($window).bind("scroll", updateScroll), updateScroll(), controller;
}), app.service("FluroSEOService", function($rootScope, $location) {
    var controller = {};
    return $rootScope.$watch(function() {
        return controller.siteTitle + " | " + controller.pageTitle;
    }, function() {
        controller.headTitle = "", controller.siteTitle && controller.siteTitle.length ? (controller.headTitle += controller.siteTitle, 
        controller.pageTitle && controller.pageTitle.length && (controller.headTitle += " | " + controller.pageTitle)) : controller.pageTitle && controller.pageTitle.length && (controller.headTitle = controller.pageTitle);
    }), controller.getImageURL = function() {
        var url = controller.defaultImageURL;
        return controller.imageURL && controller.imageURL.length && (url = controller.imageURL), 
        url;
    }, controller.getDescription = function() {
        var description = controller.defaultDescription;
        return controller.description && (description = controller.description), description && description.length ? description : "";
    }, $rootScope.$on("$stateChangeSuccess", function() {
        controller.url = $location.$$absUrl;
    }), $rootScope.$on("$stateChangeStart", function() {
        controller.description = null, controller.imageURL = null, console.log("REset SEO");
    }), controller;
}), app.controller("UserLoginController", function($scope, $http, FluroTokenService, NotificationService) {
    $scope.credentials = {}, $scope.status = "ready", $scope.signup = function(options) {
        $scope.status = "processing";
        var request = FluroTokenService.signup($scope.credentials, options);
        request.then(function(res) {
            $scope.status = "ready", NotificationService.message("Hi " + res.data.firstName);
        }, function(res) {
            $scope.status = "ready", NotificationService.message(String(res.data), "danger");
        });
    }, $scope.login = function(options) {
        $scope.status = "processing";
        var request = FluroTokenService.login($scope.credentials, options);
        request.then(function(res) {
            $scope.status = "ready", NotificationService.message("Welcome back " + res.data.firstName);
        }, function(res) {
            $scope.status = "ready", console.log("FAILED", res), NotificationService.message(String(res.data), "danger");
        });
    };
}), app.directive("hamburger", function() {
    return {
        restrict: "E",
        replace: !0,
        template: '<div class="hamburger"> 		  <span></span> 		  <span></span> 		  <span></span> 		  <span></span> 		</div>',
        link: function($scope, $elem, $attr) {}
    };
}), app.directive("compileHtml", function($compile) {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            scope.$watch(function() {
                return scope.$eval(attrs.compileHtml);
            }, function(value) {
                element.html(value), $compile(element.contents())(scope);
            });
        }
    };
}), app.directive("infinitePager", function($timeout, $sessionStorage) {
    return {
        restrict: "A",
        link: function($scope, $element, $attr) {
            var perPage = 16;
            $attr.perPage && (perPage = parseInt($attr.perPage)), $scope.pager = {
                currentPage: 0,
                limit: perPage
            }, $scope.pages = [], $scope.$watch($attr.items, function(items) {
                $scope.allItems = items, $scope.allItems && ($scope.pages.length = 0, $scope.pager.currentPage = 0, 
                $scope.totalPages = Math.ceil($scope.allItems.length / $scope.pager.limit) - 1, 
                $scope.updateCurrentPage());
            }), $scope.updateCurrentPage = function() {
                $scope.allItems.length < $scope.pager.limit * ($scope.pager.currentPage - 1) && ($scope.pager.currentPage = 0);
                var start = $scope.pager.currentPage * $scope.pager.limit, end = start + $scope.pager.limit, sliced = _.slice($scope.allItems, start, end);
                $scope.pages.push(sliced);
            };
            var timer;
            $scope.nextPage = function() {
                $scope.pager.currentPage < $scope.totalPages ? ($timeout.cancel(timer), timer = $timeout(function() {
                    $scope.pager.currentPage = $scope.pager.currentPage + 1, $scope.updateCurrentPage();
                })) : $scope.updateCurrentPage();
            };
        }
    };
}), app.filter("capitalise", function() {
    return function(str) {
        return _.upperCase(str);
    };
}), app.filter("commaSummary", function() {
    return function(arrayOfObjects, limit, delimiter) {
        limit || (limit = 20), delimiter && delimiter.length || (delimiter = ", ");
        var names = _.chain(arrayOfObjects).map(function(object) {
            return object.title;
        }).compact().value(), string = names.join(delimiter);
        return string.length >= limit && (string = string.substr(0, limit) + "..."), string;
    };
}), app.filter("maplink", function() {
    return function(location) {
        var pieces = [];
        location.title && location.title.length && pieces.push(location.title), location.addressLine1 && location.addressLine1.length && pieces.push(location.addressLine1), 
        location.addressLine2 && location.addressLine2.length && pieces.push(location.addressLine2), 
        location.state && location.state.length && pieces.push(location.state), location.suburb && location.suburb.length && pieces.push(location.suburb), 
        location.postalCode && location.postalCode.length && pieces.push(location.postalCode);
        var url = "https://www.google.com/maps/place/" + pieces.join("+");
        return url;
    };
}), app.filter("readableDate", function() {
    return function(event, style) {
        if (event.startDate) {
            var startDate = new Date(event.startDate), endDate = new Date(event.endDate), noEndDate = startDate.format("g:ia j M Y") == endDate.format("g:ia j M Y"), sameYear = startDate.format("Y") == endDate.format("Y"), sameMonth = startDate.format("M Y") == endDate.format("M Y"), sameDay = startDate.format("j M Y") == endDate.format("j M Y");
            switch (style) {
              case "short":
                return noEndDate ? startDate.format("j M") : sameDay ? startDate.format("j M") : sameMonth ? startDate.format("j") + " - " + endDate.format("j M") : sameYear ? startDate.format("j") + " - " + endDate.format("j M") : startDate.format("j M Y") + " - " + endDate.format("j M Y");

              default:
                return noEndDate ? startDate.format("g:ia l j M Y") : sameDay ? startDate.format("g:ia") + " - " + endDate.format("g:ia l j M Y") : sameMonth ? startDate.format("j") + " - " + endDate.format("j M Y") : sameYear ? startDate.format("j M") + " - " + endDate.format("j M Y") : startDate.format("j M Y") + " - " + endDate.format("j M Y");
            }
        }
    };
}), app.filter("timeago", function() {
    return function(date) {
        return moment(date).fromNow();
    };
}), app.controller("ChecklistController", function($scope, FluroContent, $filter, NotificationService, $localStorage, event, contacts, $analytics) {
    function submitNotes() {
        NotificationService.message("Submitting notes", "info"), _.forEach(contacts, function(contact) {
            if (contact.eventNote) {
                var post = {
                    parent: contact._id,
                    data: {
                        body: contact.eventNote
                    },
                    _type: "post",
                    definition: "note",
                    realms: contact.realms,
                    title: "Event Note from " + $scope.event.title
                };
                console.log("post", post);
                FluroContent.endpoint("content/note").save(post).$promise.then(function(res) {
                    $analytics.eventTrack("Pastoral note success", {
                        category: "Contact",
                        label: contact.firstName + " " + contact.lastName,
                        value: 1
                    });
                }, function(err) {
                    $analytics.eventTrack("Pastoral note failed", {
                        category: "Contact",
                        label: "Pastoral Note submit fail",
                        value: 1
                    }), console.log(err);
                });
            }
        });
    }
    function updateSearchOptions() {
        var filteredContacts = contacts;
        $scope.search.terms && $scope.search.terms.length && (filteredContacts = $filter("filter")(filteredContacts, $scope.search.terms)), 
        $scope.search.realms && (filteredContacts = _.filter(filteredContacts, function(contact) {
            var selectedRealmID = $scope.search.realms;
            return _.some(contact.realms, {
                _id: selectedRealmID
            });
        })), $scope.search.tags && (filteredContacts = _.filter(filteredContacts, function(contact) {
            var selectedTagID = $scope.search.tags;
            return _.some(contact.tags, {
                _id: selectedTagID
            });
        })), $scope.search.contactstatus && (filteredContacts = _.filter(filteredContacts, function(contact) {
            var selectedStatusID = $scope.search.contactstatus;
            return contact.status == selectedStatusID;
        })), $scope.search.groups && (filteredContacts = _.filter(filteredContacts, function(contact) {
            var selectedGroupID = $scope.search.groups;
            return _.some(contact.teams, {
                _id: selectedGroupID
            });
        })), $scope.tags = _.chain(filteredContacts).map(function(contact) {
            return contact.tags.length ? contact.tags : void 0;
        }).flatten().compact().uniqBy(function(tag) {
            return tag.title;
        }).value(), $scope.status = _.chain(filteredContacts).map(function(contact) {
            return contact.status ? contact.status : void 0;
        }).flatten().compact().uniqBy(function(status) {
            return status;
        }).value(), $scope.realms = _.chain(filteredContacts).map(function(contact) {
            return contact.realms.length ? contact.realms : void 0;
        }).flatten().compact().uniqBy(function(realm) {
            return realm._id;
        }).value(), $scope.groups = _.chain(filteredContacts).map(function(contact) {
            return contact.teams;
        }).flatten().compact().uniqBy(function(team) {
            return team._id;
        }).reduce(function(results, team) {
            var definition = "Generic";
            team.definition && (definition = team.definition.charAt(0).toUpperCase() + team.definition.slice(1));
            var existing = _.find(results, {
                definition: definition
            });
            return existing || (existing = {
                title: definition,
                definition: definition,
                groups: []
            }, results.push(existing)), existing.groups.push(team), results;
        }, []).value(), console.log("groups", $scope.groups), $scope.filteredContacts = _.orderBy(filteredContacts, function(contact) {
            return contact.lastName;
        }), $scope.filteredContacts.length < $scope.pager.itemsPerPage && (console.log("set current"), 
        $scope.pager.current = 1);
    }
    $scope.event = event, $scope.availableNotes = !1, $localStorage.checklistSearch ? $scope.search = $localStorage.checklistSearch : $scope.search = $localStorage.checklistSearch = {
        terms: ""
    }, $scope.search.contactstatus = "active", $scope.report = {
        items: []
    }, $scope.selected = function(item) {
        return _.includes($scope.report.items, item._id);
    }, $scope.select = function(item) {
        return $scope.isCheckedIn(item) ? void 0 : $scope.report.items.push(item._id);
    }, $scope.deselect = function(item) {
        return _.pull($scope.report.items, item._id);
    }, $scope.toggle = function(item) {
        $scope.selected(item) ? $scope.deselect(item) : $scope.select(item);
    }, $scope.toggleNotes = function(item) {
        item.shownotes ? item.shownotes = !1 : ($scope.availableNotes = !0, item.shownotes = !0);
    }, $scope.reset = function() {
        $scope.report = {
            items: []
        };
    }, $scope.isCheckedIn = function(contact) {
        return _.some($scope.checkins, function(checkin) {
            return checkin.contact._id == contact._id;
        });
    }, $scope.$watch("event._id", function(eventID) {
        $scope.refreshCurrentCheckins();
    }), $scope.refreshCurrentCheckins = function() {
        function success(res) {
            $scope.checkins = res;
        }
        function fail(res) {
            console.log("the request didnt work", res);
        }
        if (!$scope.event) return console.log("No event to refresh");
        var eventId = $scope.event._id;
        FluroContent.endpoint("checkin/event/" + eventId, !0, !0).query({
            all: !0
        }).$promise.then(success, fail);
    }, $scope.submitReport = function() {
        function finished(err) {
            return err ? NotificationService.message("Error saving checkins!", "danger") : ($scope.refreshCurrentCheckins(), 
            $scope.reset(), NotificationService.message("Checkins saved", "success"), void $analytics.eventTrack("submit multiple checkins success", {
                category: "Contact",
                label: "Multiple Checkins Succeeded",
                value: successCount
            }));
        }
        submitNotes();
        var eventId = $scope.event._id, items = $scope.report.items, successCount = 0;
        NotificationService.message("Submitting checkins", "info"), async.each(items, function(_id, next) {
            function success(res) {
                return $analytics.eventTrack("checkin success", {
                    category: "Contact",
                    label: res.firstName + " " + res.lastName,
                    value: 1
                }), successCount += 1, next();
            }
            function fail(err) {
                return $analytics.eventTrack("checkin failed", {
                    category: "Contact",
                    label: "Checkin submit fail",
                    value: 1
                }), next(err);
            }
            FluroContent.endpoint("checkin/" + eventId).save({
                contact: _id
            }).$promise.then(success, fail);
        }, finished);
    }, $scope.$watch(contacts, updateSearchOptions), $scope.$watch("search", updateSearchOptions, !0), 
    $scope.toggleFilter = function(key, value) {
        return $scope.search[key] == value ? delete $scope.search[key] : void ($scope.search[key] = value);
    }, $scope.pager = {
        current: 1,
        itemsPerPage: 50,
        items: []
    }, $scope.$watch("filteredContacts + pager.current", function() {
        console.log("filtered contacts is", $scope.filteredContacts.length), $scope.pager.total = $scope.filteredContacts.length;
        var start = ($scope.pager.current - 1) * $scope.pager.itemsPerPage, end = start + $scope.pager.itemsPerPage;
        $scope.pager.pages = Math.ceil($scope.filteredContacts.length / $scope.pager.itemsPerPage), 
        $scope.pager.items = $scope.filteredContacts.slice(start, end);
    });
}), app.controller("ViewContentController", function($scope, item, definition) {
    $scope.definition = definition, $scope.item = item;
}), app.controller("EventsController", function($scope, events, $localStorage, $filter) {
    function updateFilters() {
        var filteredItems = events;
        $scope.search.terms && $scope.search.terms.length && (filteredItems = $filter("filter")(filteredItems, $scope.search.terms)), 
        $scope.search.filters && ($scope.search.filters.realms && $scope.search.filters.realms.length && (filteredItems = _.filter(filteredItems, function(item) {
            return _.some(item.realms, function(realm) {
                return realm._id == $scope.search.filters.realms;
            });
        })), $scope.search.filters.tags && $scope.search.filters.tags.length && (filteredItems = _.filter(filteredItems, function(item) {
            return _.some(item.tags, function(tag) {
                return tag._id == $scope.search.filters.tags;
            });
        }))), $scope.filteredItems = filteredItems, $scope.dates = _.chain(filteredItems).orderBy(function(event) {
            var date = new Date(event.startDate);
            return date.getTime();
        }).reverse().reduce(function(results, event) {
            var date = new Date(event.startDate);
            date.setHours(0, 0, 0, 0);
            var dateKey = date.format("j M Y"), existing = _.find(results, {
                dateKey: dateKey
            });
            existing || (existing = {
                dateKey: dateKey,
                date: date,
                times: []
            }, results.push(existing));
            var time = new Date(event.startDate).format("g:ia"), existingTimeRow = _.find(existing.times, {
                time: time
            });
            return existingTimeRow || (existingTimeRow = {
                time: time,
                events: []
            }, existing.times.push(existingTimeRow)), existingTimeRow.events.push(event), results;
        }, []).value();
    }
    $scope.events = events, $localStorage.eventSearch ? $scope.search = $localStorage.eventSearch : $scope.search = $localStorage.eventSearch = {}, 
    $scope.$watch("search.filters.tags + search.filters.realms + search.terms", updateFilters), 
    updateFilters(), $scope.realms = _.chain(events).map(function(song) {
        return song.realms;
    }).flatten().compact().uniqBy(function(realm) {
        return realm._id;
    }).orderBy(function(item) {
        return item.title;
    }).value(), $scope.tags = _.chain(events).map(function(song) {
        return song.tags;
    }).flatten().compact().uniqBy(function(tag) {
        return tag._id;
    }).orderBy(function(item) {
        return item.title;
    }).value(), $scope.openModalCreateEvent = function() {
        var modalInstance = $uibModal.open({
            animation: !0,
            component: "modalCreateEvent",
            size: "lg",
            keyboard: !1,
            backdrop: "static",
            resolve: {}
        });
        modalInstance.result.then(function(event) {
            if (event) {
                var eventDefinition = "event";
                eventDefinition.definition && (eventDefinition = eventDefinition.definition), $state.go("upload", {
                    id: event._id,
                    definition: eventDefinition
                });
            }
        }, function() {
            $log.info("modal-component dismissed at: " + new Date());
        });
    };
}), app.controller("CreateContactController", function($scope, $stateParams, FluroContent, $analytics) {
    function newContact() {
        return {
            emails: [],
            phoneNumbers: [],
            realms: [ $stateParams.realm ]
        };
    }
    $scope.returnTo = $stateParams.returnTo, $scope.settings = {}, $scope.contact = newContact(), 
    $scope.submitForm = function() {
        function success(res) {
            $scope.contact = newContact(), console.log("Contact saved", res), $scope.settings.state = "success", 
            $scope.settings.result = res, $analytics.eventTrack("contact created", {
                category: "Contact",
                label: res.title,
                value: 1
            });
        }
        function fail(res) {
            console.log("Contact failed to save", res), $scope.settings.state = "failed";
        }
        $scope.settings.state = "processing";
        FluroContent.resource("contact").save($scope.contact).$promise.then(success, fail);
    };
}), app.service("NotificationService", function($timeout) {
    var controller = {
        messages: []
    };
    return controller.lastMessage = function() {
        return _.last(controller.messages);
    }, controller.message = function(string, style, duration) {
        style || (style = "info"), duration || (duration = 3e3);
        var message = {
            text: string,
            style: style,
            duration: duration
        };
        controller.messages.push(message), console.log("message", controller.messages), 
        $timeout(function() {
            _.pull(controller.messages, message);
        }, message.duration);
    }, controller.dismiss = function() {
        controller.messages = [];
    }, controller;
}), angular.module("fluro").run([ "$templateCache", function($templateCache) {
    "use strict";
    $templateCache.put("accordion/accordion.html", '<div class=accordion ng-class={expanded:settings.expanded}><div class=accordion-title ng-click="settings.expanded = !settings.expanded"><div class=container-fluid><div class=text-wrap><h3 class=title><i class="fa fa-angle-right pull-right" ng-class="{\'fa-rotate-90\':settings.expanded}"></i> <span ng-transclude=title></span></h3></div></div></div><div class=accordion-body><div ng-class="{\'container\':wide, \'container-fluid\':!wide}"><div ng-class="{\'text-wrap\':!wide}" ng-transclude=body></div></div></div></div>'), 
    $templateCache.put("admin-date-select/admin-date-select.html", '<div class=dateselect ng-class={open:settings.open}><div class=btn-group><a class="btn btn-default" ng-class={active:settings.open} ng-click="settings.open = !settings.open"><i class="fa fa-calendar"></i> <span ng-bind-html="readable | trusted"></span></a></div><dpiv class=popup><div class=datetime><div uib-datepicker class=datepicker datepicker-options=datePickerOptions ng-model=settings.dateModel></div></div></dpiv></div>'), 
    $templateCache.put("extended-field-render/extended-field-render.html", '<div class="extended-field-render form-group"><label ng-if="field.type != \'group\'">{{field.title}}</label><div field-transclude></div></div>'), 
    $templateCache.put("extended-field-render/field-types/multiple-value.html", '<div ng-switch=field.type><div class=content-select ng-switch-when=reference><div class="content-list list-group"><div class="list-group-item clearfix" ng-repeat="item in model[field.key]"><a ui-sref=viewContent({id:item._id})><div class=pull-left><img ng-if="item._type == \'image\'" ng-src="{{$root.getThumbnailUrl(item._id)}}"> <i ng-if="item._type != \'image\'" class="fa fa-{{item._type}}"></i> <i ng-if="item.definition == \'song\'" class="fa fa-music" style=padding-right:10px></i> <span>{{item.title}}</span></div></a><div class="actions pull-right btn-group"><a class="btn btn-tiny btn-xs" ng-if="item.assetType == \'upload\'" target=_blank ng-href={{$root.getDownloadUrl(item._id)}}><i class="fa fa-download"></i></a> <a class="btn btn-tiny btn-xs" ng-if=canEdit(item) ng-click=editInModal(item)><i class="fa fa-edit"></i></a></div></div></div></div><div ng-switch-default><ul><li ng-repeat="value in model[field.key]">{{value}}</li></ul></div></div>'), 
    $templateCache.put("extended-field-render/field-types/value.html", '<div ng-switch=field.type><div class=content-select ng-switch-when=reference><div class="content-list list-group"><div class="list-group-item clearfix" ng-init="item = model[field.key]"><a ui-sref=viewContent({id:item._id})><div class=pull-left><img ng-if="item._type == \'image\'" ng-src="{{$root.getThumbnailUrl(item._id)}}"> <i ng-if="item._type != \'image\'" class="fa fa-{{item._type}}"></i> <span>{{item.title}}</span></div></a><div class="actions pull-right btn-group"><a class="btn btn-tiny btn-xs" ng-if="item.assetType == \'upload\'" target=_blank ng-href={{$root.getDownloadUrl(item._id)}}><i class="fa fa-download"></i></a></div></div></div></div><div ng-switch-when=date>{{model[field.key] | formatDate:\'j M Y\'}}</div><div ng-switch-when=image><img ng-src="{{$root.asset.imageUrl(item._id)}}"></div><div ng-switch-default><div ng-bind-html="model[field.key] | trusted"></div></div></div>'), 
    $templateCache.put("fluro-interaction-form/button-select/fluro-button-select.html", '<div id={{options.id}} class="button-select {{to.definition.directive}}-buttons" ng-model=model[options.key]><a ng-repeat="(key, option) in to.options" ng-class={active:contains(option.value)} class="btn btn-default" id="{{id + \'_\'+ $index}}" ng-click=toggle(option.value)><span>{{option.name}}</span><i class="fa fa-check"></i></a></div>'), 
    $templateCache.put("fluro-interaction-form/custom.html", "<div ng-model=model[options.key] compile-html=to.definition.template></div>"), 
    $templateCache.put("fluro-interaction-form/date-select/fluro-date-select.html", '<div ng-controller=FluroDateSelectController><div class=input-group><input class=form-control datepicker-popup={{format}} ng-model=model[options.key] is-open=opened min-date=to.minDate max-date=to.maxDate datepicker-options=dateOptions date-disabled="disabled(date, mode)" ng-required=to.required close-text="Close"> <span class=input-group-btn><button type=button class="btn btn-default" ng-click=open($event)><i class="fa fa-calendar"></i></button></span></div></div>'), 
    $templateCache.put("fluro-interaction-form/dob-select/fluro-dob-select.html", "<div class=fluro-interaction-dob-select><dob-select ng-model=model[options.key] hide-age=to.params.hideAge hide-dates=to.params.hideDates></dob-select></div>"), 
    $templateCache.put("fluro-interaction-form/embedded/fluro-embedded.html", '<div class=fluro-embedded-form><div class=form-multi-group ng-if="to.definition.maximum != 1"><div class="panel panel-default" ng-init="fields = copyFields(); dataFields = copyDataFields(); " ng-repeat="entry in model[options.key] track by $index"><div class="panel-heading clearfix"><a ng-if=canRemove() class="btn btn-danger btn-sm pull-right" ng-click="model[options.key].splice($index, 1)"><span>Remove {{to.label}}</span><i class="fa fa-times"></i></a><h5>{{to.label}} {{$index + 1}}</h5></div><div class=panel-body><formly-form model=entry fields=fields></formly-form><formly-form model=entry.data fields=dataFields></formly-form></div></div><a class="btn btn-primary btn-sm" ng-if=canAdd() ng-click=addAnother()><span>Add <span ng-if=model[options.key].length>another</span> {{to.label}}</span><i class="fa fa-plus"></i></a></div><div ng-if="to.definition.maximum == 1 && options.key"><formly-form model=model[options.key] fields=options.data.fields></formly-form><formly-form model=model[options.key].data fields=options.data.dataFields></formly-form></div></div>'), 
    $templateCache.put("fluro-interaction-form/field-errors.html", '<div class=field-errors ng-if="fc.$touched && fc.$invalid"><div ng-show=fc.$error.required class="alert alert-danger" role=alert><span class="fa fa-exclamation" aria-hidden=true></span> <span class=sr-only>Error:</span> {{to.label}} is required.</div><div ng-show=fc.$error.validInput class="alert alert-danger" role=alert><span class="fa fa-exclamation" aria-hidden=true></span> <span class=sr-only>Error:</span> <span ng-if=!to.errorMessage.length>\'{{fc.$viewValue}}\' is not a valid value</span> <span ng-if=to.errorMessage.length>{{to.errorMessage}}</span></div><div ng-show=fc.$error.email class="alert alert-danger" role=alert><span class="fa fa-exclamation" aria-hidden=true></span> <span class=sr-only>Error:</span> <span>\'{{fc.$viewValue}}\' is not a valid email address</span></div></div>'), 
    $templateCache.put("fluro-interaction-form/fluro-interaction-input.html", '<div class="fluro-input form-group" scroll-active ng-class="{\'fluro-valid\':isValid(), \'fluro-dirty\':isDirty, \'fluro-invalid\':!isValid()}"><label><i class="fa fa-check" ng-if=isValid()></i><i class="fa fa-exclamation" ng-if=!isValid()></i><span>{{field.title}}</span></label><div class="error-message help-block"><span ng-if=field.errorMessage>{{field.errorMessage}}</span> <span ng-if=!field.errorMessage>Please provide valid input for this field</span></div><span class=help-block ng-if="field.description && field.type != \'boolean\'">{{field.description}}</span><div class=fluro-input-wrapper></div></div>'), 
    $templateCache.put("fluro-interaction-form/fluro-terms.html", '<div class=terms-checkbox><div class=checkbox><label><input type=checkbox ng-model="model[options.key]"> {{to.definition.params.storeData}}</label></div></div>'), 
    $templateCache.put("fluro-interaction-form/fluro-web-form.html", '<div class=fluro-interaction-form><div ng-if=!correctPermissions class=form-permission-warning><div class="alert alert-warning small"><i class="fa fa-warning"></i> <span>You do not have permission to post {{model.plural}}</span></div></div><div ng-if="promisesResolved && correctPermissions"><div ng-if=debugMode><div class="btn-group btn-group-justified"><a ng-click="vm.state = \'ready\'" class="btn btn-default">State to ready</a> <a ng-click="vm.state = \'complete\'" class="btn btn-default">State to complete</a> <a ng-click=reset() class="btn btn-default">Reset</a></div><hr></div><div ng-show="vm.state != \'complete\'"><form novalidate ng-submit=vm.onSubmit()><formly-form model=vm.model fields=vm.modelFields form=vm.modelForm options=vm.options><div ng-if=model.data.recaptcha><div recaptcha-render></div></div><div class="form-error-summary form-client-error alert alert-warning" ng-if="vm.modelForm.$invalid && !vm.modelForm.$pristine"><div class=form-error-summary-item ng-repeat="field in errorList" ng-if=field.formControl.$invalid><i class="fa fa-exclamation"></i> <span ng-if=field.templateOptions.definition.errorMessage.length>{{field.templateOptions.definition.errorMessage}}</span> <span ng-if=!field.templateOptions.definition.errorMessage.length>{{field.templateOptions.label}} has not been provided.</span></div></div><div ng-switch=vm.state><div ng-switch-when=sending><a class="btn btn-primary" ng-disabled=true><span>Processing</span> <i class="fa fa-spinner fa-spin"></i></a></div><div ng-switch-when=error><div class="form-error-summary form-server-error alert alert-danger" ng-if=processErrorMessages.length><div class=form-error-summary-item ng-repeat="error in processErrorMessages track by $index"><i class="fa fa-exclamation"></i> <span>Error processing your submission: {{error}}</span></div></div><button type=submit class="btn btn-primary" ng-disabled=!readyToSubmit><span>Try Again</span> <i class="fa fa-angle-right"></i></button></div><div ng-switch-default><button type=submit class="btn btn-primary" ng-disabled=!readyToSubmit><span>{{submitLabel}}</span> <i class="fa fa-angle-right"></i></button></div></div></formly-form></form></div><div ng-show="vm.state == \'complete\'"><div compile-html=transcludedContent></div></div></div></div>'), 
    $templateCache.put("fluro-interaction-form/nested/fluro-nested.html", '<div><div class=form-multi-group ng-if="to.definition.maximum != 1"><div class="panel panel-default" ng-init="fields = copyFields()" ng-repeat="entry in model[options.key] track by $index"><div class="panel-heading clearfix"><a ng-if=canRemove() class="btn btn-danger btn-sm pull-right" ng-click="model[options.key].splice($index, 1)"><span>Remove {{to.label}}</span><i class="fa fa-times"></i></a><h5>{{to.label}} {{$index + 1}}</h5></div><div class=panel-body><formly-form model=entry fields=fields></formly-form></div></div><a class="btn btn-primary btn-sm" ng-if=canAdd() ng-click=addAnother()><span>Add <span ng-if=model[options.key].length>another</span> {{to.label}}</span><i class="fa fa-plus"></i></a></div><div ng-if="to.definition.maximum == 1 && options.key"><formly-form model=model[options.key] fields=options.data.fields></formly-form></div></div>'), 
    $templateCache.put("fluro-interaction-form/order-select/fluro-order-select.html", '<div id={{options.id}} class=fluro-order-select><div ng-if=selection.values.length><p class=help-block>Drag to reorder your choices</p></div><div class=list-group as-sortable=dragControlListeners formly-skip-ng-model-attrs-manipulator ng-model=selection.values><div class="list-group-item clearfix" as-sortable-item ng-repeat="item in selection.values"><div class=pull-left as-sortable-item-handle><i class="fa fa-arrows order-select-handle"></i> <span class="order-number text-muted">{{$index+1}}</span> <span>{{item}}</span></div><div class="pull-right order-select-remove" ng-click=deselect(item)><i class="fa fa-times"></i></div></div></div><div ng-if=canAddMore()><p class=help-block>Choose by selecting options below</p><select class=form-control ng-model=selectBox.item ng-change=selectUpdate()><option ng-repeat="(key, option) in to.options | orderBy:\'value\'" ng-if=!contains(option.value) value={{option.value}}>{{option.value}}</option></select></div></div>'), 
    $templateCache.put("fluro-interaction-form/payment/payment-method.html", '<hr><div class=payment-method-select><div ng-if=!settings.showOptions><h3 class=clearfix>{{selected.method.title}} <em class="pull-right small" ng-click="settings.showOptions = !settings.showOptions">Other payment options <i class="fa fa-angle-right"></i></em></h3></div><div ng-if=settings.showOptions><h3 class=clearfix>Select payment method <em ng-click="settings.showOptions = false" class="pull-right small">Back <i class="fa fa-angle-up"></i></em></h3><div class="payment-method-list list-group"><div class="payment-method-list-item list-group-item" ng-class="{active:method == selected.method}" ng-click=selectMethod(method) ng-repeat="method in methodOptions"><h5 class=title>{{method.title}}</h5></div></div></div><div ng-if=!settings.showOptions><div ng-if="selected.method.key == \'card\'"><formly-form model=model fields=options.data.fields></formly-form></div><div ng-if="selected.method == method && selected.method.description.length" ng-repeat="method in methodOptions"><div compile-html=method.description></div></div></div></div><hr>'), 
    $templateCache.put("fluro-interaction-form/payment/payment-summary.html", '<hr><div class=payment-summary><h3>Payment details</h3><div class=form-group><div ng-if=modifications.length class=payment-running-total><div class="row payment-base-row"><div class=col-xs-6><strong>Base Price</strong></div><div class="col-xs-3 col-xs-offset-3">{{paymentDetails.amount / 100 | currency}}</div></div><div class="row text-muted" ng-repeat="mod in modifications"><div class=col-xs-6><em>{{mod.title}}</em></div><div class="col-xs-3 text-right"><em>{{mod.description}}</em></div><div class=col-xs-3><em class=text-muted>{{mod.total / 100 | currency}}</em></div></div><div class="row payment-total-row"><div class=col-xs-6><h4>Total</h4></div><div class="col-xs-3 col-xs-offset-3"><h4>{{calculatedTotal /100 |currency}} <span class="text-uppercase text-muted">{{paymentDetails.currency}}</span></h4></div></div></div><div class=payment-amount ng-if=!modifications.length>{{calculatedTotal /100 |currency}} <span class=text-uppercase>({{paymentDetails.currency}})</span></div></div></div>'), 
    $templateCache.put("fluro-interaction-form/search-select/fluro-search-select-item.html", '<a class=clearfix><i class="fa fa-{{match.model._type}}"></i> <span ng-bind-html="match.label | trusted | typeaheadHighlight:query"></span> <span ng-if="match.model._type == \'event\' || match.model._type == \'plan\'" class="small text-muted">// {{match.model.startDate | formatDate:\'jS F Y - g:ia\'}}</span></a>'), 
    $templateCache.put("fluro-interaction-form/search-select/fluro-search-select-value.html", '<a class=clearfix><span ng-bind-html="match.label | trusted | typeaheadHighlight:query"></span></a>'), 
    $templateCache.put("fluro-interaction-form/search-select/fluro-search-select.html", '<div class=fluro-search-select><div ng-if="to.definition.type == \'reference\'"><div class=list-group ng-if="multiple && selection.values.length"><div class=list-group-item ng-repeat="item in selection.values"><i class="fa fa-times pull-right" ng-click=deselect(item)></i> {{item.title}}</div></div><div class=list-group ng-if="!multiple && selection.value"><div class="list-group-item clearfix"><i class="fa fa-times pull-right" ng-click=deselect(selection.value)></i> {{selection.value.title}}</div></div><div ng-if=canAddMore()><div class=input-group><input class=form-control formly-skip-ng-model-attrs-manipulator ng-model=proposed.value typeahead-template-url=fluro-interaction-form/search-select/fluro-search-select-item.html typeahead-on-select=select($item) placeholder=Search typeahead="item.title for item in retrieveReferenceOptions($viewValue)" typeahead-loading="search.loading"><div class=input-group-addon ng-if=!search.loading ng-click="search.terms = \'\'"><i class=fa ng-class="{\'fa-search\':!search.terms.length, \'fa-times\':search.terms.length}"></i></div><div class=input-group-addon ng-if=search.loading><i class="fa fa-spin fa-spinner"></i></div></div></div></div><div ng-if="to.definition.type != \'reference\'"><div class=list-group ng-if="multiple && selection.values.length"><div class=list-group-item ng-repeat="value in selection.values"><i class="fa fa-times pull-right" ng-click=deselect(value)></i> {{getValueLabel(value)}}</div></div><div class=list-group ng-if="!multiple && selection.value"><div class="list-group-item clearfix"><i class="fa fa-times pull-right" ng-click=deselect(selection.value)></i> {{getValueLabel(selection.value)}}</div></div><div ng-if=canAddMore()><div class=input-group><input class=form-control formly-skip-ng-model-attrs-manipulator ng-model=proposed.value typeahead-template-url=fluro-interaction-form/search-select/fluro-search-select-value.html typeahead-on-select=select($item.value) placeholder=Search typeahead="item.name for item in retrieveValueOptions($viewValue)" typeahead-loading="search.loading"><div class=input-group-addon ng-if=!search.loading ng-click="search.terms = \'\'"><i class=fa ng-class="{\'fa-search\':!search.terms.length, \'fa-times\':search.terms.length}"></i></div><div class=input-group-addon ng-if=search.loading><i class="fa fa-spin fa-spinner"></i></div></div></div></div></div>'), 
    $templateCache.put("fluro-interaction-form/value/value.html", "<div class=fluro-interaction-value style=display:none><pre>{{model[options.key] | json}}</pre></div>"), 
    $templateCache.put("fluro-preloader/fluro-preloader.html", '<div class="preloader {{preloader.class}}"><div class=preloader-bg></div><div class=preloader-fg><div class=spinner><svg version=1.1 id=loader-1 xmlns=http://www.w3.org/2000/svg xmlns:xlink=http://www.w3.org/1999/xlink x=0px y=0px width=40px height=40px viewbox="0 0 50 50" style="enable-background:new 0 0 50 50" xml:space=preserve><path fill=#000 d=M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z transform="rotate(170 25 25)"><animatetransform attributetype=xml attributename=transform type=rotate from="0 25 25" to="360 25 25" dur=0.6s repeatcount=indefinite></animatetransform></path></svg></div></div></div>'), 
    $templateCache.put("routes/checklist/checklist.html", '<div class="wrapper-sm border-bottom bg-white"><div class=container><div class=text-wrap><div class=row><div class=col-xs-9><h1 class=title>{{event.title}}</h1><h6 class=text-muted>{{event.startDate | formatDate:\'g:ia j M Y\'}} <em>({{event.startDate | timeago}})</em></h6></div><div class="col-xs-3 text-right"><a class="btn btn-primary btn-sm" ui-sref="new({returnTo:event._id, realm:event.realms[0]._id})"><i class="fa fa-plus"></i></a></div></div></div></div></div><div class="search-row border-bottom"><div class=text-wrap><div class=input-group style="margin-bottom: 0"><input class=form-control ng-model=search.terms placeholder="Search contacts"><div class=input-group-addon ng-click="search.terms = \'\'"><i class=fa ng-class="{\'fa-search\':!search.terms.length, \'fa-times\':search.terms.length}"></i></div><div class=input-group-addon ng-class={active:$root.filterPanel} ng-click="$root.filterPanel = !$root.filterPanel"><i class="fa fa-ellipsis-v"></i></div></div></div></div><div class=filters ng-if=$root.filterPanel><div class="wrapper-xs bg-white"><div class=container><div class=text-wrap><h4 class="strong title">Filters</h4><div class="row clearfix"><div class="col-xs-12 col-sm-4"><div class=filter-block><h6>Groups</h6><select ng-model=search.groups class=form-control><option value="">Any</option><optgroup label={{existing.title}} ng-repeat="existing in groups track by existing.definition"><option value={{option._id}} ng-repeat="option in existing.groups | orderBy:\'title\' track by option._id">{{option.title}}</option></optgroup></select></div></div><div class="col-xs-6 col-sm-4"><div class=filter-block><h6>Realms</h6><select ng-model=search.realms class=form-control><option value="">Any</option><option value={{option._id}} ng-repeat="option in realms | orderBy:\'title\'">{{option.title}}</option></select></div></div><div class="col-xs-6 col-sm-4"><div class=filter-block><h6>Tags</h6><select ng-model=search.tags class=form-control><option value="">Any</option><option value={{option._id}} ng-repeat="option in tags | orderBy:\'title\'">{{option.title}}</option></select></div></div><div class="col-xs-6 col-sm-4"><div class=filter-block><h6>Status</h6><select ng-model=search.contactstatus class=form-control><option value="">Any</option><option value={{option}} ng-repeat="option in status">{{option}}</option></select></div></div></div></div></div></div></div><div class=wrapper-sm id=contacts><div class=container><div class=text-wrap><div class="wrapper-sm text-center" ng-if="search.terms.length && !(filteredContacts).length"><p class="small text-muted">Sorry no contacts found for \'{{search.terms}}\'</p><a class="btn btn-default" ng-click="search.terms = \'\'"><span>Cancel search</span></a></div><div ng-repeat="item in pager.items"><div class="row individual" ng-class="{\'active\': selected(item)}"><div class="col-xs-10 col-sm-8"><h5 class=text-capitalize><strong>{{item.lastName}},</strong>&nbsp;{{item.firstName}}</h5></div><div class="col-xs-1 col-sm-offset-2 col-sm-1 text-right" ng-click=toggle(item)><i class="fa fa-2x fa-fw" ng-class="{\'fa-check-circle\':selected(item),  \'fa-circle-o\':!selected(item) && !isCheckedIn(item), \'fa-check text-muted\':isCheckedIn(item)}"></i></div><div class="col-xs-1 col-sm-1 text-right" ng-click=toggleNotes(item)><i class="text-muted fa fa-2x fa-fw fa-pencil-square-o"></i></div><div class="col-xs-12 col-sm-12" ng-show=item.shownotes><label>Add Note:</label>&nbsp;<input ng-model=item.eventNote style="display:table-cell; width:100%"></div></div></div><div class=text-center ng-if="pager.total > pager.itemsPerPage"><ul uib-pagination class=hidden-xs total-items=pager.total items-per-page=pager.itemsPerPage ng-change="$root.scroll.scrollTo(0, \'slow\')" ng-model=pager.current max-size=5 boundary-links=true></ul><ul uib-pagination class=visible-xs-inline-block items-per-page=pager.itemsPerPage total-items=pager.total ng-change="$root.scroll.scrollTo(0, \'slow\')" ng-model=pager.current max-size=5 previous-text=Prev></ul></div></div></div></div><div class=footer-spacer ng-if="report.items.length > 0"></div><div class=footer ng-if="report.items.length || availableNotes"><div class=container><div class=text-wrap><a class="btn btn-primary btn-block" ng-click=submitReport()>Submit {{report.items.length}} checkin<span ng-if="report.items.length != 1">s</span></a></div></div></div>'), 
    $templateCache.put("routes/content/view.html", '<div class="bg-white border-bottom"><div class=wrapper-xs><div class=container-fluid><div class=text-wrap><h1><div class=pull-right><i class="fa fa-circle" ng-repeat="realm in item.realms" style="margin-left:-30px; color: {{realm.bgColor}}"></i></div>{{item.title}}</h1><h4 class=text-muted ng-show=definition.title.length>{{definition.title}}</h4><h4 class=text-muted ng-show=!definition.title.length>{{item._type}}</h4><h4 ng-show="item.definition == \'song\'"><span class=text-muted>By {{item.data.artist}}</span></h4></div></div></div></div><div ng-switch=item.definition><div ng-switch-when=song><accordion><accordion-title>Song Details</accordion-title><accordion-body><div class=row><div class="form-group col-xs-6 col-sm-3" ng-show=item.data.mm><label>Metronome</label><p>{{item.data.mm}} bpm</p></div><div class="form-group col-xs-6 col-sm-3" ng-show=item.data.key><label>Keys</label><p>{{item.data.key}}</p></div><div class="form-group col-xs-12 col-sm-6" ng-show=item.data.standardStructure><label>Structure</label><p>{{item.data.standardStructure}}</p></div></div><div class=form-group ng-show=item.data.firstLine.length><label>First Line</label><p>{{item.data.firstline}}</p></div></accordion-body></accordion><accordion ng-show=item.data.sheetMusic.length><accordion-title>Sheet Music</accordion-title><accordion-body><div class=list-group><a class=list-group-item ng-repeat="file in item.data.sheetMusic" ng-href="{{$root.asset.downloadUrl(file._id, {extension:file.extension})}}" target=_blank><i class="fa fa-download pull-right"></i> {{file.title}}</a></div></accordion-body></accordion><accordion ng-show=item.data.videos.length><accordion-title>Videos</accordion-title><accordion-body><div ng-repeat="video in item.data.videos"><fluro-video ng-model=video></fluro-video></div></accordion-body></accordion><accordion ng-show=item.data.lyrics.length><accordion-title>Lyrics</accordion-title><accordion-body><div class=list-group-item ng-repeat="section in item.data.lyrics"><h5>{{section.title}}</h5><div compile-html=section.words style=white-space:pre></div></div></accordion-body></accordion></div><div ng-switch-default><div class=wrapper-sm><div class=container-fluid><div class=text-wrap><div view-extended-fields item=item definition=definition></div></div></div></div></div></div>'), 
    $templateCache.put("routes/events/events.html", '<div class="bg-white border-bottom"><div class=wrapper-sm><div class=container-fluid><div class=text-wrap><h1 class=title>Select event</h1><p class=help-block>Select an event below to mark attendance</p></div></div></div></div><div class="search-row border-bottom"><div class=text-wrap><div class=input-group style="margin-bottom: 0"><input ng-model=search.terms class=form-control placeholder="Search {{::events.length}} events"><div class=input-group-addon ng-click="search.terms = \'\'"><i class=fa ng-class="{\'fa-search\':!search.terms.length, \'fa-times\':search.terms.length}"></i></div><div class=input-group-addon ng-class={active:search.showFilters} ng-click="search.showFilters = !search.showFilters"><i class="fa fa-ellipsis-v"></i></div></div></div></div><div class="wrapper-sm filter-bg border-bottom" ng-if=search.showFilters><div class=container><div class=text-wrap><div class="row row-inline"><div class="form-group col-xs-6"><label>Tags <span class=text-muted>{{::tags.length}}</span></label><select ng-model=search.filters.tags class=form-control><option value="">Any</option><option value={{::tag._id}} ng-repeat="tag in tags">{{::tag.title}}</option></select></div><div class="form-group col-xs-6"><label>Realms <span class=text-muted>{{::realms.length}}</span></label><select ng-model=search.filters.realms class=form-control><option value="">Any</option><option value={{::realm._id}} ng-repeat="realm in realms">{{::realm.title}}</option></select></div></div></div></div></div><div class=wrapper-sm><div class=container-fluid><div class=text-wrap><div class=search-help ng-show="filteredItems.length < 1">{{filteredItems.length}} match<span ng-if="filteredItems.length != 1">es</span> <span ng-show=search.terms.length>\'{{search.terms}}\'</span></div><div infinite-pager items=dates per-page=10><div ng-repeat="page in pages"><div class="panel panel-event-day" ng-repeat="day in page"><div class=panel-heading><i class="fa fa-calendar fa-fw"></i> {{::day.date | formatDate:\'l j M Y\'}}</div><div><div class="row row-flex panel-event-day-row" ng-repeat="timeslot in day.times | filter:search.terms track by timeslot.time"><div class="col-xs-2 bg-light"><div class=assignment-time>{{::timeslot.time}}</div></div><div class="col-xs-10 border-left"><div><a ui-sref=checklist({id:event._id}) ng-repeat="event in timeslot.events | filter:search.terms track by event._id" class=timeslot-row><div ng-repeat="realm in event.realms" class=realm-bar style=background-color:{{::realm.bgColor}}></div><h6 class=title><strong>{{::event.title}}</strong></h6><div class="small text-muted">{{::event.firstLine}}</div></a></div></div></div></div></div></div></div></div></div></div>'), 
    $templateCache.put("routes/new/new.html", '<div class="wrapper new"><div ng-switch=settings.state><div ng-switch-when=processing><div class=text-center><i class="fa fa-spinner fa-spin fa-3x"></i></div><div class=container><div class=text-center><div class=wrapper><h2>Processing</h2><p class="text-muted help-block"><em>Please wait</em></p></div></div></div></div><div ng-switch-when=failed><div class=text-center><i class="fa fa-frown-o fa-3x"></i></div><div class=container><div class=text-center><div class=wrapper><h2>There was a problem saving new contact</h2><p class="text-muted help-block"><em>Click below to return to the previous screen</em></p></div><a class="btn btn-primary btn-sm" ng-click="settings.state = \'ready\'">Go back</a></div></div></div><div ng-switch-when=success><div class=text-center><i class="fa fa-smile-o fa-3x"></i></div><div class=container><div class=text-center><div class=wrapper><h2>Contact created successfully</h2><p class="text-muted help-block"><em>You can now check in {{settings.result.firstName}}</em></p></div><a class="btn btn-primary btn-sm" ng-click=$root.breadcrumb.back()>Return to event</a> <a class="btn btn-default btn-sm" ng-click="settings.state = \'ready\'">Add another contact</a></div></div></div><div ng-switch-default class=container><div class=text-wrap><h3>Add a new contact</h3><br><form ng-submit=submitForm()><div class=row><div class="form-group col-sm-4"><label>First Name</label><input placeholder="First Name" ng-model=contact.firstName class="form-control"></div><div class="form-group col-sm-5"><label>Last Name</label><input placeholder="Last Name" ng-model=contact.lastName class="form-control"></div><div class="form-group col-sm-3"><label>Gender</label><select ng-model=contact.gender class=form-control><option value=male>Male</option><option value=female>Female</option></select></div></div><div class=row><div class="form-group col-sm-6"><label>Phone Number</label><input placeholder="Phone Number" ng-model=contact.phoneNumbers[0] class="form-control"></div><div class="form-group col-sm-6"><label>Email Address</label><input placeholder="Email Address" type=email ng-model=contact.emails[0] class="form-control"></div></div><button class="btn btn-primary"><span>Submit</span> <i class="fa fa-angle-right"></i></button> <a class="btn btn-default" ng-click=$root.breadcrumb.back()><span>Cancel</span></a></form></div></div></div></div>');
} ]);