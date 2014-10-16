// ###defaults
// Copy the (non-inherited) key:value pairs from <n> source objects to a single target object unless it is already there.
//
// `params` {objects} A target object followed by <n> source objects
// `returns` {object} A single object
Object.defaults = function(targ) {
  var len = arguments.length, i, j, len2, src, keys, curr;
  for (i = 1; i < len; i++) {
    src = arguments[i];
    keys = Object.keys(src || {});
    for (j = 0, len2 = keys.length; j < len2; j++) {
      curr = keys[j];
      if (targ[curr] === undefined) targ[curr] = src[curr];
    }
  }
  return targ;
};
// ###extend
// Copy the (non-inherited) key:value pairs from <n> source objects to a single target object.
//
// `params` {objects} A target object followed by <n> source objects
// `returns` {object} A single object
Object.extend = function(targ) {
  var len = arguments.length, i, j, len2, src, keys, curr;
  for (i = 1; i < len; i++) {
    src = arguments[i];
    keys = Object.keys(src || {});
    for (j = 0, len2 = keys.length; j < len2; j++) {
      curr = keys[j];
      targ[curr] = src[curr];
    }
  }
  return targ;
};
// ###has
// Convenience method to tell if an abject owns a particular property
//
// `param` {obj}
// `param` {string}
// `returns` {bool}
Object.has = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
// ###isObject
// Ye olde toString fallback to see if a passed in argument is an object.
// Really you should test the other cases (Array.isArray for example) but this
// does 'even' the API a little
//
// `param` {*}
// `returns` {bool}
Object.isObject = function(arg) {
  return Object.prototype.toString.call(arg) === '[object Object]';
};
// ###serialize
// Placed on the Object Object to allow a hash of data to be turned into a 
// 'paramaterized' string and returned.
//
// `param` {object} `obj`
// `returns` {string}
Object.serialize = function(obj) {
  var ary = [], keys = Object.keys(obj), len = keys.length;
  for (i = 0; i < len; i++) {
    ary.push(encodeURIComponent(key) +'='+ encodeURIComponent(obj[key]));
  }
  return ary.join('&');
};