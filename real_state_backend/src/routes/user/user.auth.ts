import express from "express";
import { signinSchema, signupSchema } from "../../validators/user.validator";
import { validate } from "../../middleware/validate";
import { refreshAccessToken, signin, signout, signoutAll, signup,sendOtp, verifyOtpEmail } from "../../controllers/user/auth.controller";
import { authMiddleware } from "../../middleware/auth";

const router = express.Router();

// api/v1/user/auth/
router.post('/signup',validate(signupSchema),(signup));
router.post('/signin',validate(signinSchema),(signin));
router.post('/signout',authMiddleware,(signout));
router.post('/signoutAll',authMiddleware,(signoutAll));
router.post('/refresh-token', refreshAccessToken);  
router.post('/send-otp',sendOtp);
router.post('/verify-otp',verifyOtpEmail);
export default router;