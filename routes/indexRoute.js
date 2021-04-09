const route = require("express").Router();

const db = require("../models");

route.get("/", (req, res) => {
    res.render("index");
});

route.use("/", require("./userDataRoute"));

module.exports = route;