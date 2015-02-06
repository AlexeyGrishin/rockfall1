bodies = (name) ->
  (args...) ->
    b = Matter.Bodies[name](args...)
    @add(b)
    b

CollisionsListener =
  _onevent: (event, call) ->
    for pair in event.pairs
      [pair.bodyA.id + "_" + pair.bodyB.id, pair.bodyB.id + "_" + pair.bodyA.id,
       pair.bodyA.id, pair.bodyB.id, pair.bodyA.label, pair.bodyB.label].forEach (id) =>
        lsn = @listeners[id]
        lsn[call](pair) if lsn and lsn[call]
  start: (event) ->
    @_onevent(event, "start")
  end: (event) ->
    @_onevent(event, "end")
  active: (event) ->
    @_onevent(event, "active")
  listeners: {}
  add: (from, to, listener) ->
    if not listener
      @listeners[from.id ? from] = to
    else
      @listeners[from.id + "_" + to.id] = listener

class DarkMatter
  constructor: (element, options) ->
    @engine = Matter.Engine.create(element, options)
    Matter.Events.on(@engine, 'collisionStart', (e) => CollisionsListener.start(e))
    Matter.Events.on(@engine, 'collisionActive', (e) => CollisionsListener.active(e))
    Matter.Events.on(@engine, 'collisionEnd', (e) => CollisionsListener.end(e))
  pause: (gv) ->
    @engine.enabled = false
  setView: (x,y,w,h) ->
    @engine.render.bounds.min.x = x
    @engine.render.bounds.min.y = y
    @engine.render.bounds.max.x = x+w
    @engine.render.bounds.max.y = y+h
  resume: ->
    @engine.enabled = true
  clear: ->
    Matter.World.clear(@engine.world)
    Matter.Engine.clear(@engine)
  run: (beforeUpdate = ->) ->
    Matter.Engine.run(@engine)
    Matter.Events.on(@engine, 'beforeUpdate', beforeUpdate)
  oncollision: (objA, objB, listener) ->
    CollisionsListener.add(objA, objB, listener)
  add: (items...) ->
    return @add(items[0]...) if items[0].splice  #is array
    Matter.World.add(@engine.world, items)
  rectangle: bodies("rectangle")
  polygon: bodies("polygon")
  circle: bodies("circle")
  apply: (body, vector, position) ->
    Matter.Body.applyForce(body, position ? body.position, vector)
  rotate: (body, angle) ->
    Matter.Body.rotate(body, angle)
  resize: (maxX, maxY) ->
    @engine.world.bounds.max = {x: maxX, y: maxY}
  resizeRender: (width, height) ->
    Matter.Render.resize(@engine.render, width, height)
  @vector: (dx, dy) -> {x: dx, y: dy}

window.DarkMatter = DarkMatter