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

describe('The Model Sync Functionality', function() {
  
  beforeEach(function() {
    this.doc = new this.Proxy({
      id: '1-the-tempest',
      title: 'The Tempest',
      author: 'Bill Shakespeare',
      length: 123
    });
    this.collection = new this.Collection();
    this.collection.add(this.doc);
  });
  
  // SAVE
  
  it("saves within change event", function () {
    var model = new Backbone.Model({firstName : "Taylor", lastName: "Swift"});
    model.url = '/test';
    model.on('change', function () {
      model.save();
      expect(_.isEqual(this.env.syncArgs.model, model)).toBe(true);
    }.bind(this));
    model.set({lastName: 'Hicks'});
  });
  
  it("validates after save", function() {
    var lastError, model = new Backbone.Model();
    model.validate = function(attrs) {
      if (attrs.admin) return "Can't change admin status.";
    };
    model.sync = function(method, model, options) {
      options.success.call(this, {admin: true});
    };
    model.on('invalid', function(model, error) {
      lastError = error;
    });
    model.save(null);

    expect(lastError).toBe("Can't change admin status.");
    expect(model.validationError).toBe("Can't change admin status.");
  });

  it("saves", function() {
    this.doc.save({title : "Henry V"});
    expect(this.env.syncArgs.method).toBe('update');
    expect(_.isEqual(this.env.syncArgs.model, this.doc)).toBe(true);
  });
  
  it("save, fetch, destroy triggers error event when an error occurs", function () {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    var model = new Backbone.Model();
    model.on('error', this.cb);
    
    model.sync = function (method, model, options) {
      options.error();
    };
    
    model.save({data: 2, id: 1});
    model.fetch();
    model.destroy();
    
    expect(spy.calls.count()).toBe(3);
  });

  it("saves with PATCH", function() {
    var obj = {b: 2, d: 4};
    
    this.doc.clear().set({id: 1, a: 1, b: 2, c: 3, d: 4});
    this.doc.save();
    expect(this.env.syncArgs.method).toBe('update');
    expect(this.env.syncArgs.options.attrs).toBeFalsy();

    this.doc.save(obj, {patch: true});
    expect(this.env.syncArgs.method).toBe('patch');
    expect(_.size(this.env.syncArgs.options.attrs)).toBe(2);
    expect(this.env.syncArgs.options.attrs.d).toBe(4);
    expect(this.env.syncArgs.options.attrs.a).toBeFalsy();
    expect(this.env.ajaxSettings.data).toEqual(obj);
  });

  it("saves with PATCH and different attrs", function() {
    var obj = {B: 1, D: 3};
    var obj2 = {b: 2, d: 4};
    
    this.doc.clear().save(obj2, {patch: true, attrs: obj});
    expect(this.env.syncArgs.options.attrs.D).toBe(3);
    expect(this.env.syncArgs.options.attrs.d).toBeFalsy();
    expect(this.env.ajaxSettings.data).toEqual(obj);
    expect(this.doc.attributes).toEqual(obj2);
  });
  
  it("saves in positional style", function() {
      var model = new Backbone.Model();
      model.sync = function(method, model, options) {
        options.success();
      };
      model.save('title', 'Twelfth Night');
      expect(model.get('title')).toBe('Twelfth Night');
    });

  it("saves with non-object success response", function () {
    var model = new Backbone.Model();
    model.sync = function(method, model, options) {
      options.success('', options);
      options.success(null, options);
    };
    model.save({testing:'empty'}, {
      success: function (model) {
        expect(model.attributes).toEqual({testing:'empty'});
      }
    });
  });
  
  it("fetches", function() {
    this.doc.fetch();
    expect(this.env.syncArgs.method).toBe('read');
    expect(_.isEqual(this.env.syncArgs.model, this.doc)).toBe(true);
  });

  it("destroys", function() {
    this.doc.destroy();
    expect(this.env.syncArgs.method).toBe('delete');
    expect(_.isEqual(this.env.syncArgs.model, this.doc)).toBe(true);

    var newModel = new Backbone.Model;
    expect(newModel.destroy()).toBe(false);
  });

  it("non-persisted destroy", function() {
    var a = new Backbone.Model({ 'foo': 1, 'bar': 2, 'baz': 3});
    var spy = spyOn(a, 'sync');
    a.destroy();
    
    expect(spy).not.toHaveBeenCalled();
  });
  
  it("saves with `wait` succeeds without `validate`", function() {
    var model = new Backbone.Model();
    model.url = '/test';
    model.save({x: 1}, {wait: true});
    expect(this.env.syncArgs.model === model).toBe(true);
  });

  it("saves without `wait` doesn't set invalid attributes", function () {
    var model = new Backbone.Model();
    model.validate = function () { return 1; };
    model.save({a: 1});
    expect(model.get('a')).toBeFalsy();
  });

  it("save doesn't validate twice", function () {
    var model = new Backbone.Model();
    var times = 0;
    model.sync = function () {};
    model.validate = function () { ++times; };
    model.save({});
    expect(times).toBe(1);
  });
  
  it("`save` with `wait` sends correct attributes", function() {
    var changed = 0;
    var model = new Backbone.Model({x: 1, y: 2});
    model.url = '/test';
    model.on('change:x', function() { changed++; });
    model.save({x: 3}, {wait: true});
    expect(this.env.ajaxSettings.data).toEqual({x: 3, y: 2});
    expect(model.get('x')).toBe(1);
    expect(changed).toBe(0);
    this.env.syncArgs.options.success({});
    expect(model.get('x')).toBe(3);
    expect(changed).toBe(1);
  });
  
  it("a failed `save` with `wait` doesn't leave attributes behind", function() {
    var model = new Backbone.Model;
    model.url = '/test';
    model.save({x: 1}, {wait: true});
    expect(model.get('x')).toBe(undefined);
  });

  it("#1030 - `save` with `wait` results in correct attributes if success is called during sync", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    var model = new Backbone.Model({x: 1, y: 2});
    
    model.sync = function(method, model, options) {
      options.success();
    };
    model.on("change:x", this.cb);
    model.save({x: 3}, {wait: true});
    
    expect(spy).toHaveBeenCalled();
    expect(model.get('x')).toBe(3);
  });
  
  it("save with wait validates attributes", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    var model = new Backbone.Model();
    
    model.url = '/test';
    model.validate = this.cb;
    
    model.save({x: 1}, {wait: true});
    
    expect(spy).toHaveBeenCalled();
  });

  it("save turns on parse flag", function () {
    var Model = Backbone.Model.extend({
      sync: function(method, model, options) { expect(options.parse).toBeTruthy(); }
    });
    new Model().save();
  });
  
  it("#1355 - `options` is passed to success callbacks", function() {
    var model = new Backbone.Model();
    var opts = {
      success: function( model, resp, options ) {
        expect(options).toBeTruthy();
      }
    };
    var spy = spyOn(opts, 'success').and.callThrough();
    
    model.sync = function(method, model, options) {
      options.success();
    };
    
    model.save({id: 1}, opts);
    model.fetch(opts);
    model.destroy(opts);
    
    expect(spy.calls.count()).toBe(3);
  });
  
  it("#1412 - Trigger 'sync' event.", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    var model = new Backbone.Model({id: 1});
    
    model.sync = function (method, model, options) { options.success(); };
    model.on('sync', this.cb);
    model.fetch();
    model.save();
    model.destroy();
    
    expect(spy.calls.count()).toBe(3);
  });
  
  it("#1365 - Destroy: New models execute success callback.", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    new Backbone.Model()
    .on('sync', this.cb)
    .on('destroy', this.cb)
    .destroy({ success: this.cb });
    
    expect(spy.calls.count()).toBe(2);
  });

  it("#1433 - Save: An invalid model cannot be persisted.", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    var model = new Backbone.Model;
    model.validate = function(){ return 'invalid'; };
    model.sync = this.cb;
    
    expect(model.save()).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("#1377 - Save without attrs triggers 'error'.", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    var Model = Backbone.Model.extend({
      url: '/test/',
      sync: function(method, model, options){ options.success(); },
      validate: function(){ return 'invalid'; }
    });
    var model = new Model({id: 1});
    
    model.on('invalid', this.cb);
    model.save();
    
    expect(spy).toHaveBeenCalled();
  });
  
  it("toJSON receives attrs during save(..., {wait: true})", function() {
    var Model = Backbone.Model.extend({
      url: '/test',
      toJSON: function() {
        expect(this.attributes.x).toBe(1);
        return _.clone(this.attributes);
      }
    });
    var model = new Model;
    model.save({x: 1}, {wait: true});
  });
  
  // DESTROY
  
  it("destroy", function() {
    this.doc.destroy();
    
    expect(this.env.syncArgs.method).toBe('delete');
    expect(_.isEqual(this.env.syncArgs.model, this.doc)).toBe(true);

    var newModel = new Backbone.Model;
    
    expect(newModel.destroy()).toBe(false);
  });

  it("non-persisted destroy", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    var a = new Backbone.Model({ 'foo': 1, 'bar': 2, 'baz': 3});
    
    a.sync = this.cb;
    a.destroy();
    
    expect(spy).not.toHaveBeenCalled();
  });
  
  it("#1365 - Destroy: New models execute success callback", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    new Backbone.Model()
    .on('sync', this.cb)
    .on('destroy', this.cb)
    .destroy({ success: this.cb });
    
    expect(spy.calls.count()).toBe(2);
  });
  
  // FETCH
  
  it("fetches", function() {
    this.doc.fetch();
    
    expect(this.env.syncArgs.method).toBe('read');
    expect(_.isEqual(this.env.syncArgs.model, this.doc)).toBe(true);
  });
  
});

describe("async model-sync tests", function() {
  
  beforeEach(function() {
    timerCallback = jasmine.createSpy("timerCallback");
    jasmine.clock().install();
  });
  
  afterEach(function() {
    jasmine.clock().uninstall();
  });
  
  it("#1478 - Model `save` does not trigger change on unchanged attributes", function() {
    var Model = Backbone.Model.extend({
      sync: function(method, model, options) {
        
        setTimeout(function(){
          options.success();
        }, 10);
      }
    });
    
    new Model({x: true})
    .on('change:x', timerCallback)
    .save(null, {wait: true});
    
    jasmine.clock().tick(11);
    expect(timerCallback).not.toHaveBeenCalled();
  });
  
});