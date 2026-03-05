import express from "express";
import { signin, setup2fa, confirm2faSetup, verify2fa, signout } from "../../controllers/staff/auth.staff.controller";

const router = express.Router();

router.post('/signin', signin);
router.post('/setup2fa', setup2fa);
router.post('/confirm2faSetup', confirm2faSetup);
router.post('/verify2fa', verify2fa);
router.post('/signout', signout);

export default router;