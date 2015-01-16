/*global spyOn*/
var _ = require('underscore');
var Backbone = require('../dist/resolve');

beforeEach(function() {
  this.a = new Backbone.Model({id: 3, label: 'a'});
  this.b = new Backbone.Model({id: 2, label: 'b'});
  this.c = new Backbone.Model({id: 1, label: 'c'});
  this.d = new Backbone.Model({id: 0, label: 'd'});
  this.e = null;
  this.col = new Backbone.Collection([this.a, this.b, this.c, this.d]);
  this.otherCol = new Backbone.Collection();
});

describe('The Collection Module', function() {
  
  it("has new and sort", function() {
    var counter = 0;
    this.col.on('sort', function(){ counter++; });
    expect(this.col.first()).toEqual(this.a);
    expect(this.col.last()).toEqual(this.d);
    this.col.comparator = function(a, b) {
      return a.id > b.id ? -1 : 1;
    };
    this.col.sort();
    expect(counter).toBe(1);
    expect(this.col.first()).toEqual(this.a);
    expect(this.col.last()).toEqual(this.d);
    this.col.comparator = function(model) { return model.id; };
    this.col.sort();
    expect(counter).toBe(2);
    expect(this.col.first()).toEqual(this.d);
    expect(this.col.last()).toEqual(this.a);
    expect(this.col.length).toBe(4);
  });
  
  it("uses a string comparator.", function() {
    var collection = new Backbone.Collection([
      {id: 3},
      {id: 1},
      {id: 2}
    ], {comparator: 'id'});
    expect(collection.pluck('id')).toEqual([1, 2, 3]);
  });
  
  it("has new and parse", function() {
    var Collection = Backbone.Collection.extend({
      parse : function(data) {
        return _.filter(data, function(datum) {
          return datum.a % 2 === 0;
        });
      }
    });
    var models = [{a: 1}, {a: 2}, {a: 3}, {a: 4}];
    var collection = new Collection(models, {parse: true});
    expect(collection.length).toBe(2);
    expect(collection.first().get('a')).toBe(2);
    expect(collection.last().get('a')).toBe(4);
  });
  
  it("shows clone preserves model and comparator", function() {
    var Model = Backbone.Model.extend();
    var comparator = function(model){ return model.id; };

    var collection = new Backbone.Collection([{id: 1}], {
      model: Model,
      comparator: comparator
    }).clone();
    collection.add({id: 2});
    expect(collection.at(0) instanceof Model).toBeTruthy();
    expect(collection.at(1) instanceof Model).toBeTruthy();
    expect(collection.comparator).toEqual(comparator);
  });
  
  it("gets", function() {
    expect(this.col.get(0)).toEqual(this.d);
    expect(this.col.get(this.d.clone())).toEqual(this.d);
    expect(this.col.get(2)).toEqual(this.b);
    expect(this.col.get({id: 1})).toEqual(this.c);
    expect(this.col.get(this.c.clone())).toEqual(this.c);
    expect(this.col.get(this.col.first().cid)).toEqual(this.col.first());
  });
  
  it("gets with non-default ids", function() {
    var MongoModel = Backbone.Model.extend({idAttribute: '_id'});
    var model = new MongoModel({_id: 100});
    var col = new Backbone.Collection([model], {model: MongoModel});
    expect(col.get(100)).toEqual(model);
    expect(col.get(model.cid)).toEqual(model);
    expect(col.get(model)).toEqual(model);
    expect(col.get(101)).toBe(undefined);

    var col2 = new Backbone.Collection();
    col2.model = MongoModel;
    col2.add(model.attributes);
    expect(col2.get(model.clone())).toEqual(col2.first());
  });
  
  it('gets with "undefined" id', function() {
    var collection = new Backbone.Collection([{id: 1}, {id: 'undefined'}]);
    expect(collection.get(1).id).toBe(1);
  });
  
  it("updates index when id changes", function() {
    var col = new Backbone.Collection();
    col.add([
      {id : 0, name : 'one'},
      {id : 1, name : 'two'}
    ]);
    var one = col.get(0);
    expect(one.get('name')).toBe('one');
    col.on('change:name', function (model) { expect(this.get(model)).toBeTruthy(); });
    one.set({name: 'dalmatians', id : 101});
    expect(col.get(0)).toBeFalsy();
    expect(col.get(101).get('name')).toBe('dalmatians');
  });
  
  it("ats", function() {
    expect(this.col.at(2)).toEqual(this.c);
    expect(this.col.at(-2)).toEqual(this.c);
  });

  it("plucks", function() {
    expect(this.col.pluck('label').join(' ')).toBe('a b c d');
  });
  
  it("adds", function() {
    var added, opts, secondAdded, e;
    added = opts = secondAdded = null;
    e = new Backbone.Model({id: 10, label : 'e'});
    this.otherCol.add(e);
    this.otherCol.on('add', function() {
      secondAdded = true;
    });
    this.col.on('add', function(model, collection, options){
      added = model.get('label');
      opts = options;
    });
    this.col.add(e, {amazing: true});
    expect(added).toBe('e');
    expect(this.col.length).toBe(5);
    expect(this.col.last()).toEqual(e);
    expect(this.otherCol.length).toBe(1);
    expect(secondAdded).toBe(null);
    expect(opts.amazing).toBe(true);

    var f = new Backbone.Model({id: 20, label : 'f'});
    var g = new Backbone.Model({id: 21, label : 'g'});
    var h = new Backbone.Model({id: 22, label : 'h'});
    var atCol = new Backbone.Collection([f, g, h]);
    expect(atCol.length).toBe(3);
    atCol.add(e, {at: 1});
    expect(atCol.length).toBe(4);
    expect(atCol.at(1)).toEqual(e);
    expect(atCol.last()).toEqual(h);

    var coll = new Backbone.Collection(new Array(2));
    var addCount = 0;
    coll.on('add', function(){
        addCount += 1;
    });
    coll.add([undefined, f, g]);
    expect(coll.length).toBe(5);
    expect(addCount).toBe(3);
    coll.add(new Array(4));
    expect(coll.length).toBe(9);
    expect(addCount).toBe(7);
  });
  
  it("adds multiple models", function() {
    var col = new Backbone.Collection([{at: 0}, {at: 1}, {at: 9}]);
    col.add([{at: 2}, {at: 3}, {at: 4}, {at: 5}, {at: 6}, {at: 7}, {at: 8}], {at: 2});
    for (var i = 0; i <= 5; i++) {
      expect(col.at(i).get('at')).toBe(i);
    }
  });

  it("shows add at should have preference over comparator", function() {
    var Col = Backbone.Collection.extend({
      comparator: function(a,b) {
        return a.id > b.id ? -1 : 1;
      }
    });

    var col = new Col([{id: 2}, {id: 3}]);
    col.add(new Backbone.Model({id: 1}), {at:   1});

    expect(col.pluck('id').join(' ')).toBe('3 1 2');
  });
  
  it("can't add model to collection twice", function() {
    var col = new Backbone.Collection([{id: 1}, {id: 2}, {id: 1}, {id: 2}, {id: 3}]);
    expect(col.pluck('id').join(' ')).toBe('1 2 3');
  });

  it("can't add different model with same id to collection twice", function() {
    var col = new Backbone.Collection;
    col.unshift({id: 101});
    col.add({id: 101});
    expect(col.length).toBe(1);
  });

  it("merges in duplicate models with {merge: true}", function() {
    var col = new Backbone.Collection;
    col.add([{id: 1, name: 'Moe'}, {id: 2, name: 'Curly'}, {id: 3, name: 'Larry'}]);
    col.add({id: 1, name: 'Moses'});
    expect(col.first().get('name')).toBe('Moe');
    col.add({id: 1, name: 'Moses'}, {merge: true});
    expect(col.first().get('name')).toBe('Moses');
    col.add({id: 1, name: 'Tim'}, {merge: true, silent: true});
    expect(col.first().get('name')).toBe('Tim');
  });
  
  it("adds a model to multiple collections", function() {
    var counter = 0;
    var e = new Backbone.Model({id: 10, label : 'e'});
    e.on('add', function(model, collection) {
      counter++;
      expect(e).toEqual(model);
      if (counter > 1) {
        expect(collection).toEqual(colF);
      } else {
        expect(collection).toEqual(colE);
      }
    });
    var colE = new Backbone.Collection([]);
    colE.on('add', function(model, collection) {
      expect(e).toEqual(model);
      expect(colE).toEqual(collection);
    });
    var colF = new Backbone.Collection([]);
    colF.on('add', function(model, collection) {
      expect(e).toEqual(model);
      expect(colF).toEqual(collection);
    });
    colE.add(e);
    expect(e.collection).toEqual(colE);
    colF.add(e);
    expect(e.collection).toEqual(colE);
  });
  
  it("adds model with parse", function() {
    var Model = Backbone.Model.extend({
      parse: function(obj) {
        obj.value += 1;
        return obj;
      }
    });

    var Col = Backbone.Collection.extend({model: Model});
    var col = new Col;
    col.add({value: 1}, {parse: true});
    expect(col.at(0).get('value')).toBe(2);
  });
  
  it("adds with parse and merge", function() {
    var collection = new Backbone.Collection();
    collection.parse = function(attrs) {
      return _.map(attrs, function(model) {
        if (model.model) return model.model;
        return model;
      });
    };
    collection.add({id: 1});
    collection.add({model: {id: 1, name: 'Alf'}}, {parse: true, merge: true});
    expect(collection.first().get('name')).toBe('Alf');
  });
  
  it("is a comparator that depends on `this`", function() {
    var col = new Backbone.Collection;
    col.negative = function(num) {
      return -num;
    };
    col.comparator = function(a) {
      return this.negative(a.id);
    };
    col.add([{id: 1}, {id: 2}, {id: 3}]);
    expect(col.pluck('id')).toEqual([3, 2, 1]);
    col.comparator = function(a, b) {
      return this.negative(b.id) - this.negative(a.id);
    };
    col.sort();
    expect(col.pluck('id')).toEqual([1, 2, 3]);
  });
  
  it("adds model to collection with sort()-style comparator", function() {
    var col = new Backbone.Collection;
    col.comparator = function(a, b) {
      return a.get('name') < b.get('name') ? -1 : 1;
    };
    var tom = new Backbone.Model({name: 'Tom'});
    var rob = new Backbone.Model({name: 'Rob'});
    var tim = new Backbone.Model({name: 'Tim'});
    col.add(tom);
    col.add(rob);
    col.add(tim);
    expect(col.indexOf(rob)).toBe(0);
    expect(col.indexOf(tim)).toBe(1);
    expect(col.indexOf(tom)).toBe(2);
  });
  
  it("removes", function() {
    var removed = null;
    var otherRemoved = null;
    this.col.on('remove', function(model, col, options) {
      removed = model.get('label');
      expect(options.index).toBe(3);
    });
    this.otherCol.on('remove', function(model, col, options) {
      otherRemoved = true;
    });
    this.col.remove(this.d);
    expect(removed, 'd');
    expect(this.col.length).toBe(3);
    expect(this.col.first()).toBe(this.a);
    expect(otherRemoved).toBe(null);
  });
  
  it("adds and removes return values", function() {
    var Even = Backbone.Model.extend({
      validate: function(attrs) {
        if (attrs.id % 2 !== 0) return "odd";
      }
    });
    var col = new Backbone.Collection;
    col.model = Even;

    var list = col.add([{id: 2}, {id: 4}], {validate: true});
    expect(list.length).toBe(2);
    expect(list[0] instanceof Backbone.Model).toBe(true);
    expect(list[1]).toEqual(col.last());
    expect(list[1].get('id')).toBe(4);

    list = col.add([{id: 3}, {id: 6}], {validate: true});
    expect(col.length).toBe(3);
    expect(list[0]).toBe(false);
    expect(list[1].get('id')).toBe(6);

    var result = col.add({id: 6});
    expect(result.cid).toBe(list[1].cid);

    result = col.remove({id: 6});
    expect(col.length).toBe(2);
    expect(result.id).toBe(6);

    list = col.remove([{id: 2}, {id: 8}]);
    expect(col.length).toBe(1);
    expect(list[0].get('id')).toBe(2);
    expect(list[1]).toBeFalsy();
  });
  
  it("can shift and pop", function() {
    var col = new Backbone.Collection([{a: 'a'}, {b: 'b'}, {c: 'c'}]);
    expect(col.shift().get('a')).toBe('a');
    expect(col.pop().get('c')).toBe('c');
  });

  it("slices", function() {
    var col = new Backbone.Collection([{a: 'a'}, {b: 'b'}, {c: 'c'}]);
    var array = col.slice(1, 3);
    expect(array.length).toBe(2);
    expect(array[0].get('b')).toBe('b');
  });

  it("shows events are unbound on remove", function() {
    var counter = 0;
    var dj = new Backbone.Model();
    var emcees = new Backbone.Collection([dj]);
    emcees.on('change', function(){ counter++; });
    dj.set({name : 'Kool'});
    expect(counter).toBe(1);
    emcees.reset([]);
    expect(dj.collection).toBe(undefined);
    dj.set({name : 'Shadow'});
    expect(counter).toBe(1);
  });
  
  it("removes in multiple collections", function() {
    var modelData = {
      id : 5,
      title : 'Othello'
    };
    var passed = false;
    var e = new Backbone.Model(modelData);
    var f = new Backbone.Model(modelData);
    f.on('remove', function() {
      passed = true;
    });
    var colE = new Backbone.Collection([e]);
    var colF = new Backbone.Collection([f]);
    expect(e != f).toBe(true);
    expect(colE.length === 1).toBe(true);
    expect(colF.length === 1).toBe(true);
    colE.remove(e);
    expect(passed).toBe(false);
    expect(colE.length === 0).toBe(true);
    colF.remove(e);
    expect(colF.length === 0).toBe(true);
    expect(passed).toBe(true);
  });
  
  it("removes same model in multiple collection", function() {
    var counter = 0;
    var e = new Backbone.Model({id: 5, title: 'Othello'});
    e.on('remove', function(model, collection) {
      counter++;
      expect(e).toEqual(model);
      if (counter > 1) {
        expect(collection).toEqual(colE);
      } else {
        expect(collection).toEqual(colF);
      }
    });
    var colE = new Backbone.Collection([e]);
    colE.on('remove', function(model, collection) {
      expect(e).toEqual(model);
      expect(colE).toEqual(collection);
    });
    var colF = new Backbone.Collection([e]);
    colF.on('remove', function(model, collection) {
      expect(e).toEqual(model);
      expect(colF).toEqual(collection);
    });
    expect(colE).toEqual(e.collection);
    colF.remove(e);
    expect(colF.length === 0).toBe(true);
    expect(colE.length === 1).toBe(true);
    expect(counter).toBe(1);
    expect(colE).toEqual(e.collection);
    colE.remove(e);
    expect(e.collection).toBeFalsy();
    expect(colE.length === 0).toBe(true);
    expect(counter).toBe(2);
  });
  
  it("initializes", function() {
    var Collection = Backbone.Collection.extend({
      initialize: function() {
        this.one = 1;
      }
    });
    var coll = new Collection;
    expect(coll.one).toBe(1);
  });

  it("toJSONs", function() {
    expect(JSON.stringify(this.col)).toBe('[{"id":3,"label":"a"},{"id":2,"label":"b"},{"id":1,"label":"c"},{"id":0,"label":"d"}]');
  });
  
  it("implements where and findWhere", function() {
    var model = new Backbone.Model({a: 1});
    var coll = new Backbone.Collection([
      model,
      {a: 1},
      {a: 1, b: 2},
      {a: 2, b: 2},
      {a: 3}
    ]);
    expect(coll.where({a: 1}).length, 3);
    expect(coll.where({a: 2}).length, 1);
    expect(coll.where({a: 3}).length, 1);
    expect(coll.where({b: 1}).length, 0);
    expect(coll.where({b: 2}).length, 2);
    expect(coll.where({a: 1, b: 2}).length, 1);
    expect(coll.findWhere({a: 1}), model);
    expect(coll.findWhere({a: 4}), void 0);
  });
  
  it("has Underscore methods", function() {
    expect(this.col.map(function(model){ return model.get('label'); }).join(' ')).toBe('a b c d');
    expect(this.col.any(function(model){ return model.id === 100; })).toBe(false);
    expect(this.col.any(function(model){ return model.id === 0; })).toBe(true);
    expect(this.col.indexOf(this.b)).toBe(1);
    expect(this.col.size()).toBe(4);
    expect(this.col.rest().length).toBe(3);
    expect(_.include(this.col.rest(), this.a)).toBe(false);
    expect(_.include(this.col.rest(), this.d)).toBe(true);
    expect(this.col.isEmpty()).toBe(false);
    expect(_.include(this.col.without(this.d), this.d)).toBe(false);
    expect(this.col.max(function(model){ return model.id; }).id).toBe(3);
    expect(this.col.min(function(model){ return model.id; }).id).toBe(0);
    expect(this.col.chain()
            .filter(function(o){ return o.id % 2 === 0; })
            .map(function(o){ return o.id * 2; })
            .value())
            .toEqual([4, 0]);
            
    expect(this.col.difference([this.c, this.d])).toEqual([this.a, this.b]);
    expect(this.col.include(this.col.sample())).toBe(true);
    var first = this.col.first();
    expect(this.col.indexBy('id')[first.id] === first).toBe(true);
  });
  
  it("resets", function() {
    var resetCount = 0;
    var models = this.col.models;
    this.col.on('reset', function() { resetCount += 1; });
    this.col.reset([]);
    expect(resetCount).toBe(1);
    expect(this.col.length).toBe(0);
    expect(this.col.last()).toBeFalsy();
    this.col.reset(models);
    expect(resetCount).toBe(2);
    expect(this.col.length).toBe(4);
    expect(this.col.last()).toBe(this.d);
    this.col.reset(_.map(models, function(m){ return m.attributes; }));
    expect(resetCount).toBe(3);
    expect(this.col.length).toBe(4);
    expect(this.col.last() !== this.d).toBe(true);
    expect(_.isEqual(this.col.last().attributes, this.d.attributes)).toBe(true);
    this.col.reset();
    expect(this.col.length).toBe(0);
    expect(resetCount).toBe(4);

    var f = new Backbone.Model({id: 20, label : 'f'});
    this.col.reset([undefined, f]);
    expect(this.col.length).toBe(2);
    expect(resetCount).toBe(5);

    this.col.reset(new Array(4));
    expect(this.col.length).toBe(4);
    expect(resetCount).toBe(6);
  });
  
  it("resets with different values", function(){
    var col = new Backbone.Collection({id: 1});
    col.reset({id: 1, a: 1});
    expect(col.get(1).get('a')).toBe(1);
  });

  it("same references in reset", function() {
    var model = new Backbone.Model({id: 1});
    var collection = new Backbone.Collection({id: 1});
    collection.reset(model);
    expect(collection.get(1)).toEqual(model);
  });
  
  it("reset passes caller options", function() {
    var Model = Backbone.Model.extend({
      initialize: function(attrs, options) {
        this.model_parameter = options.model_parameter;
      }
    });
    var col = new (Backbone.Collection.extend({ model: Model }))();
    col.reset([{ astring: "green", anumber: 1 }, { astring: "blue", anumber: 2 }], { model_parameter: 'model parameter' });
    expect(col.length).toBe(2);
    col.each(function(model) {
      expect(model.model_parameter).toBe('model parameter');
    });
  });
  
  it("reset does not alter options by reference", function() {
    var col = new Backbone.Collection([{id:1}]);
    var origOpts = {};
    col.on("reset", function(col, opts){
      expect(origOpts.previousModels).toBeFalsy();
      expect(opts.previousModels[0].id).toBe(1);
    });
    col.reset([], origOpts);
  });

  it("triggers custom events on models", function() {
    var fired = null;
    this.a.on("custom", function() { fired = true; });
    this.a.trigger("custom");
    expect(fired).toBe(true);
  });

  it("add does not alter arguments", function(){
    var attrs = {};
    var models = [attrs];
    new Backbone.Collection().add(models);
    expect(models.length).toBe(1);
    expect(attrs === models[0]).toBe(true);
  });

  it("#574, remove its own reference to the .models array.", function() {
    var col = new Backbone.Collection([
      {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}
    ]);
    expect(col.length).toBe(6);
    col.remove(col.models);
    expect(col.length).toBe(0);
  });
  
  it("#861, adding models to a collection which do not pass validation, with validate:true", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
      
      var Model = Backbone.Model.extend({
        validate: function(attrs) {
          if (attrs.id === 3) return "id can't be 3";
        }
      });

      var Collection = Backbone.Collection.extend({
        model: Model
      });

      var collection = new Collection;
      collection.on("invalid", this.cb);

      collection.add([{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}], {validate:true});
      
      expect(collection.pluck('id')).toEqual([1, 2, 4, 5, 6]);
      expect(spy).toHaveBeenCalled();
  });

  it("Invalid models are discarded with validate:true.", function() {
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    var collection = new Backbone.Collection;
    collection.on('test', this.cb);
    collection.model = Backbone.Model.extend({
      validate: function(attrs){ if (!attrs.valid) return 'invalid'; }
    });
    var model = new collection.model({id: 1, valid: true});
    collection.add([model, {id: 2}], {validate:true});
    model.trigger('test');
    
    expect(collection.get(model.cid)).toBeTruthy();
    expect(collection.get(1)).toBeTruthy();
    expect(collection.get(2)).toBeFalsy();
    expect(collection.length).toBe(1);
    expect(spy).toHaveBeenCalled();
  });
  
  it("multiple copies of the same model", function() {
    var col = new Backbone.Collection();
    var model = new Backbone.Model();
    col.add([model, model]);
    expect(col.length).toBe(1);
    col.add([{id: 1}, {id: 1}]);
    expect(col.length).toBe(2);
    expect(col.last().id).toBe(1);
  });

  it("#964 - collection.get return inconsistent", function() {
    var c = new Backbone.Collection();
    expect(c.get(null) === undefined).toBe(true);
    expect(c.get() === undefined).toBe(true);
  });

  it("#1112 - passing options.model sets collection.model", function() {
    var Model = Backbone.Model.extend({});
    var c = new Backbone.Collection([{id: 1}], {model: Model});
    expect(c.model === Model).toBe(true);
    expect(c.at(0) instanceof Model).toBe(true);
  });
  
  it("null and undefined are invalid ids.", function() {
    var model = new Backbone.Model({id: 1});
    var collection = new Backbone.Collection([model]);
    model.set({id: null});
    expect(collection.get('null')).toBeFalsy();
    model.set({id: 1});
    model.set({id: undefined});
    expect(collection.get('undefined')).toBeFalsy();
  });

  it("falsy comparator", function(){
    var Col = Backbone.Collection.extend({
      comparator: function(model){ return model.id; }
    });
    var col = new Col();
    var colFalse = new Col(null, {comparator: false});
    var colNull = new Col(null, {comparator: null});
    var colUndefined = new Col(null, {comparator: undefined});
    expect(col.comparator).toBeTruthy();
    expect(colFalse.comparator).toBeFalsy();
    expect(colNull.comparator).toBeFalsy();
    expect(colUndefined.comparator).toBeTruthy();
  });
  
  // TODO sync tests
  // it("#1355 - `options` is passed to success callbacks", 2, function(){
  //   var m = new Backbone.Model({x:1});
  //   var col = new Backbone.Collection();
  //   var opts = {
  //     opts: true,
  //     success: function(collection, resp, options) {
  //       expect(options.opts).toBeTruthy();
  //     }
  //   };
  //   col.sync = m.sync = function( method, collection, options ){
  //     options.success({});
  //   };
  //   col.fetch(opts);
  //   col.create(m, opts);
  // });
  
  it("#1448 - add sorts collection after merge.", function() {
    var collection = new Backbone.Collection([
      {id: 1, x: 1},
      {id: 2, x: 2}
    ]);
    collection.comparator = function(model){ return model.get('x'); };
    collection.add({id: 1, x: 3}, {merge: true});
    expect(collection.pluck('id')).toEqual([2, 1]);
  });
  
  it("#1655 - groupBy can be used with a string argument.", function() {
    var collection = new Backbone.Collection([{x: 1}, {x: 2}]);
    var grouped = collection.groupBy('x');
    expect(_.keys(grouped).length).toBe(2);
    expect(grouped[1][0].get('x')).toBe(1);
    expect(grouped[2][0].get('x')).toBe(2);
  });

  it("#1655 - sortBy can be used with a string argument.", function() {
    var collection = new Backbone.Collection([{x: 3}, {x: 1}, {x: 2}]);
    var values = _.map(collection.sortBy('x'), function(model) {
      return model.get('x');
    });
    expect(values).toEqual([1, 2, 3]);
  });

  // it("#1604 - Removal during iteration.", function() {
  //   var collection = new Backbone.Collection([{}, {}]);
  //   collection.on('add', function() {
  //     collection.at(0).destroy();
  //   });
  //   collection.add({}, {at: 0});
  // });
  
  it("#1638 - `sort` during `add` triggers correctly.", function() {
    var collection = new Backbone.Collection;
    collection.comparator = function(model) { return model.get('x'); };
    var added = [];
    collection.on('add', function(model) {
      model.set({x: 3});
      collection.sort();
      added.push(model.id);
    });
    collection.add([{id: 1, x: 1}, {id: 2, x: 2}]);
    expect(added).toEqual([1, 2]);
  });
  
});
