// Matter.js module aliases
var Engine = Matter.Engine,
    World = Matter.World,
    Events = Matter.Events,
    Bodies = Matter.Bodies;

// create a Matter.js engine
var engine = Engine.create(document.body);
engine.render.options.wireframes = false;
engine.render.options.showDebug = true;
engine.render.options.showIds = true;

// create two boxes and a ground
var boxA = Bodies.rectangle(400, 200, 80, 30, {friction: 1, density: 10});
var boxB = Bodies.rectangle(500, 50, 80, 80, {friction: 1, density: 10});
var hero = Matter.Composite.create();
Matter.Composite.add(hero, Bodies.circle(550, 50, 10, {
    density: 1,
    friction: 0.5

}, 100));

Matter.Composite.add(hero, Bodies.rectangle(550,35,5,10, {
    density: 1,
    //density: 0.00005,
    friction: 1
}));

Matter.Composite.add(hero, Matter.Constraint.create({
    bodyA: hero.bodies[0],
    pointA: vector(10, 0),
    bodyB: hero.bodies[1],
    length: 20,
    stiffness: 0.7/*,
    pointA: vector(10, 0),
    pointB: vector(0, 0)*/
}));

Matter.Composite.add(hero, Matter.Constraint.create({
    bodyA: hero.bodies[0],
    pointA: vector(0, 10),
    bodyB: hero.bodies[1],
    length: 30,
    stiffness: 0.7/*,
     pointA: vector(10, 0),
     pointB: vector(0, 0)*/
}));


var test = Matter.Composite.create();
var boxes = [0,1,2,3].map(function(i) {
    //return Matter.Bodies.circle(100 + 20*Math.floor(i/2), 22 + 20*(i%2), 8, {density: 1});
    return Matter.Bodies.circle(100 + 20*i, 22, 8, {density: 1});
});
var center = Matter.Bodies.circle((boxes[1].position.x + boxes[2].position.x)/2, 22, 2, {fake: true});
var constraints = [[0,1,20], [1,2,20], [2,3,20], [0,2,40], [1,3,40], [0,3,40]].map(function(a) {
    return Matter.Constraint.create({
        bodyA: boxes[a[0]],
        bodyB: boxes[a[1]],
        length: a[2],
        stiffness: 0.5
    })
});

Matter.Composite.add(test, boxes);
Matter.Composite.add(test, center);
Matter.Composite.add(test, constraints);
Matter.Composite.add(test, [Matter.Constraint.create({
    bodyA: boxes[1],
    bodyB: center,
    stiffness: 1
})]);
Matter.Composite.add(test, [Matter.Constraint.create({
    bodyA: boxes[2],
    bodyB: center,
    stiffness: 1
})]);
var testWithWeight = Matter.Composite.create();
var weight = Matter.Bodies.polygon(40, 22, 8, 20, {
    density: 0.8
});

Matter.Composite.add(testWithWeight, [test, weight, Matter.Constraint.create({
    bodyA: center,
    bodyB: weight,
    length: 200,
    stiffness: 0.01
})]);


/*setTimeout(function() {
    World.add(engine.world, [boxB]);
}, 2000);*/

var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
var wall = Matter.Composite.create({bodies: [
    Bodies.rectangle(0, 300, 10, 600, { isStatic: true }),
    Bodies.rectangle(790, 300, 10, 600, { isStatic: true }),
]});

// add all of the bodies to the world
hero = test;//testWithWeight; test = boxB;
World.add(engine.world, [boxA, ground, wall, testWithWeight, boxB]);

// run the engine
Engine.run(engine);

//@returns {vector}
function vector(dx,dy) { return {x: dx, y: dy}}

var pressed = {
    left: false,
    right: false,
    up: false,
    down: false,
    onfloor: false,
    codes: {
        37: "left",
        40: "down",
        38: "up",
        39: "right"
    }
};
window.addEventListener('keydown', function(e) {
    var key = pressed.codes[e.keyCode];
    if (key) pressed[key] = true;
});
window.addEventListener('keyup', function(e) {
    var key = pressed.codes[e.keyCode];
    if (key) pressed[key] = false;
});
Events.on(engine, 'beforeUpdate', function() {
    var force = {x: 0, y: 0};
    if (pressed.left) {
        force.x = -0.2;
    }
    if (pressed.right) {
        force.x = 0.2;
    }
    if (pressed.up && pressed.onfloor) {
        force.y = -10;
        //force.x = force.x / 2;
    }
    if (pressed.down) {
        Matter.Body.applyForce(hero.bodies[0], hero.bodies[0].position, {x:0, y:1});
    }
    if (force.x != 0 || force.y != 0) {
        Matter.Body.applyForce(hero.bodies[0], hero.bodies[0].position, force);
        if (force.y != 0) {
            hero.bodies.slice(1).forEach(function(b) {
                if (!b.fake) Matter.Body.applyForce(b, b.position, {x:0, y: force.y});
            })
        }
        //Matter.Body.applyForce(hero.bodies[1], hero.bodies[1].position, {x: force.x/10, y:force.y/10});
    }
    hero.bodies[0].render.fillStyle = pressed.onfloor ? "green" : "red";
});

function are(pair, bodyA, bodyB) {
    return (pair.bodyA == bodyA && pair.bodyB == bodyB) || (pair.bodyA == bodyB && pair.bodyB == bodyA);
}
function is(pair, bodyA) {
    if (pair.bodyA == bodyA) return pair.bodyB;
    if (pair.bodyB == bodyA) return pair.bodyA;
}

ground.onground = true;
Events.on(engine, 'collisionStart', function(event) {
    var pairs = event.pairs;
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var opposite;
        if (opposite = is(pair, ground)) {
            opposite.onground = true;
        }
        if (are(pair, hero.bodies[0], boxB)) {
            if (pair.collision.normal.y > 0.1) {
                console.log('ok');
            }
            else if (pair.collision.normal.y < -0.1) {
                console.error('dead');
            }
        }
    }
})  ;
Events.on(engine, 'collisionActive', function(event) {
    var pairs = event.pairs;
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var opposite;
        if ((opposite = is(pair, hero.bodies[0])) && opposite.onground && pair.collision.normal.y > 0.1) {
            pressed.onfloor = true;
        }
    }
}) ;
Events.on(engine, 'collisionEnd', function(event) {
    var pairs = event.pairs;
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var opposite;
        if ((opposite = is(pair, hero.bodies[0])) && opposite.onground) {
            pressed.onfloor = false;
        }
        if (opposite = is(pair, ground)) {
            opposite.onground = false;
        }
    }
});
