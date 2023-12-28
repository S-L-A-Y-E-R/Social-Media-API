import { Request, Response, NextFunction } from "express";
import { prisma } from "./prismaClient";
import cloudinaryV2 from "./cloudinary";

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return await prisma.user.findUnique({
    where: {
      id: Number(req.user.id),
    },
    include: {
      profile: {
        include: {
          following: true,
        },
      },
    },
  });
};

export const handlePhotoUpload = async (req: Request) => {
  let uploadedPhot = undefined;
  if (req.file) {
    const result = await cloudinaryV2.uploader.upload(req.file.path, {
      resource_type: "image",
    });
    uploadedPhot = result.secure_url;
  }
  return uploadedPhot;
};
