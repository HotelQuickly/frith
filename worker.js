'use strict'

let Frith = require('./'),
    Promise = require('bluebird'),
    all = Promise.all,
    queue = Frith('amqp://localhost', 200)

queue.on('connected', onConnected)

function onConnected() {
    let queueOptions = { msgTtl: 0 }
    all([
            queue.create('test.second',queueOptions),
            queue.create('test.third',queueOptions)
        ])
        .then(onJoin)
}

function onJoin() {
    queue.handle('test.second',secondHandler)
}

function secondHandler(job, ack, queues) {
    console.log(job)
    setTimeout(function(){
        queues['test.third'].publish('r' + job + 'r')
        ack()
    },1000)
}
