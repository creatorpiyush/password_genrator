const route = require("express").Router();

const db = require("../models");

route.get("/", (req, res) => {
    res.send("Hi from Home");
});

route.use("/", require("./userDataRoute"));

module.exports = route;