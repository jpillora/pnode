http = require("http")
fs = require("fs")

#a mini-static file server, may swap out for express or similar
module.exports = http.createServer (req, res) ->
  response = null
  if req.url is "/"
    response = fs.readFileSync(__dirname + "/index.html")
  else if req.url is "/bundle.js"
    response = fs.readFileSync(__dirname + "/../../browser/dist/bundle.js")
    
  res.writeHead if response then 200 else 404
  res.end response
.listen 8000, "0.0.0.0"

