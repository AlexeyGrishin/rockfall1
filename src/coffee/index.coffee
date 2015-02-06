play = (sound) ->
  document.getElementById(sound).play()


levels = [
  #{width: 400, height: 400, count: 1, every: 2000, size2: 1.1},
  {width: 400, height: 800, count: 1, every: 3000, size2: 0},
  {width: 400, height: 800, count: 1, every: 1500, size2: 1.1},
  {width: 400, height: 1200, count: 2, every: 2000, size2: 1.1},
  {width: 600, height: 1200, count: 1, every: 1000, size2: 0.7},
  {width: 1200, height: 1200, count: 1, every: 250, size2: 0},
]


cover = document.getElementById("over")
levelnr = document.getElementById("levelnr")
view = document.getElementById("view")
game = new RockfallGame(view, levels, {
  onPause: (reason) ->
    cover.style.display = "block";
    cover.className = reason
    switch reason
      when "gameover" then play("gameover")
      when "levelend" then play("win")
  onResume: ->
    cover.style.display = "none";
    levelnr.innerHTML = 1+game.levelnr
  onResize: (width) ->
    view.parentNode.style.width = width + "px"
  onJump: ->
    play("jump")
  onFeltDown: (type) ->
    play("rock0") if type == "floor"

})

pressed = darkkey(
  down:
    space: ->
      if game.state == "running"
        game.pause()
      else if game.state != "win"
        game.resume()
)
game.start(pressed)
