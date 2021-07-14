const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

let OrgsSchema = new mongoose.Schema({
    username: String,
    password: String,
    orgName: String,
    mission: String,
    website: String,
    interests: Array
});

OrgsSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Orgs', OrgsSchema);
