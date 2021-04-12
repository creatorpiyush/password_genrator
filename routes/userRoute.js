const route = require("express").Router();

const session = require("express-session");

const bcrypt = require("bcryptjs");

const db = require("../models");

const flash = require("req-flash");

route.get("/signup", (req, res) => {
    if (req.session.userId) {
        return res.redirect(`/${req.session.username}`);
    }
    return res.render("signup", { err: req.flash("err") });
});

route.post("/adduser", (req, res) => {
    if (req.body.password !== req.body.confirm_password) {
        return res.render("signup", { err: `Passwords does not Matched` });
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, 13);
    const temp = new db.User({
        user_email: req.body.user_email,
        name_of_user: req.body.name_of_user,
        username: req.body.username,
        password: hashedPassword,
    });
    temp.save((err, result) => {
        if (err) {
            if (Object.keys(err.keyValue)[0] === "user_email") {
                req.flash("err", "⚠️ User With this Email Exists!! ⚠️");

                return res.redirect("/user/signup");
            }
            if (Object.keys(err.keyValue)[0] === "username") {
                req.flash("err", "⚠️ User With this Username Exists!! ⚠️");

                return res.redirect("/user/signup");
            }

            return res.render("signup", { err: err });
        }

        req.flash("signup_success", "🙌 Signup Success!! Login Here 🙌");
        return res.redirect("/");
    });
});

route.post("/login", (req, res) => {
    db.User.findOne({
            $or: [
                { user_email: req.body.email_username },
                { username: req.body.email_username },
            ],
        },
        (err, result) => {
            if (err) return res.send(err);
            if (result) {
                const isPasswordMatched = bcrypt.compareSync(
                    req.body.password,
                    result.password
                );

                if (isPasswordMatched) {
                    req.session.userId = result.id;
                    req.session.username = result.username;
                    req.session.user_email = result.user_email;

                    return res.redirect(`/${result.username}`);
                } else {
                    req.flash("err", "⚠️ Password does not matched... ⚠️");
                    return res.redirect("/");
                }
            } else {
                req.flash("err", "⚠️ Email not Found... ⚠️");
                return res.redirect("/");
            }
        }
    );
});

route.delete("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.redirect("/");
    });
});

module.exports = route;