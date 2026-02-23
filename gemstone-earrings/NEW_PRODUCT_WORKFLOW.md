# New Product Creation Workflow

## Overview
Complete redesign of product creation to include AI enhancement and SKU generation BEFORE database insertion.

## Old Workflow (DEPRECATED)
```
1. Admin uploads images + enters data
2. Product saved to database (incomplete)
3. Admin clicks "Enhance with AI" button
4. AI processes product → Updates database
```

**Problems:**
- Products saved without SKU
- AI enhancement is optional/manual
- Database contains incomplete products

---

## New Workflow (CURRENT)

```
1. Admin uploads 4 images + enters basic data
   ├─ Images stored temporarily (React state)
   └─ No database write yet

2. Admin clicks "Generate Product Preview"
   ├─ Upload images to Vercel Blob
   ├─ Call AI processing APIs (parallel):
   │   ├─ Image analysis (Gemini)
   │   ├─ Image enhancement (Gemini → 4 enhanced images)
   │   ├─ Description generation (GPT-5.2)
   │   └─ Keyword extraction (GPT-5.2)
   ├─ Generate SKU (GET /api/admin/sku/generate)
   └─ Display preview with ALL data

3. Admin reviews preview
   ├─ Can edit description
   ├─ Can edit keywords
   ├─ Can see original vs enhanced images
   └─ SKU is displayed (immutable)

4. Admin clicks "Create Product"
   ├─ POST /api/admin/products/create-complete
   └─ Single database write with COMPLETE data

5. Product appears in catalog immediately
   └─ With AI description, keywords, SKU, enhanced images
```

---

## API Endpoints

### 1. Generate SKU
```typescript
GET /api/admin/sku/generate

Response:
{
  success: true,
  sku: "Aa1a01",
  validated: true
}
```

### 2. AI Processing (Existing)
```typescript
POST /api/ai/process-product
Body: { productId: string }

// This endpoint will be REPLACED with client-side orchestration
// New approach: Call individual AI services from frontend
```

### 3. Create Complete Product
```typescript
POST /api/admin/products/create-complete
Body: {
  // Required
  sku: string,
  name: string,
  price: string,
  stock: number,
  
  // Optional but recommended
  description: string,
  category: string,
  
  // Images (Vercel Blob URLs)
  image1: string,
  image2: string,
  image3: string,
  image4: string,
  
  // Enhanced images
  enhancedImage1: string,
  enhancedImage2: string,
  enhancedImage3: string,
  enhancedImage4: string,
  
  // AI-generated
  aiDescription: string,
  aiKeywords: string[],
  embeddingVector: number[],
  aiProcessedAt: string
}

Response:
{
  success: true,
  product: { ...complete product data },
  message: "Product created successfully"
}
```

---

## Frontend Implementation Plan

### Current Add Product Page
`app/admin/products/add/page.tsx`

Needs complete rewrite:

```typescript
interface ProductDraft {
  // User input
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  imageFiles: File[];
  
  // Generated data (after preview)
  sku: string | null;
  imageUrls: string[];
  enhancedImageUrls: string[];
  aiDescription: string | null;
  aiKeywords: string[] | null;
  embeddingVector: number[] | null;
  
  // Status
  isGeneratingPreview: boolean;
  previewGenerated: boolean;
}

const workflow = {
  step1_UserInput: () => {
    // Collect: name, description, price, category, stock, 4 image files
    // Button: "Generate Preview" → step2
  },
  
  step2_GeneratePreview: async () => {
    setIsGeneratingPreview(true);
    
    // Upload images to Vercel Blob
    const uploadedUrls = await uploadImagesToBlob(imageFiles);
    
    // Generate SKU
    const skuResponse = await fetch('/api/admin/sku/generate');
    const { sku } = await skuResponse.json();
    
    // Process with AI (parallel)
    const [
      imageAnalysis,
      enhancementResults,
      descriptionData
    ] = await Promise.all([
      fetch('/api/ai/analyze-images', { 
        body: JSON.stringify({ images: uploadedUrls }) 
      }),
      fetch('/api/ai/enhance-images', { 
        body: JSON.stringify({ images: uploadedUrls }) 
      }),
      fetch('/api/ai/generate-description', { 
        body: JSON.stringify({ 
          productName: name,
          existingDescription: description,
          imageUrls: uploadedUrls
        })
      })
    ]);
    
    // Update state with all generated data
    setProductDraft({
      ...draft,
      sku,
      imageUrls: uploadedUrls,
      enhancedImageUrls: enhancementResults.images,
      aiDescription: descriptionData.description,
      aiKeywords: descriptionData.keywords,
      embeddingVector: descriptionData.embedding,
      previewGenerated: true
    });
    
    setIsGeneratingPreview(false);
  },
  
  step3_ReviewAndEdit: () => {
    // Display preview UI
    // Allow editing aiDescription, aiKeywords
    // Show image comparisons
    // Button: "Create Product" → step4
  },
  
  step4_CreateProduct: async () => {
    const response = await fetch('/api/admin/products/create-complete', {
      method: 'POST',
      body: JSON.stringify(productDraft)
    });
    
    if (response.ok) {
      router.push('/admin/products');
    }
  }
};
```

---

## UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│ Add New Product                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Step 1: Product Information]                          │
│                                                         │
│ Upload Images (4 required)                             │
│ [📷] [📷] [📷] [📷]                                      │
│                                                         │
│ Product Name: [___________________________]            │
│ Description:  [___________________________]            │
│               [___________________________]            │
│ Price: [____] Category: [__________] Stock: [____]    │
│                                                         │
│ [Generate Preview with AI] ← First CTA                │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Step 2: AI-Generated Preview] ← After generation     │
│                                                         │
│ 🤖 SKU: Aa1a01 (Auto-generated)                        │
│                                                         │
│ ┌──────────────────────────────────────────────┐      │
│ │ AI-Enhanced Description (Editable)           │      │
│ │ [________________________________]           │      │
│ │ [________________________________]           │      │
│ └──────────────────────────────────────────────┘      │
│                                                         │
│ Keywords: [jewelry] [earrings] [gemstone] [+]         │
│                                                         │
│ Image Comparison:                                      │
│ ┌─────────────┬─────────────┐                         │
│ │  Original   │  Enhanced   │                         │
│ │  [Image 1]  │  [Image 1]  │                         │
│ └─────────────┴─────────────┘                         │
│                                                         │
│ [← Back] [Create Product] ← Final CTA                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Migration Strategy

### Phase 1: Deploy Infrastructure ✅
- [x] SKU Generator library
- [x] Database schema with SKU field
- [x] SKU generation API
- [x] Complete product creation API

### Phase 2: Update Frontend (TODO)
- [ ] Rewrite `app/admin/products/add/page.tsx`
- [ ] Add preview step UI
- [ ] Implement client-side AI orchestration
- [ ] Add image comparison view
- [ ] Add description/keyword editing

### Phase 3: Testing
- [ ] Test with empty database
- [ ] Test SKU generation sequence
- [ ] Test AI processing timeout handling
- [ ] Test image upload failures
- [ ] Test database insertion

### Phase 4: Cleanup
- [ ] Mark old `/api/admin/products POST` as deprecated
- [ ] Remove "Enhance with AI" button from edit page
- [ ] Update documentation

---

## Error Handling

### Image Upload Failures
```typescript
if (uploadFailed) {
  // Show error, allow retry
  // Don't proceed to AI processing
}
```

### AI Processing Failures
```typescript
if (aiFailed) {
  // Option 1: Retry
  // Option 2: Allow manual entry
  // Option 3: Use partial results
}
```

### SKU Generation Failures
```typescript
if (skuFailed) {
  // CRITICAL: Cannot proceed without SKU
  // Show error, require retry
}
```

### Database Insertion Failures
```typescript
if (insertFailed) {
  // Rollback: None needed (images already in Blob)
  // Images persist in Blob storage
  // User can retry creation with same data
}
```

---

## Next Steps

1. ✅ Complete API infrastructure
2. ⏭️  Rewrite Add Product frontend
3. ⏭️  Test complete workflow
4. ⏭️  Deploy to production
5. ⏭️  Delete test products
6. ⏭️  Create first real product with new workflow

---

## Notes

- **SKU is immutable after creation** - Cannot be changed in edit mode
- **AI processing happens client-side** - Better UX with progress feedback
- **Images uploaded before AI** - Prevents orphaned Blob files
- **Single database write** - Atomic operation, no partial products
- **Original description preserved** - In `originalDescription` field
