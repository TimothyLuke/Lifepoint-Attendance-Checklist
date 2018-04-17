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