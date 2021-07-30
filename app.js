// Foundation
const path = require('path');
const http = require('http');
const express = require("express");
require('dotenv').config();
const methodOverride = require("method-override"); //for updating and deleting profile
const socketio = require('socket.io');
const mongoose = require("mongoose");
const passport = require('passport');
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/user.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);


app.set("view engine", "ejs");  //adding this line makes it so we don't have to specify .ejs for file names
app.use(methodOverride("_method")); //for use with method-override
app.use(express.static(path.join(__dirname, 'public'))); //connects express to the "public" folder where we made a css file
app.use(express.urlencoded({extended: true})); //lets us read data from req.body
app.use(express.json());
const keys = require("./config/keys"); //links to private api key in config folder so no one has access. dev.js is added to gitignore

//Logger
const logger = require("morgan");
app.use(logger("dev") );

mongoose.connect(keys.mongoURI,
  { //must use two lines of code below for mongoose to work
      useNewUrlParser: true,
      useUnifiedTopology: true
  })
  .then(()=> console.log("Connected to VolunTender database")) //console logs to make sure it's connected
  .catch((error) => console.log(error));//otherwise console logs error
  

let User = require("./models/user"); //connects to user file in models folder

let formatMessage = require("./utils/messages"); //connects to user file in models folder

let Orgs = require("./models/orgs"); //connects to org file in models folder
let Org = require("./models/orgs"); //connects to org file in models folder

app.use(require('express-session')({
  secret: "Blah blah blah", //used to calculate the hash to protect our password from3rd party hijackers
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize()); //starts a session
app.use(passport.session()); //allows access to session
passport.use(new LocalStrategy(User.authenticate())); 
passport.serializeUser(User.serializeUser()); //required to store data session
passport.deserializeUser(User.deserializeUser()); //removes user session when they logout

// image uploading packages:
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// this requires you to have '.env' file in root folder with API info
cloudinary.config({ 
  API_Environment_variable: process.env.CLOUDINARY_URL
});

const storage =  new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    // name of folder images will be stored in our Cloudinary account
    folder: 'demo',
  },
});

const parser = multer({ storage: storage });

// TEMP route for temp "/api/images" form
// NOTE: *Image is an example placeholder for your database collection. Substitute it for your own.
// app.post('/api/images', parser.single("image"), (req, res) => {
//   // console.log(req.file) // to see what is returned to you
//   console.log("path to image: ", req.file.path) // this is the http address to the image
//   const image = {};
//   image.url = req.file.url;
//   image.id = req.file.public_id;

//   // THIS PART needs to send the img url to our mongodb to the new user's document:
//   // ("Image" is placeholder for our db)

//   // Image.create(image) // save image information in database
//   //   .then(newImage => res.json(newImage))
//   //   .catch(err => console.log(err));

//   res.redirect('/')
// });

// Routes
app.get("/", function(req, res) {  //links to home.ejs page
    res.render("home"); //displays home.ejs file
});


//var matches = new Array();

function getMatches(interestsArray) {

  let aggregateQuery = [{$addFields:{"Most_Matched":{$size:{$setIntersection: ["$interests", interestsArray ]} } } }, {$sort: {"Most_Matched": -1}}, {$limit: 4}];


  var query = User.aggregate(aggregateQuery);
  return query;

}// end getMatches

// ADDING DELETING STUFF:

//async function getOrganizations(commonInterests) {
  function getOrganizations(commonInterests) {

    //var commonInterestsQuery = {"interests":{$in: commonInterests}};
    //return await Org.find(commonInterestsQuery);
  
  
    return Org.find({"interests":{$in: commonInterests}});
    //return await Org.find({"interests":{$in: commonInterests}});
    //return await Org.find({"interests":{$in: commonInterests}}).exec();
  
    /*
    await Org.find({"interests":{$in: commonInterests}}).exec((error, doc) => {
      if(error)
      {
        console.log(error);
        return error;
      }
      else 
      {
        var results = new Array();
        doc.forEach((elem) =>{
          results.push(elem.orgName);
        });
        console.log("Organizations:  " + results);
        return results;
      }
    })// end find
    */
  
  
  
  }// end getOrganizations 


app.get("/results", isLoggedIn, function(req, res) { //isLoggedIn is middleware that only allows results page to show if you're logged in

   var matches = new Array();
  //The following console.log lines are to check/verify that the correct username and interests array are accessible via the request body.
  console.log("The username in question:  " + req.user.username);
  console.log("The user\'s interests are:" + req.user.interests);


  //The interests and username of the currently logged in user are stored in local variables.
  let interestsArray = req.user.interests;
  let username = req.user.username;


  console.log("What is the value of interestsArray:  " + interestsArray);

  //The user's interests (interestArray) is passed to a function called getMatches, where a query object is returned and stored in local variable results.
  let results = getMatches(interestsArray);


  //The returned query is first checked for any errors.  If there no errors, the code iterates through all the documents via a forEach loop.  For each document/record,
  //the field values are copied to a locally-defined object, which is then pushed into the matches array.  Finally, the matches array is passed to results.ejs.
  results.exec(function(err, doc){

    if(err)
    {
      console.log(err);
      return err;
    }
    else
    {
      doc.forEach(function(elem){

        if(elem.username === username)
        {
          return;
        }
        else
        {
	  var obj = {};
	  var intersection = interestsArray.filter( x => elem.interests.includes(x) );


   
	  obj.firstName = elem.firstName;
	  obj.lastName = elem.lastName;
	  obj.username = elem.username;
	  obj.gender = elem.gender; 
	  obj.ageRange = elem.ageRange;
	  obj.pic = elem.pic;
	  obj.bio = elem.bio;
	  obj.interests = intersection;
	  matches.push(obj);

        }

      }); // end forEach








      //matches.forEach((elem) =>{
      matches.forEach((elem, key, arr) =>{

        console.log("\n\nFor the given match:  " + elem);

        console.log("Declaring an empty array...");
        var organizations = new Array();

        //For each record, match up organizations to candidates based on interests.
        console.log("Common interests...  " + elem.interests);



        /*
        getOrganizations(elem.interests) 
        .then((element) =>{

          element.forEach((org) =>{
            console.log("Result of calling getOrganizations from the result route...  " + org.orgName);
            organizations.push(org.orgName);
          })// end forEach

          console.log("Organizations Array...  " + organizations);
	  elem.organizations = organizations;

        })// end then
        */







        var results2 = getOrganizations(elem.interests);
        results2.exec(function(err, doc){

          if(err)
          {
            console.log(err);
          }// end if
          else
          {
            doc.forEach((org)=>{

              organizations.push(org.orgName);
            });// doc.forEach

            elem.organizations = organizations;
            console.log("The array of organizations..." + elem.organizations);
             
          }// end else


	  if (Object.is(arr.length - 1, key)) {
	    // execute last item logic
	    //console.log(`Last callback call at index ${key} with value ${val}` ); 
            res.render("results", {matches: matches});
	  }
        

        });// end results2.exec


      });// end matches.forEach



      //res.render("results", {matches: matches});

    }// end else

  });
  

});// end /results





app.get("/signup", function(req, res) { //brings us to sign up page and profile questions
  res.render("signup");
});

app.get("/orgSignup", function(req, res) { //brings us to dummy (for now) org signup page
  res.render("orgSignup");
});

app.get("/login", function(req, res) { //brings us to user login page if already have a profile
  res.render("login");
});

app.get("/dashboard", isLoggedIn, function(req, res) { //brings us to user dashboard. isLoggedIn means it's only accessible when logged in
  res.render("dashboard");
});

app.get("/orgThanks", isLoggedIn, function(req, res) { //brings us to thank you page where they can logout (unless I can get submit button to logout at same time)
  res.render("orgThanks");
});

app.get("/matchroom", isLoggedIn, function(req, res) { //brings us to sign in as user in a org chat room 
  res.render("matchroom");
});

app.get("/chat", isLoggedIn, function(req, res) { //brings us to sign in as user in a org chat room 
  res.render("chat");
});

// post route that handles logic for registering user & adding their info to database
// parser handles image upload to Cloudinary
app.post("/signup", parser.single("image"), function(req, res) {
  // passport stuff:
  console.log(req.body)
  
  var newUser = new User({
    username: req.body.username,
    password: req.body.pw,
    firstName: req.body.fname,
    lastName: req.body.lname,
    email: req.body.email,
    // pic: req.body.avatar,        // we don't need avatars anymore.
    // PLACEHOLDER IMAGE as default:
    // pic: 'https://res.cloudinary.com/dfg6bkjgg/image/upload/v1626496428/demo/i7cup02wozwmiytpwur9.jpg', 
    pic: req.file.path, 
    gender: req.body.gender,
    ageRange: req.body.age,
    bio: req.body.bio,
    interests: req.body.interests,
    lookingFor: req.body.lookingFor
  });

  User.register(newUser, req.body.password, function(err, user) {
      if(err){
        console.log(err);
        return res.render("signup")
      } else {
        passport.authenticate("local")(req, res, function() {
          console.log("new user info: ", newUser) // to see if image upload address is included correctly
          res.redirect("/dashboard");
        });

        // upload image to cloudinary *after* user added to db:
        // console.log("path to image: ", req.file.path) // this is the http address to the image
        // const image = {};
        // add these to user db to store image url and id 
        // first have defaults for these in the db document; then we will update with this info:
        // image.url = req.file.url;
        // image.id = req.file.public_id;'

        // // this is not working:
        // User.updateOne({ firstName: `"${newUser.firstName}"` }, { pic: `"${req.file.path}"`});
        
      }
  })
});


//adds saved matches to user's profile in db 
app.post("/results", isLoggedIn, function(req, res) {
  User.updateOne
  ({username: req.user.username},
    { $addToSet: {savedMatches: req.body.username
  }},
  function(error) {
    if (error) {
      console.log("savedMatches Error: ", error);
    } else {
      res.redirect("/dashboard");
    }
  })
});

//edits user profile
app.get("/edit", isLoggedIn, function(req, res) {
  User.findById(req.user._id, (err, user) => {
    if(err) {
      console.log("Issue updating profile: ",err);
      res.redirect("/dashboard");
    } else {
      res.render("edit", {user: user});
    }
  });
});

//put route for updating profile
app.post("/edit", 
isLoggedIn, 
// parser.single("image"), 
(req, res) => {
  console.log("--req.body is: ", req.body)
  User.findByIdAndUpdate(req.params._id, {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    pic: req.body.pic,
    bio: req.body.bio,
    ageRange: req.body.ageRange,
    gender: req.body.gender,
    interests: req.body.interests
  }, (error) => {
      if(error) {
          console.log("Issue saving updated profile to db: ", error);
      } else {
          res.redirect("/dashboard");
      }
  });
});

//post route that handles logic for adding org info to database
app.post("/orgSignup", function(req, res) {
  // passport stuff:
  console.log(req.body)
  
  var newOrgs = new Orgs({
    username: req.body.username,
    password: req.body.pw,
    orgName: req.body.orgName,
    mission: req.body.mission,
    website: req.body.website,
    interests: req.body.interests
  });

  Orgs.register(newOrgs, req.body.password, function(err, orgs) {
      if(err){
        console.log(err);
        return res.render("orgSignup")
      } else {
        passport.authenticate("local")(req, res, function() {
          // redirect might change
          res.redirect("/orgThanks");
        });
      }
  })  
});

//Login route logic
app.post('/login', passport.authenticate('local', { //passport.authenticate is known as middleware (code that runs before callback function)
  successRedirect: '/dashboard', // if successful, will send to dashboard page
  failureRedirect: '/login' //if it doesn't work, will redirect back to login screen
}), function(req, res) {
  //don't need anything in our callback function
});

//logout route logic
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});// logging out destroys all user data in the session, then redirect to home page

function isLoggedIn(req, res, next) {
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/login');
}// idAuthenticated is a built in passport method, checks to see if user is logged in, next( ) tells it to move to next piece of code

const botName = 'ChatCord Bot';

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room}) => {
      const user = userJoin(socket.id, username, room);

      socket.join(user.room);

      // Welcome current user
      socket.emit('message', formatMessage(botName, 'Welcome the ChatCord!'));

      // Broadcast when a user connnects
      socket.broadcast
      .to(user.room)
      .emit('message', formatMessage(botName, `${user.username} has joined the chat`));

      // Send users and room info
      io.to(user.room).emit('roomUser', {
          room: user.room,
          users: getRoomUsers(user.room)
      });
  });

      // Listen to chatMessage
      socket.on('chatMessage', msg => {
      const user = getCurrentUser(socket.id);

      io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
      const user = userLeave(socket.id);

      io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

      // Send users and room info
      io.to(user.room).emit('roomUser', {
          room: user.room,
          users: getRoomUsers(user.room)
      });
  });
});


// Listener
const port = process.env.PORT || 3000; // this says run whatever port if 3000 is not available
app.listen(port, ()=> console.log(`VolunTender App is Listening on port ${port}`));  // when running app we want you to listen for requests port and console log the port #
