-- Add new image columns to products table
-- Keeping existing image_url and category columns
ALTER TABLE "products" ADD COLUMN "image1" text;
ALTER TABLE "products" ADD COLUMN "image2" text;
ALTER TABLE "products" ADD COLUMN "image3" text;
ALTER TABLE "products" ADD COLUMN "image4" text;
