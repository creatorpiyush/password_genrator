const route = require("express").Router();

const db = require("../models");

const { encrypt, decrypt } = require("./crypto");

// route.get("/", (req, res) => {
//     res.send("Hi from user Data");
// });

let username;

route.get("/:username", (req, res) => {
    username = req.params.username;
    db.User.findOne({ username: req.params.username })
        .populate({
            path: "user_data_storage",
        })
        .then((user) => {
            let data = user;

            // application_name
            let application_name = [];
            for (var i = 0; i < data.user_data_storage.length; i++) {
                application_name[i] = data.user_data_storage[i].application_name;
            }

            // application_username
            let application_username = [];
            for (var i = 0; i < data.user_data_storage.length; i++) {
                application_username[i] =
                    data.user_data_storage[i].application_username;
            }

            // application_password
            let application_password = [];
            for (var i = 0; i < data.user_data_storage.length; i++) {
                application_password[i] = decrypt(
                    data.user_data_storage[i].application_password
                );
            }

            res.json({
                username: data.username,
                user_email: data.user_email,
                name_of_user: data.name_of_user,
                user_data_storage: {
                    application_name: application_name,
                    application_username: application_username,
                    application_password: application_password,
                },
            });
            // password decryption
            // res.send(decrypt(user.user_data_storage[1].application_password));
        })
        .catch((err) => {
            res.json(err);
        });
});

route.post("/addaccount", async(req, res) => {
    // res.send(username);
    if (!username) {
        return res.redirect("/");
    }

    const hash = encrypt(req.body.application_password);

    await db.UserData.create({
            application_name: req.body.application_name,
            application_username: req.body.application_username,
            application_password: hash,
        })
        .then((userData) => {
            return db.User.findOneAndUpdate({ username: username }, { $push: { user_data_storage: userData._id } });
        })
        .then((user) => {
            res.redirect(`/${user.username}`);
        })
        .catch((err) => {
            res.json(err);
        });
});

module.exports = route;