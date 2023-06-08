import { Plugin as PrismaPlugin, Rule as PrismaRule } from '@prisma/client';

export function ruleToLinkUs(rule: PrismaRule, plugin: PrismaPlugin) {
  return `/npm/${encodeURIComponent(plugin.name)}/${encodeURIComponent(
    rule.name
  )}`;
}

export function pluginToLinkUs(plugin: PrismaPlugin) {
  return `/npm/${encodeURIComponent(plugin.name)}`;
}

export function pluginToLinkPackageRegistry(plugin: PrismaPlugin) {
  return `https://www.npmjs.com/package/${encodeURIComponent(plugin.name)}`;
}
