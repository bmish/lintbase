import {
  Package as PrismaPackage,
  Rule as PrismaRule,
  LintFramework as PrismaLintFramework,
  Ecosystem as PrismaEcosystem,
} from '@prisma/client';

export function ruleToLinkUs(rule: PrismaRule, package_: PrismaPackage) {
  return `/db/npm/${encodeURIComponent(
    package_.name
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
