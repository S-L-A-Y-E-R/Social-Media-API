import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  const before = Date.now();

  const result = await next(params);

  const after = Date.now();

  console.log(
    `\x1b[36mQuery ${params.model}.${params.action} took \x1b[33m${
      after - before
    }ms\x1b[0m`
  );

  return result;
});

export { prisma };
