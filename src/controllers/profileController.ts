import { Request, Response, NextFunction } from "express";
import { SubscriptionType } from "@prisma/client";
import webPush from "../utils/webPush";
import { prisma } from "../utils/prismaClient";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import { getUser, handlePhotoUpload } from "../utils/profileHelperFunctions";

declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

export const getProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await prisma.user.findUnique({
      where: {
        id: Number(req.user?.id),
      },
      include: {
        profile: {
          include: {
            profilePicture: {
              select: {
                url: true,
              },
            },
            followers: true,
            following: true,
          },
        },
      },
    });

    const profile = user?.profile;

    res.status(200).json({
      status: "success",
      data: {
        profile,
      },
    });
  }
);

export const updateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (
      req.body.followersCount ||
      req.body.followingCount ||
      req.body.postsCount
    )
      return next(
        new AppError("You can't update followersCount or followingCount", 400)
      );

    let uploadedPhot = await handlePhotoUpload(req);

    const user = await getUser(req, res, next);

    const profile = await prisma.profile.update({
      where: {
        id: Number(user?.profile?.id),
      },
      data: {
        ...req.body,
        profilePicture: {
          upsert: {
            create: {
              url: uploadedPhot,
            },
            update: {
              url: uploadedPhot,
            },
          },
        },
      },
      include: {
        profilePicture: {
          select: {
            url: true,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        profile,
      },
    });
  }
);

export const deleteProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await getUser(req, res, next);

    await prisma.user.update({
      where: {
        id: Number(user?.profile?.id),
      },
      data: {
        active: false,
      },
    });

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

export const followProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await getUser(req, res, next);
    const profile = user?.profile;

    const profileToFollow = await prisma.profile.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    if (!profileToFollow) {
      return next(new AppError("No profile found with that ID", 404));
    }

    if (profile?.id === profileToFollow.id) {
      return next(new AppError("You can't follow yourself", 400));
    }

    if (
      profile?.following.some((profile) => profile.id === profileToFollow.id)
    ) {
      return next(new AppError("You already follow this profile", 400));
    }

    await prisma.$transaction([
      prisma.profile.update({
        where: {
          id: Number(profile?.id),
        },
        data: {
          followingCount: {
            increment: 1,
          },
          following: {
            connect: {
              id: Number(profileToFollow.id),
            },
          },
        },
      }),
      prisma.profile.update({
        where: {
          id: Number(profileToFollow.id),
        },
        data: {
          followersCount: {
            increment: 1,
          },
          followers: {
            connect: {
              id: Number(profile?.id),
            },
          },
        },
      }),
    ]);

    const followedProfileSubscription = await prisma.subscription.findFirst({
      where: {
        profileId: Number(profileToFollow.id),
        type: SubscriptionType.NEW_FOLLOWER,
      },
    });

    const modifiedProfileSubscription = {
      id: followedProfileSubscription?.id,
      endpoint: followedProfileSubscription?.endpoint as string,
      keys: {
        auth: followedProfileSubscription?.auth as string,
        p256dh: followedProfileSubscription?.p256dh as string,
      },
      type: followedProfileSubscription?.type,
      profileId: followedProfileSubscription?.profileId,
    };

    if (followedProfileSubscription) {
      const payload = JSON.stringify({
        title: "New follower",
        body: `${profile?.fullName} started following you`,
      });

      await webPush.sendNotification(modifiedProfileSubscription, payload);
    }

    res.status(200).json({
      status: "success",
      message: "You followed this profile",
    });
  }
);

export const unfollowProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await getUser(req, res, next);
    const profile = user?.profile;

    const profileToUnfollow = await prisma.profile.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    if (!profileToUnfollow) {
      return next(new AppError("No profile found with that ID", 404));
    }

    if (profile?.id === profileToUnfollow.id) {
      return next(new AppError("You can't unfollow yourself", 400));
    }

    if (
      !profile?.following.some((profile) => profile.id === profileToUnfollow.id)
    ) {
      return next(new AppError("You don't follow this profile", 400));
    }

    await prisma.$transaction([
      prisma.profile.update({
        where: {
          id: Number(profile?.id),
        },
        data: {
          followingCount: {
            decrement: 1,
          },
          following: {
            disconnect: {
              id: Number(profileToUnfollow.id),
            },
          },
        },
      }),
      prisma.profile.update({
        where: {
          id: Number(profileToUnfollow.id),
        },
        data: {
          followersCount: {
            decrement: 1,
          },
          followers: {
            disconnect: {
              id: Number(profile?.id),
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      status: "success",
      message: "You unfollowed this profile",
    });
  }
);

export const searchProfiles = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const textSearch = req.query.search as string;

    const profiles = await prisma.profile.findMany({
      take: Number(req.query.limit) || 10,
      skip: Number(req.query.skip) || 0,
      where: {
        fullName: {
          search: textSearch,
        },
      },
    });

    res.status(200).json({
      status: "success",
      results: profiles.length,
      data: {
        profiles,
      },
    });
  }
);

export const subscribeToNotifications = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { endpoint, keys, type, profileId } = req.body;

    const newSubscription = await prisma.subscription.upsert({
      where: {
        profileId: Number(profileId),
        type,
      },
      update: {
        endpoint,
        auth: keys.auth,
        p256dh: keys.p256dh,
      },
      create: {
        endpoint,
        auth: keys.auth,
        p256dh: keys.p256dh,
        type,
        profileId: Number(profileId),
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        subscription: newSubscription,
      },
    });
  }
);

export const blockProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const user = await getUser(req, res, next);
    const profile = await prisma.profile.findUnique({
      where: {
        id: Number(user?.profile?.id),
      },
      include: {
        blockList: true,
        blockedBy: true,
        following: true,
      },
    });

    const profileToBlock = await prisma.profile.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        blockedBy: true,
        followers: true,
        following: true,
      },
    });

    if (!profile) {
      return next(new AppError("No profile found with that ID", 404));
    }

    if (profile?.id === Number(id)) {
      return next(new AppError("You can't block yourself", 400));
    }

    if (profile?.blockList.some((profile) => profile.id === Number(id))) {
      return next(new AppError("You already blocked this profile", 400));
    }

    await prisma.$transaction([
      prisma.profile.update({
        where: {
          id: Number(profile?.id),
        },
        data: {
          blockList: {
            connect: {
              id: Number(id),
            },
          },
          following: profile?.following.some(
            (profile) => profile.id === Number(id)
          )
            ? {
                disconnect: {
                  id: Number(id),
                },
              }
            : undefined,
          followingCount: profile?.following.some(
            (profile) => profile.id === Number(id)
          )
            ? {
                decrement: 1,
              }
            : undefined,
        },
      }),
      prisma.profile.update({
        where: {
          id: Number(id),
        },
        data: {
          blockedBy: {
            connect: {
              id: Number(profile?.id),
            },
          },
          followers: profileToBlock?.followers.some(
            (profile) => profile.id === Number(profile?.id)
          )
            ? {
                disconnect: {
                  id: Number(profile?.id),
                },
              }
            : undefined,
          followersCount: profileToBlock?.followers.some(
            (profile) => profile.id === Number(profile?.id)
          )
            ? {
                decrement: 1,
              }
            : undefined,
        },
      }),
    ]);
    res.status(200).json({
      status: "success",
      message: "You blocked this profile",
    });
  }
);

export const unblockProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const user = await getUser(req, res, next);
    const profile = await prisma.profile.findUnique({
      where: {
        id: Number(user?.profile?.id),
      },
      include: {
        blockList: true,
        blockedBy: true,
      },
    });

    if (!profile) {
      return next(new AppError("No profile found with that ID", 404));
    }

    if (profile?.id === Number(id)) {
      return next(new AppError("You can't unblock yourself", 400));
    }

    if (!profile?.blockList.some((profile) => profile.id === Number(id))) {
      return next(new AppError("You don't block this profile", 400));
    }

    await prisma.$transaction([
      prisma.profile.update({
        where: {
          id: Number(profile?.id),
        },
        data: {
          blockList: {
            disconnect: {
              id: Number(id),
            },
          },
        },
      }),
      prisma.profile.update({
        where: {
          id: Number(id),
        },
        data: {
          blockedBy: {
            disconnect: {
              id: Number(profile?.id),
            },
          },
        },
      }),
    ]);
    res.status(200).json({
      status: "success",
      message: "You unblocked this profile",
    });
  }
);
