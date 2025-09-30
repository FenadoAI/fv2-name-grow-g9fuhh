# Baby Name Generator - Implementation Plan

## Requirement ID: 353a8ab6-e2b0-412c-9650-9a84db47ac6d

## Features
1. **Name Input**: Text field for baby name
2. **Image Generation**: Photorealistic baby images using AI
3. **Age Progression**: Toggle between baby, child, teen, adult (consistent facial features)
4. **Download**: Save image with name and age watermark
5. **Regenerate**: Create new image variations

## Backend Implementation

### API Endpoints
1. `POST /api/baby/generate` - Generate initial baby image
   - Input: `{ "name": "string" }`
   - Output: `{ "image_id": "uuid", "image_url": "base64", "attributes": {...} }`

2. `POST /api/baby/age-progress` - Generate aged version
   - Input: `{ "image_id": "uuid", "age_group": "baby|child|teen|adult" }`
   - Output: `{ "image_url": "base64", "age_group": "string" }`

3. `POST /api/baby/download` - Get image with watermark
   - Input: `{ "image_url": "base64", "name": "string", "age": "string" }`
   - Output: `{ "watermarked_image": "base64" }`

### MongoDB Schema
```javascript
{
  _id: ObjectId,
  name: String,
  original_image: String (base64),
  attributes: Object,
  age_versions: {
    baby: String (base64),
    child: String (base64),
    teen: String (base64),
    adult: String (base64)
  },
  created_at: DateTime
}
```

### AI Implementation
- Use image generation MCP for photorealistic baby images
- Maintain consistent facial attributes across age groups
- Prompt engineering for age-specific features

## Frontend Implementation

### Pages
1. **Home Page** (`/`)
   - Name input field
   - Generate button
   - Image display area
   - Age toggle buttons (baby, child, teen, adult)
   - Download and Regenerate buttons

### Components
- `BabyNameInput.jsx` - Name input component
- `ImageDisplay.jsx` - Image viewer with loading states
- `AgeToggle.jsx` - Age selection buttons
- `ActionButtons.jsx` - Download and regenerate controls

### User Flow
1. Enter baby name → Click Generate
2. View initial baby image
3. Toggle between ages → Image updates
4. Download → Get watermarked image
5. Regenerate → New variation

## Technical Stack
- **Backend**: FastAPI, Python Pillow (for watermarking)
- **Frontend**: React 19, shadcn/ui, Tailwind CSS
- **AI**: Image generation MCP via LiteLLM
- **Storage**: MongoDB (base64 images)

## Success Criteria
- Generate photorealistic baby images from names
- Consistent facial attributes across all ages
- Smooth age transitions
- Working download with watermark
- Fast regeneration (< 10s per image)

## Testing Plan
1. Test image generation with various names
2. Verify age progression consistency
3. Test watermark application
4. Performance testing (generation time)
5. End-to-end user flow testing