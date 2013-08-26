{assert, expect} = require 'chai'
phantom = require 'phantom'
pnode = require '../'
http = require 'http'
fs = require 'fs'

#init phantomjs
phantom = null
before (done) ->
  require('phantom').create (ph) ->
    phantom = ph
    done()

after ->
  phantom.exit()

#tests
describe 'websockets', ->
  it 'simple call', (done) ->

    #simple file server
    httpServer = http.createServer (req, res) ->
      res.end fs.readFileSync "#{__dirname}/#{if req.url is '/pnode.js' then '/../browser/dist/pnode.js' else 'ws.html'}"
    .listen 8000

    #peer server
    server = pnode.server('ws-server')
    server.expose
      foo: (n, callback) -> callback n+42

    #bind to server object under the path '/pnode-ws'
    server.bind 'ws', httpServer, '/pnode-ws-test'

    phantom.createPage (page) ->
      page.open 'http://localhost:8000', (status) ->
        expect(status).to.equal('success')

        check = ->
          page.evaluate (-> {response, error} ), (result) ->
            if result.error
              assert.fail result.error
            else if result.response
              expect(result.response).to.equal(49)
              httpServer.close()
              done()
            else
              check()
        check()
