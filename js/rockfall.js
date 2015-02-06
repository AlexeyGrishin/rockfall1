var RockfallGame, StandardGameLevel, forces;

forces = {
  dx: 0.004,
  dy: 0.05
};

RockfallGame = (function() {
  function RockfallGame(element, _at_levels, _at_listener) {
    this.levels = _at_levels;
    this.listener = _at_listener;
    this.viewHeight = 800;
    this.game = new DarkMatter(element, {
      enableSleeping: true,
      world: {
        gravity: {
          x: 0,
          y: 0.5
        },
        bounds: {
          min: {
            x: 0,
            y: -200
          }
        }
      },
      render: {
        options: {
          background: "img/Tileable3h.png",
          wireframes: false,
          width: 400,
          height: this.viewHeight,
          hasBounds: true,
          showSleeping: false
        }
      }
    });
    this.levelnr = -1;
    this.state = "first";
  }

  RockfallGame.prototype.start = function(_at_pressed) {
    this.pressed = _at_pressed;
    this.initMainLoop();
    return this.pause("first");
  };

  RockfallGame.prototype.gameover = function() {
    return this.pause("gameover");
  };

  RockfallGame.prototype.win = function() {
    this.state = "levelend";
    if (this.levelnr === this.levels.length - 1) {
      this.state = "win";
    }
    return this.pause(this.state);
  };

  RockfallGame.prototype.nextlevel = function() {
    this.levelnr = this.levelnr + 1;
    return this.samelevel();
  };

  RockfallGame.prototype.setlevel = function(lvl) {
    this.levelnr = lvl;
    return this.samelevel();
  };

  RockfallGame.prototype.samelevel = function() {
    var _base;
    this.level = new StandardGameLevel(this.levels[this.levelnr], this.game);
    this.game.setView(0, this.level.height - this.viewHeight, this.level.width, this.viewHeight);
    return typeof (_base = this.listener).onResize === "function" ? _base.onResize(this.level.width, this.viewHeight) : void 0;
  };

  RockfallGame.prototype.pause = function(_at_state) {
    var _base, _ref;
    this.state = _at_state != null ? _at_state : "paused";
    this.game.pause();
    if ((_ref = this.level) != null) {
      _ref.stopGenerateRocks();
    }
    return typeof (_base = this.listener).onPause === "function" ? _base.onPause(this.state) : void 0;
  };

  RockfallGame.prototype.resume = function() {
    var _base;
    switch (this.state) {
      case "first":
        this.nextlevel();
        break;
      case "levelend":
        this.nextlevel();
        break;
      case "gameover":
        this.samelevel();
        break;
      case "win":
        return;
      case "running":
        return;
      case "paused":
        break;
      default:
        throw "Unknown state " + this.state;
    }
    this.game.oncollision(this.level.hero, this.level.wizzard, {
      start: (function(_this) {
        return function() {
          return _this.win();
        };
      })(this)
    });
    this.game.oncollision(this.level.hero, {
      active: (function(_this) {
        return function(pair) {
          return pair.friction = _this.level.hero.getFriction();
        };
      })(this)
    });
    this.game.oncollision(this.level.floor, {
      start: (function(_this) {
        return function() {
          return _this.listener.onFeltDown("floor");
        };
      })(this)
    });
    this.game.oncollision("rock", {
      start: (function(_this) {
        return function() {
          return _this.listener.onFeltDown("rock");
        };
      })(this)
    });
    this.game.resume();
    this.level.startGenerateRocks();
    this.state = "running";
    return typeof (_base = this.listener).onResume === "function" ? _base.onResume() : void 0;
  };

  RockfallGame.prototype.initMainLoop = function() {
    return this.game.run((function(_this) {
      return function(e) {
        var dir, hero, viewmax, viewmin, _base;
        dir = {
          x: 0,
          y: 0
        };
        hero = _this.level.hero;
        hero.checkCollisions();
        if (hero.underrock && hero.onfloor) {
          return _this.gameover();
        }
        if (_this.pressed.left) {
          dir.x = -forces.dx;
          if (_this.pressed.just.left) {
            hero.animation.setSequence("moveLeft");
          }
        } else if (pressed.right) {
          dir.x = +forces.dx;
          if (_this.pressed.just.right) {
            hero.animation.setSequence("moveRight");
          }
        }
        if (_this.pressed.just.up && hero.onfloor) {
          dir.y = -(forces.dy * (1 + _this.pressed.ctrl / 2));
          if (typeof (_base = _this.listener).onJump === "function") {
            _base.onJump();
          }
        }
        if (dir.x === 0 && dir.y === 0) {
          hero.animation.setSequence([hero.animation.sequence[0]]);
        }
        if (dir.x !== 0 && !hero.onfloor) {
          dir.x = dir.x / 10;
        }
        hero.animation.onTick();
        _this.pressed.processed();
        _this.game.apply(hero, dir);
        hero.angle = 0;
        hero.anglePrev = 0;
        hero.sleepCounter = 0;
        _this.level.rocks.forEach(function(r) {
          return r.torque = 0;
        });
        viewmax = Math.min(_this.level.height, hero.position.y + _this.viewHeight / 2);
        viewmin = viewmax - _this.viewHeight;
        if (viewmin < 0) {
          viewmin = 0;
        }
        return _this.game.setView(0, viewmin, _this.level.width, _this.viewHeight);
      };
    })(this));
  };

  return RockfallGame;

})();

StandardGameLevel = (function() {
  function StandardGameLevel(_at_level, _at_world) {
    this.level = _at_level;
    this.world = _at_world;
    this.wallWidth = 10;
    this.ledgeWidth = 40;
    this.ledgeTop = 100;
    this.width = this.level.width + this.wallWidth * 2 + this.ledgeWidth;
    this.height = this.level.height;
    this.world.resize(this.width, this.level.height);
    this.world.resizeRender(this.width, 0);
    this.rocks = [];
    this.init();
  }

  StandardGameLevel.prototype.init = function() {
    this.clear();
    this.addWalls();
    this.addHero();
    return this.addWizzard();
  };

  StandardGameLevel.prototype.clear = function() {
    return this.world.clear();
  };

  StandardGameLevel.prototype.startGenerateRocks = function() {
    var generate;
    generate = (function(_this) {
      return function() {
        var r, _i, _ref;
        for (r = _i = 1, _ref = _this.level.count; 1 <= _ref ? _i <= _ref : _i >= _ref; r = 1 <= _ref ? ++_i : --_i) {
          _this.addRock();
        }
        return _this.to = setTimeout(generate, _this.level.every);
      };
    })(this);
    return generate();
  };

  StandardGameLevel.prototype.stopGenerateRocks = function() {
    return clearTimeout(this.to);
  };

  StandardGameLevel.prototype.addWalls = function() {
    var w, _i, _len, _ref, _results;
    this.floor = this.world.rectangle((this.width - this.ledgeWidth) / 2, this.level.height - this.wallWidth / 2, this.width - this.ledgeWidth, this.wallWidth, {
      isStatic: true,
      label: "Floor"
    });
    this.walls = [
      this.world.rectangle(this.wallWidth / 2, this.level.height / 2, this.wallWidth, this.level.height, {
        isStatic: true
      }), this.world.rectangle(this.width - this.ledgeWidth - this.wallWidth / 2, this.level.height / 2 + this.ledgeTop / 2, this.wallWidth, this.level.height - this.ledgeTop, {
        isStatic: true
      }), this.world.rectangle(this.width - this.ledgeWidth / 2, this.ledgeTop + this.wallWidth / 2, this.ledgeWidth, this.wallWidth, {
        isStatic: true
      })
    ];
    _ref = this.walls;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      w = _ref[_i];
      _results.push(w.friction = 0);
    }
    return _results;
  };

  StandardGameLevel.prototype.addHero = function() {
    var floor, hero, rocks;
    floor = this.floor;
    rocks = this.rocks;
    return this.hero = hero = this.world.rectangle(this.width / 2, this.level.height - this.wallWidth - 48, 32, 48, {
      friction: 0,
      label: "Hero",
      onfloor: false,
      underrock: false,
      checkCollisions: function() {
        this.onfloor = Matter.Query.ray([floor].concat(rocks), hero.position, {
          x: hero.position.x,
          y: hero.bounds.max.y + 1
        }, 30).length > 0;
        return this.underrock = Matter.Query.ray(rocks, hero.position, {
          x: hero.position.x,
          y: hero.bounds.min.y - 1
        }, 16).length > 0;
      },
      getFriction: function() {
        if (this.onfloor) {
          return 1;
        } else {
          return 0;
        }
      },
      animation: {
        sequence: [12],
        ticks: [0, 20],
        lookLeft: [4],
        lookRight: [8],
        moveLeft: [4, 5, 6, 7],
        moveRight: [8, 9, 10, 11],
        setSequence: function(sequence) {
          this.sequence = sequence.splice ? sequence : this[sequence];
          this.ticks[0] = this.ticks[1];
          return hero.render.sprite.clip.index = this.sequence[0];
        },
        onTick: function() {
          this.ticks[0] = this.ticks[0] - 1;
          if (this.ticks[0] === 0) {
            this.ticks[0] = this.ticks[1];
            this.sequence.push(this.sequence.shift());
            return hero.render.sprite.clip.index = this.sequence[0];
          }
        }
      },
      render: {
        sprite: {
          texture: "img/luggage.png",
          clip: {
            width: 32,
            height: 48,
            index: 4
          }
        }
      }
    });
  };

  StandardGameLevel.prototype.addWizzard = function() {
    return this.wizzard = this.world.rectangle(this.width - 20, 80, 32, 48, {
      label: "Wizzard",
      render: {
        sprite: {
          texture: "img/rincewind.png",
          clip: {
            width: 32,
            height: 48,
            index: 0
          }
        }
      }
    });
  };

  StandardGameLevel.prototype.addRock = function() {
    var baseSize, r, rock, slots, x;
    baseSize = 25;
    r = baseSize + baseSize * (Math.random() > this.level.size2);
    slots = Math.floor(this.level.width / r / 2);
    x = this.wallWidth + r + Math.floor(Math.random() * slots) * r * 2;
    rock = this.world.polygon(x, -100, 8, r, {
      density: 100,
      friction: 1,
      frictionAir: 0.05,
      label: "rock",
      render: {
        sprite: {
          texture: "img/url.png",
          clip: {
            width: 92,
            height: 92,
            x: 128 * (Math.floor(Math.random() * 8)) + 18,
            y: 128 * (Math.floor(Math.random() * 7)) + 18
          },
          xScale: 2 * r / 92,
          yScale: 2 * r / 92
        }
      }
    });
    return this.rocks.push(rock);
  };

  return StandardGameLevel;

})();
