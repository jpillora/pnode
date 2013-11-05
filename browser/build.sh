echo "browserifying pnode debug"
node node_modules/.bin/browserify --debug src/index.js > dist/pnode.debug.js
echo "browserifying pnode"
node node_modules/.bin/browserify src/index.js | node node_modules/.bin/uglifyjs --mangle --compress > dist/pnode.js
echo "discifying pnode"
node node_modules/.bin/discify src/index.js > stats/stats.html