const keys = require("./keys")
const redis = require("redis")

const redisClient = redis.createClient({
    host: keys.redisHOST,
    port: keys.redisPORT,
    retry_strategy: () => 1000
})
console.log('keys ==>',keys)
const sub = redisClient.duplicate()

const fib = (index) => {
    if (index < 2) return 1
    return fib(index - 1) + fib(index - 2)
}

sub.on("message", (channel, message) => {
    const calculated = fib(Number(message))
    redisClient.hset("values", message, calculated)
})

sub.subscribe("insert")
