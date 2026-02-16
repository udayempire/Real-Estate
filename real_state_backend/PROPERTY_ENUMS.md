# Property Enums Quick Reference

This document provides all enum values for the Property API to help with frontend integration.

---

## Property Status
```typescript
"ACTIVE"           // Property is active and visible
"UNLISTED"         // Property is unlisted/hidden from public listings
"SOLDOFFLINE"      // Property has been sold offline
"SOLDTOREALBRO"    // Property has been sold to Realbro
"SOLDFROMLISTINGS" // Property has been sold from platform listings
"DRAFT"            // Property is in draft mode
```

---

## Property Type
```typescript
"FARMLAND" // Farm land property
"DUPLEX"   // Duplex house
"FLAT"     // Apartment/Flat
"PLOT"     // Empty plot
```

---

## Category
```typescript
"Residential" // Residential property (houses, apartments)
"Commercial"  // Commercial property (offices, shops)
"FarmLand"    // Agricultural land
```

---

## Furnishing Status

### For Residential & Commercial:
```typescript
"FullyFurnished"  // Fully furnished with all amenities
"SemiFurnished"   // Semi-furnished (basic furniture)
"Unfurnished"     // No furniture
```

### For FarmLand:
```typescript
"FencedWired"     // Fenced or wired boundary
"FertileLand"     // Fertile agricultural land
"OpenLand"        // Open land without fencing
"Cultivated"      // Currently cultivated land
```

---

## Availability Status
```typescript
"ReadyToMove"       // Ready to move in immediately
"UnderConstruction" // Currently under construction
```

---

## Age of Property
```typescript
"ZeroToOne"    // 0-1 year old
"OneToThree"   // 1-3 years old
"ThreeToSix"   // 3-6 years old
"SixToTen"     // 6-10 years old
"TenPlus"      // 10+ years old
```

---

## Carpet Area Unit
```typescript
"SQFT"  // Square feet
"SQM"   // Square meters
"ACRES" // Acres
```

---

## Property Facing
```typescript
"East"       // East facing
"West"       // West facing
"North"      // North facing
"South"      // South facing
"NorthEast"  // North-East facing
"NorthWest"  // North-West facing
"SouthEast"  // South-East facing
"SouthWest"  // South-West facing
```

---

## Media Type
```typescript
"IMAGE" // Image file
"VIDEO" // Video file
```

---

## Common Amenities (String Array)

Use these as reference values for the `amenities` field:

```typescript
[
  "Security / Fire Alarm",
  "Water Storage",
  "Maintenance Staff",
  "Visitor Parking",
  "Vaastu Compliant",
  "Park",
  "Lifts",
  "Pool",
  "Intercom Facility",
  "Gym",
  "Power Backup",
  "CCTV Surveillance",
  "Playground",
  "Clubhouse",
  "Garden",
  "Gated Community",
  "24/7 Security",
  "Wi-Fi Connectivity",
  "Rainwater Harvesting",
  "Solar Panels"
]
```

**Note:** These are suggested values. You can send any custom string values.

---

## Common Location Advantages (String Array)

Use these as reference values for the `locationAdvantages` field:

```typescript
[
  "Close to Metro Station",
  "Close to School",
  "Close to Hospital",
  "Close to Railway Station",
  "Close to Airport",
  "Close to Mall",
  "Close to Highway",
  "Close to Bank",
  "Close to ATM",
  "Close to Market",
  "Close to Park",
  "Close to Restaurant",
  "Close to Bus Stop",
  "Close to Pharmacy",
  "Close to Supermarket"
]
```

**Note:** These are suggested values. You can send any custom string values.

---

## Frontend Examples

### React/TypeScript Enums

```typescript
// types/property.ts

export enum PropertyStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SOLD = "SOLD",
  DRAFT = "DRAFT"
}

export enum PropertyType {
  FARMLAND = "FARMLAND",
  DUPLEX = "DUPLEX",
  FLAT = "FLAT",
  PLOT = "PLOT"
}

export enum Category {
  Residential = "Residential",
  Commercial = "Commercial",
  FarmLand = "FarmLand"
}

export enum FurnishingStatus {
  FullyFurnished = "FullyFurnished",
  SemiFurnished = "SemiFurnished",
  Unfurnished = "Unfurnished",
  FencedWired = "FencedWired",
  FertileLand = "FertileLand",
  OpenLand = "OpenLand",
  Cultivated = "Cultivated"
}

export enum AvailabilityStatus {
  ReadyToMove = "ReadyToMove",
  UnderConstruction = "UnderConstruction"
}

export enum AgeOfProperty {
  ZeroToOne = "ZeroToOne",
  OneToThree = "OneToThree",
  ThreeToSix = "ThreeToSix",
  SixToTen = "SixToTen",
  TenPlus = "TenPlus"
}

export enum CarpetAreaUnit {
  SQFT = "SQFT",
  SQM = "SQM",
  ACRES = "ACRES"
}

export enum PropertyFacing {
  East = "East",
  West = "West",
  North = "North",
  South = "South",
  NorthEast = "NorthEast",
  NorthWest = "NorthWest",
  SouthEast = "SouthEast",
  SouthWest = "SouthWest"
}
```

### React Select Options

```typescript
// constants/propertyOptions.ts

export const propertyTypeOptions = [
  { value: "FLAT", label: "Flat/Apartment" },
  { value: "DUPLEX", label: "Duplex" },
  { value: "PLOT", label: "Plot" },
  { value: "FARMLAND", label: "Farm Land" }
];

export const categoryOptions = [
  { value: "Residential", label: "Residential" },
  { value: "Commercial", label: "Commercial" },
  { value: "FarmLand", label: "Farm Land" }
];

export const furnishingOptions = {
  residential: [
    { value: "FullyFurnished", label: "Fully Furnished" },
    { value: "SemiFurnished", label: "Semi-Furnished" },
    { value: "Unfurnished", label: "Unfurnished" }
  ],
  farmland: [
    { value: "FencedWired", label: "Fenced/Wired" },
    { value: "FertileLand", label: "Fertile Land" },
    { value: "OpenLand", label: "Open Land" },
    { value: "Cultivated", label: "Cultivated" }
  ]
};

export const availabilityOptions = [
  { value: "ReadyToMove", label: "Ready to Move" },
  { value: "UnderConstruction", label: "Under Construction" }
];

export const ageOptions = [
  { value: "ZeroToOne", label: "0-1 Year" },
  { value: "OneToThree", label: "1-3 Years" },
  { value: "ThreeToSix", label: "3-6 Years" },
  { value: "SixToTen", label: "6-10 Years" },
  { value: "TenPlus", label: "10+ Years" }
];

export const facingOptions = [
  { value: "East", label: "East" },
  { value: "West", label: "West" },
  { value: "North", label: "North" },
  { value: "South", label: "South" },
  { value: "NorthEast", label: "North-East" },
  { value: "NorthWest", label: "North-West" },
  { value: "SouthEast", label: "South-East" },
  { value: "SouthWest", label: "South-West" }
];

export const carpetAreaUnitOptions = [
  { value: "SQFT", label: "sq.ft" },
  { value: "SQM", label: "sq.m" },
  { value: "ACRES", label: "Acres" }
];
```

### React Form Example

```tsx
import { useState } from 'react';

function PropertyForm() {
  const [formData, setFormData] = useState({
    propertyType: "FLAT",
    category: "Residential",
    furnishingStatus: "FullyFurnished",
    propertyFacing: "East",
    carpetAreaUnit: "SQFT",
    // ... other fields
  });

  return (
    <form>
      <select 
        value={formData.propertyType}
        onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
      >
        <option value="FLAT">Flat/Apartment</option>
        <option value="DUPLEX">Duplex</option>
        <option value="PLOT">Plot</option>
        <option value="FARMLAND">Farm Land</option>
      </select>
      
      {/* Add other fields similarly */}
    </form>
  );
}
```

---

## Validation Rules

### Required Fields (Cannot be empty/null)
- `title`
- `propertyType`
- `listingPrice`
- `state`
- `city`
- `address`
- `latitude`
- `longitude`
- `media` (at least 1 item)

### Optional Fields (Can be null/undefined)
- All other fields

### Number Validations
- `listingPrice`: Must be positive
- `carpetArea`: Must be positive
- `numberOfRooms`: Must be >= 0
- `numberOfBathrooms`: Must be >= 0
- `numberOfBalcony`: Must be >= 0
- `numberOfFloors`: Must be >= 0
- `coveredParking`: Must be >= 0
- `uncoveredParking`: Must be >= 0

### Array Fields
- `amenities`: Array of strings (default: [])
- `locationAdvantages`: Array of strings (default: [])
- `media`: Array of objects (minimum 1 required)

---

## Display Labels Mapping

For user-friendly display in UI:

```typescript
const displayLabels = {
  // Age of Property
  ZeroToOne: "0-1 Year",
  OneToThree: "1-3 Years",
  ThreeToSix: "3-6 Years",
  SixToTen: "6-10 Years",
  TenPlus: "10+ Years",
  
  // Furnishing Status
  FullyFurnished: "Fully Furnished",
  SemiFurnished: "Semi-Furnished",
  Unfurnished: "Unfurnished",
  FencedWired: "Fenced/Wired",
  FertileLand: "Fertile Land",
  OpenLand: "Open Land",
  Cultivated: "Cultivated",
  
  // Availability
  ReadyToMove: "Ready to Move",
  UnderConstruction: "Under Construction",
  
  // Facing
  NorthEast: "North-East",
  NorthWest: "North-West",
  SouthEast: "South-East",
  SouthWest: "South-West"
};
```

---

## Tips for Frontend Integration

1. **Type Safety**: Use TypeScript enums for compile-time checking
2. **Conditional Fields**: Show/hide furnishing options based on category
3. **Validation**: Validate enum values before sending to API
4. **User Experience**: Use radio buttons for 2-3 options, dropdowns for more
5. **Multi-select**: Use checkboxes or multi-select for amenities
6. **Default Values**: Set sensible defaults (e.g., status: "ACTIVE")
