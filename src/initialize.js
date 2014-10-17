(function(root, factory) {
  // Node.js or CommonJS
  if (typeof exports !== 'undefined') {
    var _ = require('underscore');
    factory(root, exports, _);

  // browser
  } else {
    root.Backbone = factory(root, {}, root._);
  }

} (this, function(root, Backbone, _) {
// Initial Setup
// -------------

// Create local references to array methods we'll want to use later.
var array = [];
var slice = array.slice;

// Current version of the library we are in parity with. Keep in sync with `package.json`.
Backbone.VERSION = '1.1.2.r';