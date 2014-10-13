var utils = Backbone.utils = {
  defaults: function(targ) {
    // not checking the arg, DBS
    for (var i = 1, length = arguments.length; i < length; i++) {
      var source = arguments[i];
      for (var prop in source) {
        if (targ[prop] === undefined) targ[prop] = source[prop];
      }
    }
    return targ;
  }
};