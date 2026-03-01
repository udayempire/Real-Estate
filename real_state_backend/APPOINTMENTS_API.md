# Appointments API Documentation

## Overview
The Appointments API allows users to schedule property viewing appointments. Users can create, view, update, cancel, and delete appointments for properties they're interested in. A single user can create multiple appointments for the same property.

## Base URL
```
/api/v1/appointments
```

---

## Endpoints

### 1. Create an Appointment
**POST** `/api/v1/appointments/`

**Authentication:** Required

**Description:** Create a new appointment for viewing a property

#### Request Body
```json
{
  "propertyId": "clxyz123...",
  "appointmentDate": "2024-03-15",
  "appointmentTime": "10:00 AM",
  "notes": "Please call me before the appointment",
  "isPreBooked": "YES"
}
```

#### Request Schema
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| propertyId | string | Yes | ID of the property to schedule appointment for |
| appointmentDate | string | Yes | Date of appointment in YYYY-MM-DD format (must be today or future date) |
| appointmentTime | string | Yes | Time of appointment (HH:MM or HH:MM AM/PM format) |
| notes | string | No | Additional notes for the appointment |
| isPreBooked | string | No | Pre-booking status ("YES" or "NO"), defaults to "NO" |

#### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "id": "appointment_id_123",
    "userId": "user123",
    "propertyId": "property123",
    "appointmentDate": "2024-03-15T00:00:00.000Z",
    "appointmentTime": "10:00 AM",
    "status": "SCHEDULED",
    "notes": "Please call me before the appointment",
    "createdAt": "2024-02-15T10:30:00.000Z",
    "updatedAt": "2024-02-15T10:30:00.000Z",
    "property": {
      "id": "property123",
      "title": "Luxury 3BHK Apartment",
      "description": "Spacious apartment with modern amenities",
      "propertyType": "FLAT",
      "status": "ACTIVE",
      "listingPrice": 8500000,
      "state": "Maharashtra",
      "city": "Mumbai",
      "locality": "Bandra West",
      "address": "Hill View Society, Bandra West, Mumbai",
      "carpetArea": 1200,
      "carpetAreaUnit": "SQFT",
      "category": "RESIDENTIAL",
      "furnishingStatus": "FullyFurnished",
      "numberOfRooms": 3,
      "numberOfBathrooms": 2,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "media": [
        {
          "id": "media1",
          "url": "https://example.com/image.jpg",
          "key": "s3-key",
          "mediaType": "IMAGE",
          "order": 0
        }
      ],
      "user": {
        "id": "owner123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+919876543210",
        "avatar": "https://example.com/avatar.jpg"
      }
    }
  }
}
```

#### Error Response (400 Bad Request)
```json
{
  "errors": [
    {
      "path": ["appointmentDate"],
      "message": "Invalid date format or date is in the past. Use YYYY-MM-DD format and ensure the date is today or in the future."
    }
  ]
}
```

#### Error Response (404 Not Found)
```json
{
  "message": "Property not found"
}
```

#### Error Response (401 Unauthorized)
```json
{
  "message": "Unauthorized User"
}
```

---

### 2. Get All Appointments
**GET** `/api/v1/appointments/`

**Authentication:** Required

**Description:** Retrieve all appointments for the authenticated user with pagination and filtering options

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 10 | Number of items per page (max 100) |
| status | string | No | - | Filter by appointment status (`SCHEDULED`, `COMPLETED`, `CANCELLED`) |
| propertyId | string | No | - | Filter by specific property ID |

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "appointment_id_123",
      "userId": "user123",
      "propertyId": "property123",
      "appointmentDate": "2024-03-15T00:00:00.000Z",
      "appointmentTime": "10:00 AM",
      "status": "SCHEDULED",
      "notes": "Please call me before the appointment",
      "isPreBooked": "YES",
      "createdAt": "2024-02-15T10:30:00.000Z",
      "updatedAt": "2024-02-15T10:30:00.000Z",
      "property": {
        "id": "property123",
        "title": "Luxury 3BHK Apartment",
        "propertyType": "FLAT",
        "status": "ACTIVE",
        "listingPrice": 8500000,
        "state": "Maharashtra",
        "city": "Mumbai",
        "locality": "Bandra West",
        "media": [
          {
            "id": "media1",
            "url": "https://example.com/image.jpg",
            "key": "s3-key",
            "mediaType": "IMAGE",
            "order": 0
          }
        ],
        "user": {
          "id": "owner123",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "phone": "+919876543210",
          "avatar": "https://example.com/avatar.jpg"
        }
      }
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

#### Example Requests
```bash
# Get all appointments
GET /api/v1/appointments/

# Get scheduled appointments only
GET /api/v1/appointments/?status=SCHEDULED

# Get appointments for a specific property
GET /api/v1/appointments/?propertyId=property123

# Get second page with 20 items per page
GET /api/v1/appointments/?page=2&limit=20
```

---

### 3. Get Single Appointment
**GET** `/api/v1/appointments/:appointmentId`

**Authentication:** Required

**Description:** Retrieve details of a specific appointment by ID

#### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| appointmentId | string | Yes | ID of the appointment |

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "appointment_id_123",
    "userId": "user123",
    "propertyId": "property123",
    "appointmentDate": "2024-03-15T00:00:00.000Z",
    "appointmentTime": "10:00 AM",
    "status": "SCHEDULED",
    "notes": "Please call me before the appointment",
    "createdAt": "2024-02-15T10:30:00.000Z",
    "updatedAt": "2024-02-15T10:30:00.000Z",
    "property": {
      "id": "property123",
      "title": "Luxury 3BHK Apartment",
      "description": "Spacious apartment with modern amenities",
      "propertyType": "FLAT",
      "listingPrice": 8500000,
      "media": [
        {
          "id": "media1",
          "url": "https://example.com/image.jpg",
          "key": "s3-key",
          "mediaType": "IMAGE",
          "order": 0
        }
      ],
      "user": {
        "id": "owner123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+919876543210",
        "avatar": "https://example.com/avatar.jpg"
      }
    }
  }
}
```

#### Error Response (404 Not Found)
```json
{
  "message": "Appointment not found"
}
```

---

### 4. Update an Appointment
**PUT** `/api/v1/appointments/:appointmentId`

**Authentication:** Required

**Description:** Update an existing appointment (date, time, status, or notes)

#### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| appointmentId | string | Yes | ID of the appointment to update |

#### Request Body
```json
{
  "appointmentDate": "2024-03-20",
  "appointmentTime": "2:30 PM",
  "status": "SCHEDULED",
  "notes": "Updated notes",
  "isPreBooked": "NO"
}
```

#### Request Schema
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| appointmentDate | string | No | New date in YYYY-MM-DD format (must be today or future date) |
| appointmentTime | string | No | New time (HH:MM or HH:MM AM/PM format) |
| status | string | No | New status (`SCHEDULED`, `COMPLETED`, `CANCELLED`) |
| notes | string | No | Updated notes |
| isPreBooked | string | No | Pre-booking status ("YES" or "NO") |

**Note:** All fields are optional. You can update one or more fields.

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Appointment updated successfully",
  "data": {
    "id": "appointment_id_123",
    "userId": "user123",
    "propertyId": "property123",
    "appointmentDate": "2024-03-20T00:00:00.000Z",
    "appointmentTime": "2:30 PM",
    "status": "SCHEDULED",
    "notes": "Updated notes",
    "createdAt": "2024-02-15T10:30:00.000Z",
    "updatedAt": "2024-02-15T14:20:00.000Z",
    "property": {
      "id": "property123",
      "title": "Luxury 3BHK Apartment",
      "media": [
        {
          "id": "media1",
          "url": "https://example.com/image.jpg",
          "key": "s3-key",
          "mediaType": "IMAGE",
          "order": 0
        }
      ],
      "user": {
        "id": "owner123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+919876543210",
        "avatar": "https://example.com/avatar.jpg"
      }
    }
  }
}
```

#### Error Response (404 Not Found)
```json
{
  "message": "Appointment not found"
}
```

---

### 5. Cancel an Appointment
**PATCH** `/api/v1/appointments/:appointmentId/cancel`

**Authentication:** Required

**Description:** Cancel a scheduled appointment (sets status to CANCELLED)

#### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| appointmentId | string | Yes | ID of the appointment to cancel |

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "data": {
    "id": "appointment_id_123",
    "userId": "user123",
    "propertyId": "property123",
    "appointmentDate": "2024-03-15T00:00:00.000Z",
    "appointmentTime": "10:00 AM",
    "status": "CANCELLED",
    "notes": "Please call me before the appointment",
    "createdAt": "2024-02-15T10:30:00.000Z",
    "updatedAt": "2024-02-15T15:00:00.000Z",
    "property": {
      "id": "property123",
      "title": "Luxury 3BHK Apartment",
      "media": [
        {
          "id": "media1",
          "url": "https://example.com/image.jpg",
          "key": "s3-key",
          "mediaType": "IMAGE",
          "order": 0
        }
      ]
    }
  }
}
```

#### Error Response (404 Not Found)
```json
{
  "message": "Appointment not found"
}
```

---

### 6. Toggle Pre-Booked Status
**PATCH** `/api/v1/appointments/:appointmentId/toggle-prebooked`

**Authentication:** Required

**Description:** Toggle the pre-booked status of an appointment between YES and NO

#### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| appointmentId | string | Yes | ID of the appointment to toggle |

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Pre-booked status toggled to YES",
  "data": {
    "id": "appointment_id_123",
    "userId": "user123",
    "propertyId": "property123",
    "appointmentDate": "2024-03-15T00:00:00.000Z",
    "appointmentTime": "10:00 AM",
    "status": "SCHEDULED",
    "notes": "Please call me before the appointment",
    "isPreBooked": "YES",
    "createdAt": "2024-02-15T10:30:00.000Z",
    "updatedAt": "2024-02-15T16:00:00.000Z",
    "property": {
      "id": "property123",
      "title": "Luxury 3BHK Apartment",
      "media": [
        {
          "id": "media1",
          "url": "https://example.com/image.jpg",
          "key": "s3-key",
          "mediaType": "IMAGE",
          "order": 0
        }
      ],
      "user": {
        "id": "owner123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+919876543210",
        "avatar": "https://example.com/avatar.jpg"
      }
    }
  }
}
```

#### Error Response (404 Not Found)
```json
{
  "message": "Appointment not found"
}
```

---

### 7. Delete an Appointment
**DELETE** `/api/v1/appointments/:appointmentId`

**Authentication:** Required

**Description:** Permanently delete an appointment

#### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| appointmentId | string | Yes | ID of the appointment to delete |

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Appointment deleted successfully"
}
```

#### Error Response (404 Not Found)
```json
{
  "message": "Appointment not found"
}
```

---

### 8. Get Appointments for a Specific Property
**GET** `/api/v1/appointments/property/:propertyId`

**Authentication:** Required

**Description:** Retrieve all appointments for a specific property made by the authenticated user

#### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| propertyId | string | Yes | ID of the property |

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 10 | Number of items per page |
| status | string | No | - | Filter by appointment status |

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "appointment_id_123",
      "userId": "user123",
      "propertyId": "property123",
      "appointmentDate": "2024-03-15T00:00:00.000Z",
      "appointmentTime": "10:00 AM",
      "status": "SCHEDULED",
      "notes": "First viewing",
      "createdAt": "2024-02-15T10:30:00.000Z",
      "updatedAt": "2024-02-15T10:30:00.000Z"
    },
    {
      "id": "appointment_id_124",
      "userId": "user123",
      "propertyId": "property123",
      "appointmentDate": "2024-03-20T00:00:00.000Z",
      "appointmentTime": "2:00 PM",
      "status": "SCHEDULED",
      "notes": "Second viewing with family",
      "createdAt": "2024-02-16T11:00:00.000Z",
      "updatedAt": "2024-02-16T11:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

#### Error Response (404 Not Found)
```json
{
  "message": "Property not found"
}
```

---

## Data Models

### Appointment Object
```typescript
{
  id: string                    // Unique appointment identifier
  userId: string                // ID of the user who created the appointment
  propertyId: string            // ID of the property for the appointment
  appointmentDate: Date         // Date of the appointment
  appointmentTime: string       // Time of the appointment
  status: AppointmentStatus     // SCHEDULED | COMPLETED | CANCELLED
  notes: string?                // Optional notes for the appointment
  isPreBooked: string           // Pre-booking status ("YES" or "NO")
  createdAt: Date               // When the appointment was created
  updatedAt: Date               // When the appointment was last updated
  property: Property            // Related property details (included in responses)
}
```

### Appointment Status Enum
- `SCHEDULED` - Appointment is scheduled and pending
- `COMPLETED` - Appointment has been completed
- `CANCELLED` - Appointment has been cancelled

---

## Authentication

All endpoints require authentication via JWT Bearer token.

**Header:**
```
Authorization: Bearer <your-jwt-token>
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Resource created successfully |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing or invalid token) |
| 404 | Resource not found |
| 500 | Internal server error |

---

## Usage Examples

### Create an Appointment
```bash
curl -X POST \
  'http://localhost:5000/api/v1/appointments/' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "propertyId": "clxyz123abc",
    "appointmentDate": "2024-03-15",
    "appointmentTime": "10:00 AM",
    "notes": "Please call me before the appointment",
    "isPreBooked": "YES"
  }'
```

### Get All Scheduled Appointments
```bash
curl -X GET \
  'http://localhost:5000/api/v1/appointments/?status=SCHEDULED' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Update an Appointment
```bash
curl -X PUT \
  'http://localhost:5000/api/v1/appointments/appointment_id_123' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "appointmentDate": "2024-03-20",
    "appointmentTime": "2:30 PM"
  }'
```

### Cancel an Appointment
```bash
curl -X PATCH \
  'http://localhost:5000/api/v1/appointments/appointment_id_123/cancel' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Toggle Pre-Booked Status
```bash
curl -X PATCH \
  'http://localhost:5000/api/v1/appointments/appointment_id_123/toggle-prebooked' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Delete an Appointment
```bash
curl -X DELETE \
  'http://localhost:5000/api/v1/appointments/appointment_id_123' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## Notes

1. **Multiple Appointments:** A user can create multiple appointments for the same property, allowing them to schedule different viewing times.

2. **Date Validation:** Appointment dates must be today or in the future. Past dates are not allowed.

3. **Time Format:** Time can be provided in 24-hour format (14:30) or 12-hour format with AM/PM (2:30 PM).

4. **User Isolation:** Users can only view, update, cancel, and delete their own appointments.

5. **Property Validation:** The API validates that the property exists before creating an appointment.

6. **Status Updates:** You can update the status manually using the update endpoint, or use the dedicated cancel endpoint for convenience.

7. **Pre-Booking Status:** The `isPreBooked` field accepts "YES" or "NO" values from the frontend. Use the toggle endpoint to easily switch between states, or update it directly with the update endpoint.

8. **Pagination:** All list endpoints support pagination with a maximum limit of 100 items per page.
