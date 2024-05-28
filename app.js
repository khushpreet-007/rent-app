var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const expressSession = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const passport = require('passport');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(expressSession({
  resave:false, 
  saveUninitialized: false,
  secret:"Hey "
}));

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(usersRouter.serializeUser());
passport.deserializeUser(usersRouter.deserializeUser());


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.get('/search', (req, res)=> {
  res.send("done");
  // try {
  //     const user = await userModel.findOne({ username: req.session.passport.user });
  //     const searchKeyword = req.query.search||"";
  //     // Using regular expression to perform case-insensitive search on the title field only
  //     const posts = await postModel.find({ title: { $regex: searchKeyword, $options: 'i' } }).populate("user");
  //     res.render('feed', { user, posts, nav: true });
  // } catch (error) {
  //     console.error(error);
  //     next(error);
  // }
});


module.exports = app;
