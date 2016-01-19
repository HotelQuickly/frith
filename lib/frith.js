'use strict'

const amqp = require('amqplib')
const Queue = require('./queue')
const Exchange = require('./exchange')
const EventEmitter = require('events').EventEmitter

module.exports = function createFrith(url, prefetch) {
  return new Frith(url, prefetch)
}

function Frith(url, prefetch) {
  if (!url) {
    throw new Error('amqp url required')
  }

  EventEmitter.call(this)

  this.conn = null
  this.chann = null
  this.prefetch = prefetch || 1
  this.queues = {}
  this.exchanges = {}

  amqp
  .connect(url)
  .then(this.createChannel.bind(this))
  .then(this.onChannel.bind(this))
  .catch(this.onConnectionErr.bind(this))
}

Frith.prototype = Object.create(EventEmitter.prototype)

Frith.prototype.createChannel = function(conn) {
  this.conn = conn
  this.conn.once('close', this.onClose.bind(this))
  return conn.createChannel()
}

Frith.prototype.onChannel = function (chann) {
  this.chann = chann
  this.chann.on('close', this.onChannelClose.bind(this))
  this.chann.prefetch(this.prefetch)
  this.emit('connected')
}

Frith.prototype.close = function() {
  this.conn.close()
}

Frith.prototype.onClose = genericClose
Frith.prototype.onConnectionErr = genericClose
Frith.prototype.onChannelClose = genericClose

function genericClose(err) {
  this.emit('disconnected', err)
}

Frith.prototype.createExchange = function(name, type, option) {
  return new Exchange(this.chann, name, type, option)
  .then(function onExchangeReady(exchange) {
    this.exchanges[name] = exchange
  }.bind(this))
}

Frith.prototype.create = function(name, options) {
  return new Queue(this.chann, name, options, this.queues)
  .then(function onQueReady(queue) {
    this.queues[name] = queue
    this.queues[name].on('reject', msg => this.emit('rejected', msg))
  }.bind(this))
}

Frith.prototype.bindQueueToExchange = function(qName, exchangeName) {
  return this.chann.bindQueue(qName, exchangeName, '')
}

Frith.prototype.destroy = function(name) {
  return this.chann.deleteQueue(name)
}

Frith.prototype.purge = function(name) {
  return this.chann.purgeQueue(name)
}

Frith.prototype.publish = function(name, obj, opts) {
  return this.queues[name].publish(obj, opts)
}

Frith.prototype.exchangePublish = function(name, obj, opts) {
  return this.exchanges[name].publish(obj, opts)
}

Frith.prototype.handle = function(name, handler) {
  return this.queues[name].subscribe(handler)
}

Frith.prototype.ignore = function(name) {
  return this.queues[name].unsubscribe()
}
