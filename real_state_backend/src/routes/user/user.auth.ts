import express from "express";
import { signinSchema, signupSchema } from "../../validators/user.validator";
import { validate } from "../../middleware/validate";
import { signin, signup } from "../../controllers/user/auth.controller";

const router = express.Router();

// api/v1/user/auth/register
router.post('/signup',validate(signupSchema),(signup))
router.post('/signin',validate(signinSchema),(signin))

export default router;