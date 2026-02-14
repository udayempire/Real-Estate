import express from "express";
import { signinSchema, signupSchema, changePasswordSchema } from "../../validators/user.validator";
import { validate } from "../../middleware/validate";
import { refreshAccessToken, signin, signout, signoutAll, signup, sendOtp, verifyOtpEmail, forgotPassword, resetPassword, changePassword } from "../../controllers/user/auth.controller";
import { authMiddleware } from "../../middleware/auth";

const router = express.Router();

// api/v1/user/auth/
router.post('/signup', validate(signupSchema), (signup));
router.post('/signin', validate(signinSchema), (signin));
router.post('/signout', authMiddleware, (signout));
router.post('/signout-all', authMiddleware, (signoutAll));
router.post('/refresh-token', refreshAccessToken);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", authMiddleware, validate(changePasswordSchema), changePassword);
export default router;