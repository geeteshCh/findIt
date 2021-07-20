//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({secret: 'creativedevils',name:'cgBlogSessionId',saveUninitialized: false}));

app.use((req, res, next)=>{
  console.log("LOGGLE: " + req.url);
  if(req.session.username == null && req.url != "/" && req.url != "/login" && req.url != "/signup" && req.url != "/home/about" && req.url != "/home/contact" && req.url != "/signup?button=" )
    res.redirect("/");
  next();
});

mongoose.connect("mongodb://localhost:27017/newDB", {useNewUrlParser: true});

const postSchema = {
  title: String,
  author: String, 
  content: String,
  likes : Number,
  dislikes: Number
};

const Post = mongoose.model("Post", postSchema);

const userSchema = {
  name: String,
  password: String
};

const User = mongoose.model("User", userSchema);

app.get("/", function(req, res){
  res.render("login");
});

app.get("/logout", function(req, res){
  req.session.destroy((err)=>{})
  res.redirect("/");
});

app.post("/login", function(req, res){

  var username = '^' + req.body.userid + '$';
  var password = req.body.password;
  console.log(username + password);

  User.findOne({
    'name': {'$regex': username,$options:'i'},
    'password': [password]
  }, function(err, user) {
    if (!user) {
      console.log("login error", err);
      res.status(404).send({message: 'Invalid credentials'}); //Send error response here
    } else {
      console.log("login in");
      req.session.loggedIn = true
      req.session.username = req.body.userid
      res.redirect("/home");
    }
  });
});

app.get("/signup", function(req, res){
  res.render("signup");
});

app.post("/signup", function(req, res){

  const username = '^' + req.body.userid + '$';
  User.findOne({'name':{'$regex': username,$options:'i'}},function(err, result) {
      if(!result){
        const user = new User({
          name: req.body.userid,
          password: req.body.password
        });
        user.save();
        req.session.loggedIn = true
        req.session.username = req.body.userid
        res.redirect("/home");
      }else{
        res.status("409").send({message: 'User already exists'})
      }
  });
});


app.get("/home", function(req, res){
 
  Post.find().sort({"title":1})
  Post.find({}, function(err, posts){
    res.render("home", {
      startingContent: homeStartingContent,
      posts: posts
      });
  }).sort({"title":1});
});

app.get("/home/compose", function(req, res){
  res.render("compose");
});

app.post("/home/compose", function(req, res){
  console.log("username from seesion is:", req.session.username)
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
    author: req.session.username,
    likes : 0,
    dislikes:0
  });

  
  post.save()
  Post.find().sort({"title":1})
        res.redirect("/home");
    
  
});

app.get("/home/posts/:postId", function(req, res){

const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      title: post.title,
      content: post.content
    });
  });

});

app.get("/home/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/home/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});

app.post('/home/post/like',(req,res)=>{
  console.log(req);
  let postId=req.body.postId
  console.log("postid in appjs is:"+postId);
  Post.findByIdAndUpdate(postId, {$inc : {'likes' : 1}}, function(err, post){
      console.log("response post is:" + post)
    if(err){
      console.log("error in updating is:" + err);
    }
    if(!post){
      console.log("post is null or undefined")
    }
    res.status("200").send({message:"Success"});
  });
});

app.post('/home/post/dislike',(req,res)=>{
  console.log(req);
  let postId=req.body.postId
  console.log("postid in appjs is:"+postId);
  Post.findByIdAndUpdate(postId, {$inc : {'dislikes' : 1}}, function(err, post){
      console.log("response post is:" + post)
    if(err){
      console.log("error in updating is:" + err);
    }
    if(!post){
      console.log("post is null or undefined")
    }
    res.status("200").send({message:"Success"});
  });
});
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
