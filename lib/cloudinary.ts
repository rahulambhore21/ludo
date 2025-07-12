import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (file: Buffer, fileName: string): Promise<string> => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: `ludo/proofs/${fileName}`,
          folder: 'ludo/proofs',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(file);
    });

    return (result as any).secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

export default cloudinary;
