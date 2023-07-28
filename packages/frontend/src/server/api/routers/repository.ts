import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

export const repositoryRouter = createTRPCRouter({
  add: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(1),
        description: z.string().optional(),
        commitSha: z.string().optional(),
        language: z.string().optional(),
        size: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.repository.upsert({
        where: { owner: { id: ctx.session.user.id }, fullName: input.fullName },
        update: {},
        create: {
          fullName: input.fullName,
          description: input.description,
          commitSha: input.commitSha,
          language: input.language,
          size: input.size,
          owner: { connect: { id: ctx.session.user.id } },
        },
      });
    }),
});
