var $ = require('cash-js');
var Backbone = require('../dist/resolve');

describe('The Events Module', function() {
  
  it('uses on and trigger', function() {
    var obj = { counter: 0 };
    $.extend(obj,Backbone.Events);
    obj.on('event', function() { obj.counter += 1; });
    obj.trigger('event');
    
    expect(obj.counter).toBe(1);
    
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    expect(obj.counter).toBe(5);
  });
  
  it('binds and triggers multiple events', function() {
    var obj = { counter: 0 };
    $.extend(obj, Backbone.Events);

    obj.on('a b c', function() { obj.counter += 1; });

    obj.trigger('a');
    expect(obj.counter).toBe(1);

    obj.trigger('a b');
    expect(obj.counter).toBe(3);

    obj.trigger('c');
    expect(obj.counter).toBe(4);

    obj.off('a c');
    obj.trigger('a b c');
    expect(obj.counter).toBe(5);
  });
  
  it('binds and triggers with event maps', function() {
    var obj = { counter: 0 };
    $.extend(obj, Backbone.Events);

    var increment = function() {
      this.counter += 1;
    };

    obj.on({
      a: increment,
      b: increment,
      c: increment
    }, obj);

    obj.trigger('a');
    expect(obj.counter).toBe(1);

    obj.trigger('a b');
    expect(obj.counter).toBe(3);

    obj.trigger('c');
    expect(obj.counter).toBe(4);

    obj.off({
      a: increment,
      c: increment
    }, obj);
    
    obj.trigger('a b c');
    expect(obj.counter).toBe(5);
  });
  
  it('can listenTo and stopListening', function() {
    var a = $.extend({}, Backbone.Events);
    var b = $.extend({}, Backbone.Events);
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    a.listenTo(b, 'all', this.cb);
    b.trigger('anything');
    a.listenTo(b, 'all', this.cb);
    a.stopListening();
    b.trigger('anything');
    
    expect(spy.calls.count()).toBe(1);
  });
  
  it('can listenTo and stopListening with event maps', function() {
    var a = $.extend({}, Backbone.Events);
    var b = $.extend({}, Backbone.Events);
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    a.listenTo(b, {event: this.cb});
    b.trigger('event');
    a.listenTo(b, {event2: this.cb});
    b.on('event2', this.cb);
    a.stopListening(b, {event2: this.cb});
    b.trigger('event event2');
    a.stopListening();
    b.trigger('event event2');
    
    expect(spy.calls.count()).toBe(4);
  });
  
});