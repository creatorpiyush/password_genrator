const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
    user_email: {
        type: String,
        required: true,
        unique: true,
    },

    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },

    user_data_storage: [{
        type: Schema.Types.ObjectId,
        ref: "userData",
    }, ],
});

const Users = mongoose.model("user", userSchema);

module.exports = Users;