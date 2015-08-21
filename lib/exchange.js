'use strict'

let EventEmitter = require('events').EventEmitter,
    Promise = require('bluebird'),
    extend = require('util')._extend

module.exports = function createExchange(chann, name, type, opts, Exchanges) {
    return new Promise(function(resolve, reject) {
        let newExchange = new Exchange(chann, name, type, opts, Exchanges)
            .once('ready',function(Exchange) {
                resolve(Exchange)
            })
            .once('error', function onExchangeErr(err) {
                reject(err)
            })
    })
}

function Exchange(chann, name, type, opts, Exchanges) {
    EventEmitter.call(this)
    // durable, must ack, msgs published never expire
    opts = extend({ durable: true }, opts)

    this.handler = function(){}
    this.name = name
    this.type = type
    this.chann = chann
    this.durable = opts.durable
    this.Exchanges = Exchanges
    this.tag = null

    this.chann
        .assertExchange(name, type, { durable: this.durable })
        .then(function storeExchange(info) {
            this.emit('ready', this)
        }.bind(this))
}

Exchange.prototype = Object.create(EventEmitter.prototype)

function saveTag(obj) {
    this.tag = obj.consumerTag
}


Exchange.prototype.publish = function(msg) {
    msg = JSON.stringify(msg)

    this.chann.publish(this.name, '', new Buffer(msg), {
        persistent: this.durable,
        expiration: this.msgTtl || undefined
    })
}
