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