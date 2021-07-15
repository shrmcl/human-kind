const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

let OrgsSchema = new mongoose.Schema({
    username: String,
    password: String,
    orgName: String,
    address: {
        street: String,
        city: String,
        zip: String},
    contact: {
        firstName: String,
        lastName: String,
        email: String,
        phone: Number},
    mission: String,
    website: String,
    interests: Array,
    events: {
        type: String,
        date: Date,
        time: String}
});

OrgsSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Orgs', OrgsSchema);
