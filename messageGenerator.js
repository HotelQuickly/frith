'use strict'

let Frith   = require('./'),
    Promise = require('bluebird'),
    queue = Frith('amqp://localhost', 1)

queue.on('connected', onConnected)

function onConnected() {
    let queueOptions = { msgTtl: 0 }
    queue.create('fiz.start',queueOptions)
        .then(onJoin)
}

function onJoin() {
    for (var i = 0; i < 3000; i++) {
        queue.publish('fiz.start', Math.random() * 10000)
    }
}
