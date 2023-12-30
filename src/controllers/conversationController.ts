import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prismaClient";
import catchAsync from "../utils/catchAsync";
import { getUser } from "../utils/profileHelperFunctions";

export const createConversation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const profileOneId = Number(req.body.profileOneId);
    const profile = (await getUser(req, res, next))?.profile;
    const profileTwoId = profile?.id as number;

    const conversation = await prisma.conversation.upsert({
      update: {},
      create: {
        profileOneId,
        profileTwoId,
      },
      where: {
        profileOneId,
        profileTwoId,
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        conversation,
      },
    });
  }
);

export const getConversation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const profile = (await getUser(req, res, next))?.profile;
    const profileOneId = profile?.id as number;
    const profileTwoId = Number(req.params.profileTwoId);
    const conversation = await prisma.conversation.findUnique({
      where: {
        profileOneId,
        profileTwoId,
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        conversation,
      },
    });
  }
);
