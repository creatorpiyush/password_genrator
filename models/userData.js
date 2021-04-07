const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userDataSchema = new Schema({
    application_name: {
        type: String,
        required: true,
        unique: true,
    },

    application_username: {
        type: String,
        required: true,
    },
    application_password: {
        type: String,
        required: true,
    },
});

const UserData = mongoose.model("userData", userDataSchema);

module.exports = UserData;