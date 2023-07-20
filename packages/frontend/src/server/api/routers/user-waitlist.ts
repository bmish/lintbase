import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';

export const userWaitlistRouter = createTRPCRouter({
  join: publicProcedure
    .input(z.object({ email: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.userWaitlist.upsert({
        where: { email: input.email },
        update: {},
        create: { email: input.email },
      });
    }),
});
