window.darkkey = function(element, listener) {
  var keycodes = {
    37: "left",
    40: "down",
    38: "up",
    39: "right",
    32: "space"
  };
  var pressed = {
    just: {},
    processed: function() {
      pressed.just = {}
    }
  };
  for (var code in keycodes) {
    pressed[keycodes[code]] = false;
    pressed.just[keycodes[code]] = false;
  }
  if (element && typeof element.firstChild == typeof undefined) {
    listener = element;
    element = window;
  }
  element = element || window;
  listener = listener || {};

  element.addEventListener('keydown', function(e) {
    if (e.repeat) return;
    var key = keycodes[e.keyCode];
    if (key) {
      pressed.ctrl = e.ctrlKey;
      pressed[key] = true;
      pressed.just[key] = true;
      if (listener.down && listener.down[key]) listener.down[key]();
    }
  });
  element.addEventListener('keyup', function(e) {
    var key = keycodes[e.keyCode];
    if (key) {
      pressed[key] = false;
      if (listener.up && listener.up[key]) listener.up[key]();

    }
  });

  return pressed;
};