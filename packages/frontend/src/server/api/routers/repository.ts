import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { Octokit } from 'octokit';
import { env } from '@/env.mjs';
import { dirname } from 'node:path';
import { PackageJson } from 'type-fest';
import type { TSESLint } from '@typescript-eslint/utils';
import { uniqueItems } from '@/utils/javascript';
import {
  LINTERS_RECOMMENDED_ALWAYS,
  LINTERS_RECOMMENDED_NEVER,
  LINTERS_DEPRECATED,
  getLintersForPackage,
} from '@/utils/lintees';

function extendsToInfo(
  extendsList: string[] | undefined,
): { plugin: string; config: string }[] {
  return (extendsList || []).flatMap(
    (configName) =>
      configName.startsWith('eslint:')
        ? [{ plugin: 'eslint', config: configName.split(':')[1] }]
        : configName.startsWith('plugin:')
          ? [
              {
                plugin: `eslint-plugin-${
                  configName.split(':')[1].split('/')[0]
                }`,
                config: configName.split(':')[1].split('/')[1],
              },
            ]
          : [], // TODO: unknown
  );
}

function normalizeSeverity(
  severity: TSESLint.Linter.RuleLevel | TSESLint.Linter.Severity,
): 0 | 1 | 2 {
  return severity === 'off' || severity === 0
    ? 0
    : severity === 'warn' || severity === 1
      ? 1
      : 2;
}

function rulesToInfo(rules: TSESLint.Linter.RulesRecord | undefined): {
  plugin: string;
  ruleName: string;
  severity: 0 | 1 | 2;
}[] {
  return Object.entries(rules || {}).flatMap(([ruleName, entry]) =>
    entry === undefined
      ? []
      : ruleName.includes('/')
        ? [
            {
              plugin: `eslint-plugin-${ruleName.split('/')[0]}`,
              ruleName: ruleName.split('/')[1],
              severity: normalizeSeverity(
                typeof entry === 'string' || typeof entry === 'number'
                  ? entry
                  : entry[0],
              ),
            },
          ]
        : [
            {
              plugin: 'eslint',
              ruleName,
              severity: normalizeSeverity(
                typeof entry === 'string' || typeof entry === 'number'
                  ? entry
                  : entry[0],
              ),
            },
          ],
  );
}

const ESLINTRC_FILENAMES = new Set(['.eslintrc.js', '.eslintrc.cjs']); // TODO: json, yaml, etc.

export const repositoryRouter = createTRPCRouter({
  add: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        fullName: z.string().min(1),
        // TODO: Query the GitHub API here to get this data.
        description: z.string().optional(),
        commitSha: z.string().optional(),
        language: z.string().optional(),
        size: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.repository.upsert({
        where: {
          fullName: input.fullName,
        },
        create: {
          name: input.name,
          fullName: input.fullName,
          description: input.description,
          commitSha: input.commitSha,
          language: input.language,
          size: input.size,
          importedAt: new Date(),
          owner: { connect: { id: ctx.session.user.id } },
          // TODO: add more repository fields
        },
        update: {
          description: input.description,
          commitSha: input.commitSha,
          language: input.language,
          size: input.size,
          importedAt: new Date(),
          owner: { connect: { id: ctx.session.user.id } },
          // TODO: add more repository fields
        },
      });
    }),

  remove: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const deleteRepository = ctx.prisma.repository.delete({
        where: {
          fullName: input.fullName,
          owner: { id: ctx.session.user.id },
        },
      });
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
      const deleteLocalPackageConfigs =
        ctx.prisma.localPackageConfig.deleteMany({
          where: {
            localPackage: {
              repository: {
                owner: { id: ctx.session.user.id },
                fullName: input.fullName,
              },
            },
          },
        });
      const deleteLocalPackageRules = ctx.prisma.localPackageRule.deleteMany({
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
        deleteLocalPackageLinters,
        deleteLocalPackageConfigs,
        deleteLocalPackageRules,
        deleteLocalPackages,
        deleteRepository,
      ]); // Must be done in a transaction to satisfy constraints.
    }),

  refresh: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(1),
      }),
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
        },
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
        },
      )) as { data: { name: string; path: string }[] };

      if (!contents.data.some((file) => file.name === 'package.json')) {
        console.log('No package.json file(s) found in repository.'); // eslint-disable-line no-console
        return;
      }

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
        },
      )) as { data: { content: string } };
      // decode base64 from contentsLocalPackageManifest.data.content
      const localPackageManifest = JSON.parse(
        Buffer.from(
          contentsLocalPackageManifest.data.content,
          'base64',
        ).toString('utf8'),
      ) as PackageJson;

      if (!contents.data.some((file) => ESLINTRC_FILENAMES.has(file.name))) {
        console.log('No eslintrc file(s) found in repository.'); // eslint-disable-line no-console
        return;
      }

      // TODO: search recursively for linter configs in monorepos.
      const contentsEslintrc = (await octokit.request(
        'GET /repos/{owner}/{repo}/contents/{path}',
        {
          owner: input.fullName.split('/')[0],
          repo: input.fullName.split('/')[1],
          path: contents.data
            .filter((data) => ESLINTRC_FILENAMES.has(data.path))
            .map((data) => data.path)[0],
          headers: {
            'X-GitHub-Api-Version': '2022-11-28',
          },
        },
      )) as { data: { content: string } };
      const requireRegex = /require\s*\(\s*["'][^"']+["']\s*\)\s*/u;
      const requireResolveRegex =
        /require\.resolve\s*\(\s*["'][^"']+["']\s*\)\s*/gu;
      const contentsEslintrcData = Buffer.from(
        contentsEslintrc.data.content,
        'base64',
      )
        .toString('utf8')
        .replace(requireRegex, '{}') // Replace require statement with dummy value for now.
        .replaceAll(requireResolveRegex, '{}'); // Replace require statement with dummy value for now.

      const eslintrc = contentsEslintrc.data.content
        ? // eslint-disable-next-line no-eval -- TODO: eventually, we need a sandbox for installing repos and evaluating lint configs.
          (eval(contentsEslintrcData) as {
            extends?: string[];
            rules?: TSESLint.Linter.RulesRecord;
          })
        : undefined;

      const localPackageAllDependencies = {
        ...localPackageManifest.dependencies,
        ...localPackageManifest.devDependencies,
      };
      const localPackageLinters = Object.keys(
        localPackageAllDependencies,
      ).filter((dependency) => dependency.startsWith('eslint-plugin-'));

      const suggestedLinters = [
        ...Object.keys(localPackageAllDependencies).flatMap((dep) =>
          getLintersForPackage(dep),
        ),
        ...LINTERS_RECOMMENDED_ALWAYS,
      ].filter(
        (linterName) =>
          !LINTERS_RECOMMENDED_NEVER.includes(linterName) ||
          linterName in LINTERS_DEPRECATED,
      );

      const linterPackageIds = await ctx.prisma.package.findMany({
        where: {
          name: {
            in: [
              // Installed linters.
              ...localPackageLinters,
              // Suggested linters.
              ...suggestedLinters,
            ],
          },
        },
        select: {
          id: true,
          name: true,
        },
      });
      const linterToPackageId = Object.fromEntries(
        linterPackageIds.map((obj) => [obj.name, obj.id]),
      );

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
      const deleteLocalPackageConfigs =
        ctx.prisma.localPackageConfig.deleteMany({
          where: {
            localPackage: {
              repository: {
                owner: { id: ctx.session.user.id },
                fullName: input.fullName,
              },
            },
          },
        });
      const deleteLocalPackageRules = ctx.prisma.localPackageRule.deleteMany({
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
        deleteLocalPackageLinters,
        deleteLocalPackageConfigs,
        deleteLocalPackageRules,
        deleteLocalPackages,
      ]); // Must be done in a transaction to satisfy constraints.

      const extendsInfo = extendsToInfo(eslintrc?.extends);
      const lintersForConfigs = await ctx.prisma.linter.findMany({
        where: {
          package: {
            name: {
              in: extendsInfo.map((obj) => obj.plugin),
            },
          },
        },
        include: {
          package: true,
        },
      });

      const rulesInfo = rulesToInfo(eslintrc?.rules);
      const lintersForRules = await ctx.prisma.linter.findMany({
        where: {
          package: {
            name: {
              in: rulesInfo.map((obj) => obj.plugin),
            },
          },
        },
        include: {
          package: true,
        },
      });

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
                    .filter((data) => ESLINTRC_FILENAMES.has(data.name))
                    .map((data) => ({
                      pathConfig: data.path,
                      isPresent: true,
                      lintFramework: {
                        connect: { id: lintFramework.id },
                      },
                    })),
                },

                localPackageLinters: {
                  // Dedupe in case suggested linters already installed.
                  create: [
                    ...uniqueItems(
                      [
                        // Present linters.
                        ...localPackageLinters
                          .filter(
                            (linterName) =>
                              linterToPackageId[linterName] !== undefined,
                          )
                          .map((linterName) => ({
                            isPresent: true,
                            version: localPackageAllDependencies[linterName],
                            linter: {
                              connect: {
                                packageId: linterToPackageId[linterName],
                              },
                            },
                          })),
                        // Suggested linters.
                        ...suggestedLinters
                          .filter(
                            (linterName) =>
                              linterToPackageId[linterName] !== undefined,
                          )
                          .map((linterName) => ({
                            isSuggested: true,
                            linter: {
                              connect: {
                                packageId: linterToPackageId[linterName],
                              },
                            },
                          })),
                      ],
                      (obj) => obj.linter.connect.packageId,
                    ),
                  ],
                },

                localPackageConfigs: {
                  create: extendsInfo.map(({ config, plugin }) => ({
                    isEnabled: true,
                    config: {
                      connect: {
                        name_linterId: {
                          name: config,
                          linterId: lintersForConfigs.find(
                            (linter) => linter.package.name === plugin,
                          )?.id as number,
                        },
                      },
                    },
                  })),
                },

                localPackageRules: {
                  create: rulesInfo.map(({ ruleName, plugin }, i) => ({
                    isEnabled: true, // TODO: remove, redundant with severity
                    severity: rulesInfo[i].severity.toString(), // TODO: avoid need to convert
                    rule: {
                      connect: {
                        name_linterId: {
                          name: ruleName,
                          linterId: lintersForRules.find(
                            (linter) => linter.package.name === plugin,
                          )?.id as number,
                        },
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
