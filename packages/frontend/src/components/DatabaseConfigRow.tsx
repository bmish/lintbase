import { Prisma } from '@prisma/client';
import { TableCell, TableRow } from '@mui/material';
import { getConfigEmojis } from '@/utils/config-emoji';

export default function DatabaseConfigRow({
  config,
  configs,
  includeDescription,
  includeDescriptionAI,
}: {
  config: Prisma.ConfigGetPayload<{
    include: { ruleConfigs: true };
  }>;
  configs: Prisma.ConfigGetPayload<object>[];
  includeDescription: boolean;
  includeDescriptionAI: boolean;
}) {
  const configToEmoji = getConfigEmojis(configs);

  const countError = config.ruleConfigs.filter(
    (ruleConfig) => ruleConfig.severity === 'error',
  ).length;
  const countWarn = config.ruleConfigs.filter(
    (ruleConfig) => ruleConfig.severity === 'warn',
  ).length;
  const countOff = config.ruleConfigs.filter(
    (ruleConfig) => ruleConfig.severity === 'off',
  ).length;

  const countsDisplay = [
    countError > 0 ? `${countError} error` : null,
    countWarn > 0 ? `${countWarn} warn` : null,
    countOff > 0 ? `${countOff} off` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell scope="row">
        {configToEmoji[config.name]} {config.name}
      </TableCell>
      {includeDescription && (
        <TableCell scope="row">{config.description}</TableCell>
      )}
      {includeDescriptionAI && (
        <TableCell scope="row">{config.descriptionAI}</TableCell>
      )}
      <TableCell scope="row" align="right">
        {(countError > 0 && countWarn === 0 && countOff === 0 && countError) ||
          countsDisplay}
      </TableCell>
    </TableRow>
  );
}
