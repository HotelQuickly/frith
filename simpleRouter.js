'use strict'

let Frith = require('./'),
    Promise = require('bluebird'),
    all = Promise.all,
    queue = Frith('amqp://localhost', 1)

queue.on('connected', onConnected)

function onConnected() {
    let queueOptions = { msgTtl: 0 }
    all([
            queue.create('test.first',queueOptions),
            queue.create('test.second',queueOptions)
        ])
        .then(onJoin)
}

function onJoin() {
    queue.handle('test.first',firstHandler)
}

function firstHandler(job, ack, queues) {
    // could arbitrarily null route / split divide source among queues
    queues['test.second'].publish(job)
    ack()
}
