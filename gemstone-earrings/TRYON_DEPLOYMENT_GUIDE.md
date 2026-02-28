# Virtual Try-On Feature - Deployment Guide

## Overview
This guide covers deploying and using the virtual try-on feature for myearringadvisor.com.

## Prerequisites

### 1. Database Migration
Apply the migration to create try-on tables in your Neon database:

```sql
-- Run this SQL in Neon Console
-- File: gemstone-earrings/drizzle/migrations/0005_typical_timeslip.sql

CREATE TABLE "product_tryon_assets" (
  "id" text PRIMARY KEY NOT NULL,
  "product_id" text NOT NULL,
  "left_earring_url" text,
  "right_earring_url" text,
  "real_world_width" numeric(6, 2),
  "real_world_height" numeric(6, 2),
  "anchor_point_x" numeric(4, 3),
  "anchor_point_y" numeric(4, 3),
  "reflectivity" numeric(3, 2),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "product_tryon_assets_product_id_unique" UNIQUE("product_id")
);

CREATE TABLE "tryon_results" (
  "id" text PRIMARY KEY NOT NULL,
  "session_id" text NOT NULL,
  "product_id" text NOT NULL,
  "result_image_url" text,
  "rendering_time" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "tryon_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text,
  "session_token" text NOT NULL,
  "selfie_url" text,
  "face_landmarks" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp NOT NULL
);

ALTER TABLE "product_tryon_assets" ADD CONSTRAINT "product_tryon_assets_product_id_products_id_fk" 
  FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "tryon_results" ADD CONSTRAINT "tryon_results_session_id_tryon_sessions_id_fk" 
  FOREIGN KEY ("session_id") REFERENCES "public"."tryon_sessions"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "tryon_results" ADD CONSTRAINT "tryon_results_product_id_products_id_fk" 
  FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "tryon_sessions" ADD CONSTRAINT "tryon_sessions_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
```

### 2. Vercel Blob Storage (Optional but Recommended)
Configure Vercel Blob for selfie storage:

1. Go to your Vercel project dashboard
2. Navigate to Storage → Create Store → Blob
3. Environment variables will be automatically added:
   - `BLOB_READ_WRITE_TOKEN`

### 3. Update Root Layout
Add PWA manifest link to `app/layout.tsx`:

```tsx
<head>
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#9333ea" />
  <link rel="icon" href="/favicon.ico" />
</head>
```

## Usage

### Option 1: Add to Product Pages

In your product detail page (e.g., `app/products/[id]/page.tsx`):

```tsx
import TryOnWidget from '@/components/tryon/TryOnWidget';

export default function ProductPage({ product }) {
  return (
    <div>
      {/* Existing product UI */}
      <h1>{product.name}</h1>
      <p>${product.price}</p>
      
      {/* Add Try-On Button */}
      <TryOnWidget product={product} />
    </div>
  );
}
```

### Option 2: Chatbot Integration

The chatbot automatically suggests try-on when users show interest. The `startVirtualTryOn` function is already integrated.

To handle the action in the chat UI, update your ChatWidget to recognize the `start_tryon` action:

```tsx
// In components/ChatWidget.tsx or your chat message handler
if (functionResult.action === 'start_tryon') {
  // Open try-on modal with the specified product
  setTryOnProduct({
    id: functionResult.productId,
    name: functionResult.productName,
  });
  setShowTryOn(true);
}
```

### Option 3: Standalone Try-On Page

Create a dedicated try-on page at `app/tryon/page.tsx`:

```tsx
'use client';

import TryOnWidget from '@/components/tryon/TryOnWidget';
import { useSearchParams } from 'next/navigation';

export default function TryOnPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('product');
  
  // Fetch product data based on productId
  // ...
  
  return (
    <div className="container mx-auto p-6">
      <h1>Virtual Try-On</h1>
      <TryOnWidget product={product} />
    </div>
  );
}
```

## Testing Checklist

### Local Testing
- [ ] Camera access works in browser
- [ ] File upload works
- [ ] Face detection identifies ears correctly
- [ ] Earrings render at proper scale
- [ ] Rotation matches head tilt
- [ ] Download/share buttons work
- [ ] Chatbot suggests try-on feature
- [ ] Mobile responsive

### Browser Compatibility
Test on:
- [ ] Chrome/Edge (Windows, Mac, Android)
- [ ] Safari (iOS, Mac)
- [ ] Firefox

### Mobile Testing
- [ ] Camera flip (front-facing) works
- [ ] Touch interactions smooth
- [ ] Photo upload from gallery works
- [ ] PWA install prompt appears
- [ ] Offline mode graceful fallback

## Performance Optimization

### 1. MediaPipe Loading
MediaPipe assets are loaded from CDN. For better performance, you can host them locally:

```typescript
// In lib/tryon/faceDetection.ts
const faceMesh = new FaceMesh({
  locateFile: (file) => {
    return `/mediapipe/${file}`; // Host files in public/mediapipe/
  },
});
```

### 2. Image Optimization
- Selfies are automatically resized to max 1024x1024
- Use WebP format for earring assets when possible
- Compress earring PNGs (use tools like TinyPNG)

### 3. Caching Strategy
- MediaPipe models cached by service worker
- Consider caching frequently accessed product images

## Privacy & Compliance

### Data Retention
- Selfies auto-delete after 24 hours (set in `expiresAt`)
- No facial recognition data stored
- Face landmarks stored only for session duration

### GDPR Compliance
- Clear consent UI before camera access
- Privacy notice displayed during upload
- Right to deletion (automatic after 24h)

### User Communication
Add to your privacy policy:
```
Virtual Try-On Feature:
- Photos are processed locally in your browser
- Facial landmarks detected but not stored permanently
- Images automatically deleted after 24 hours
- No biometric data collected or stored
```

## Troubleshooting

### Face Not Detected
**Issue**: "No face detected" error

**Solutions**:
- Ensure good lighting
- Face fully visible and forward-facing
- Clear view of ears (hair pulled back)
- Try different photo

### MediaPipe Loading Error
**Issue**: Face detection fails to initialize

**Solutions**:
- Check CDN connectivity
- Verify CORS headers
- Try hosting MediaPipe assets locally

### Earrings Don't Appear Correct Size
**Issue**: Earrings too large or too small

**Solutions**:
- Verify `realWorldWidth` and `realWorldHeight` in product data
- Typical values: width 10-20mm, height 20-40mm
- Adjust `anchorPointX` and `anchorPointY` (0-1 range)

### Performance Issues
**Issue**: Slow rendering or lag

**Solutions**:
- Reduce selfie resolution (already set to 1024px max)
- Use WebP format for earring images
- Compress earring assets
- Test on actual mobile devices

## Deployment

### 1. Commit and Push
```bash
git add .
git commit -m "Deploy virtual try-on feature"
git push origin main
```

### 2. Vercel Auto-Deploy
Vercel will automatically deploy when you push to main. Monitor at:
- https://vercel.com/your-project/deployments

### 3. Verify Deployment
- [ ] Visit https://www.myearringadvisor.com
- [ ] Test try-on feature on a product
- [ ] Check browser console for errors
- [ ] Test on mobile device
- [ ] Verify PWA installability

### 4. Monitor
Check Vercel logs and analytics for:
- Try-on usage rate
- Error rates
- Performance metrics
- Blob storage usage

## Feature Flags (Optional)

To enable gradual rollout, add a feature flag:

```typescript
// lib/featureFlags.ts
export const TRYON_ENABLED = process.env.NEXT_PUBLIC_TRYON_ENABLED === 'true';

// In TryOnWidget
if (!TRYON_ENABLED) {
  return null; // Hide button
}
```

Set in Vercel environment variables:
```
NEXT_PUBLIC_TRYON_ENABLED=true
```

## Analytics Tracking

Add to your analytics (e.g., Google Analytics):

```typescript
// When try-on starts
gtag('event', 'tryon_start', {
  product_id: product.id,
  product_name: product.name,
});

// When try-on completes
gtag('event', 'tryon_complete', {
  product_id: product.id,
  rendering_time: renderTime,
});
```

## Next Steps

1. **Apply database migration** via Neon Console
2. **Add TryOnWidget** to product pages
3. **Test thoroughly** on multiple devices
4. **Deploy to production** via git push
5. **Monitor usage** and gather feedback
6. **Iterate** based on user behavior

## Support

For issues or questions:
- Check browser console for error messages
- Review Vercel deployment logs
- Test in incognito mode (clear cache)
- Verify MediaPipe CDN accessibility

## Future Enhancements

Consider adding:
- [ ] 3D earring models for realistic rotation
- [ ] AR mode with ARKit/ARCore
- [ ] Multiple product comparison
- [ ] Social sharing with branded frames
- [ ] Face shape recommendations
- [ ] Virtual makeup/styling suggestions
