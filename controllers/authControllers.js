import User from "../models/User.js";
import jwt from "jsonwebtoken";
const maxAge = 5 * 24 * 60 * 60;
const createJWT = (id) => {
  return jwt.sign({ id }, "chatroom secret", {
    expiresIn: maxAge,
  });
};
const alertError = (err) => {
  let errors = { name: "", email: "", password: "" };
  if (err.message === "incorrect email") {
    errors.email = "This email not found";
  }
  if (err.message === "incorrect password") {
    errors.password = "Password is incorrect";
  }
  if (err.code === 11000) {
    errors.email = "This email is already registered";
    return errors;
  }

  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }
  return errors;
};

export const signup = async (req, res) => {
  const { name, email, password, userType } = req.body;
  try {
    const user = await User.create({
      name: name,
      email: email,
      password: password,
      userType: userType,
    });
    const token = createJWT(user._id);
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: maxAge * 1000,
    });
    res.status(201).json({ user });
  } catch (error) {
    let errors = alertError(error);
    res.status(400).json({ errors });
  }
};
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.login(email, password);
    const token = createJWT(user._id);
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: maxAge * 1000,
    });
    res.status(201).json({ user });
  } catch (error) {
    let errors = alertError(error);
    res.status(400).json({ errors });
  }
};

export const verifyUser = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, "chatroom secret", async (err, decodedToken) => {
      console.log(decodedToken);
      if (err) {
        console.log(err.message);
      } else {
        let user = await User.findById(decodedToken.id);
        res.json(user);
        next();
      }
    });
  } else {
    next();
  }
};

export const logout = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.status(200).json({ logout: true });
};

export const saveCode = async (req, res) => {
  const { _id, code, language, room_id } = req.body;
  const check = User.findOne({ _id: _id, "programs.room_id": room_id });
  console.log(check);
  const result = await User.updateOne(
    {
      _id: _id,
      "programs.room_id": room_id,
    },
    {
      $set: {
        "programs.$.code": code,
      },
    }
  );
  res.status(200).json({ saved: true });
};
