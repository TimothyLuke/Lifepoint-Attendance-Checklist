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

