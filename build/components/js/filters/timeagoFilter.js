
app.filter('timeago', function(){
  return function(date){
    return moment(date).fromNow();
  };
});
