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