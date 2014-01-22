//example handlers

var _ = require('lodash');
var PeerStore = require('../');

exports.after = function(ms, fn) {
  setTimeout(fn, ms);
};

exports.every = function(ms, fn) {
  setInterval(fn, ms);
};

exports.create = function(port, peers) {

  if(!peers) peers = process.argv.slice(2);
  if(!port)  port = Number(peers.shift());

  if(!port) {
    console.log('no port');
    process.exit(1);
  }

  return new PeerStore({
    port: port,
    peers: peers
  });
};

exports.compare = function(A,B) {
  for(var a in A) {
    if(A[a] !== B[a])
      return false;
    delete B[a];
  }
  for(var b in B)
    return false;
  return true;
};

exports.val = function(max) {
  return Math.floor(Math.random()*max);
};

exports.helper = require('../').helper;