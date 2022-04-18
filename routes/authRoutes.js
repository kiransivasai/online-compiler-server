import { Router } from "express";
import {
  signup,
  login,
  logout,
  verifyUser,
  saveCode,
} from "../controllers/authControllers.js";

const router = Router();
router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);
router.get("/verifyuser", verifyUser);
router.post("/savecode", saveCode);

export default router;
