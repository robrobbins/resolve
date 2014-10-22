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
  
});