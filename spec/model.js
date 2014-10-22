/*global spyOn*/
var _ = require('underscore');
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
        expect(this.collection).toBeTruthy();
      }
    });
    
    var model = new Model({}, {collection: new Backbone.Collection});
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
    expect(a.get('foo')).toBe(1);
    expect(a.get('bar')).toBe(2);
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
  
  it("unsets and reflects in changedAttributes", function() {
    var model = new Backbone.Model({a: 1});
    model.on('change', function() {
      expect('a' in model.changedAttributes()).toBeTruthy();
    });
    model.unset('a');
  });
  
  it("uses a non-default id attribute.", function() {
    var MongoModel = Backbone.Model.extend({idAttribute : '_id'});
    var model = new MongoModel({id: 'eye-dee', _id: 25, title: 'Model'});
    expect(model.get('id')).toBe('eye-dee');
    expect(model.id).toBe(25);
    expect(model.isNew()).toBeFalsy();
    model.unset('_id');
    expect(model.id).toBeFalsy();
    expect(model.isNew()).toBe(true);
  });
  
  it("sets an empty string", function() {
    var model = new Backbone.Model({name : "Model"});
    model.set({name : ''});
    expect(model.get('name')).toBe('');
  });
  
  it("sets an object", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    var model = new Backbone.Model({
      custom: { foo: 1 }
    });
    
    model.on('change', this.cb);
    model.set({
      custom: { foo: 1 } // no change should be fired
    });
    model.set({
      custom: { foo: 2 } // change event should be fired
    });
    
    expect(spy.calls.count()).toBe(1);
  });
  
  it("clears", function() {
    var changed;
    var model = new Backbone.Model({id: 1, name : "Model"});
    model.on("change:name", function(){ changed = true; });
    model.on("change", function() {
      var changedAttrs = model.changedAttributes();
      expect('name' in changedAttrs).toBe(true);
    });
    model.clear();
    expect(changed).toBe(true);
    expect(model.get('name')).toBe(undefined);
  });
  
  it("uses defaults", function() {
    var Defaulted = Backbone.Model.extend({
      defaults: {
        "one": 1,
        "two": 2
      }
    });
    var model = new Defaulted({two: undefined});
    expect(model.get('one')).toBe(1);
    expect(model.get('two')).toBe(2);
    Defaulted = Backbone.Model.extend({
      defaults: function() {
        return {
          "one": 3,
          "two": 4
        };
      }
    });
    model = new Defaulted({two: undefined});
    expect(model.get('one')).toBe(3);
    expect(model.get('two')).toBe(4);
  });
  
  it("has change, hasChanged, changedAttributes, previous, previousAttributes", function() {
    var model = new Backbone.Model({name: "Tim", age: 10});
    expect(model.changedAttributes()).toBe(false);
    model.on('change', function() {
      expect(model.hasChanged('name')).toBeTruthy();
      expect(model.hasChanged('age')).toBeFalsy();
      expect(_.isEqual(model.changedAttributes(), {name : 'Rob'})).toBe(true);
      expect(model.previous('name')).toBe('Tim');
      expect(_.isEqual(model.previousAttributes(), {name : "Tim", age : 10})).toBe(true);
    });
    expect(model.hasChanged()).toBe(false);
    expect(model.hasChanged(undefined)).toBe(false);
    model.set({name : 'Rob'});
    expect(model.get('name')).toBe('Rob');
  });
  
  it("has changedAttributes", function() {
    var model = new Backbone.Model({a: 'a', b: 'b'});
    expect(model.changedAttributes()).toBe(false);
    expect(model.changedAttributes({a: 'a'})).toBe(false);
    expect(model.changedAttributes({a: 'b'}).a).toBe('b');
  });
  
  it("changed with options", function() {
    var value;
    var model = new Backbone.Model({name: 'Rob'});
    model.on('change', function(model, options) {
      value = options.prefix + model.get('name');
    });
    model.set({name: 'Bob'}, {prefix: 'Mr. '});
    expect(value).toBe('Mr. Bob');
    model.set({name: 'Sue'}, {prefix: 'Ms. '});
    expect(value).toBe('Ms. Sue');
  });
  
  it("changed after initialize", function () {
    var changed = 0;
    var attrs = {id: 1, label: 'c'};
    var obj = new Backbone.Model(attrs);
    obj.on('change', function() { changed += 1; });
    obj.set(attrs);
    expect(changed).toBe(0);
  });
  
  it("validates", function() {
    var lastError;
    var model = new Backbone.Model();
    model.validate = function(attrs) {
      if (attrs.admin !== this.get('admin')) return "Can't change admin status.";
    };
    model.on('invalid', function(model, error) {
      lastError = error;
    });
    var result = model.set({a: 100});
    expect(result).toEqual(model);
    expect(model.get('a')).toBe(100);
    expect(lastError).toBe(undefined);
    result = model.set({admin: true});
    expect(model.get('admin')).toBe(true);
    result = model.set({a: 200, admin: false}, {validate:true});
    expect(lastError).toBe("Can't change admin status.");
    expect(result).toBe(false);
    expect(model.get('a')).toBe(100);
  });
  
  it("validate on unset and clear", function() {
    var error;
    var model = new Backbone.Model({name: "One"});
    model.validate = function(attrs) {
      if (!attrs.name) {
        error = true;
        return "No thanks.";
      }
    };
    model.set({name: "Two"});
    expect(model.get('name')).toBe('Two');
    expect(error).toBe(undefined);
    model.unset('name', {validate: true});
    expect(error).toBe(true);
    expect(model.get('name')).toBe('Two');
    model.clear({validate:true});
    expect(model.get('name')).toBe('Two');
    delete model.validate;
    model.clear();
    expect(model.get('name')).toBe(undefined);
  });
  
  it("validates with error callback", function() {
    var lastError, boundError;
    var model = new Backbone.Model();
    model.validate = function(attrs) {
      if (attrs.admin) return "Can't change admin status.";
    };
    model.on('invalid', function(model, error) {
      boundError = true;
    });
    var result = model.set({a: 100}, {validate:true});
    expect(result).toEqual(model);
    expect(model.get('a')).toBe(100);
    expect(model.validationError).toBe(null);
    expect(boundError).toBe(undefined);
    result = model.set({a: 200, admin: true}, {validate:true});
    expect(result).toBe(false);
    expect(model.get('a')).toBe(100);
    expect(model.validationError).toBe("Can't change admin status.");
    expect(boundError).toBe(true);
  });
  
  it("shows defaults always extend attrs (#459)", function() {
    var Defaulted = Backbone.Model.extend({
      defaults: {one: 1},
      initialize : function(attrs, opts) {
        expect(this.attributes.one).toBe(1);
      }
    });
    var providedattrs = new Defaulted({});
    var emptyattrs = new Defaulted();
  });
  
  it("Inherits class properties", function() {
    var Parent = Backbone.Model.extend({
      instancePropSame: function() {},
      instancePropDiff: function() {}
    }, {
      classProp: function() {}
    });
    var Child = Parent.extend({
      instancePropDiff: function() {}
    });

    var adult = new Parent;
    var kid   = new Child;

    expect(Child.classProp).toEqual(Parent.classProp);
    expect(Child.classProp).toBeTruthy();

    expect(kid.instancePropSame).toEqual(adult.instancePropSame);
    expect(kid.instancePropSame).toBeTruthy();

    expect(Child.prototype.instancePropDiff).not.toEqual(Parent.prototype.instancePropDiff);
    expect(Child.prototype.instancePropDiff).toBeTruthy();
  });
  
  it("shows nested change events don't clobber previous attributes", function() {
    new Backbone.Model()
    .on('change:state', function(model, newState) {
      expect(model.previous('state')).toBeFalsy();
      expect(newState).toBe('hello');
      // Fire a nested change event.
      model.set({other: 'whatever'});
    })
    .on('change:state', function(model, newState) {
      expect(model.previous('state')).toBeFalsy();
      expect(newState).toBe('hello');
    })
    .set({state: 'hello'});
  });
  
  it("hasChanged/set should use same comparison", function() {
    var changed = 0, model = new Backbone.Model({a: null});
    model.on('change', function() {
      expect(this.hasChanged('a')).toBeTruthy();
    })
    .on('change:a', function() {
      changed++;
    })
    .set({a: undefined});
    expect(changed).toBe(1);
  });
  
  it("#582, #425, change:attribute callbacks should fire after all changes have occurred", function() {
    var model = new Backbone.Model;

    var assertion = function() {
      expect(model.get('a')).toBe('a');
      expect(model.get('b')).toBe('b');
      expect(model.get('c')).toBe('c');
    };

    model.on('change:a', assertion);
    model.on('change:b', assertion);
    model.on('change:c', assertion);

    model.set({a: 'a', b: 'b', c: 'c'});
  });
  
  it("#871, sets with attributes property", function() {
    var model = new Backbone.Model();
    model.set({attributes: true});
    expect(model.has('attributes')).toBeTruthy();
  });

  it("sets value regardless of equality/change", function() {
    var model = new Backbone.Model({x: []});
    var a = [];
    model.set({x: a});
    expect(model.get('x')).toEqual(a);
  });

  it("does not trigger change when setting the same value", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    var model = new Backbone.Model({x: 1});
    model.on('change change:x', this.cb);
    model.set({x: 1});
    model.set({x: 1});
    
    expect(spy).not.toHaveBeenCalled();
  });

  it("does not fire a change for undefined attributes", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    var model = new Backbone.Model({x: undefined});
    model.on('change:x', this.cb);
    model.unset('x');
    
    expect(spy).not.toHaveBeenCalled();    
  });

  it("sets undefined values", function() {
    var model = new Backbone.Model({x: undefined});
    expect('x' in model.attributes).toBe(true);
  });
  
  it("shows hasChanged works outside of change events, and true within", function() {
    var model = new Backbone.Model({x: 1});
    model.on('change:x', function() {
      expect(model.hasChanged('x')).toBe(true);
      expect(model.get('x')).toBe(1);
    });
    model.set({x: 2}, {silent: true});
    expect(model.hasChanged()).toBe(true);
    expect(model.hasChanged('x')).toBe(true);
    model.set({x: 1});
    expect(model.hasChanged()).toBe(true);
    expect(model.hasChanged('x')).toBe(true);
  });
  
  it("shows hasChanged gets cleared on the following set", function() {
    var model = new Backbone.Model;
    model.set({x: 1});
    expect(model.hasChanged()).toBe(true);
    model.set({x: 1});
    expect(model.hasChanged()).toBe(false);
    model.set({x: 2});
    expect(model.hasChanged()).toBe(true);
    model.set({});
    expect(model.hasChanged()).toBe(false);
  });
  
  it("`hasChanged` for falsey keys", function() {
    var model = new Backbone.Model();
    model.set({x: true}, {silent: true});
    expect(model.hasChanged(0)).toBe(false);
    expect(model.hasChanged('')).toBe(false);
  });

  it("honors `previous` for falsey keys", function() {
    var model = new Backbone.Model({0: true, '': true});
    model.set({0: false, '': false}, {silent: true});
    expect(model.previous(0)).toBe(true);
    expect(model.previous('')).toBe(true);
  });
  
  it("honors nested `set` during `'change:attr'`", function() {
    var events = [];
    var model = new Backbone.Model();
    model.on('all', function(event) { events.push(event); });
    model.on('change', function() {
      model.set({z: true}, {silent:true});
    });
    model.on('change:x', function() {
      model.set({y: true});
    });
    model.set({x: true});
    expect(events).toEqual(['change:y', 'change:x', 'change']);
    events = [];
    model.set({z: true});
    expect(events).toEqual([]);
  });
  
  it("shows nested `change` only fires once", function() {
    var model = new Backbone.Model();
    this.cb = function() {model.set({x: true});};
    var spy = spyOn(this, 'cb');
    
    model.on('change', this.cb);
    model.set({x: true});
    
    expect(spy.calls.count()).toBe(1);
  });
  
  it("allows nested `set` during `'change'`", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    var count = 0;
    var model = new Backbone.Model();
    model.on('change', function() {
      switch(count++) {
        case 0:
          expect(this.changedAttributes()).toEqual({x: true});
          expect(model.previous('x')).toBe(undefined);
          model.set({y: true});
          break;
        case 1:
          expect(this.changedAttributes()).toEqual({x: true, y: true});
          expect(model.previous('x')).toBe(undefined);
          model.set({z: true});
          break;
        case 2:
          expect(this.changedAttributes()).toEqual({x: true, y: true, z: true});
          expect(model.previous('y')).toBe(undefined);
          break;
        default:
          this.cb();
      }
    });
    model.set({x: true});
    expect(spy).not.toHaveBeenCalled();
  });
  
  it("honors nested `change` with silent", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    var count = 0;
    var model = new Backbone.Model();
    model.on('change:y', this.cb);
    model.on('change', function() {
      switch(count++) {
        case 0:
          expect(this.changedAttributes()).toEqual({x: true});
          model.set({y: true}, {silent: true});
          model.set({z: true});
          break;
        case 1:
          expect(this.changedAttributes()).toEqual({x: true, y: true, z: true});
          break;
        case 2:
          expect(this.changedAttributes()).toEqual({z: false});
          break;
        default:
          this.cb();
      }
    });
    model.set({x: true});
    model.set({z: false});
    
    expect(spy).not.toHaveBeenCalled();
  });
  
  it("honors nested `change:attr` with silent", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    var model = new Backbone.Model();
    model.on('change:y', this.cb);
    model.on('change', function() {
      model.set({y: true}, {silent: true});
      model.set({z: true});
    });
    model.set({x: true});
    
    expect(spy).not.toHaveBeenCalled();
  });

  it("honors multiple nested changes with silent", function() {
    var model = new Backbone.Model();
    model.on('change:x', function() {
      model.set({y: 1}, {silent: true});
      model.set({y: 2});
    });
    model.on('change:y', function(model, val) {
      expect(val).toBe(2);
    });
    
    model.set({x: true});
  });

  it("honors multiple nested changes with silent", function() {
    var changes = [];
    var model = new Backbone.Model();
    model.on('change:b', function(model, val) { changes.push(val); });
    model.on('change', function() {
      model.set({b: 1});
    });
    model.set({b: 0});
    
    expect(changes).toEqual([0, 1]);
  });

  it("has basic silent change semantics", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    var model = new Backbone.Model;
    model.set({x: 1});
    model.on('change', this.cb);
    model.set({x: 2}, {silent: true});
    model.set({x: 1});
    
    expect(spy.calls.count()).toBe(1);
  });
  
  it("honors nested set multiple times", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    var model = new Backbone.Model();
    model.on('change:b', this.cb);
    model.on('change:a', function() {
      model.set({b: true});
      model.set({b: true});
    });
    model.set({a: true});
    
    expect(spy.calls.count()).toBe(1);
  });

  it("#1122 - clear does not alter options.", function() {
    var model = new Backbone.Model();
    var options = {};
    model.clear(options);
    expect(options.unset).toBeFalsy();
  });

  it("#1122 - unset does not alter options.", function() {
    var model = new Backbone.Model();
    var options = {};
    model.unset('x', options);
    expect(options.unset).toBeFalsy();
  });
  
  it("#1545 - `undefined` can be passed to a model constructor without coersion", function() {
    var Model = Backbone.Model.extend({
      defaults: { one: 1 },
      initialize : function(attrs, opts) {
        expect(attrs).toBe(undefined);
      }
    });
    var emptyattrs = new Model();
    var undefinedattrs = new Model(undefined);
  });
  
  it("#1664 - Changing from one value, silently to another, back to original triggers a change.", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    var model = new Backbone.Model({x:1});
    model.on('change:x', this.cb);
    model.set({x:2},{silent:true});
    model.set({x:3},{silent:true});
    model.set({x:1});
    
    expect(spy.calls.count()).toBe(1);
  });
  
  it("#1664 - multiple silent changes nested inside a change event", function() {
    var changes = [];
    var model = new Backbone.Model();
    model.on('change', function() {
      model.set({a:'c'}, {silent:true});
      model.set({b:2}, {silent:true});
      model.unset('c', {silent:true});
    });
    model.on('change:a change:b change:c', function(model, val) { changes.push(val); });
    model.set({a:'a', b:1, c:'item'});
    
    expect(changes).toEqual(['a',1,'item']);
    expect(model.attributes).toEqual({a: 'c', b: 2});
  });
  
  it("#1791 - `attributes` is available for `parse`", function() {
    var Model = Backbone.Model.extend({
      parse: function() {
        var self = this; 
        expect(function() { self.has('a'); }).not.toThrow(); 
      } // shouldn't throw an error
    });
    var model = new Model(null, {parse: true});
  });
  
  it("silent changes in last `change` event back to original triggers change", function() {
    var changes = [];
    var model = new Backbone.Model();
    model.on('change:a change:b change:c', function(model, val) { changes.push(val); });
    model.on('change', function() {
      model.set({a:'c'}, {silent:true});
    });
    model.set({a:'a'});
    expect(changes).toEqual(['a']);
    model.set({a:'a'});
    expect(changes).toEqual(['a', 'a']);
  });
  
  it("#1943 change calculations should use _.isEqual", function() {
    var model = new Backbone.Model({a: {key: 'value'}});
    model.set('a', {key:'value'}, {silent:true});
    expect(model.changedAttributes()).toBe(false);
  });
  
  it("#1964 - final `change` event is always fired, regardless of interim changes", function () {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    var model = new Backbone.Model();
    model.on('change:property', function() {
      model.set('property', 'bar');
    });
    model.on('change', this.cb);
    model.set('property', 'foo');
    
    expect(spy).toHaveBeenCalled();
  });
  
  it("isValid", function() {
    var model = new Backbone.Model({valid: true});
    model.validate = function(attrs) {
      if (!attrs.valid) return "invalid";
    };
    expect(model.isValid()).toBe(true);
    expect(model.set({valid: false}, {validate:true})).toBe(false);
    expect(model.isValid()).toBe(true);
    model.set({valid:false});
    expect(model.isValid()).toBe(false);
    expect(model.set('valid', false, {validate: true})).toBe(false);
  });
  
  it("#1179 - isValid returns true in the absence of validate.", function() {
    var model = new Backbone.Model();
    model.validate = null;
    expect(model.isValid()).toBe(true);
  });
  
  it("#1961 - Creating a model with {validate:true} will call validate and use the error callback", function () {
    var Model = Backbone.Model.extend({
      validate: function (attrs) {
        if (attrs.id === 1) return "This shouldn't happen";
      }
    });
    var model = new Model({id: 1}, {validate: true});
    expect(model.validationError).toBe("This shouldn't happen");
  });

  it("#2034 - nested set with silent only triggers one change", function() {
    var model = new Backbone.Model();
    this.cb = function() {model.set({b: true}, {silent: true});};
    var spy = spyOn(this, 'cb');
    
    
    model.on('change', this.cb);
    model.set({a: true});
    
    expect(spy.calls.count()).toBe(1);
  });
});