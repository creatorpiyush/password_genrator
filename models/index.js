const mongoose = require("mongoose");

require("dotenv").config();

const db_url = process.env.DB_URL;

mongoose
    .connect(db_url, {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    })
    .then((result) => {
        console.log("DB connected...");
    })
    .catch((err) => {
        console.log(err);
    });

module.exports = {
    User: require("./users"),
    UserData: require("./userData"),
};