import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { Prisma } from '@prisma/client';
import { Button, Chip, Link, TableCell, TableRow } from '@mui/material';

const include = {
  localPackage: {
    include: {
      repository: true,
    },
  },
  linter: {
    include: {
      rules: {
        include: {
          localPackageRules: true,
        },
      },
      configs: {
        include: {
          localPackageConfigs: true,
          ruleConfigs: true,
        },
      },
      package: { include: { versions: true } },
      lintFramework: {
        include: {
          linter: { include: { package: true } },
        },
      },
    },
  },
};

export default function DashboardRuleRow({
  localPackageLinter,
  rule,
}: {
  localPackageLinter: Prisma.LocalPackageLinterGetPayload<{
    include: typeof include;
  }>;
  rule: Prisma.RuleGetPayload<{
    include: { localPackageRules: true };
  }>;
}) {
  const isEnabledByConfig = localPackageLinter.linter.configs
    .filter((config) =>
      config.localPackageConfigs.some(
        (localPackageConfig) =>
          localPackageConfig.localPackageId ===
          localPackageLinter.localPackageId
      )
    )
    .some((config) =>
      config.ruleConfigs.some((ruleConfig) => ruleConfig.ruleId === rule.id)
    );

  const isDisableIndividually = rule.localPackageRules.some(
    (localPackageRule) =>
      localPackageRule.localPackageId === localPackageLinter.localPackageId &&
      localPackageRule.severity &&
      localPackageRule.severity === '0'
  );

  const isEnabledIndividually = rule.localPackageRules.some(
    (localPackageRule) =>
      localPackageRule.localPackageId === localPackageLinter.localPackageId &&
      localPackageRule.severity !== '0'
  );

  const showDisableButton =
    (isEnabledByConfig && !isDisableIndividually) || isEnabledIndividually;

  return (
    <TableRow
      key={rule.name}
      sx={{
        '&:last-child td, &:last-child th': {
          border: 0,
        },
      }}
    >
      <TableCell scope="row">
        <Link
          href={`/db/npm/${localPackageLinter.linter.package.name}/rules/${rule.name}`}
        >
          {rule.name}
        </Link>
      </TableCell>
      <TableCell
        scope="row"
        className="max-w-xs overflow-hidden whitespace-nowrap text-ellipsis"
      >
        {rule.description && (
          // eslint-disable-next-line react/no-children-prop -- false positive
          <ReactMarkdown children={rule.description} />
        )}
      </TableCell>
      <TableCell scope="row">25</TableCell>
      <TableCell scope="row">25%</TableCell>
      <TableCell scope="row" align="right">
        {localPackageLinter.linter.configs
          .filter((config) =>
            config.localPackageConfigs.some(
              (localPackageConfig) =>
                localPackageConfig.localPackageId ===
                localPackageLinter.localPackageId
            )
          )
          .filter((config) =>
            config.ruleConfigs.some(
              (ruleConfig) => ruleConfig.ruleId === rule.id
            )
          )
          .map((config) => (
            <Chip
              className="mr-4"
              label={`Enabled By: ${config.name}`}
              key={config.id}
              color="success"
              size="small"
            />
          ))}
        {localPackageLinter.linter.rules
          .flatMap((rule2) =>
            rule2.localPackageRules.filter(
              (localPackageRule) =>
                localPackageRule.localPackageId ===
                  localPackageLinter.localPackageId &&
                localPackageRule.ruleId === rule.id
            )
          )
          .map((rule2) => (
            <Chip
              className="mr-4"
              label={`${
                rule2.severity === '2'
                  ? 'Enabled'
                  : rule2.severity === '1'
                  ? 'Set To Warn'
                  : 'Disabled'
              } Individually`}
              key={rule2.id}
              color={
                rule2.severity === '2'
                  ? 'success'
                  : rule2.severity === '1'
                  ? 'warning'
                  : 'error'
              }
              size="small"
            />
          ))}
        {showDisableButton ? (
          <Button variant="outlined" size="small">
            Disable
          </Button>
        ) : (
          <Button variant="outlined" size="small">
            Enable
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
