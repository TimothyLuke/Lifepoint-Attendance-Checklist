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