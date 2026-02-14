# Property API - Error Reference Guide

Complete error documentation for property creation and update endpoints to help frontend implement form validation.

---

## 📍 Endpoint

**POST** `/api/v1/property`  
**PATCH** `/api/v1/property/:id`

---

## 🔴 HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| `400` | Bad Request - Validation errors or invalid data |
| `401` | Unauthorized - Missing or invalid JWT token |
| `404` | Not Found - Property not found (for update) |
| `500` | Internal Server Error - Database or server issues |

---

## 📋 Validation Errors

### **Required Fields**

#### **1. Missing Property Type**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "propertyType",
      "message": "Property type is required"
    }
  ]
}
```
**Frontend Validation:**
```typescript
propertyType: z.enum(['Residential', 'Commercial', 'FarmLand'], {
  required_error: "Property type is required"
})
```

---

#### **2. Missing Category**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "category",
      "message": "Category is required"
    }
  ]
}
```
**Frontend Validation:**
```typescript
category: z.enum([
  'Apartment', 'Villa', 'House', 'Plot', 
  'Office', 'Shop', 'Warehouse', 'Factory', 
  'Agricultural'
], {
  required_error: "Category is required"
})
```

---

#### **3. Missing Title**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```
**Frontend Validation:**
```typescript
title: z.string().min(1, "Title is required")
```

---

#### **4. Missing Description**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "description",
      "message": "Description is required"
    }
  ]
}
```
**Frontend Validation:**
```typescript
description: z.string().min(10, "Description must be at least 10 characters")
```

---

#### **5. Missing Listing Price**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "listingPrice",
      "message": "Listing price is required"
    }
  ]
}
```
**Frontend Validation:**
```typescript
listingPrice: z.number().min(1, "Listing price is required and must be greater than 0")
```

---

#### **6. Missing State**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "state",
      "message": "State is required"
    }
  ]
}
```
**Frontend Validation:**
```typescript
state: z.string().min(1, "State is required")
```

---

#### **7. Missing City**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "city",
      "message": "City is required"
    }
  ]
}
```
**Frontend Validation:**
```typescript
city: z.string().min(1, "City is required")
```

---

#### **8. Missing Locality**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "locality",
      "message": "Locality is required"
    }
  ]
}
```
**Frontend Validation:**
```typescript
locality: z.string().min(1, "Locality is required")
```

---

#### **9. Missing Pincode**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "pincode",
      "message": "Pincode is required"
    }
  ]
}
```
**Frontend Validation:**
```typescript
pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits")
```

---

### **Type & Format Errors**

#### **10. Invalid Property Type**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "propertyType",
      "message": "Invalid property type. Must be one of: Residential, Commercial, FarmLand"
    }
  ]
}
```
**Frontend Validation:**
```typescript
propertyType: z.enum(['Residential', 'Commercial', 'FarmLand'])
```

---

#### **11. Invalid Category**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "category",
      "message": "Invalid category for the selected property type"
    }
  ]
}
```
**Frontend Validation:**
```typescript
// Residential categories
['Apartment', 'Villa', 'House', 'Plot']

// Commercial categories
['Office', 'Shop', 'Warehouse', 'Factory']

// FarmLand categories
['Agricultural']
```

---

#### **12. Invalid Furnishing Status**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "furnishingStatus",
      "message": "Invalid furnishing status. Must be one of: Furnished, SemiFurnished, Unfurnished"
    }
  ]
}
```
**Frontend Validation:**
```typescript
furnishingStatus: z.enum(['Furnished', 'SemiFurnished', 'Unfurnished']).optional()
```

---

#### **13. Invalid Availability Status**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "availabilityStatus",
      "message": "Invalid availability status. Must be one of: ReadyToMove, UnderConstruction"
    }
  ]
}
```
**Frontend Validation:**
```typescript
availabilityStatus: z.enum(['ReadyToMove', 'UnderConstruction']).optional()
```

---

#### **14. Invalid Age of Property**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "ageOfProperty",
      "message": "Invalid age of property. Must be one of: LessThan1Year, OneToThreeYears, ThreeToFiveYears, FiveToTenYears, MoreThanTenYears"
    }
  ]
}
```
**Frontend Validation:**
```typescript
ageOfProperty: z.enum([
  'LessThan1Year', 
  'OneToThreeYears', 
  'ThreeToFiveYears', 
  'FiveToTenYears', 
  'MoreThanTenYears'
]).optional()
```

---

#### **15. Invalid Property Facing**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "propertyFacing",
      "message": "Invalid property facing. Must be one of: North, South, East, West, NorthEast, NorthWest, SouthEast, SouthWest"
    }
  ]
}
```
**Frontend Validation:**
```typescript
propertyFacing: z.enum([
  'North', 'South', 'East', 'West',
  'NorthEast', 'NorthWest', 'SouthEast', 'SouthWest'
]).optional()
```

---

#### **16. Invalid Carpet Area Unit**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "carpetAreaUnit",
      "message": "Invalid carpet area unit. Must be one of: SqFt, SqYd, SqM, Acre, Guntha, Ground"
    }
  ]
}
```
**Frontend Validation:**
```typescript
carpetAreaUnit: z.enum(['SqFt', 'SqYd', 'SqM', 'Acre', 'Guntha', 'Ground']).optional()
```

---

### **Range & Constraint Errors**

#### **17. Listing Price Too Low**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "listingPrice",
      "message": "Listing price must be greater than 0"
    }
  ]
}
```
**Frontend Validation:**
```typescript
listingPrice: z.number().min(1, "Price must be greater than 0")
```

---

#### **18. Invalid Carpet Area**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "carpetArea",
      "message": "Carpet area must be greater than 0"
    }
  ]
}
```
**Frontend Validation:**
```typescript
carpetArea: z.number().min(1, "Carpet area must be greater than 0").optional()
```

---

#### **19. Invalid Number of Rooms**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "numberOfRooms",
      "message": "Number of rooms must be at least 1"
    }
  ]
}
```
**Frontend Validation:**
```typescript
numberOfRooms: z.number().min(1, "At least 1 room required").optional()
```

---

#### **20. Invalid Number of Bathrooms**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "numberOfBathrooms",
      "message": "Number of bathrooms must be at least 1"
    }
  ]
}
```
**Frontend Validation:**
```typescript
numberOfBathrooms: z.number().min(1, "At least 1 bathroom required").optional()
```

---

#### **21. Invalid Number of Floors**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "numberOfFloors",
      "message": "Number of floors must be at least 1"
    }
  ]
}
```
**Frontend Validation:**
```typescript
numberOfFloors: z.number().min(1, "At least 1 floor required").optional()
```

---

#### **22. Invalid Property Floor**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "propertyFloor",
      "message": "Property floor cannot be greater than total number of floors"
    }
  ]
}
```
**Frontend Validation:**
```typescript
// Custom validation
.refine(data => {
  if (data.propertyFloor && data.numberOfFloors) {
    return data.propertyFloor <= data.numberOfFloors;
  }
  return true;
}, "Property floor cannot exceed total floors")
```

---

#### **23. Invalid Pincode Format**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "pincode",
      "message": "Pincode must be exactly 6 digits"
    }
  ]
}
```
**Frontend Validation:**
```typescript
pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits")
```

---

### **Array Field Errors**

#### **24. Invalid Amenities Format**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "amenities",
      "message": "Amenities must be an array of strings"
    }
  ]
}
```
**Frontend Validation:**
```typescript
amenities: z.array(z.string()).optional()
```

---

#### **25. Invalid Location Advantages Format**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "locationAdvantages",
      "message": "Location advantages must be an array of strings"
    }
  ]
}
```
**Frontend Validation:**
```typescript
locationAdvantages: z.array(z.string()).optional()
```

---

### **Boolean Field Errors**

#### **26. Invalid All Inclusive Price Format**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "allInclusivePrice",
      "message": "All inclusive price must be a boolean (true/false)"
    }
  ]
}
```
**Frontend Validation:**
```typescript
allInclusivePrice: z.boolean().optional()
```

---

#### **27. Invalid Negotiable Price Format**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "negotiablePrice",
      "message": "Negotiable price must be a boolean (true/false)"
    }
  ]
}
```
**Frontend Validation:**
```typescript
negotiablePrice: z.boolean().optional()
```

---

#### **28. Invalid Govt Charges Tax Included Format**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "govtChargesTaxIncluded",
      "message": "Govt charges tax included must be a boolean (true/false)"
    }
  ]
}
```
**Frontend Validation:**
```typescript
govtChargesTaxIncluded: z.boolean().optional()
```

---

### **Authentication Errors**

#### **29. Missing Authorization Token**
```json
{
  "success": false,
  "message": "Authorization token is required"
}
```
**Status Code:** `401`

**Frontend Action:**
- Redirect user to login page
- Clear local storage
- Show "Session expired" message

---

#### **30. Invalid/Expired Token**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```
**Status Code:** `401`

**Frontend Action:**
- Redirect to login
- Clear authentication state

---

### **Resource Errors**

#### **31. Property Not Found (Update)**
```json
{
  "success": false,
  "message": "Property not found"
}
```
**Status Code:** `404`

**Frontend Action:**
- Show error message
- Redirect to properties list

---

### **Server Errors**

#### **32. Database Connection Error**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Database connection failed"
}
```
**Status Code:** `500`

**Frontend Action:**
- Show generic error message
- Retry after delay
- Contact support if persists

---

## 🎯 Complete Frontend Validation Schema

```typescript
import { z } from 'zod';

// Enums
const PropertyTypeEnum = z.enum(['Residential', 'Commercial', 'FarmLand']);

const CategoryEnum = z.enum([
  'Apartment', 'Villa', 'House', 'Plot',
  'Office', 'Shop', 'Warehouse', 'Factory',
  'Agricultural'
]);

const FurnishingStatusEnum = z.enum([
  'Furnished', 
  'SemiFurnished', 
  'Unfurnished'
]);

const AvailabilityStatusEnum = z.enum([
  'ReadyToMove', 
  'UnderConstruction'
]);

const AgeOfPropertyEnum = z.enum([
  'LessThan1Year',
  'OneToThreeYears',
  'ThreeToFiveYears',
  'FiveToTenYears',
  'MoreThanTenYears'
]);

const PropertyFacingEnum = z.enum([
  'North', 'South', 'East', 'West',
  'NorthEast', 'NorthWest', 'SouthEast', 'SouthWest'
]);

const CarpetAreaUnitEnum = z.enum([
  'SqFt', 'SqYd', 'SqM', 'Acre', 'Guntha', 'Ground'
]);

// Property Creation Schema
export const createPropertySchema = z.object({
  // Required fields
  propertyType: PropertyTypeEnum,
  category: CategoryEnum,
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  listingPrice: z.number().min(1, "Listing price must be greater than 0"),
  
  // Location (Required)
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  locality: z.string().min(1, "Locality is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  
  // Location (Optional)
  subLocality: z.string().optional(),
  flatNo: z.string().optional(),
  
  // Property Details (Optional)
  carpetArea: z.number().min(1).optional(),
  carpetAreaUnit: CarpetAreaUnitEnum.optional(),
  furnishingStatus: FurnishingStatusEnum.optional(),
  availabilityStatus: AvailabilityStatusEnum.optional(),
  ageOfProperty: AgeOfPropertyEnum.optional(),
  propertyFacing: PropertyFacingEnum.optional(),
  
  // Rooms & Structure (Optional)
  numberOfRooms: z.number().min(1).optional(),
  numberOfBathrooms: z.number().min(1).optional(),
  numberOfBalcony: z.number().min(0).optional(),
  numberOfFloors: z.number().min(1).optional(),
  propertyFloor: z.number().min(0).optional(),
  
  // Parking (Optional)
  coveredParking: z.number().min(0).optional(),
  uncoveredParking: z.number().min(0).optional(),
  
  // Price Flags (Optional)
  allInclusivePrice: z.boolean().optional(),
  negotiablePrice: z.boolean().optional(),
  govtChargesTaxIncluded: z.boolean().optional(),
  
  // Lists (Optional)
  amenities: z.array(z.string()).optional(),
  locationAdvantages: z.array(z.string()).optional(),
  
}).refine(data => {
  // Property floor cannot exceed total floors
  if (data.propertyFloor && data.numberOfFloors) {
    return data.propertyFloor <= data.numberOfFloors;
  }
  return true;
}, {
  message: "Property floor cannot exceed total number of floors",
  path: ["propertyFloor"]
});

// Property Update Schema (all fields optional)
export const updatePropertySchema = createPropertySchema.partial();

// Type inference
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
```

---

## 🔧 Example Error Handling in React

```typescript
import { useState } from 'react';
import { createPropertySchema } from './validation';

function PropertyForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (formData: any) => {
    try {
      // Validate with Zod
      const validatedData = createPropertySchema.parse(formData);
      
      // Call API
      const response = await fetch('/api/v1/property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(validatedData)
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle API errors
        if (result.errors) {
          const errorMap: Record<string, string> = {};
          result.errors.forEach((err: any) => {
            errorMap[err.field] = err.message;
          });
          setErrors(errorMap);
        } else {
          alert(result.message || 'Something went wrong');
        }
        return;
      }

      // Success
      alert('Property created successfully!');
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle Zod validation errors
        const errorMap: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errorMap[err.path[0] as string] = err.message;
          }
        });
        setErrors(errorMap);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Show error for each field */}
      {errors.title && <span className="error">{errors.title}</span>}
      {/* ... rest of form */}
    </form>
  );
}
```

---

## 📊 Error Summary Table

| Error Type | Count | Status Code |
|------------|-------|-------------|
| Required Fields | 9 | 400 |
| Invalid Enum Values | 8 | 400 |
| Range/Constraint | 8 | 400 |
| Array Format | 2 | 400 |
| Boolean Format | 3 | 400 |
| Authentication | 2 | 401 |
| Resource Not Found | 1 | 404 |
| Server Errors | 1 | 500 |
| **Total** | **32** | - |

---

## ✅ Quick Validation Checklist

### Before Submit:
- [ ] Property type selected (required)
- [ ] Category selected (required)
- [ ] Title entered (required)
- [ ] Description at least 10 chars (required)
- [ ] Listing price > 0 (required)
- [ ] State entered (required)
- [ ] City entered (required)
- [ ] Locality entered (required)
- [ ] Pincode is 6 digits (required)
- [ ] If propertyFloor entered, check it's ≤ numberOfFloors
- [ ] Arrays (amenities, locationAdvantages) are valid arrays
- [ ] Booleans are true/false, not strings
- [ ] Numbers are not strings

### Common Mistakes:
❌ Sending `"true"` instead of `true` for booleans  
❌ Sending `"123"` instead of `123` for numbers  
❌ Forgetting to validate pincode format  
❌ Not checking propertyFloor vs numberOfFloors  

---

Need help with any specific error scenario? Let me know! 🚀
