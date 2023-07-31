import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { Octokit } from 'octokit';
import { env } from '@/env.mjs';

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

  refresh: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const octokit = new Octokit({
        auth: env.GITHUB_PERSONAL_ACCESS_TOKEN,
      });

      const commits = await octokit.request(
        'GET /repos/{owner}/{repo}/commits',
        {
          owner: input.fullName.split('/')[0],
          repo: input.fullName.split('/')[1],
          headers: {
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );
      const lastCommit = commits.data[0];

      await ctx.prisma.repository.update({
        where: { owner: { id: ctx.session.user.id }, fullName: input.fullName },
        data: {
          commitSha: lastCommit.sha,
          // TODO: update anything else, commit time
        },
      });
    }),
});
