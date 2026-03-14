# Notifications Integration Guide (App + Backend)

## Scope
This guide explains:
- How app team should integrate push notifications (Firebase FCM)
- How to register/unregister device tokens with backend
- How to fetch and manage in-app notification list
- How backend Firebase Admin must be configured

---

## 1) Backend API Summary

Base URL:
- `https://<your-domain><API_VERSION>`
- Example: `https://api.example.com/api/v1`

Auth:
- All endpoints below require user auth token (`Authorization: Bearer <accessToken>`)

### A. Register Device Token
Endpoint:
- `POST /user/notifications/device-token`

Body:
```json
{
  "token": "fcm_device_token_here",
  "platform": "ANDROID"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Device token registered successfully",
  "data": {
    "id": "...",
    "userId": "...",
    "token": "...",
    "platform": "ANDROID",
    "isActive": true,
    "lastSeenAt": "2026-03-14T00:00:00.000Z",
    "createdAt": "2026-03-14T00:00:00.000Z",
    "updatedAt": "2026-03-14T00:00:00.000Z"
  }
}
```

### B. Unregister Device Token (Logout)
Endpoint:
- `DELETE /user/notifications/device-token`

Body:
```json
{
  "token": "fcm_device_token_here"
}
```

### C. Get Notifications (Inbox)
Endpoint:
- `GET /user/notifications?page=1&limit=20&isRead=false`

Response (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "userId": "...",
      "type": "APPOINTMENT_CREATED",
      "title": "Appointment booked",
      "description": "Your appointment for XYZ has been scheduled successfully.",
      "data": {
        "appointmentId": "...",
        "propertyId": "..."
      },
      "isRead": false,
      "readAt": null,
      "createdAt": "2026-03-14T00:00:00.000Z",
      "updatedAt": "2026-03-14T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### D. Mark One Notification as Read
Endpoint:
- `PATCH /user/notifications/:notificationId/read`

### E. Mark All Notifications as Read
Endpoint:
- `PATCH /user/notifications/read-all`

---

## 2) Notification Types Available

- `GENERIC`
- `APPOINTMENT_CREATED`
- `APPOINTMENT_UPDATED`
- `APPOINTMENT_CANCELLED`
- `SUPPORT_TICKET_CREATED`
- `SUPPORT_TICKET_UPDATED`

Current automatic triggers implemented:
- On appointment creation
- On support ticket creation

---

## 3) App Team Integration Flow

### Login / Session Start
1. Get FCM token from Firebase SDK.
2. Call `POST /user/notifications/device-token` with token + platform.
3. Store token locally.

### Token Refresh
1. Firebase may rotate token.
2. On `onNewToken(...)`, immediately re-call register endpoint with new token.

### Logout
1. Call `DELETE /user/notifications/device-token` with current token.
2. Then clear local auth and token cache.

### Notification Inbox Screen
1. Use `GET /user/notifications` for paginated list.
2. On open/click item, call `PATCH /:id/read`.
3. Optional "Mark all" button -> `PATCH /read-all`.

---

## 4) Firebase Setup (Android App)

## 4.1 Create Firebase Project
1. Go to Firebase Console.
2. Create/select project.
3. Add Android app with exact package name.
4. Download `google-services.json` and place it in app module folder.

## 4.2 Android Gradle Setup

Project-level `build.gradle` or `settings.gradle`:
- Add Google Services plugin if not already present.

App-level `build.gradle`:
```gradle
plugins {
  id 'com.android.application'
  id 'com.google.gms.google-services'
}

dependencies {
  implementation platform('com.google.firebase:firebase-bom:33.10.0')
  implementation 'com.google.firebase:firebase-messaging'
}
```

Sync Gradle.

## 4.3 Get FCM Token
Kotlin example:
```kotlin
FirebaseMessaging.getInstance().token
  .addOnCompleteListener { task ->
    if (!task.isSuccessful) return@addOnCompleteListener
    val token = task.result ?: return@addOnCompleteListener
    // Send this token to backend: POST /user/notifications/device-token
  }
```

## 4.4 Handle Token Refresh
```kotlin
class AppFirebaseMessagingService : FirebaseMessagingService() {
  override fun onNewToken(token: String) {
    super.onNewToken(token)
    // If user is logged in, call backend register endpoint again
  }

  override fun onMessageReceived(message: RemoteMessage) {
    super.onMessageReceived(message)
    // Handle foreground push: show local notification or update UI
  }
}
```

Add service in `AndroidManifest.xml`:
```xml
<service
    android:name=".AppFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

---

## 5) Firebase Setup (Backend for Push Sending)

Backend uses Firebase Admin SDK and requires these env vars:

Preferred (recommended):

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./realbro-notifications-firebase-adminsdk-fbsvc-37cd903de3.json
```

Alternate (manual fields):

```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

How to get values:
1. Firebase Console -> Project Settings -> Service Accounts.
2. Generate new private key JSON.
3. Map JSON fields:
   - `project_id` -> `FIREBASE_PROJECT_ID`
   - `client_email` -> `FIREBASE_CLIENT_EMAIL`
   - `private_key` -> `FIREBASE_PRIVATE_KEY`
4. Keep `\n` escaped exactly in `.env`.
5. Restart backend server after env update.

Security notes:
- Never commit service account key.
- Restrict access to `.env`.
- Rotate key if leaked.

---

## 6) Quick QA Checklist

1. User logs in and token is registered (200 response).
2. Create appointment from app -> push should arrive.
3. Create support ticket from app -> push should arrive.
4. Open notification inbox -> records should be visible.
5. Mark one read + mark all read should work.
6. Logout -> unregister endpoint should deactivate token.

---

## 7) Troubleshooting

No push received:
- Confirm token registered in backend.
- Confirm Firebase env vars are valid on backend.
- Confirm app package name matches Firebase project app.
- Confirm notification permissions are granted (Android 13+).
- Confirm app handles foreground notifications.

Token invalid errors:
- Backend auto-deactivates invalid tokens.
- App should re-register latest token on `onNewToken`.
