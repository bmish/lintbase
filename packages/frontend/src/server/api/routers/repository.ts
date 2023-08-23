import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { Octokit } from 'octokit';
import { env } from '@/env.mjs';
import { dirname } from 'node:path';
import { PackageJson } from 'type-fest';

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
      await ctx.prisma.repository.create({
        data: {
          fullName: input.fullName,
          description: input.description,
          commitSha: input.commitSha,
          language: input.language,
          size: input.size,
          importedAt: new Date(),
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

      // TODO: search recursively for local packages in monorepos.
      const contentsLocalPackageManifest = (await octokit.request(
        'GET /repos/{owner}/{repo}/contents/{path}',
        {
          owner: input.fullName.split('/')[0],
          repo: input.fullName.split('/')[1],
          path: 'package.json',
          headers: {
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      )) as { data: { content: string } };
      // decode base64 from contentsLocalPackageManifest.data.content
      const localPackageManifest = JSON.parse(
        Buffer.from(
          contentsLocalPackageManifest.data.content,
          'base64'
        ).toString('utf8')
      ) as PackageJson;
      const localPackageAllDependencies = {
        ...localPackageManifest.dependencies,
        ...localPackageManifest.devDependencies,
      };
      const localPackageLinters = Object.keys(
        localPackageAllDependencies
      ).filter((dependency) => dependency.startsWith('eslint-plugin-'));
      const localPackageLinterPackageIds = await ctx.prisma.package.findMany({
        where: {
          name: {
            in: localPackageLinters,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      // TODO: support other lint frameworks.
      const lintFramework = await ctx.prisma.lintFramework.findFirstOrThrow({
        where: {
          name: 'eslint',
          ecosystem: {
            name: 'node',
          },
        },
      });

      // TODO: eventually reuse existing models that are still relevant.
      const deleteLocalPackages = ctx.prisma.localPackage.deleteMany({
        where: {
          repository: {
            owner: { id: ctx.session.user.id },
            fullName: input.fullName,
          },
        },
      });
      const deleteLocalPackageLintFrameworks =
        ctx.prisma.localPackageLintFramework.deleteMany({
          where: {
            localPackage: {
              repository: {
                owner: { id: ctx.session.user.id },
                fullName: input.fullName,
              },
            },
          },
        });
      const deleteLocalPackageLinters =
        ctx.prisma.localPackageLinter.deleteMany({
          where: {
            localPackage: {
              repository: {
                owner: { id: ctx.session.user.id },
                fullName: input.fullName,
              },
            },
          },
        });
      await ctx.prisma.$transaction([
        deleteLocalPackageLintFrameworks,
        deleteLocalPackages,
        deleteLocalPackageLinters,
      ]); // Must be done in a transaction to satisfy constraints.

      await ctx.prisma.repository.update({
        where: { owner: { id: ctx.session.user.id }, fullName: input.fullName },
        data: {
          commitSha: lastCommit.sha,
          committedAt: lastCommit.commit.committer?.date,
          scannedAt: new Date(),
          localPackages: {
            create: contents.data
              .filter((data) => data.name === 'package.json')
              .map((data) => ({
                path: dirname(data.path),
                pathManifest: data.path,
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
                localPackageLinters: {
                  create: localPackageLinterPackageIds.map((obj) => ({
                    isPresent: true,
                    version: localPackageAllDependencies[obj.name],
                    linter: {
                      connect: {
                        packageId: obj.id,
                      },
                    },
                  })),
                },
              })),
          },
          // TODO: update anything else
        },
      });
    }),
});
