node node_modules/.bin/browserify --debug src/index.js > dist/pnode.js
node node_modules/.bin/browserify src/index.js | node node_modules/.bin/uglifyjs --mangle --compress > dist/pnode.min.js
node node_modules/.bin/discify src/index.js > stats/stats.html