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
  
});