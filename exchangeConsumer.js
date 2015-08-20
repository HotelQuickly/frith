'use strict'

require('dotenv').config({ path: '.localenv', silent: true})
let cluster = require('cluster'),
    procCount = process.env.CLUSTER_PROC_COUNT || require('os').cpus().length - 1
if ( cluster.isMaster && process.env.CLUSTER_MODE) {
    // Count the machine's CPUs
    console.log('Starting in cluster mode!!',procCount)
    // Create a worker for each CPU
    for (let i = 0; i < procCount; i += 1) {
        cluster.fork();
    }

    cluster.on('exit', function(deadWorker, code, signal) {
        // Restart the worker
        var worker = cluster.fork();

        // Note the process IDs
        var newPID = worker.process.pid;
        var oldPID = deadWorker.process.pid;

        // Log the event to logentries eventually

    })

} else {

    let Frith   = require('./'),
        Promise = require('bluebird'),
        frith = Frith('amqp://localhost', 1),
        getBytes = require('crypto').randomBytes,
        exchangeName = 'fiz.control',
        qName = exchangeName + '.' + getBytes(8).toString('hex')

    frith.on('connected', onConnected)

    function onConnected() {
        console.log('connect')
        let queueOptions = { durable: false, msgTtl: 0 }
        frith.create(qName,queueOptions)
            .then(onJoin)
    }

    function onJoin(h) {
        console.log(h)
        frith.bindQueueToExchange(qName,exchangeName)
            .then(function(){
                frith.handle(qName, onMsg)
            })
    }

    function onMsg(job, ack, queues) {
        console.log(job,ack)
        ack()
    }
}


