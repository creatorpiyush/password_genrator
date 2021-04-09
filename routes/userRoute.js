const route = require("express").Router();

const bcrypt = require("bcryptjs");

const db = require("../models");

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

route.post("/login", (req, res) => {
    db.User.findOne({ user_email: req.body.user_email }, (err, result) => {
        if (err) return res.send(err);
        if (result) {
            const isPasswordMatched = bcrypt.compareSync(
                req.body.password,
                result.password
            );

            if (isPasswordMatched) {
                return res.redirect(`/${result.username}`);
            } else {
                return res.json({
                    status: false,
                    message: `Password not matched...`,
                });
            }
        } else {
            return res.json({
                status: false,
                message: `Email not Found...`,
            });
        }
    });
});

module.exports = route;