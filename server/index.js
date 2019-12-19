const keys = require("./keys")
const express = require("express")
const redis = require("redis")
const cors = require("cors")
const bodyParser = require("body-parser")

//* Express App Setup
const app = express()
app.use(cors())
app.use(bodyParser.json())

//* Postgress Client Setup
const { Pool } = require("pg")
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
})

pgClient.on('error', (err) => console.log("lost PG connection")) //! shows connection error

pgClient
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch((e) => console.log(e)) //! shows error

//* Redis Client Setup
const redisClient = redis.createClient({
    host: keys.redisHOST,
    port: keys.redisPORT,
    retry_strategy: () => 1000
})

const redisPublisher = redisClient.duplicate()

//* Express Route Handlers
app.get("/", (req, res) => {
    res.send("Hi")
})

app.get("/values/all", async (req, res) => {
    const values = await pgClient.query("SELECT * from values")

    res.send(values.rows)
})

app.get("/values/current", (req, res) => {
    redisClient.hgetall("values", (err, values) => {
        res.send(values)
    })
})


app.post("/values", async (req, res) => {
    const { index } = req.body

    if (Number(index) > 40) {
        return res.status(422).send("Index too high!")
    }

    redisClient.hset("values", index, "Nothing yet!")
    redisPublisher.publish("insert", index)
    pgClient.query("INSERT INTO values(number) VALUES($1)", [index])

    res.send({ working: true })
})


app.listen(5000, (err) => {
    console.log("listening on port 5000")
})



