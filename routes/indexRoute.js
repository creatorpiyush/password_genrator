const route = require("express").Router();

const db = require("../models");

route.get("/", (req, res) => {
    res.send("Hi from Home");
});

route.use("/:username", require("./userDataRoute"));

route.get("/:username", (req, res) => {
    db.User.findOne({ username: req.params.username })
        .populate({
            path: "user_data_storage",
        })
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            res.json(err);
        });
});

module.exports = route;