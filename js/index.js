var cover, game, levelnr, levels, play, pressed, view;

play = function(sound) {
  return document.getElementById(sound).play();
};

levels = [
  {
    width: 400,
    height: 800,
    count: 1,
    every: 3000,
    size2: 0
  }, {
    width: 400,
    height: 800,
    count: 1,
    every: 1500,
    size2: 1.1
  }, {
    width: 400,
    height: 1200,
    count: 2,
    every: 2000,
    size2: 1.1
  }, {
    width: 600,
    height: 1200,
    count: 1,
    every: 1000,
    size2: 0.7
  }, {
    width: 1200,
    height: 1200,
    count: 1,
    every: 250,
    size2: 0
  }
];

cover = document.getElementById("over");

levelnr = document.getElementById("levelnr");

view = document.getElementById("view");

game = new RockfallGame(view, levels, {
  onPause: function(reason) {
    cover.style.display = "block";
    cover.className = reason;
    switch (reason) {
      case "gameover":
        return play("gameover");
      case "levelend":
        return play("win");
    }
  },
  onResume: function() {
    cover.style.display = "none";
    return levelnr.innerHTML = 1 + game.levelnr;
  },
  onResize: function(width) {
    return view.parentNode.style.width = width + "px";
  },
  onJump: function() {
    return play("jump");
  },
  onFeltDown: function(type) {
    if (type === "floor") {
      return play("rock0");
    }
  }
});

pressed = darkkey({
  down: {
    space: function() {
      if (game.state === "running") {
        return game.pause();
      } else if (game.state !== "win") {
        return game.resume();
      }
    }
  }
});

game.start(pressed);
