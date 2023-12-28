import { Request } from "express";
import cloudinaryV2 from "./cloudinary";

export const handlePhotoUpload = async (req: Request) => {
  let uploadedPhoto = undefined;

  if ((req.files as { [fieldname: string]: Express.Multer.File[] })["image"]) {
    const file = (req.files as { [fieldname: string]: Express.Multer.File[] })[
      "image"
    ][0];
    const result = await cloudinaryV2.uploader.upload(file.path, {
      resource_type: "image",
    });
    uploadedPhoto = result.secure_url;
  }
  return uploadedPhoto;
};

export const handleVideoUpload = async (req: Request) => {
  let uploadedVideo = undefined;
  if ((req.files as { [fieldname: string]: Express.Multer.File[] })["video"]) {
    const file = (req.files as { [fieldname: string]: Express.Multer.File[] })[
      "video"
    ][0];
    const result = await cloudinaryV2.uploader.upload(file.path, {
      resource_type: "video",
    });
    uploadedVideo = result.secure_url;
  }
  return uploadedVideo;
};
