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