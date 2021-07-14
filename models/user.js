const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

let UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    email: String,
    pic: String,
    gender: String,
    ageRange: String,
    bio: String,
    interests: Array,
    lookingFor: Array,
    savedMatches: Array
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);