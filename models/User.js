import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
const { isEmail } = validator;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter a name"],
    },
    email: {
      type: String,
      required: [true, "Please Enter a email"],
      unique: true,
      lowercase: true,
      validate: [isEmail, "Please Enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Please Enter a password"],
      minlength: [6, "Password should be atleast 6 characters long"],
    },
    userType: {
      type: String,
      required: [true],
    },
    programs: {
      type: Array,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const isAuthenticated = await bcrypt.compare(password, user.password);
    if (isAuthenticated) {
      return user;
    }
    throw Error("incorrect password");
  } else {
    throw Error("incorrect email");
  }
};

const User = mongoose.model("user", userSchema);

export default User;
