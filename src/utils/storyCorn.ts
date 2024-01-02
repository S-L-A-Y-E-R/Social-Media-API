import corn from "node-cron";
import { prisma } from "../utils/prismaClient";

const moveStoryToArchive = async () => {
  const currentTime = new Date();

  const expiredStories = await prisma.story.findMany({
    where: {
      expiryTime: {
        lte: currentTime,
      },
      visible: true,
      archiveId: {
        not: null,
      },
    },
  });

  expiredStories.forEach(async (story) => {
    await prisma.$transaction([
      prisma.story.update({
        where: {
          id: story.id,
        },
        data: {
          visible: false,
        },
      }),
      prisma.archive.update({
        where: {
          profileId: story.authorId,
        },
        data: {
          stories: {
            connect: {
              id: story.id,
            },
          },
        },
      }),
    ]);
  });
};

// cron job to move expired stories to archive, runs every minute
corn.schedule("* * * * *", moveStoryToArchive);
