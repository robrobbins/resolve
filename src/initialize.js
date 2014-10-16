(function(root, factory) {
  // Node.js or CommonJS
  if (typeof exports !== 'undefined') {
    factory(root, exports);

  // browser
  } else {
    root.Backbone = factory(root, {});
  }

} (this, function(root, Backbone) {
  
// Create local references to array methods we'll want to use later.
var array = [];
var slice = array.slice;

// Current version of the library we are in parity with. Keep in sync with `package.json`.
Backbone.VERSION = '1.1.2.r';