const route = require("express").Router();

const session = require("express-session");

const db = require("../models");

route.get("/", (req, res) => {
    if (req.session.userId) {
        return res.redirect(`/${req.session.username}`);
    }
    return res.render("index");
});

route.use("/", require("./userDataRoute"));

module.exports = route;