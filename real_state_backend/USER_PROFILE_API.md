# User Profile API Documentation

## Endpoints

### 1. Get User Profile
**GET** `/api/v1/user/profile`

**Description:**
Retrieves the authenticated user's profile information including KYC details and property statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+919876543210",
    "avatar": "https://bucket.s3.amazonaws.com/avatars/user123.jpg",
    "avatarKey": "avatars/user123.jpg",
    "age": 30,
    "gender": "MALE",
    "referralCode": "JOHN1234",
    "referrerId": "clxxx...",
    "points": 150,
    "isEmailVerified": true,
    "createdAt": "2026-01-15T10:30:00.000Z",
    "aadharCardNumber": "1234-5678-9012",
    "aadharCardStatus": "VERIFIED",
    "panCardNumber": "ABCDE1234F",
    "panCardStatus": "VERIFIED",
    "propertyStats": {
      "totalProperties": 25,
      "soldToRealbro": 3,
      "soldFromListings": 5,
      "soldOffline": 2,
      "totalListed": 15,
      "activePropertyCount": 10
    }
  }
}
```

**Property Statistics Fields:**
- `totalProperties`: Total number of properties added by the user (all statuses)
- `soldToRealbro`: Count of properties sold to Realbro company
- `soldFromListings`: Count of properties sold through platform listings
- `soldOffline`: Count of properties sold offline
- `totalListed`: Total count of properties with status ACTIVE, UNLISTED, SOLDOFFLINE, or DRAFT
- `activePropertyCount`: Count of properties with ACTIVE status only

**Error Response (401):**
```json
{
  "message": "Unauthorized"
}
```

**Error Response (404):**
```json
{
  "message": "User does not exist"
}
```

---

### 2. Update User Profile
**PUT** `/api/v1/user/profile`

**Description:**
Updates the authenticated user's profile information.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:** (All fields optional)
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+919876543210",
  "email": "newemail@example.com",
  "password": "newSecurePassword123",
  "avatar": "https://bucket.s3.amazonaws.com/avatars/new-avatar.jpg",
  "avatarKey": "avatars/new-avatar.jpg",
  "age": 31,
  "gender": "MALE"
}
```

**Field Details:**
- `firstName`: User's first name (string)
- `lastName`: User's last name (string)
- `phone`: Phone number with country code (string)
- `email`: Email address (string) - Note: Updating email will set `isEmailVerified` to false
- `password`: New password (string) - Will be hashed before storing
- `avatar`: URL to avatar image (string)
- `avatarKey`: S3 key for avatar (string)
- `age`: User's age (number)
- `gender`: User's gender - "MALE" | "FEMALE" | "OTHER"

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "newemail@example.com",
    "phone": "+919876543210",
    "avatar": "https://bucket.s3.amazonaws.com/avatars/new-avatar.jpg",
    "avatarKey": "avatars/new-avatar.jpg",
    "age": 31,
    "gender": "MALE",
    "isEmailVerified": false,
    "updatedAt": "2026-02-16T..."
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "message": "No fields provided to update"
}
```

**401 Unauthorized:**
```json
{
  "message": "Unauthorized"
}
```

**409 Conflict (Email/Phone already exists):**
```json
{
  "message": "Email or phone already in use"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Internal server error"
}
```

---

## Usage Examples

### Get Profile with cURL
```bash
curl -X GET http://localhost:4000/api/v1/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Profile with cURL
```bash
curl -X PUT http://localhost:4000/api/v1/user/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Smith",
    "age": 32
  }'
```

---

## Notes

1. **Authentication Required**: Both endpoints require a valid JWT token in the Authorization header
2. **Email Verification**: If email is updated, the user will need to verify the new email address
3. **Password Security**: Passwords are automatically hashed using bcrypt before storage
4. **KYC Information**: Aadhar and PAN details are extracted from the user's KYC records and included in the profile response
5. **Property Statistics**: Statistics are calculated in real-time based on current property data
6. **Partial Updates**: The update endpoint supports partial updates - you only need to send fields you want to change

---

## Property Status Breakdown

The property statistics track properties across different lifecycle stages:

- **ACTIVE**: Properties currently listed and visible to buyers
- **UNLISTED**: Properties temporarily hidden from public view but not sold
- **SOLDOFFLINE**: Properties sold through offline channels
- **SOLDTOREALBRO**: Properties purchased by Realbro company
- **SOLDFROMLISTINGS**: Properties sold through the platform's listings to buyers
- **DRAFT**: Properties saved as drafts and not yet published

**TotalListed Calculation:**
```
totalListed = ACTIVE + UNLISTED + SOLDOFFLINE + DRAFT
```

This excludes properties with SOLDTOREALBRO and SOLDFROMLISTINGS status as these are completed sales.
