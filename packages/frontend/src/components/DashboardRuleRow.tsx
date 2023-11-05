import ReactMarkdown from 'react-markdown';
import { Prisma } from '@prisma/client';
import { Button, Chip, Link, TableCell, TableRow } from '@mui/material';
import { getConfigEmojis } from '@/utils/config-emoji';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

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
          localPackageLinter.localPackageId,
      ),
    )
    .some((config) =>
      config.ruleConfigs.some((ruleConfig) => ruleConfig.ruleId === rule.id),
    );

  const isDisableIndividually = rule.localPackageRules.some(
    (localPackageRule) =>
      localPackageRule.localPackageId === localPackageLinter.localPackageId &&
      localPackageRule.severity &&
      localPackageRule.severity === '0',
  );

  const isEnabledIndividually = rule.localPackageRules.some(
    (localPackageRule) =>
      localPackageRule.localPackageId === localPackageLinter.localPackageId &&
      localPackageRule.severity !== '0',
  );

  const isEnabled =
    (isEnabledByConfig && !isDisableIndividually) || isEnabledIndividually;

  const configToEmoji = getConfigEmojis(localPackageLinter.linter.configs);

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
      <TableCell scope="row">
        {!isEnabled && Math.round(Math.random() * 100)}
      </TableCell>
      <TableCell scope="row">
        {!isEnabled && rule.fixable && `${Math.round(Math.random() * 100)}%`}
        {!isEnabled && !rule.fixable && 'No'}
      </TableCell>
      <TableCell scope="row" align="right">
        {localPackageLinter.linter.configs
          .filter((config) =>
            config.localPackageConfigs.some(
              (localPackageConfig) =>
                localPackageConfig.localPackageId ===
                localPackageLinter.localPackageId,
            ),
          )
          .filter((config) =>
            config.ruleConfigs.some(
              (ruleConfig) => ruleConfig.ruleId === rule.id,
            ),
          )
          .map((config) => (
            <Chip
              className="mr-4"
              label={`${configToEmoji[config.name] || ''} ${config.name}`}
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
                localPackageRule.ruleId === rule.id,
            ),
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
        {isEnabled ? (
          <Button variant="outlined" size="small" color="error">
            <DeleteIcon fontSize="small" className="mr-1" /> Disable
          </Button>
        ) : (
          <Button variant="outlined" size="small">
            <AddIcon fontSize="small" className="mr-1" /> Enable
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
