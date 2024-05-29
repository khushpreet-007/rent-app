var express = require('express');
var router = express.Router();
const localStrategy = require('passport-local');
const userModel = require('./users');
const postModel = require('./posts');
const nodemailer = require('nodemailer');

const passport = require('passport');
const upload = require('./multer');
const { post } = require('../app');
passport.use(new localStrategy(userModel.authenticate()));

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv').config()

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.API_KEY;

async function runChat(userInput) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 1000,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    // ... other safety settings
  ];

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: [
      {
        role: "user",
        parts: [{ text: "You are Khushpreet, a friendly assistant." }],
      },
      {
        role: "model",
        parts: [{ text: "Hello! Welcome to Home. My name is khushpreet. What's your name?" }],
      },
      {
        role: "user",
        parts: [{ text: "Hi" }],
      },
      {
        role: "model",
        parts: [{ text: "Hi there! Thanks for reaching out here ask me anything. Before I can answer your question, . Can you please provide more information?" }],
      },
    ],
  });

  const result = await chat.sendMessage(userInput);
  const response = result.response;
  return response.text();
}

router.post('/chat', async (req, res) => {
  try {
    const userInput = req.body?.userInput;
    console.log('incoming /chat req', userInput)
    if (!userInput) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await runChat(userInput);
    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { nav: false });
});

router.get('/register', function (req, res, next) {
  res.render('register', { nav: false });
});

// router.get('/user_profile/:userId', isLoggedIn, async function (req, res, next) {
//   const user = await userModel.findOne({ username: req.session.passport.user })
//     .populate("posts")
//   res.render('profile', { user, nav: true });
// });

router.get('/profile/:userId', isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.params.userId).populate('posts');
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.render('profile', { user, nav: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.post('/sendmail', async(req, res, next)=>{
  try{
      const {email} = req.body;
      const user = await User.findOne({ email }); // Find the seller by email
      if (!user) {
          return res.status(404).send('Seller not found');
      }
      const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
              user: 'kingage30s@gmail.com',
              pass: process.env.GMAIL_APP_PASSWORD 
          }
      });
      const info = await transporter.sendMail({
          from: 'kingage30s@gmail.com',
          to: email,
          subject: 'Intersted',
          html: `<p>I am interested to buy your property</p>`
      });
      res.send('Successfully sent mail');
  }
  catch(err){
      return next(err);
  }
});


router.get('/show/posts', isLoggedIn, async (req, res) => {
  try {
      // Fetch the current user
      const user = await userModel.findOne({ username: req.session.passport.user });
      if (!user) {
          return res.status(404).send('User not found');
      }
      // Fetch and populate only the posts belonging to the current user (seller)
      const posts = await postModel.find({ user: user._id }).populate('user');

      res.render('show', { user, posts, nav: true });
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
});

router.post('/delete/post/:postId', async (req, res) => {
  const postId = req.params.postId;
  const user = await userModel.findOne({ username: req.session.passport.user });
  try {
      // Find the post by ID
      const post = await postModel.findById(postId);

      if (!post) {
          return res.status(404).send('Post not found');
      }
      // Check if the current user owns the post (optional, based on your application logic)
      // For example, if the user ID is stored in the post's 'user' field
      if (post.user.toString() !== req.user._id.toString()) {
          return res.status(403).send('Unauthorized to delete this post');
      }
      // Delete the post using the Mongoose model's deleteOne method
      await postModel.deleteOne({ _id: postId });
      // res.redirect('/show/posts');
      res.redirect(`/profile/${user._id}`);
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
});



router.get('/feed', isLoggedIn, async function (req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const posts = await postModel.find().populate("user"); // Add .populate("user") if user is a reference in the post model
    res.render('feed', { user, posts, nav: true });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// const getpost = async (req, res) => {
//   let query = {};
//   if (req.body.search) {
//     const search = req.body.search;
//     query = {
//       title: { regex: search, $option: 'i' }
//     }
//   }
// }
// not api's
//  api
//  need to find all users  input read, data base compare
// router.get('/search/:key', (req, res)=> {
//   res.send("done");
// });

router.post('/search/:key', (req, res) => {
  const query = req.body.query;

  Item.find({ name: new RegExp(query, 'i') }, (err, items) => {
    if (err) {
      console.log(err);
    } else {
      res.render('search', { items });
    }
  });

});

router.get('/add', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render('add', { user, nav: true });
});
router.post('/createpost', isLoggedIn, upload.single("postimage"), async function (req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const post = await postModel.create({
      user: user._id,
      title: req.body.title,
      description: req.body.description,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      image: req.file.filename
    });

    user.posts.push(post._id);
    await user.save();

    // Redirect to the user's profile after post creation
    res.redirect(`/profile/${user._id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

router.post('/fileupload', isLoggedIn, upload.single("image"), async function (req, res, next) {
  //  res.send("uploaded");
  const user = await userModel.findOne({ username: req.session.passport.user });
  user.profileImage = req.file.filename;  // new file saved inside in always
  await user.save();
  // console.log(user.profileImage);
  res.redirect("/profile/:userId");
});
router.post('/register', function (req, res, next) {
  const data = new userModel({
    username: req.body.username,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    accountType: req.body.accountType,
    email: req.body.email,
    contact: req.body.contact
  });

  userModel.register(data, req.body.password)
    .then(function (user) {
      passport.authenticate("local")(req, res, function () {
        // Correctly get the user ID after authentication
        const userId = req.user._id;
        res.redirect(`/profile/${userId}`);
      });
    })
    .catch(function (err) {
      // Handle errors
      console.error(err);
      res.status(500).send("Error registering new user.");
    });
});

router.post('/login', passport.authenticate("local", {
  failureRedirect: "/"
}), function (req, res, next) {
  // After successful authentication, redirect to the user's profile
  const userId = req.user._id;
  res.redirect(`/profile/${userId}`);
});

// router.post('/logout', function (req, res, next) {
//   req.logout(function (err) {
//     if (err) { return next(err); }
//     res.redirect('/');
//   });
// });

router.get('/logout', isLoggedIn, function (req, res, next) {
  // req.logout(); // Remove the callback function
  res.redirect('/');
});

//  pagination
//  search bar

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect("/")
}

module.exports = router;
