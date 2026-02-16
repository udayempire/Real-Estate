# Property API Documentation

## Updated Property Schema

The property API has been enhanced with comprehensive fields for better property listings.

---

## Endpoints

### 1. Create Property
**POST** `/api/v1/property`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Luxurious 3BHK Apartment in Arera Colony",
  "description": "Spacious and well-maintained apartment with modern amenities",
  "status": "ACTIVE",
  "propertyType": "FLAT",
  
  "listingPrice": 5000000,
  
  "state": "Madhya Pradesh",
  "city": "Bhopal",
  "locality": "Arera Colony",
  "subLocality": "Green Heights Apartments",
  "flatNo": "A-401",
  "address": "A-401, Green Heights, Arera Colony, Bhopal",
  "latitude": 23.2156,
  "longitude": 77.4212,
  
  "carpetArea": 1200,
  "carpetAreaUnit": "SQFT",
  
  "category": "Residential",
  "furnishingStatus": "FullyFurnished",
  "availabilityStatus": "ReadyToMove",
  "ageOfProperty": "OneToThree",
  
  "numberOfRooms": 3,
  "numberOfBathrooms": 2,
  "numberOfBalcony": 2,
  "numberOfFloors": 12,
  "propertyFloor": "4",
  
  "allInclusivePrice": false,
  "negotiablePrice": true,
  "govtChargesTaxIncluded": false,
  
  "propertyFacing": "East",
  "amenities": [
    "Security / Fire Alarm",
    "Water Storage",
    "Lifts",
    "Park",
    "Pool"
  ],
  "locationAdvantages": [
    "Close to Metro Station",
    "Close to School",
    "Close to Hospital"
  ],
  "coveredParking": 1,
  "uncoveredParking": 0,
  
  "media": [
    {
      "url": "https://bucket.s3.amazonaws.com/property/images/user/image1.jpg",
      "key": "property/images/user/image1.jpg",
      "mediaType": "IMAGE",
      "order": 0
    }
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "title": "Luxurious 3BHK Apartment in Arera Colony",
    "listingPrice": 5000000,
    "category": "Residential",
    // ... all other fields
    "createdAt": "2026-02-12T...",
    "updatedAt": "2026-02-12T...",
    "media": [...]
  }
}
```

---

### 2. Update Property
**PUT** `/api/v1/property/:id`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:** (All fields optional)
```json
{
  "title": "Updated Title",
  "listingPrice": 5500000,
  "negotiablePrice": false,
  "amenities": ["Lifts", "Park", "Pool", "Gym"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    // ... updated property data
  }
}
```

---

### 3. Get All Properties
**GET** `/api/v1/property?page=1&limit=10`

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "clxxx...",
      "title": "Property Title",
      // ... all property fields
      "media": [...]
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

### 4. Get My Properties
**GET** `/api/v1/property/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "clxxx...",
      // ... property data with media
    }
  ]
}
```

---

### 5. Get Single Property
**GET** `/api/v1/property/:id`

**Success Response (200):**
```json
{
  "data": {
    "id": "clxxx...",
    "title": "Property Title",
    // ... all fields
    "media": [...]
  }
}
```

---

### 6. Delete Property
**DELETE** `/api/v1/property/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Property with id clxxx... deleted successfully"
}
```

---

### 7. Change Property Status (Toggle Status)
**PUT** `/api/v1/property/change-status/:id`

**Description:**
Toggle/update property status between different states. All statuses can be updated from any current status.

**Available Status Transitions:**
- `ACTIVE` ↔ `UNLISTED` ↔ `SOLDOFFLINE` ↔ `SOLDTOREALBRO` ↔ `SOLDFROMLISTINGS` ↔ `DRAFT`
- Any status can be changed to any other status

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "SOLDOFFLINE"
}
```

**Valid Status Values:**
- `ACTIVE` - Property is active and visible in public listings
- `UNLISTED` - Property is unlisted/hidden from public listings
- `SOLDOFFLINE` - Property has been sold offline
- `SOLDTOREALBRO` - Property has been sold to Realbro
- `SOLDFROMLISTINGS` - Property has been sold from platform listings
- `DRAFT` - Property is in draft mode

**Success Response (200):**
```json
{
  "success": true,
  "message": "Property status updated successfully from ACTIVE to SOLDOFFLINE",
  "data": {
    "id": "clxxx...",
    "title": "Luxurious 3BHK Apartment in Arera Colony",
    "status": "SOLDOFFLINE",
    "updatedAt": "2026-02-16T..."
  }
}
```

**Error Responses:**

**400 Bad Request - Invalid Status:**
```json
{
  "message": "Invalid status. Valid statuses are: ACTIVE, UNLISTED, SOLDOFFLINE, SOLDTOREALBRO, SOLDFROMLISTINGS, DRAFT"
}
```

**404 Not Found:**
```json
{
  "message": "Property not found or not owned by this user"
}
```

---

### 8. Add Media to Property
**POST** `/api/v1/property/:id/media`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "media": [
    {
      "url": "https://bucket.s3.amazonaws.com/property/images/user/image2.jpg",
      "key": "property/images/user/image2.jpg",
      "mediaType": "IMAGE"
    },
    {
      "url": "https://bucket.s3.amazonaws.com/property/videos/user/video1.mp4",
      "key": "property/videos/user/video1.mp4",
      "mediaType": "VIDEO"
    }
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": [
    // ... all media items with order
  ]
}
```

---

### 9. Delete Media
**DELETE** `/api/v1/property/media/:mediaId`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Media deleted and reordered successfully"
}
```

---

## Field Reference

### Required Fields (Create)
- `title`: string
- `propertyType`: "FARMLAND" | "DUPLEX" | "FLAT" | "PLOT"
- `listingPrice`: number (positive)
- `state`: string
- `city`: string
- `address`: string
- `latitude`: number
- `longitude`: number
- `media`: array (min 1 item)

### Optional Fields

#### Basic Details
- `description`: string
- `status`: "ACTIVE" | "INACTIVE" | "SOLD" | "DRAFT" (default: "ACTIVE")
- `category`: "Residential" | "Commercial" | "FarmLand"
- `furnishingStatus`: 
  - For Residential/Commercial: "FullyFurnished" | "SemiFurnished" | "Unfurnished"
  - For FarmLand: "FencedWired" | "FertileLand" | "OpenLand" | "Cultivated"
- `availabilityStatus`: "ReadyToMove" | "UnderConstruction"
- `ageOfProperty`: "ZeroToOne" | "OneToThree" | "ThreeToSix" | "SixToTen" | "TenPlus"

#### Location Details
- `locality`: string (e.g., "Arera Colony")
- `subLocality`: string (e.g., "Green Heights Apartments")
- `flatNo`: string (e.g., "A-401")

#### Size/Area
- `carpetArea`: number (positive)
- `carpetAreaUnit`: "SQFT" | "SQM" | "ACRES"

#### Property Details
- `numberOfRooms`: number (integer, min 0)
- `numberOfBathrooms`: number (integer, min 0)
- `numberOfBalcony`: number (integer, min 0)
- `numberOfFloors`: number (integer, min 0)
- `propertyFloor`: string (e.g., "Ground", "1", "2")

#### Price Flags
- `allInclusivePrice`: boolean (default: false)
- `negotiablePrice`: boolean (default: false)
- `govtChargesTaxIncluded`: boolean (default: false)

#### Other Details
- `propertyFacing`: "East" | "West" | "North" | "South" | "NorthEast" | "NorthWest" | "SouthEast" | "SouthWest"
- `amenities`: string[] (default: [])
  - Examples: "Security / Fire Alarm", "Water Storage", "Maintenance Staff", "Visitor Parking", "Vaastu Compliant", "Park", "Lifts", "Pool", "Intercom Facility"
- `locationAdvantages`: string[] (default: [])
  - Examples: "Close to Metro Station", "Close to School", "Close to Hospital", "Close to Railway Station", "Close to Airport", "Close to Mall", "Close to Highway"
- `coveredParking`: number (integer, min 0, default: 0)
- `uncoveredParking`: number (integer, min 0, default: 0)

---

## Backward Compatibility

The following deprecated fields are still supported but not recommended:
- `priceMin`: Use `listingPrice` instead
- `priceMax`: Use `listingPrice` instead
- `size`: Use `carpetArea` instead
- `sizeUnit`: Use `carpetAreaUnit` instead
- `area`: Use `locality` instead

---

## Database Migration

After updating the code, run:

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema changes to database
npm run prisma:push
```

**⚠️ Important:** Make sure your `.env` file has the correct `DATABASE_URL` before running `prisma:push`.

---

## Example: Complete Property Creation Flow

### Step 1: Upload Property Images
```bash
curl -X POST http://localhost:4000/api/v1/upload \
  -F "file=@./property-image-1.jpg" \
  -F "purpose=PROPERTY_IMAGE"
```

Response:
```json
{
  "success": true,
  "data": {
    "key": "property/images/guest/1707696000000-uuid.jpg",
    "fileUrl": "https://bucket.s3.amazonaws.com/property/images/guest/1707696000000-uuid.jpg"
  }
}
```

### Step 2: Create Property with Uploaded Images
```bash
curl -X POST http://localhost:4000/api/v1/property \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Beautiful 3BHK Apartment",
    "description": "Well maintained property",
    "propertyType": "FLAT",
    "listingPrice": 5000000,
    "state": "Madhya Pradesh",
    "city": "Bhopal",
    "locality": "Arera Colony",
    "address": "Arera Colony, Bhopal",
    "latitude": 23.2156,
    "longitude": 77.4212,
    "carpetArea": 1200,
    "carpetAreaUnit": "SQFT",
    "category": "Residential",
    "numberOfRooms": 3,
    "numberOfBathrooms": 2,
    "media": [
      {
        "url": "https://bucket.s3.amazonaws.com/property/images/guest/1707696000000-uuid.jpg",
        "key": "property/images/guest/1707696000000-uuid.jpg",
        "mediaType": "IMAGE",
        "order": 0
      }
    ]
  }'
```

---

## Testing with Postman

### Create Property
1. Method: POST
2. URL: `http://localhost:4000/api/v1/property`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_TOKEN`
4. Body (raw JSON): Use the example above
5. Click Send

### Get All Properties
1. Method: GET
2. URL: `http://localhost:4000/api/v1/property?page=1&limit=10`
3. Click Send

---

## Error Responses

**400 Bad Request:**
```json
{
  "message": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "message": "Unauthorized"
}
```

**404 Not Found:**
```json
{
  "message": "Property not found or not owned by user"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Internal server error"
}
```

---

## Notes

1. **Media Upload**: Always upload media files using the upload API first, then use the returned URL and key in property creation
2. **Arrays**: `amenities` and `locationAdvantages` accept arrays of strings
3. **Price**: Use `listingPrice` for the property price (old `priceMin`/`priceMax` are deprecated)
4. **Area**: Use `carpetArea` with `carpetAreaUnit` (old `size`/`sizeUnit` are deprecated)
5. **Location**: Use detailed location fields: `locality`, `subLocality`, `flatNo` for better address management
