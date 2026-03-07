import express from "express";
import { signin, setup2fa, confirm2faSetup, verify2fa, signout, refreshAccessToken } from "../../controllers/staff/auth.staff.controller";
import { validate } from "../../middleware/validate";
import { setup2faSchema, signoutStaffSchema, staffSigninSchema, verify2faSchema } from "../../validators/staff.validator";

const router = express.Router();

router.post('/signin', validate(staffSigninSchema), signin);
router.post('/setup2fa', validate(setup2faSchema), setup2fa);
router.post('/confirm2faSetup', validate(verify2faSchema), confirm2faSetup);
router.post('/verify2fa', validate(verify2faSchema), verify2fa);
router.post('/signout', validate(signoutStaffSchema), signout);
router.post('/refresh', validate(signoutStaffSchema), refreshAccessToken);

export default router;