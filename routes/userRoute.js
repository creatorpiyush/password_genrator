const route = require("express").Router();

const bcrypt = require("bcryptjs");

const db = require("../models");

route.get("/", (req, res) => {
    res.send("Hi from User");
});

route.post("/adduser", (req, res) => {
    const hashedPassword = bcrypt.hashSync(req.body.password, 13);

    const temp = new db.User({
        user_email: req.body.user_email,
        name_of_user: req.body.name_of_user,
        username: req.body.username,
        password: hashedPassword,
    });

    temp.save((err, result) => {
        if (err) return res.send({ err: err });

        return res.send(result);
    });
});

module.exports = route;