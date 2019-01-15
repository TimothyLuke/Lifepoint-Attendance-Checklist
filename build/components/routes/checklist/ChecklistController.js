app.controller('ChecklistController', function($scope, FluroContent, $filter, NotificationService, $localStorage, event, contacts, $analytics) {


    // console.log('contacts', contacts);
    // console.log('event', event);

    $scope.event = event;


    if ($localStorage['checklistSearch']) {
        $scope.search = $localStorage['checklistSearch'];
    } else {
        $scope.search = $localStorage['checklistSearch'] =  {terms:''};
    }
    $scope.search.contactstatus = 'active'

    ////////////////////////////////////////////////

    $scope.report = {
        items:[]
    };

    // $scope.scrollTop = function () {
    //     window.scroll(0,0)
    // }


    $scope.selected = function(item) {
        return  _.includes($scope.report.items, item._id);
    }

    $scope.select = function(item) {
        if(!$scope.isCheckedIn(item)) {
            return  $scope.report.items.push(item._id);
        }
    }

    $scope.deselect = function(item) {
        return   _.pull($scope.report.items, item._id);
    }

    $scope.toggle = function(item) {
        if ($scope.selected(item)) {
            $scope.deselect(item);
        } else {
            $scope.select(item)
        }
    }

    $scope.reset = function () {

        $scope.report = {
            items:[]
        }
    }


    /////////////////////////////////////////

    $scope.isCheckedIn = function(contact) {


        return _.some($scope.checkins, function(checkin) {
            //  console.log('Check checkin', contact._id, checkin.contact._id, checkin.contact._id == contact._id)
            return (checkin.contact._id == contact._id);
        })

    }

    //Send the report data to api
    $scope.$watch('event._id', function(eventID) {
        $scope.refreshCurrentCheckins();
    })


    $scope.refreshCurrentCheckins = function() {
        //Callback on success
        function success(res) {
            $scope.checkins = res;
        }

        function fail(res) {
             console.log('the request didnt work', res);
        }


        if(!$scope.event) {
            return console.log('No event to refresh');
        }

        var eventId = $scope.event._id;

        //Request a certain type of content from the Fluro API
        FluroContent.endpoint('checkin/event/' + eventId, true, true).query({all:true}).$promise.then(success, fail);
    }


    /////////////////////////////////////////


    $scope.submitReport = function() {

        var eventId = $scope.event._id;
        var items = $scope.report.items;
        var successCount = 0;

        NotificationService.message('Submitting checkins', 'info')

        async.each(items, function(_id, next) {

            //Request a certain type of content from the Fluro API
            var promise = FluroContent.endpoint('checkin/' + eventId).save({
                contact:_id
            }).$promise.then(success, fail);


            //Callback on success_id
            function success(res) {
                // Google Analytics
                $analytics.eventTrack('checkin success', {
                    category: 'Contact',
                    label: res.firstName + ' ' + res.lastName, // Contact name
                    value: 1 // number
                });
                successCount += 1;

                return next();
            }

            function fail(err) {
                // Google Analytics
                $analytics.eventTrack('checkin failed', {
                    category: 'Contact',
                    label: 'Checkin submit fail',
                    value: 1 // number
                });

                return next(err);
            }

        }, finished );


        function finished (err) {

            if (err) {
                return NotificationService.message('Error saving checkins!', 'danger')
            }

            $scope.refreshCurrentCheckins();
            $scope.reset();
            NotificationService.message('Checkins saved', 'success')


            // Google Analytics
            $analytics.eventTrack('submit multiple checkins success', {
                category: 'Contact',
                label: 'Multiple Checkins Succeeded', // Contact name
                value: successCount // number
            });

        }
    }





/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////



    /////////////////////////////

    //Watch if anything changes and update results
    $scope.$watch(contacts, updateSearchOptions)
    $scope.$watch('search', updateSearchOptions, true)

    //////////////////////////////

    $scope.toggleFilter = function(key, value) {
        if($scope.search[key] == value) {
            return delete $scope.search[key];
        }

        $scope.search[key] = value;

    }

    ////////////////////////////////////////////////////////

    //Update search options
    function updateSearchOptions() {
        // console.log('Updating the search options')

        /////////////////////////

        var filteredContacts = contacts;

        ///////////////////////////

        //Filter items by search terms
        if($scope.search.terms && $scope.search.terms.length) {
            filteredContacts = $filter('filter')(filteredContacts, $scope.search.terms);
        }

        //////////////////////////

        //Now apply selectable filters
        if ($scope.search.realms) {
            filteredContacts = _.filter(filteredContacts, function(contact) {

                var selectedRealmID = $scope.search.realms;
                return _.some(contact.realms, {_id:selectedRealmID})
            });
        }

        if ($scope.search.tags) {
            filteredContacts = _.filter(filteredContacts, function(contact) {

                var selectedTagID = $scope.search.tags;
                return _.some(contact.tags, {_id:selectedTagID})
            });
        }
        if ($scope.search.contactstatus) {
            filteredContacts = _.filter(filteredContacts, function(contact) {

                var selectedStatusID = $scope.search.contactstatus;
                return (contact.status == selectedStatusID)
            });
        }
        if ($scope.search.groups) {
            filteredContacts = _.filter(filteredContacts, function(contact) {

                var selectedGroupID = $scope.search.groups;
                return _.some(contact.teams, {_id:selectedGroupID})
            });
        }



        //////////////////////////////////////////

        // console.log('filtered groups', $scope.search.groups)
        // console.log('filtered realms', $scope.search.realms)
        // console.log('filtered tags', $scope.search.tags)


        // if ($scope.search.style) {
        //     filteredContacts = _.filter(filteredContacts, function(contact) {
        //         return contact.data.publicData.style == $scope.search.style;
        //     });
        // }

        /////////////////////////////////////////////////////


        $scope.tags = _.chain(filteredContacts)
        .map(function(contact) {
            if(contact.tags.length) {
                return contact.tags;
            }
        })
        .flatten()
        .compact()
        .uniqBy(function(tag) {
            return tag.title;
        })
        .value();

        // ///////////////////////////

        $scope.status = _.chain(filteredContacts)
        .map(function(contact) {
            if(contact.status) {
                return contact.status;
            }
        })
        .flatten()
        .compact()
        .uniqBy(function(status) {
          return status;
        })
        .value();

        // ///////////////////////////

        $scope.realms = _.chain(filteredContacts)
        .map(function(contact) {
            if(contact.realms.length) {
                return contact.realms;
            }
        })
        .flatten()
        .compact()
        .uniqBy(function(realm) {
            return realm._id;
        })
        .value();

        // console.log('realms are', $scope.realms)

        // /////////////////////////////

        $scope.groups = _.chain(filteredContacts)
        .map(function(contact) {
            return contact.teams;
        })
        .flatten()
        .compact()
        .uniqBy(function(team) {
            return team._id;
        })
        .reduce(function(results, team) {

            var definition = 'Generic';
            if(team.definition) {
                definition = team.definition.charAt(0).toUpperCase() + team.definition.slice(1);
            }

            //Definition here will be '' or 'lifegroup'

            //Check to see if our new list has an entry already for 'lifegroup'
            var existing = _.find(results, {definition:definition});

            if(!existing) {
                existing = {
                    title:definition,
                    definition:definition,
                    groups:[]
                }

                results.push(existing);
            }


            //By this stage existing will either be the existing definition in the results set
            //Or an entry we just created
            existing.groups.push(team);

            return results;
        }, [])
        .value();


        console.log('groups', $scope.groups)
        // console.log('Updated filteredContacts')

        //Update the items with our search
        $scope.filteredContacts = _.orderBy(filteredContacts, function(contact) {
            return contact.lastName;
        });

        if(($scope.filteredContacts.length < $scope.pager.itemsPerPage)) {
            console.log('set current')
            $scope.pager.current = 1;
        }


    }

    ////////////////////////////////////////////////

    $scope.pager = {
        current:1,
        itemsPerPage:50,
        items:[]
    };

    $scope.$watch('filteredContacts + pager.current', function() {

        console.log('filtered contacts is', $scope.filteredContacts.length)
        $scope.pager.total = $scope.filteredContacts.length;

        var start = ($scope.pager.current-1) * $scope.pager.itemsPerPage;
        var end = start + $scope.pager.itemsPerPage;

        $scope.pager.pages = Math.ceil($scope.filteredContacts.length / $scope.pager.itemsPerPage)
        $scope.pager.items = $scope.filteredContacts.slice(start, end)
    })

        ////////////////////////////////////////////////


})
