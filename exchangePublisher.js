'use strict'

let Frith   = require('./'),
    Promise = require('bluebird'),
    frith = Frith('amqp://localhost', 1)

frith.on('connected', onConnected)

function onConnected() {
    frith.createExchange('fiz.control','fanout')
        .then(onJoin)
}

function onJoin() {
    for (var i = 0; i < 3000; i++) {
        frith.exchangePublish('fiz.control', Math.random() * 10000)
    }
}
