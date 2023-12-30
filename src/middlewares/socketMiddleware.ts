import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prismaClient";
import catchAsync from "../utils/catchAsync";
import { getUser } from "../utils/profileHelperFunctions";

export const setActiveStatus = (isOnline: boolean) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const profile = (await getUser(req, res, next))?.profile;

    await prisma.profile.update({
      where: {
        id: profile?.id,
      },
      data: {
        isOnline: isOnline,
      },
    });
    next();
  });

export const setMessagesDelivery = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const profile = (await getUser(req, res, next))?.profile;

    await prisma.message.updateMany({
      where: {
        AND: [
          {
            conversation: {
              OR: [
                {
                  profileOneId: profile?.id,
                },
                {
                  profileTwoId: profile?.id,
                },
              ],
            },
          },
          {
            isDelivered: false,
          },
        ],
      },
      data: {
        isDelivered: true,
      },
    });
    next();
  }
);
