const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

let OrgSchema = new mongoose.Schema({
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

OrgSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Org', OrgSchema);