import {
  Config as PrismaConfig,
  Rule as PrismaRule,
  Plugin as PrismaPlugin,
  PluginKeyword as PrismaPluginKeyword,
  RuleOption as PrismaRuleOption,
  RuleReplacedBy as PrismaRuleReplacedBy,
  PluginVersion as PrismaPluginVersion,
  RuleConfig as PrismaRuleConfig,
} from '@prisma/client';

export type Plugin = PrismaPlugin & {
  rules: PrismaRule[];
  configs: PrismaConfig[];
  keywords: PrismaPluginKeyword[];
  versions: PrismaPluginVersion[];
};

export type Rule = PrismaRule & {
  plugin: PrismaPlugin;
  options: PrismaRuleOption[];
  replacedBy: PrismaRuleReplacedBy[];
  ruleConfigs: PrismaRuleConfig[];
};

export type Config = PrismaConfig & {
  plugin: PrismaPlugin;
};

export type EmberTemplateLint = {
  configurations: Record<string, { rules: {} }>;
  rules: Record<string, {}>;
};
