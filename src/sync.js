// Backbone.sync
// -------------

// Overridden to use `Reqwest` as the client side AJAX implementation.
// https://github.com/ded/reqwest
// `Request` is used in a node env,
//
// NOTE you will need no override this
// in said node env to map the arguments properly.
// We have mapped them here for the client scenario as the two libs do not
// perfectly align (though all of Resolve's tests are run in Node, the sync
// module is overridden in that case).

Backbone.sync = function(method, model, options) {
  var type = methodMap[method];

  // Default options, unless specified.
  options || (options = {});

  // Default JSON-request options. Map for `reqwest`
  var params = {method: type, type: 'json'};

  // Ensure that we have a URL.
  if (!options.url) {
    params.url = _.result(model, 'url') || urlError();
  }

  // Ensure that we have the appropriate request data.
  if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
    params.contentType = 'application/json';
    // reqwest does not need this to be a json string
    params.data = options.attrs || model.toJSON(options);
  }

  // Make the request, allowing the user to override any Ajax options.
  var xhr = options.xhr = Backbone.request(_.extend(params, options));
  model.trigger('request', model, xhr, options);
  return xhr;
};

// Map from CRUD to HTTP for our default `Backbone.sync` implementation.
var methodMap = {
  'create': 'POST',
  'update': 'PUT',
  'patch':  'PATCH',
  'delete': 'DELETE',
  'read':   'GET'
};

// Set the default implementation of `Backbone.request` to proxy through to
// req (passed in reqwest/request). It a Node env override this method to
// properly map the prepared arguments
Backbone.request = function(options) {
  return req.apply(req, arguments);
};
