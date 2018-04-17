app.controller('CreateContactController', function($scope, $stateParams, FluroContent, $analytics) {


    $scope.returnTo = $stateParams.returnTo;

    $scope.settings = {};
 
    ///////////////////////////////////

    $scope.contact = newContact();

    ///////////////////////////////////

    function newContact() {
        return {
            emails:[],
            phoneNumbers:[],
            realms:[$stateParams.realm]
        }
    }
    
    ///////////////////////////////////
    
    $scope.submitForm = function() {
        
        $scope.settings.state = 'processing';

        //Callback on success
        function success(res) {

            $scope.contact = newContact();

            console.log('Contact saved', res);
            $scope.settings.state = 'success';
            $scope.settings.result = res;

            // Google Analytics
            $analytics.eventTrack('contact created', {
                category: 'Contact',
                label: res.title, // Contact name
                value: 1 // number
            });
        }
        
        function fail(res) {
            console.log('Contact failed to save', res);
            $scope.settings.state = 'failed';
        }
        
        ///////////////////////////////////

        var promise = FluroContent.resource('contact').save($scope.contact).$promise.then(success, fail);
        
    }
});