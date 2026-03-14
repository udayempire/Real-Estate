import express from "express";
import { authMiddleware } from "../../middleware/auth";
import { validate, validateQuery } from "../../middleware/validate";
import {
  registerDeviceTokenSchema,
  unregisterDeviceTokenSchema,
  getNotificationsQuerySchema,
} from "../../validators/user.validator";
import {
  registerDeviceToken,
  unregisterDeviceToken,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../controllers/user/notification.controller";

const router = express.Router();

router.use(authMiddleware);

router.post("/device-token", validate(registerDeviceTokenSchema), registerDeviceToken);
router.delete("/device-token", validate(unregisterDeviceTokenSchema), unregisterDeviceToken);

router.get("/", validateQuery(getNotificationsQuerySchema), getMyNotifications);
router.patch("/:notificationId/read", markNotificationAsRead);
router.patch("/read-all", markAllNotificationsAsRead);

export default router;
