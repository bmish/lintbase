import {
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import EmojiHasSuggestions from '@/components/EmojiHasSuggestions';
import EmojiFixable from '@/components/EmojiFixable';
import EmojiRequiresTypeChecking from '@/components/EmojiRequiresTypeChecking';
import EmojiTypeLayout from '@/components/EmojiTypeLayout';
import EmojiTypeProblem from '@/components/EmojiTypeProblem';
import EmojiTypeSuggestion from '@/components/EmojiTypeSuggestion';
import EmojiOptions from '@/components/EmojiOptions';
import EmojiDeprecated from '@/components/EmojiDeprecated';
import EmojiType from '@/components/EmojiType';
import EmojiSeverityWarn from '@/components/EmojiSeverityWarn';
import EmojiSeverityOff from '@/components/EmojiSeverityOff';
import { ruleToLinkUs } from '@/utils/dynamic-fields';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { Prisma, Package as PrismaPackage } from '@prisma/client';

export default function RuleTable({
  rules,
  pkg,
  configToEmoji,
}: {
  rules: readonly Prisma.RuleGetPayload<{
    include: { options: true; ruleConfigs: { include: { config: true } } };
  }>[];
  pkg: PrismaPackage;
  configToEmoji: Record<string, string | undefined>;
}) {
  const hasDescription = rules.some((rule) => rule.description);
  return (
    <TableContainer>
      <Table sx={{ minWidth: 650 }} aria-label="linter rule list">
        <TableHead>
          <TableRow>
            <TableCell scope="col">Rule</TableCell>
            {hasDescription && (
              <TableCell scope="col" align="left">
                Description
              </TableCell>
            )}
            <TableCell scope="col" align="right">
              <EmojiFixable />
            </TableCell>
            <TableCell scope="col" align="right">
              <EmojiHasSuggestions />
            </TableCell>
            <TableCell scope="col" align="right">
              <EmojiRequiresTypeChecking />
            </TableCell>
            <TableCell scope="col" align="right">
              <EmojiType />
            </TableCell>
            <TableCell scope="col" align="right">
              <EmojiOptions />
            </TableCell>
            <TableCell scope="col" align="right">
              <EmojiDeprecated />
            </TableCell>
            {Object.entries(configToEmoji).map(([config, emoji]) => (
              <TableCell key={config} align="right" title={`Config: ${config}`}>
                {emoji}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rules.map((rule) => (
            <TableRow
              key={`${pkg.name}/${rule.name}`}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell scope="row">
                <Link href={ruleToLinkUs(rule, pkg)} underline="none">
                  {rule.name}
                </Link>
              </TableCell>
              {hasDescription && (
                <TableCell align="left">
                  {rule.description && (
                    // eslint-disable-next-line react/no-children-prop -- false positive
                    <ReactMarkdown children={rule.description} />
                  )}
                </TableCell>
              )}
              <TableCell align="right">
                {rule.fixable ? <EmojiFixable /> : ''}
              </TableCell>
              <TableCell align="right">
                {rule.hasSuggestions ? <EmojiHasSuggestions /> : ''}
              </TableCell>
              <TableCell align="right">
                {rule.requiresTypeChecking ? <EmojiRequiresTypeChecking /> : ''}
              </TableCell>
              <TableCell align="right">
                {rule.type === 'layout' ? <EmojiTypeLayout /> : ''}
                {rule.type === 'problem' ? <EmojiTypeProblem /> : ''}
                {rule.type === 'suggestion' ? <EmojiTypeSuggestion /> : ''}
              </TableCell>
              <TableCell align="right">
                {rule.options.length > 0 ? <EmojiOptions /> : ''}
              </TableCell>
              <TableCell align="right">
                {rule.deprecated ? <EmojiDeprecated /> : ''}
              </TableCell>
              {Object.entries(configToEmoji).map(([config, emoji]) => (
                <TableCell key={config} align="right">
                  {rule.ruleConfigs.some(
                    (ruleConfig) =>
                      ruleConfig.config.name === config &&
                      ruleConfig.severity === 'error'
                  ) ? (
                    <span title={`Errors in ${config}`}>{emoji}</span>
                  ) : (
                    ''
                  )}
                  {rule.ruleConfigs.some(
                    (ruleConfig) =>
                      ruleConfig.config.name === config &&
                      ruleConfig.severity === 'warn'
                  ) ? (
                    <EmojiSeverityWarn config={config} />
                  ) : (
                    ''
                  )}
                  {rule.ruleConfigs.some(
                    (ruleConfig) =>
                      ruleConfig.config.name === config &&
                      ruleConfig.severity === 'off'
                  ) ? (
                    <EmojiSeverityOff config={config} />
                  ) : (
                    ''
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
