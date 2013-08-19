node node_modules/.bin/browserify -t coffeeify --debug src/index.coffee > dist/bundle.js
node node_modules/.bin/browserify -t coffeeify src/index.coffee |
  node node_modules/.bin/uglifyjs > dist/bundle.min.js
# node node_modules/.bin/discify -t coffeeify src/index.coffee > stats/stats.html