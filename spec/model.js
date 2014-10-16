/*global spyOn*/

var $ = require('cash-js');
var Backbone = require('../dist/resolve');

beforeEach(function() {
  this.proxy = Backbone.Model.extend();
  this.doc = undefined;
});

describe('The Model Module', function() {
  
  beforeEach(function() {
    this.doc = new this.proxy({
      id: '1-the-tempest',
      title: 'The Tempest',
      author: 'Bill Shakespeare',
      length: 123
    });
  });
  
  it("initializes", function() {
    var Model = Backbone.Model.extend({
      initialize: function() {
        this.one = 1;
        this.set('two', 2);
        // equal(this.collection, collection);
      }
    });
    
    var model = new Model({});
    expect(model.one).toBe(1);
    expect(model.get('two')).toBe(2);
  });
  
  it("initializes with attributes and options", function() {
    var Model = Backbone.Model.extend({
      initialize: function(attributes, options) {
        this.one = options.one;
      }
    });
    
    var model = new Model({}, {one: 1});
    expect(model.one).toBe(1);
  });
  
  it("initializes with parsed attributes", function() {
    var Model = Backbone.Model.extend({
      parse: function(attrs) {
        attrs.value += 1;
        return attrs;
      }
    });
    
    var model = new Model({value: 1}, {parse: true});
    expect(model.get('value')).toBe(2);
  });
  
  it("initializes with defaults", function() {
    var Model = Backbone.Model.extend({
      defaults: {
        first_name: 'Unknown',
        last_name: 'Unknown'
      }
    });
    
    var model = new Model({'first_name': 'John'});
    expect(model.get('first_name')).toBe('John');
    expect(model.get('last_name')).toBe('Unknown');
  });
  
  it("shows parse can return null", function() {
    var Model = Backbone.Model.extend({
      parse: function(attrs) {
        attrs.value += 1;
        return null;
      }
    });
    var model = new Model({value: 1}, {parse: true});
    expect(JSON.stringify(model.toJSON())).toEqual("{}");
  });
  
  it("implements url", function() {
    this.doc.urlRoot = '/collection';
    expect(this.doc.url()).toBe('/collection/1-the-tempest');
    // doc.collection.url = '/collection/';
    // equal(doc.url(), '/collection/1-the-tempest');
    // doc.collection = null;
    this.doc.urlRoot = null;
    expect(function() { return this.doc.url(); }).toThrow();
    // doc.collection = collection;
  });
  
  it("has a url when using urlRoot, and uri encoding", function() {
    var Model = Backbone.Model.extend({
      urlRoot: '/collection'
    });
    var model = new Model();
    expect(model.url()).toBe('/collection');
    model.set({id: '+1+'});
    expect(model.url()).toBe('/collection/%2B1%2B');
  });
  
  it("has a url when using urlRoot as a function to determine urlRoot at runtime", function() {
    var Model = Backbone.Model.extend({
      urlRoot: function() {
        return '/nested/' + this.get('parent_id') + '/collection';
      }
    });

    var model = new Model({parent_id: 1});
    expect(model.url()).toBe('/nested/1/collection');
    model.set({id: 2});
    expect(model.url()).toBe('/nested/1/collection/2');
  });
  
  it("clones", function() {
    var a = new Backbone.Model({ 'foo': 1, 'bar': 2, 'baz': 3});
    var b = a.clone();
    expect(a.get('foo')).toBe(1);;
    expect(a.get('bar')).toBe(2)
    expect(a.get('baz')).toBe(3);
    expect(b.get('foo')).toBe(a.get('foo'));
    expect(b.get('bar')).toBe(a.get('bar'));
    expect(b.get('baz')).toBe(a.get('baz'));
    
    a.set({foo : 100});
    
    expect(a.get('foo')).toBe(100);
    expect(b.get('foo')).toBe(1);

    var foo = new Backbone.Model({p: 1});
    var bar = new Backbone.Model({p: 2});
    bar.set(foo.clone().attributes, {unset: true});
    
    expect(foo.get('p')).toBe(1);
    expect(bar.get('p')).toBe(undefined);
  });
  
  it("isNew", function() {
    var a = new Backbone.Model({ 'foo': 1, 'bar': 2, 'baz': 3});
    expect(a.isNew()).toBeTruthy();
    a = new Backbone.Model({ 'foo': 1, 'bar': 2, 'baz': 3, 'id': -5 });
    expect(a.isNew()).toBeFalsy();
    a = new Backbone.Model({ 'foo': 1, 'bar': 2, 'baz': 3, 'id': 0 });
    expect(a.isNew()).toBeFalsy();
    expect( new Backbone.Model({          }).isNew()).toBeTruthy();
    expect(new Backbone.Model({ 'id': 2  }).isNew()).toBeFalsy();
    expect(new Backbone.Model({ 'id': -5 }).isNew()).toBeFalsy();
  });
  
  it("gets", function() {
    expect(this.doc.get('title')).toBe('The Tempest');
    expect(this.doc.get('author')).toBe('Bill Shakespeare');
  });

  it("escapes", function() {
    expect(this.doc.escape('title')).toBe('The Tempest');
    this.doc.set({audience: 'Bill & Bob'});
    expect(this.doc.escape('audience')).toBe('Bill &amp; Bob');
    this.doc.set({audience: 'Tim > Joan'});
    expect(this.doc.escape('audience')).toBe('Tim &gt; Joan');
    this.doc.set({audience: 10101});
    expect(this.doc.escape('audience')).toBe('10101');
    this.doc.unset('audience');
    expect(this.doc.escape('audience')).toBe('');
  });
  
  it("has", function() {
    var model = new Backbone.Model();

    expect(model.has('name')).toEqual(false);

    model.set({
      '0': 0,
      '1': 1,
      'true': true,
      'false': false,
      'empty': '',
      'name': 'name',
      'null': null,
      'undefined': undefined
    });

    expect(model.has('0')).toEqual(true);
    expect(model.has('1')).toEqual(true);
    expect(model.has('true')).toEqual(true);
    expect(model.has('false')).toEqual(true);
    expect(model.has('empty')).toEqual(true);
    expect(model.has('name')).toEqual(true);

    model.unset('name');

    expect(model.has('name')).toEqual(false);
    expect(model.has('null')).toEqual(false);
    expect(model.has('undefined')).toEqual(false);
  });
  
  it("can set and unset", function() {
    var a = new Backbone.Model({id: 'id', foo: 1, bar: 2, baz: 3});
    var changeCount = 0;
    a.on("change:foo", function() { changeCount += 1; });
    a.set({'foo': 2});
    expect(a.get('foo')).toBe(2);
    expect(changeCount).toBe(1);
    a.set({'foo': 2}); // set with value that is not new shouldn't fire change event
    expect(a.get('foo')).toBe(2);
    expect(changeCount).toBe(1);

    a.validate = function(attrs) {
      expect(attrs.foo).toBeFalsy();
    };
    
    a.unset('foo', {validate: true});
    expect(a.get('foo')).toBeFalsy();
    delete a.validate;
    expect(changeCount).toBe(2);

    a.unset('id');
    expect(a.id).toBe(undefined);
  });
  
  it("#2030 - set with failed validate, followed by another set triggers change", function () {
    var attr = 0, main = 0, error = 0;
    var Model = Backbone.Model.extend({
      validate: function (attr) {
        if (attr.x > 1) {
          error++;
          return "this is an error";
        }
      }
    });
    var model = new Model({x:0});
      model.on('change:x', function () { attr++; });
      model.on('change', function () { main++; });
      model.set({x:2}, {validate:true});
      model.set({x:1}, {validate:true});
      
      expect([attr, main, error]).toEqual([1, 1, 1]);
  });
  
  it("triggers changes in the correct order when set", function() {
    var value = null;
    var model = new Backbone.Model;
    model.on('last', function(){ value = 'last'; });
    model.on('first', function(){ value = 'first'; });
    model.trigger('first');
    model.trigger('last');
    expect(value).toBe('last');
  });
  
  it("sets falsy values in the correct order", function() {
    var model = new Backbone.Model({result: 'result'});
    model.on('change', function() {
      expect(model.changed.result).toBe(undefined);
      expect(model.previous('result')).toBe(false);
    });
    model.set({result: void 0}, {silent: true});
    model.set({result: null}, {silent: true});
    model.set({result: false}, {silent: true});
    model.set({result: void 0});
  });
  
  it("shows nested set triggers with the correct options", function() {
      var model = new Backbone.Model();
      var o1 = {};
      var o2 = {};
      var o3 = {};
      model.on('change', function(__, options) {
        switch (model.get('a')) {
        case 1:
          expect(options).toEqual(o1);
          return model.set('a', 2, o2);
        case 2:
          expect(options).toEqual(o2);
          return model.set('a', 3, o3);
        case 3:
          expect(options).toEqual(o3);
        }
      });
    model.set('a', 1, o1);
  });
  
  it("multiple unsets", function() {
    var i = 0;
    var counter = function(){ i++; };
    var model = new Backbone.Model({a: 1});
    model.on("change:a", counter);
    model.set({a: 2});
    model.unset('a');
    model.unset('a');
    expect(i).toBe(2);
  });
  
  it("unset and changedAttributes", function() {
    var model = new Backbone.Model({a: 1});
    model.on('change', function() {
      expect('a' in model.changedAttributes()).toBeTruthy();
    });
    model.unset('a');
  });
  
});