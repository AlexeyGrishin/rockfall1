forces =
  dx: 0.004
  dy: 0.05


class RockfallGame
  constructor: (element, @levels, @listener) ->
    @viewHeight = 800
    @game = new DarkMatter(element, {
      enableSleeping: true
      world:
        gravity: {x: 0, y: 0.5}
        bounds:
          min: {x: 0, y: -200}
      render:
        options:
          background: "img/Tileable3h.png"
          wireframes: false
          width: 400
          height: @viewHeight
          hasBounds: true
          showSleeping: false
    })
    @levelnr = -1
    @state = "first"
  start: (@pressed) ->
    @initMainLoop()
    @pause("first")
  gameover: ->
    @pause("gameover")
  win: ->
    @state = "levelend"
    @state = "win" if @levelnr == @levels.length - 1
    @pause(@state)
  nextlevel: ->
    @levelnr = @levelnr + 1
    @samelevel()
  setlevel: (lvl) ->
    @levelnr = lvl
    @samelevel()
  samelevel: ->
    @level = new StandardGameLevel(@levels[@levelnr], @game)
    @game.setView(0, @level.height - @viewHeight, @level.width, @viewHeight)
    @listener.onResize?(@level.width, @viewHeight)
  pause: (@state = "paused")->
    @game.pause()
    @level?.stopGenerateRocks()
    @listener.onPause?(@state)
  resume: ->
    switch @state
      when "first" then @nextlevel()
      when "levelend" then @nextlevel()
      when "gameover" then @samelevel()
      when "win" then return
      when "running" then return
      when "paused"
        #do nothing
      else throw "Unknown state #{@state}"
    @game.oncollision @level.hero, @level.wizzard, start: =>
      @win()
    @game.oncollision @level.hero, {
      active: (pair) => pair.friction = @level.hero.getFriction()
    }
    @game.oncollision @level.floor, {
      start: => @listener.onFeltDown("floor")
    }
    @game.oncollision "rock", {
      start: => @listener.onFeltDown("rock")
    }
    @game.resume()
    @level.startGenerateRocks()
    @state = "running"
    @listener.onResume?()
  initMainLoop: ->
    @game.run (e)=>
      dir = {x: 0, y: 0}
      hero = @level.hero
      hero.checkCollisions()
      if hero.underrock and hero.onfloor
        return @gameover()

      if @pressed.left
        dir.x = -forces.dx
        hero.animation.setSequence("moveLeft") if @pressed.just.left
      else if pressed.right
        dir.x = +forces.dx
        hero.animation.setSequence("moveRight") if @pressed.just.right
      if @pressed.just.up and hero.onfloor
        dir.y = -(forces.dy * (1+@pressed.ctrl/2))
        @listener.onJump?()
      if dir.x == 0 and dir.y == 0
        hero.animation.setSequence([hero.animation.sequence[0]])
      if dir.x != 0 and not hero.onfloor
        dir.x =dir.x / 10

      hero.animation.onTick()
      @pressed.processed()
      @game.apply(hero, dir)#, {x: hero.position.x, y: hero.bounds.max.y})
      hero.angle = 0
      hero.anglePrev = 0
      hero.sleepCounter = 0
      @level.rocks.forEach (r) -> r.torque = 0
      viewmax = Math.min(@level.height, hero.position.y + @viewHeight/2)
      viewmin = viewmax - @viewHeight
      if viewmin < 0
        viewmin = 0
      @game.setView(0, viewmin, @level.width, @viewHeight)


class StandardGameLevel
  constructor: (@level, @world) ->
    @wallWidth = 10
    @ledgeWidth = 40
    @ledgeTop = 100
    @width = @level.width + @wallWidth*2 + @ledgeWidth
    @height = @level.height
    @world.resize(@width, @level.height)
    @world.resizeRender(@width, 0)
    @rocks = []
    @init()
  init: ->
    @clear()
    @addWalls()
    @addHero()
    @addWizzard()

  clear: ->
    @world.clear()

  startGenerateRocks: ->
    generate = =>
      @addRock() for r in [1..@level.count]
      @to = setTimeout(generate, @level.every)
    generate()


  stopGenerateRocks: ->
    clearTimeout(@to)

  addWalls: ->

    @floor = @world.rectangle((@width-@ledgeWidth)/2, @level.height-@wallWidth/2, @width-@ledgeWidth, @wallWidth, isStatic: true, label: "Floor")
    @walls = [@world.rectangle(@wallWidth/2, @level.height/2, @wallWidth, @level.height, isStatic: true)
              @world.rectangle(@width-@ledgeWidth-@wallWidth/2, @level.height/2+@ledgeTop/2, @wallWidth, @level.height-@ledgeTop, isStatic: true)
              @world.rectangle(@width-@ledgeWidth/2, @ledgeTop+@wallWidth/2, @ledgeWidth, @wallWidth, isStatic: true)]
    w.friction = 0 for w in @walls

  addHero: ->
    floor = @floor
    rocks = @rocks
    @hero = hero = @world.rectangle(@width/2, @level.height-@wallWidth-48, 32, 48, {
      friction: 0
      label: "Hero"
      onfloor: false
      underrock: false
      checkCollisions: ->
        @onfloor = Matter.Query.ray([floor].concat(rocks), hero.position, {x: hero.position.x, y: hero.bounds.max.y + 1}, 30).length > 0
        @underrock = Matter.Query.ray(rocks, hero.position, {x: hero.position.x, y: hero.bounds.min.y - 1}, 16).length > 0
      getFriction: ->
        if @onfloor then 1 else 0
      animation:
        sequence: [12]
        ticks: [0, 20]
        lookLeft: [4]
        lookRight: [8]
        moveLeft: [4,5,6,7]
        moveRight: [8,9,10,11]
        setSequence: (sequence) ->
          @sequence = if sequence.splice then sequence else @[sequence]
          @ticks[0] = @ticks[1]
          hero.render.sprite.clip.index = @sequence[0]
        onTick: ->
          @ticks[0] = @ticks[0] - 1
          if @ticks[0] == 0
            @ticks[0] = @ticks[1]
            @sequence.push(@sequence.shift())
            hero.render.sprite.clip.index = @sequence[0]

      render:
        sprite:
          texture: "img/luggage.png"
          clip:
            width: 32
            height: 48
            index: 4

    })

  addWizzard: ->
    @wizzard = @world.rectangle(@width-20, 80, 32, 48, {
      label: "Wizzard",
      render:
        sprite:
          texture: "img/rincewind.png"
          clip:
            width: 32
            height: 48
            index: 0
    })

  addRock: ->
    baseSize = 25
    r = baseSize + baseSize*(Math.random()>@level.size2)# + 25*(Math.random() > 0.5)
    slots = Math.floor((@level.width / r / 2))
    x = @wallWidth+r+ Math.floor(Math.random()*slots)*r*2
    rock = @world.polygon(x, -100, 8, r, {
      density: 100
      friction: 1
      frictionAir: 0.05
      label: "rock"
      render:
        sprite:
          texture: "img/url.png"
          clip:
            width: 92
            height: 92
            x: 128*(Math.floor(Math.random()*8)) + 18
            y: 128*(Math.floor(Math.random()*7)) + 18
          xScale: 2*r/92
          yScale: 2*r/92
    })
    @rocks.push(rock)