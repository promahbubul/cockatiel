import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbzpn0w31',
  api_key: process.env.CLOUDINARY_API_KEY || '988577689868946',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'ZvCeZrpbW3HrJzpH7-fjVFORm8w',
});

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = 'cockatiel/chats'
): Promise<any> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export default cloudinary;
