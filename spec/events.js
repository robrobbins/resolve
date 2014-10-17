/*global spyOn*/

var Backbone = require('../dist/resolve');

describe('The Events Module', function() {
  
  it('uses on and trigger', function() {
    var obj = { counter: 0 };
    _.extend(obj, Backbone.Events);
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
    _.extend(obj, Backbone.Events);

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
    _.extend(obj, Backbone.Events);

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
    var a = _.extend({}, Backbone.Events);
    var b = _.extend({}, Backbone.Events);
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
    var a = _.extend({}, Backbone.Events);
    var b = _.extend({}, Backbone.Events);
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    a.listenTo(b, {event: this.cb});
    b.trigger('event'); // 1
    a.listenTo(b, {event2: this.cb});
    b.on('event2', this.cb);
    a.stopListening(b, {event2: this.cb});
    b.trigger('event event2'); // 2, 3
    a.stopListening();
    b.trigger('event event2'); // 4
    
    expect(spy.calls.count()).toBe(4);
  });
  
  it('will stopListening with omitted args', function() {
    var a = _.extend({}, Backbone.Events);
    var b = _.extend({}, Backbone.Events);
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    a.listenTo(b, 'event', this.cb);
    b.on('event', this.cb);
    a.listenTo(b, 'event2', this.cb);
    a.stopListening(null, {event: this.cb});
    b.trigger('event event2');
    b.off();
    a.listenTo(b, 'event event2', this.cb);
    a.stopListening(null, 'event');
    a.stopListening();
    b.trigger('event2');
    
    expect(spy.calls.count()).toBe(2);
  });
  
  it("will listenTo and stopListening with event maps", function() {
    var a = _.extend({}, Backbone.Events);
    var b = _.extend({}, Backbone.Events);
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    a.listenTo(b, {change: this.cb});
    b.trigger('change');
    a.listenTo(b, {change: this.cb});
    a.stopListening();
    b.trigger('change');
    
    expect(spy.calls.count()).toBe(1);
  });
  
  it("will listenTo itself", function(){
    var e = _.extend({}, Backbone.Events);
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    e.listenTo(e, "foo", this.cb);
    e.trigger("foo");
    
    expect(spy).toHaveBeenCalled();
  });
  
  it("will listenTo itself and clean itself up with stopListening", function(){
    var e = _.extend({}, Backbone.Events);
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    e.listenTo(e, "foo", this.cb);
    e.trigger("foo");
    e.stopListening();
    e.trigger("foo");
    
    expect(spy.calls.count()).toBe(1);
  });
  
  it("cleans up references with stopListening", function() {
    var a = _.extend({}, Backbone.Events);
    var b = _.extend({}, Backbone.Events);
    this.cb = function() {};
    
    a.listenTo(b, 'all', this.cb).stopListening();
    expect(Object.keys(a._listeningTo).length).toBe(0);
    a.listenTo(b, 'all', this.cb).stopListening(b);
    expect(Object.keys(a._listeningTo).length).toBe(0);
    a.listenTo(b, 'all', this.cb).stopListening(null, 'all');
    expect(Object.keys(a._listeningTo).length).toBe(0);
    a.listenTo(b, 'all', this.cb).stopListening(null, null, this.cb);
    expect(Object.keys(a._listeningTo).length).toBe(0);
  });
  
  it("cleans up references via listenTo and stopListening", function() {
    var a = _.extend({}, Backbone.Events);
    var b = _.extend({}, Backbone.Events);
    this.cb = function() {};
        
    a.listenTo(b, 'all', this.cb);
    b.trigger('anything');
    a.listenTo(b, 'other', this.cb);
    a.stopListening(b, 'other');
    a.stopListening(b, 'all');
    expect(Object.keys(a._listeningTo).length).toBe(0);
  });
  
  it("doesn't throw an error with listenTo with empty callback", function(){
    var e = _.extend({}, Backbone.Events);
    e.listenTo(e, "foo", null);
    
    expect(function() {e.trigger("foo");}).not.toThrow();
  });
  
  it("will trigger all for each event", function() {
    var a, b, obj = { counter: 0 };
    _.extend(obj, Backbone.Events);
    obj.on('all', function(event) {
      obj.counter++;
      if (event === 'a') a = true;
      if (event === 'b') b = true;
    })
    .trigger('a b');
    
    expect(a).toBe(true);
    expect(b).toBe(true);    
    expect(obj.counter).toBe(2);
  });
  
  it("uses on, then unbinds all functions", function() {
    var obj = { counter: 0 };
    _.extend(obj,Backbone.Events);
    var callback = function() { obj.counter += 1; };
    obj.on('event', callback);
    obj.trigger('event');
    obj.off('event');
    obj.trigger('event');
    
    expect(obj.counter).toBe(1);
  });
  
  it("binds two callbacks, unbinds only one", function() {
    var obj = { counterA: 0, counterB: 0 };
    _.extend(obj,Backbone.Events);
    var callback = function() { obj.counterA += 1; };
    obj.on('event', callback);
    obj.on('event', function() { obj.counterB += 1; });
    obj.trigger('event');
    obj.off('event', callback);
    obj.trigger('event');
    expect(obj.counterA).toBe(1);
    expect(obj.counterB).toBe(2);
  });
  
  it("unbinds a callback in the midst of it firing", function() {
    var obj = {counter: 0};
    _.extend(obj, Backbone.Events);
    var callback = function() {
      obj.counter += 1;
      obj.off('event', callback);
    };
    obj.on('event', callback);
    obj.trigger('event');
    obj.trigger('event');
    obj.trigger('event');
    
    expect(obj.counter).toBe(1);
  });
  
  it("binds a callback with a supplied context", function () {
    var TestClass = function () {
      return this;
    };
    TestClass.prototype.assertTrue = function () {};
    var testClass = new TestClass();
    var spy = spyOn(testClass, 'assertTrue');

    var obj = _.extend({},Backbone.Events);
    obj.on('event', function () { this.assertTrue(); }, (testClass));
    obj.trigger('event');
    
    expect(spy).toHaveBeenCalled();
  });
  
  it("uses a nested trigger with unbind", function () {
    var obj = { counter: 0 };
    _.extend(obj, Backbone.Events);
    var incr1 = function(){ obj.counter += 1; obj.off('event', incr1); obj.trigger('event'); };
    var incr2 = function(){ obj.counter += 1; };
    obj.on('event', incr1);
    obj.on('event', incr2);
    obj.trigger('event');
    
    expect(obj.counter).toBe(3);
  });
  
  it("does not alter the callback list during trigger", function () {
    var counter = 0, obj = _.extend({}, Backbone.Events);
    var incr = function(){ counter++; };
    obj.on('event', function(){ obj.on('event', incr).on('all', incr); })
    .trigger('event');
    
    expect(counter).toBe(0);

    obj.off()
    .on('event', function(){ obj.off('event', incr).off('all', incr); })
    .on('event', incr)
    .on('all', incr)
    .trigger('event');
    
    expect(counter).toBe(2);
  });
  
  it("#1282 - 'all' callback list is retrieved after each event.", function() {
    var counter = 0;
    var obj = _.extend({}, Backbone.Events);
    var incr = function(){ counter++; };
    obj.on('x', function() {
      obj.on('y', incr).on('all', incr);
    })
    .trigger('x y');
    
    expect(counter).toEqual(2);
  });
  
  it("shows if no callback is provided, `on` is a noop", function() {
    _.extend({}, Backbone.Events).on('test').trigger('test');
    
    expect(true).toBe(true);
  });
  
  it("shows if callback is truthy but not a function, `on` should throw an error", function() {
    var view = _.extend({}, Backbone.Events).on('test', 'noop');
    
    expect(function() {view.trigger('test');}).toThrow();
  });
  
  it("removes all events for a specific context", function() {
    var obj = _.extend({}, Backbone.Events);
    this.cb = function() {};
    this.cb2 = function() {};
    var spy = spyOn(this, 'cb');
    var spy2 = spyOn(this, 'cb2');
    
    obj.on('x y all', this.cb);
    obj.on('x y all', this.cb2, obj);
    obj.off(null, null, obj);
    obj.trigger('x y');
    
    expect(spy.calls.count()).toBe(4);
    expect(spy2).not.toHaveBeenCalled();
  });
  
  it("removes all events for a specific callback", function() {
    var obj = _.extend({}, Backbone.Events);
    this.success = function() {};
    this.fail = function() {};
    var spy = spyOn(this, 'success');
    var spy2 = spyOn(this, 'fail');
    
    obj.on('x y all', this.success);
    obj.on('x y all', this.fail);
    
    obj.off(null, this.fail);
    obj.trigger('x y');
    
    expect(spy.calls.count()).toBe(4);
    expect(spy2).not.toHaveBeenCalled();
  });
  
  it("#1310 - off does not skip consecutive events", function() {
    var obj = _.extend({}, Backbone.Events);
    this.cb = function() {};
    var spy = spyOn(this, 'cb');
    
    obj.on('event', this.cb, obj);
    obj.on('event', this.cb, obj);
    obj.off(null, null, obj);
    
    obj.trigger('event');
    
    expect(spy).not.toHaveBeenCalled();
  });
  
});