const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect("mongodb+srv://khushpreet:5iZVzYPZlLBPNAj9@code-a.5othqvs.mongodb.net/?retryWrites=true&w=majority&appName=code-a");

const userSchema = new mongoose.Schema({
  username: String,
  firstname: String,
  lastname: String,
  accountType: String,
  email: String,
  password: String,
  profileImage: String,
  contact: Number,
  boards: {
    type: Array,
    default: []
  },

  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post"
    }
  ]
});

userSchema.plugin(plm);
module.exports = mongoose.model("user", userSchema);
