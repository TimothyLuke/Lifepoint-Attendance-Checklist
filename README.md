# fluro-attendance
Fluro's Attendance app.


# Getting Started
~~~~
git clone https://bitbucket.org/blaireasdon/fluro-attendance attendance-checklist
~~~~

Once you have cloned the repository change into the directory and install node packages, install bower components into the 'app' folder
	
~~~~
cd attendance-checklist
npm install
cd app
bower install
cd ../

~~~~

# Grunt
Once bower and node packages have been installed start grunt using
~~~~
grunt
~~~~

This will start watching your style.scss file, and all .js, .html and .scss files in the 'build/components' folder, Any changes will automatically trigger SCSS to compile, Javascript to concatenate and HTML to be made into angular templates, this will also live reload your browser window.

To view the application in the browser as your working visit http://0.0.0.0:9001

Start coding!