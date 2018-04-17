app.filter('commaSummary', function() {
    return function (arrayOfObjects, limit, delimiter) {

        if(!limit) {
            limit = 20;
        }

        if(!delimiter || !delimiter.length) {
           delimiter = ', ';
        }

        var names = _.chain(arrayOfObjects)
        .map(function(object) {
            return object.title;
        })
        .compact()
        .value();

        var string = names.join(delimiter);

        if(string.length >=limit) {
            string = string.substr(0,limit) + '...';
        }

        return string;
    }
})