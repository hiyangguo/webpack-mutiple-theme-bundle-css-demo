var ghpages = require('gh-pages');
console.log('Publish...');
ghpages.publish('dist', function(err) {
  err && console.log(err);
  !err && console.log('Published');
});