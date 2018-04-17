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