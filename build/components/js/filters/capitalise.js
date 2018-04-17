app.filter('capitalise', function() {
	return function (str) {
		return _.upperCase(str);
	}
})