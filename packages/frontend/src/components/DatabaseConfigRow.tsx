import { Prisma } from '@prisma/client';
import { TableCell, TableRow } from '@mui/material';
import { getConfigEmojis } from '@/utils/config-emoji';

export default function DatabaseConfigRow({
  config,
  configs,
}: {
  config: Prisma.ConfigGetPayload<{
    include: { ruleConfigs: true };
  }>;
  configs: Prisma.ConfigGetPayload<object>[];
}) {
  const configToEmoji = getConfigEmojis(configs);

  const countError = config.ruleConfigs.filter(
    (ruleConfig) => ruleConfig.severity === 'error'
  ).length;
  const countWarn = config.ruleConfigs.filter(
    (ruleConfig) => ruleConfig.severity === 'warn'
  ).length;
  const countOff = config.ruleConfigs.filter(
    (ruleConfig) => ruleConfig.severity === 'off'
  ).length;
  const hasMultipleCounts =
    [countError, countWarn, countOff].filter((item) => item > 0).length > 1;

  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell scope="row">
        {configToEmoji[config.name]} {config.name}
      </TableCell>
      <TableCell scope="row" align="right">
        {countError > 0 && countError}
        {countError > 0 && hasMultipleCounts && ' error'}
        {countError > 0 && countWarn > 0 && ' • '}
        {countWarn > 0 && `${countWarn} warn`}
        {countWarn > 0 && countOff > 0 && ' • '}
        {countOff > 0 && `${countOff} disabled`}
      </TableCell>
    </TableRow>
  );
}
