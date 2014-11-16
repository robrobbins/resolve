(function(root, factory) {
  // Node.js or CommonJS
  if (typeof exports !== 'undefined') {
    var _ = require('underscore');
    // if in node env you should use request, not reqwest
    var req = require('request');
    factory(root, exports, _, req);

  // browser
  } else {
    // we use reqwest as our `$.ajax` replacement for `sync`
    root.Backbone = factory(root, {}, root._, root.reqwest);
  }

} (this, function(root, Backbone, _, req) {
// Initial Setup
// -------------

// Create local references to array methods we'll want to use later.
var array = [];
var slice = array.slice;

// Current version of the library we are in parity with. Keep in sync with `package.json`.
Backbone.VERSION = '1.1.2.r';