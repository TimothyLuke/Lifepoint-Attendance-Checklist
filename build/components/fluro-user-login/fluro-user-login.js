app.controller('UserLoginController', function($scope, $http, FluroTokenService, NotificationService) {
    

    ////////////////////////////////////////

    $scope.credentials = {}
    
    $scope.status = 'ready';
    
    ////////////////////////////////////////

    $scope.signup = function(options) {
        
        $scope.status = 'processing';
     
     	//Signup for a new persona
        var request = FluroTokenService.signup($scope.credentials, options)
        
        request.then(function(res) {
            $scope.status = 'ready';
            NotificationService.message('Hi ' + res.data.firstName)
        }, function(res) {
            $scope.status = 'ready';
            NotificationService.message(String(res.data), 'danger')
        })
    }
    
    ////////////////////////////////////////

    $scope.login = function(options) {
        
        $scope.status = 'processing';
        var request = FluroTokenService.login($scope.credentials, options);

        request.then(function(res) {
            $scope.status = 'ready';
            NotificationService.message('Welcome back ' + res.data.firstName)
        }, function(res) {
            $scope.status = 'ready';
            console.log('FAILED', res);
            NotificationService.message(String(res.data), 'danger')
        })
    }
   
});

