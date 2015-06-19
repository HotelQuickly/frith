'use strict'

let EventEmitter = require('events').EventEmitter,
    Promise = require('bluebird'),
    extend = require('util')._extend

module.exports = function createQueue(chann, name, opts, queues) {
    return new Promise(function(resolve, reject) {
        let newQueue = new Queue(chann, name, opts, queues)
            .once('ready',function(queue) {
                resolve(queue)
            })
            .once('error', function onQueueErr(err) {
                reject(err)
            })
    })
}

function Queue(chann, name, opts, queues) {
    EventEmitter.call(this)
    // durable, must ack, msgs published never expire
    opts = extend({ durable: true, noAck: false, msgTtl: 0}, opts)

    this.handler = function(){}
    this.name = name
    this.replyName = null
    this.chann = chann
    this.durable = opts.durable
    this.noAck = opts.noAck
    this.msgTtl = opts.msgTtl
    this.queues = queues
    this.tag = null

    this.chann
        .assertQueue(name, { durable: this.durable })
        .then(function storeQueue(info) {
            this.emit('ready', this)
        }.bind(this))
}

Queue.prototype = Object.create(EventEmitter.prototype)

Queue.prototype.subscribe = function(handler) {
    this.handler = handler
    this.chann.consume(this.name, this.onMessage.bind(this), { noAckk: this.noAck })
        .then(saveTag.bind(this))
}

function saveTag(obj) {
    this.tag = obj.consumerTag
}

Queue.prototype.unsubscribe = function() {
    this.chann.cancel(this.tag)
    this.handler = null
    this.tag = null
}

Queue.prototype.onMessage = function(msg) {
    if (!msg) return
    let body = JSON.parse(msg.content.toString()),
        hasReply = msg.properties.replyTo

    this.handler(body, function ack() {
        if (!this.noAck) {
            this.chann.ack(msg)
        }
    }.bind(this), this.queues)

}

Queue.prototype.publish = function(msg) {
    msg = JSON.stringify(msg)

    this.chann.sendToQueue(this.name, new Buffer(msg), {
        persistent: this.durable,
        expiration: this.msgTtl || undefined
    })
}
