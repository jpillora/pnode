node node_modules/.bin/browserify -t coffeeify --debug src/index.coffee > out/bundle.js
node node_modules/.bin/browserify -t coffeeify src/index.coffee | node node_modules/.bin/uglifyjs > out/bundle.min.js
# node node_modules/.bin/discify -t coffeeify src/index.coffee > stats/stats.html