app.filter('maplink', function() {
    return function(location) {



        var pieces = [];

        if (location.title && location.title.length) {
            pieces.push(location.title);
        }

        if (location.addressLine1 && location.addressLine1.length) {
            pieces.push(location.addressLine1);
        }

        if (location.addressLine2 && location.addressLine2.length) {
            pieces.push(location.addressLine2);
        }

        if (location.state && location.state.length) {
            pieces.push(location.state);
        }

        if (location.suburb && location.suburb.length) {
            pieces.push(location.suburb);
        }

        if (location.postalCode && location.postalCode.length) {
            pieces.push(location.postalCode);
        }

        var url = 'https://www.google.com/maps/place/' + pieces.join('+');


        return url;
    }
})