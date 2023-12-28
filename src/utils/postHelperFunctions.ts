import { Request } from "express";
import cloudinaryV2 from "./cloudinary";

export const handlePhotosUpload = async (req: Request) => {
  let uploadedPhotos: string[] | undefined = undefined;
  if ((req.files as { [fieldname: string]: Express.Multer.File[] })["images"]) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const images = files["images"];
    const results = await Promise.all(
      images.map((file: Express.Multer.File) =>
        cloudinaryV2.uploader.upload(file.path, { resource_type: "image" })
      )
    );
    uploadedPhotos = results.map((result: any) => result.secure_url);
  }
  return uploadedPhotos;
};

export const handleVideosUpload = async (req: Request) => {
  let uploadedVideos: string[] | undefined = undefined;
  if ((req.files as { [fieldname: string]: Express.Multer.File[] })["videos"]) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const videos = files["videos"];
    const results = await Promise.all(
      videos.map((file: Express.Multer.File) =>
        cloudinaryV2.uploader.upload(file.path, { resource_type: "video" })
      )
    );
    uploadedVideos = results.map((result: any) => result.secure_url);
  }
  return uploadedVideos;
};
