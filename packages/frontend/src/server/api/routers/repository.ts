import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { Octokit } from 'octokit';
import { env } from '@/env.mjs';

export const repositoryRouter = createTRPCRouter({
  add: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(1),
        // TODO: Query the GitHub API here to get this data.
        description: z.string().optional(),
        commitSha: z.string().optional(),
        language: z.string().optional(),
        size: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const octokit = new Octokit({
        auth: env.GITHUB_PERSONAL_ACCESS_TOKEN,
      });

      // TODO: search recursively for local packages in monorepos.
      const contents = (await octokit.request(
        'GET /repos/{owner}/{repo}/contents',
        {
          owner: input.fullName.split('/')[0],
          repo: input.fullName.split('/')[1],
          headers: {
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      )) as { data: { name: string; path: string }[] };

      // TODO: support other lint frameworks.
      const lintFramework = await ctx.prisma.lintFramework.findFirstOrThrow({
        where: {
          name: 'eslint',
          ecosystem: {
            name: 'node',
          },
        },
      });

      await ctx.prisma.repository.create({
        data: {
          fullName: input.fullName,
          description: input.description,
          commitSha: input.commitSha,
          language: input.language,
          size: input.size,
          importedAt: new Date(),
          owner: { connect: { id: ctx.session.user.id } },
          localPackages: {
            create: contents.data
              .filter((data) => data.name === 'package.json')
              .map((data) => ({
                path: data.path,
                localPackageLintFrameworks: {
                  create: contents.data
                    .filter((data) => data.name === '.eslintrc.js')
                    .map((data) => ({
                      pathConfig: data.path,
                      isPresent: true,
                      lintFramework: {
                        connect: { id: lintFramework.id },
                      },
                    })),
                },
              })),
          },
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
          committedAt: lastCommit.commit.committer?.date,
          scannedAt: new Date(),
          // TODO: update anything else
        },
      });
    }),
});
