const route = require("express").Router();

route.get("/", (req, res) => {
    res.send("Hi from Home");
});

module.exports = route;