const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const imagesDir = path.join(__dirname, 'public', 'assets', 'question_images');

async function migrateImages() {
  console.log('🚀 Starting Cloudinary Image Migration...');
  
  if (!fs.existsSync(imagesDir)) {
    console.error('❌ Directory not found:', imagesDir);
    return;
  }

  const files = fs.readdirSync(imagesDir).filter(f => f.match(/\.(png|jpe?g|gif)$/i));
  console.log(`Found ${files.length} images to upload.`);

  let successCount = 0;
  
  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    const publicId = `question_images/${path.basename(file, path.extname(file))}`;
    
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        public_id: publicId,
        overwrite: true,
      });
      console.log(`✅ Uploaded: ${file} -> ${result.secure_url}`);
      successCount++;
    } catch (err) {
      console.error(`❌ Failed to upload ${file}:`, err.message);
    }
  }
  
  console.log(`\n🎉 Image migration complete! ${successCount}/${files.length} images uploaded.`);
}

migrateImages();
