var CollisionsListener, DarkMatter, bodies,
  __slice = [].slice;

bodies = function(name) {
  return function() {
    var args, b, _ref;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    b = (_ref = Matter.Bodies)[name].apply(_ref, args);
    this.add(b);
    return b;
  };
};

CollisionsListener = {
  _onevent: function(event, call) {
    var pair, _i, _len, _ref, _results;
    _ref = event.pairs;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      pair = _ref[_i];
      _results.push([pair.bodyA.id + "_" + pair.bodyB.id, pair.bodyB.id + "_" + pair.bodyA.id, pair.bodyA.id, pair.bodyB.id, pair.bodyA.label, pair.bodyB.label].forEach((function(_this) {
        return function(id) {
          var lsn;
          lsn = _this.listeners[id];
          if (lsn && lsn[call]) {
            return lsn[call](pair);
          }
        };
      })(this)));
    }
    return _results;
  },
  start: function(event) {
    return this._onevent(event, "start");
  },
  end: function(event) {
    return this._onevent(event, "end");
  },
  active: function(event) {
    return this._onevent(event, "active");
  },
  listeners: {},
  add: function(from, to, listener) {
    var _ref;
    if (!listener) {
      return this.listeners[(_ref = from.id) != null ? _ref : from] = to;
    } else {
      return this.listeners[from.id + "_" + to.id] = listener;
    }
  }
};

DarkMatter = (function() {
  function DarkMatter(element, options) {
    this.engine = Matter.Engine.create(element, options);
    Matter.Events.on(this.engine, 'collisionStart', (function(_this) {
      return function(e) {
        return CollisionsListener.start(e);
      };
    })(this));
    Matter.Events.on(this.engine, 'collisionActive', (function(_this) {
      return function(e) {
        return CollisionsListener.active(e);
      };
    })(this));
    Matter.Events.on(this.engine, 'collisionEnd', (function(_this) {
      return function(e) {
        return CollisionsListener.end(e);
      };
    })(this));
  }

  DarkMatter.prototype.pause = function(gv) {
    return this.engine.enabled = false;
  };

  DarkMatter.prototype.setView = function(x, y, w, h) {
    this.engine.render.bounds.min.x = x;
    this.engine.render.bounds.min.y = y;
    this.engine.render.bounds.max.x = x + w;
    return this.engine.render.bounds.max.y = y + h;
  };

  DarkMatter.prototype.resume = function() {
    return this.engine.enabled = true;
  };

  DarkMatter.prototype.clear = function() {
    Matter.World.clear(this.engine.world);
    return Matter.Engine.clear(this.engine);
  };

  DarkMatter.prototype.run = function(beforeUpdate) {
    if (beforeUpdate == null) {
      beforeUpdate = function() {};
    }
    Matter.Engine.run(this.engine);
    return Matter.Events.on(this.engine, 'beforeUpdate', beforeUpdate);
  };

  DarkMatter.prototype.oncollision = function(objA, objB, listener) {
    return CollisionsListener.add(objA, objB, listener);
  };

  DarkMatter.prototype.add = function() {
    var items;
    items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (items[0].splice) {
      return this.add.apply(this, items[0]);
    }
    return Matter.World.add(this.engine.world, items);
  };

  DarkMatter.prototype.rectangle = bodies("rectangle");

  DarkMatter.prototype.polygon = bodies("polygon");

  DarkMatter.prototype.circle = bodies("circle");

  DarkMatter.prototype.apply = function(body, vector, position) {
    return Matter.Body.applyForce(body, position != null ? position : body.position, vector);
  };

  DarkMatter.prototype.rotate = function(body, angle) {
    return Matter.Body.rotate(body, angle);
  };

  DarkMatter.prototype.resize = function(maxX, maxY) {
    return this.engine.world.bounds.max = {
      x: maxX,
      y: maxY
    };
  };

  DarkMatter.prototype.resizeRender = function(width, height) {
    return Matter.Render.resize(this.engine.render, width, height);
  };

  DarkMatter.vector = function(dx, dy) {
    return {
      x: dx,
      y: dy
    };
  };

  return DarkMatter;

})();

window.DarkMatter = DarkMatter;
