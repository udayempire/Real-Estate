import express from "express";
import { signinSchema, signupSchema } from "../../validators/user.validator";
import { validate } from "../../middleware/validate";
import { signin, signout, signoutAll, signup } from "../../controllers/user/auth.controller";
import { authMiddleware } from "../../middleware/auth";

const router = express.Router();

// api/v1/user/auth/
router.post('/signup',validate(signupSchema),(signup));
router.post('/signin',validate(signinSchema),(signin));
router.post('/signout',authMiddleware,(signout));
router.post('/signoutAll',authMiddleware,(signoutAll));

export default router;