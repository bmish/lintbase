import { Prisma } from '@prisma/client';
import { Chip, Link, TableCell, TableRow } from '@mui/material';
import { getConfigEmojis } from '@/utils/config-emoji';

export default function DashboardLinterRow({
  localPackageLintFramework,
  localPackageLinter,
}: {
  localPackageLinter: Prisma.LocalPackageLinterGetPayload<{
    include: {
      linter: {
        include: {
          lintFramework: true;
          package: { include: { versions: true } };
          rules: { include: { ruleConfigs: true; localPackageRules: true } };
          configs: {
            include: {
              ruleConfigs: true;
              localPackageConfigs: true;
              localPackageRules: true;
            };
          };
        };
      };
    };
  }>;
  localPackageLintFramework: Prisma.LocalPackageLintFrameworkGetPayload<{
    include: { localPackage: { include: { repository: true } } };
  }>;
}) {
  const configToEmoji = getConfigEmojis(localPackageLinter.linter.configs);

  return (
    <TableRow key={localPackageLinter.id}>
      <TableCell scope="row">
        <Link
          href={`/dashboard/repos/${encodeURIComponent(
            localPackageLintFramework.localPackage.repository.fullName
          )}/packages/${
            localPackageLintFramework.localPackage.path === '.'
              ? 'root'
              : localPackageLintFramework.localPackage.path
          }/linters/${localPackageLinter.linter.lintFramework.name}/plugins/${
            localPackageLinter.linter.package.name
          }`}
        >
          {localPackageLinter.linter.package.name}
        </Link>
      </TableCell>
      <TableCell scope="row" align="right">
        {localPackageLinter.version}
      </TableCell>
      <TableCell scope="row" align="right">
        {localPackageLinter.linter.package.versions.at(-1)?.version}
      </TableCell>
      <TableCell scope="row" align="right">
        {localPackageLinter.linter.configs
          .filter((config) =>
            config.localPackageConfigs.some(
              (localPackageConfig) =>
                localPackageConfig.localPackageId ===
                localPackageLinter.localPackageId
            )
          )
          .map((config) => (
            <Chip
              key={config.id}
              label={`${configToEmoji[config.name] || ''} ${config.name}`}
            />
          ))}
      </TableCell>
      <TableCell scope="row" align="right">
        {
          // Count rules that are either enabled individually or enabled by a config that is enabled.
          localPackageLinter.linter.rules.filter(
            (rule) =>
              rule.localPackageRules.some(
                (localPackageRule) =>
                  localPackageRule.localPackageId ===
                    localPackageLinter.localPackageId &&
                  localPackageRule.severity !== '0'
              ) ||
              localPackageLinter.linter.configs.some((config) =>
                config.localPackageConfigs.some(
                  (localPackageConfig) =>
                    localPackageConfig.localPackageId ===
                      localPackageLinter.localPackageId &&
                    config.ruleConfigs.some(
                      (ruleConfig) => ruleConfig.ruleId === rule.id
                    )
                )
              )
          ).length
        }{' '}
        / {localPackageLinter.linter.rules.length}
      </TableCell>
    </TableRow>
  );
}
