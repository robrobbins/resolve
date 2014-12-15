/*global spyOn*/
var _ = require('underscore');
var Backbone = require('../dist/resolve');

beforeEach(function() {
  // evironment setup for mocking the ajax calls
  var env = this.env = {};
  var sync = Backbone.sync;
  var req = Backbone.request;
  // Capture ajax settings for comparison.
  Backbone.request = function(settings) {
    env.ajaxSettings = settings;
  };
  // Capture the arguments to Backbone.sync for comparison.
  Backbone.sync = function(method, model, options) {
    env.syncArgs = {
      method: method,
      model: model,
      options: options
    };
    sync.apply(this, arguments);
  };

  // from the model spec
  this.Proxy = Backbone.Model.extend();
  this.Collection = Backbone.Collection.extend({
    url: function() {return '/collection';}
  });
  this.doc = undefined;
});

describe('collection sync tests', function() {
  
  beforeEach(function() {
    this.a = new Backbone.Model({id: 3, label: 'a'});
    this.b = new Backbone.Model({id: 2, label: 'b'});
    this.c = new Backbone.Model({id: 1, label: 'c'});
    this.d = new Backbone.Model({id: 0, label: 'd'});
    this.e = null;
    this.col = new Backbone.Collection([this.a, this.b, this.c, this.d]);
    this.otherCol = new Backbone.Collection();
  });
  
  // FETCH
  
  it("fetches", function() {
    var collection = new Backbone.Collection;
    collection.url = '/test';
    collection.fetch();
    expect(this.env.syncArgs.method).toBe('read');
    expect(this.env.syncArgs.model).toEqual(collection);
    expect(this.env.syncArgs.options.parse).toBe(true);

    collection.fetch({parse: false});
    expect(this.env.syncArgs.options.parse).toBe(false);
  });
  
  it("fetch with an error response triggers an error event", function () {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    var collection = new Backbone.Collection();
    collection.on('error', this.cb);
    collection.sync = function (method, model, options) { options.error(); };
    collection.fetch();
    
    expect(spy).toHaveBeenCalled();
  });
  
  it("fetch only parses once", function() {
    var collection = new Backbone.Collection;
    var counter = 0;
    collection.parse = function(models) {
      counter++;
      return models;
    };
    collection.url = '/test';
    collection.fetch();
    this.env.syncArgs.options.success();
    expect(counter).toBe(1);
  });
  
  it("fetch parses models by default", function() {
    var model = {};
    var Collection = Backbone.Collection.extend({
      url: 'test',
      model: Backbone.Model.extend({
        parse: function(resp) {
          expect(resp).toEqual(model);
        }
      })
    });
    new Collection().fetch();
    this.env.ajaxSettings.success([model]);
  });
  
  // CREATE
  
  it("creates", function() {
    var collection = new Backbone.Collection;
    collection.url = '/test';
    var model = collection.create({label: 'f'}, {wait: true});
    expect(this.env.syncArgs.method).toBe('create');
    expect(this.env.syncArgs.model).toBe(model);
    expect(model.get('label')).toBe('f');
    expect(model.collection).toEqual(collection);
  });
  
  it("create with validate:true enforces validation", function() {
    var ValidatingModel = Backbone.Model.extend({
      validate: function(attrs) {
        return "fail";
      }
    });
    var ValidatingCollection = Backbone.Collection.extend({
      model: ValidatingModel
    });
    var col = new ValidatingCollection();
    col.on('invalid', function (collection, error, options) {
      expect(error).toBe("fail");
      expect(options.validationError).toBe('fail');
    });
    
    expect(col.create({"foo":"bar"}, {validate:true})).toBe(false);
  });
  
  it("a failing create returns model with errors", function() {
    var ValidatingModel = Backbone.Model.extend({
      validate: function(attrs) {
        return "fail";
      }
    });
    var ValidatingCollection = Backbone.Collection.extend({
      model: ValidatingModel
    });
    var col = new ValidatingCollection();
    var m = col.create({"foo":"bar"});
    expect(m.validationError).toBe('fail');
    expect(col.length).toBe(1);
  });
  
  it("#714: access `model.collection` in a brand new model.", function() {
    var collection = new Backbone.Collection;
    collection.url = '/test';
    var Model = Backbone.Model.extend({
      set: function(attrs) {
        expect(attrs.prop).toBe('value');
        expect(this.collection).toEqual(collection);
        return this;
      }
    });
    collection.model = Model;
    collection.create({prop: 'value'});
  });
  
  it("#1355 - `options` is passed to success callbacks", function(){
    var m = new Backbone.Model({x:1});
    var col = new Backbone.Collection();
    var opts = {
      opts: true,
      success: function(collection, resp, options) {
        expect(options.opts).toBe(true);
      }
    };
    var spy = spyOn(opts, 'success').and.callThrough();
    
    col.sync = m.sync = function( method, collection, options ){
      options.success({});
    };
    col.fetch(opts);
    col.create(m, opts);
    
    expect(spy.calls.count()).toBe(2);
  });
  
  it("#1412 - Trigger 'request' and 'sync' events.", function() {
    var collection = new Backbone.Collection;
    collection.url = '/test';
    Backbone.request = function(settings){ settings.success(); };

    collection.on('request', function(obj, xhr, options) {
      expect(obj === collection).toBe(true);
    });
    collection.on('sync', function(obj, response, options) {
      expect(obj === collection).toBe(true);
    });
    collection.fetch();
    collection.off();

    collection.on('request', function(obj, xhr, options) {
      expect(obj === collection.get(1)).toBe(true);
    });
    collection.on('sync', function(obj, response, options) {
      expect(obj === collection.get(1)).toBe(true);
    });
    collection.create({id: 1});
    collection.off();
  });
  
  it("#1447 - create with wait adds model.", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    var collection = new Backbone.Collection;
    var model = new Backbone.Model;
    model.sync = function(method, model, options){ options.success(); };
    collection.on('add', this.cb);
    collection.create(model, {wait: true});
    
    expect(spy).toHaveBeenCalled();
  });
  
  it("#2606 - Collection#create, success arguments", function() {
    var collection = new Backbone.Collection;
    collection.url = 'test';
    collection.create({}, {
      success: function(model, resp, options) {
        expect(resp).toBe('response');
      }
    });
    
    this.env.ajaxSettings.success('response');
  });
  
});

describe("collection async tests", function() {
  
  // asyncTest("#1939 - `parse` is passed `options`", 1, function () {
  //   var collection = new (Backbone.Collection.extend({
  //     url: '/',
  //     parse: function (data, options) {
  //       strictEqual(options.xhr.someHeader, 'headerValue');
  //       return data;
  //     }
  //   }));
  //   var ajax = Backbone.ajax;
  //   Backbone.ajax = function (params) {
  //     _.defer(params.success);
  //     return {someHeader: 'headerValue'};
  //   };
  //   collection.fetch({
  //     success: function () { start(); }
  //   });
  //   Backbone.ajax = ajax;
  // });
  
});