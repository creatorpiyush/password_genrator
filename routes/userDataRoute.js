const route = require("express").Router();

const db = require("../models");

const { encrypt, decrypt } = require("./crypto");

// route.get("/", (req, res) => {
//     res.send("Hi from user Data");
// });

let username;
route.get("/favicon.ico", (req, res) => {});

route.get("/:username", (req, res) => {
    username = req.params.username;

    db.User.findOne({ username: req.params.username })
        .populate({
            path: "user_data_storage",
        })
        .then((user) => {
            if (!user || user === null) {
                return res.redirect("/");
            }

            let data = user;

            // user's Data
            let data_user = {
                user_content: [],
            };
            for (var i = 0; i < data.user_data_storage.length; i++) {
                data_user.user_content[i] = data.user_data_storage[i];
            }

            for (var i in data_user.user_content) {
                data_user.user_content[i].application_password = decrypt(
                    data_user.user_content[i].application_password
                );
            }

            const user_data = {
                id: data._id,
                username: data.username,
                user_email: data.user_email,
                name_of_user: data.name_of_user,
                user_data_storage: data_user,
            };

            // res.send({ user_data });
            res.render("user", { user_data });
            // password decryption
            // res.send(decrypt(user.user_data_storage[1].application_password));
        })
        .catch((err) => {
            res.json(err);
        });
});

route.post("/addaccount", async(req, res) => {
    // res.send(username);
    // console.log(username);
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