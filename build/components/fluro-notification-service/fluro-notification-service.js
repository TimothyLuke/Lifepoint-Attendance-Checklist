app.service('NotificationService', function($timeout) {


	var controller = {
		messages:[],
	};

	/////////////////////////////////////
	
	controller.lastMessage = function() {
		return _.last(controller.messages);
	}
	/////////////////////////////////////

	controller.message = function(string, style, duration) {

		if(!style) {
			style = 'info';
		}

		if(!duration) {
			duration = 3000;
		}

		var message = {
			text:string,
			style:style,
			duration:duration,
		}

		//Add the message to the list
		controller.messages.push(message);

		//Remove it after duration
		$timeout(function() {
			_.pull(controller.messages, message);
		}, message.duration);

	}
	/////////////////////////////////////

	return controller;
})