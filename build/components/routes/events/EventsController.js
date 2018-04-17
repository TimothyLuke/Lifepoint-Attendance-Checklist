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