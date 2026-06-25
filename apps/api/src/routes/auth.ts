import bcrypt from "bcrypt";
import { Router } from "express";
import { findUserByUsername } from "../db/repositories/users";
import { HttpError } from "../middleware/error-handler";
import { requireAuth } from "../middleware/require-auth";
import { loginSchema } from "../validators/auth";

export const authRouter = Router();

authRouter.post("/login", (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = findUserByUsername(body.username);

    if (!user) {
      throw new HttpError(401, "Invalid username or password");
    }

    const passwordMatches = bcrypt.compareSync(body.password, user.password);
    if (!passwordMatches) {
      throw new HttpError(401, "Invalid username or password");
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    res.json({
      username: user.username,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", requireAuth, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      next(err);
      return;
    }
    res.clearCookie("connect.sid");
    res.sendStatus(204);
  });
});

authRouter.get("/me", requireAuth, (req, res) => {
  const user = req.session.user!;
  res.json({
    username: user.username,
    role: user.role,
  });
});