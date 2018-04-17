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