import {
  Config as PrismaConfig,
  Rule as PrismaRule,
  Plugin as PrismaPlugin,
} from '@prisma/client';

export type Plugin = PrismaPlugin & {
  rules: PrismaRule[];
  configs: PrismaConfig[];
};

export type Rule = PrismaRule & {
  plugin: PrismaPlugin;
};

export type Config = PrismaConfig & {
  plugin: PrismaPlugin;
};
