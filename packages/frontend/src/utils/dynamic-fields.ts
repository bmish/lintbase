/**
 * These are helpers for generating display data (e.g. URLs) based on what's stored in the database.
 */

import {
  Package as PrismaPackage,
  Rule as PrismaRule,
  LintFramework as PrismaLintFramework,
  Ecosystem as PrismaEcosystem,
} from '@prisma/client';

export function ruleToLinkUs(rule: PrismaRule, package_: PrismaPackage) {
  return `/db/npm/${encodeURIComponent(
    package_.name,
  )}/rules/${encodeURIComponent(rule.name)}`;
}

export function packageToLinkUs(package_: PrismaPackage) {
  return `/db/npm/${encodeURIComponent(package_.name)}`;
}

export function linterToLinkPackageRegistry(package_: PrismaPackage) {
  return `https://www.npmjs.com/package/${encodeURIComponent(package_.name)}`;
}

export function lintFrameworkToLinkUs(linter: PrismaLintFramework) {
  return `/db/plugins?linter=${encodeURIComponent(linter.name)}`;
}

export function ecosystemToDisplayName(ecosystem: PrismaEcosystem) {
  return ecosystem.name === 'node' ? 'Node.js' : ecosystem.name;
}

export function lintFrameworkToDisplayName(lintFramework: PrismaLintFramework) {
  return lintFramework.name === 'eslint' ? 'ESLint' : lintFramework.name;
}
