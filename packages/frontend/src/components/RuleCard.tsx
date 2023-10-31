import {
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  Link,
  Paper,
  Typography,
} from '@mui/material';
import {
  ecosystemToDisplayName,
  lintFrameworkToDisplayName,
  lintFrameworkToLinkUs,
  packageToLinkUs,
  ruleToLinkUs,
} from '@/utils/dynamic-fields';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { Prisma } from '@prisma/client';
import EmojiFixable from './EmojiFixable';
import EmojiHasSuggestions from './EmojiHasSuggestions';
import EmojiOptions from './EmojiOptions';
import EmojiRequiresTypeChecking from './EmojiRequiresTypeChecking';
import EmojiTypeLayout from './EmojiTypeLayout';
import EmojiTypeProblem from './EmojiTypeProblem';
import EmojiTypeSuggestion from './EmojiTypeSuggestion';
import EmojiDeprecated from './EmojiDeprecated';
import Image from 'next/image';

// eslint-disable-next-line complexity
export default function RuleCard({
  rule,
  rulesRelated,
  detailed = false,
}: {
  rule: Prisma.RuleGetPayload<{
    include: {
      linter: {
        include: {
          lintFramework: true;
          package: { include: { ecosystem: true } };
        };
      };
      options: true;
      replacedBys: true;
    };
  }>;
  detailed?: boolean;
  rulesRelated?:
    | Prisma.RuleGetPayload<{
        include: { linter: { include: { package: true } } };
      }>[]
    | undefined;
}) {
  return (
    <Card sx={{ minWidth: 275 }}>
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 flex flex-col">
          <CardContent>
            <Breadcrumbs aria-label="breadcrumb" className="mb-1">
              <Typography
                sx={{ fontSize: 14 }}
                color="text.secondary"
                className="flex flex-row"
              >
                {rule.linter.package.ecosystem &&
                  rule.linter.package.ecosystem.name === 'node' && (
                    <Image
                      src="/icon-nodejs-square.svg"
                      width="14"
                      height="14"
                      alt="Node.js Logo"
                      className="mr-1 mt-1 mb-1"
                    />
                  )}
                {ecosystemToDisplayName(rule.linter.package.ecosystem)}
              </Typography>
              <Link
                underline="hover"
                sx={{ fontSize: 14 }}
                color="text.secondary"
                href={lintFrameworkToLinkUs(rule.linter.lintFramework)}
                className="flex flex-row"
              >
                {rule.linter.lintFramework &&
                  rule.linter.lintFramework.name === 'eslint' && (
                    <Image
                      src="/icon-eslint-square.png"
                      width="14"
                      height="14"
                      alt="ESLint Logo"
                      className="mr-1 mt-1 mb-1"
                    />
                  )}
                {lintFrameworkToDisplayName(rule.linter.lintFramework)}
              </Link>
              <Link
                underline="hover"
                sx={{ fontSize: 14 }}
                color="text.secondary"
                href={packageToLinkUs(rule.linter.package)}
                className="flex flex-row"
              >
                {rule.linter.package.name}
              </Link>
            </Breadcrumbs>

            <div className="mb-4">
              <Typography variant="h5" component="div">
                {detailed && rule.name}
                {!detailed && (
                  <Link
                    href={ruleToLinkUs(rule, rule.linter.package)}
                    underline="none"
                  >
                    {rule.name}
                  </Link>
                )}{' '}
                {rule.fixable ? <EmojiFixable /> : ''}
                {rule.hasSuggestions ? <EmojiHasSuggestions /> : ''}
                {rule.options.length > 0 ? <EmojiOptions /> : ''}
                {rule.requiresTypeChecking ? <EmojiRequiresTypeChecking /> : ''}
                {rule.type === 'layout' ? <EmojiTypeLayout /> : ''}
                {rule.type === 'problem' ? <EmojiTypeProblem /> : ''}
                {rule.type === 'suggestion' ? <EmojiTypeSuggestion /> : ''}
                {rule.deprecated ? <EmojiDeprecated /> : ''}
              </Typography>
              {detailed && rule.replacedBys.length > 0 && (
                <Typography sx={{ fontSize: 14 }} color="text.secondary">
                  Replaced by:{' '}
                  {rule.replacedBys.map((obj) => obj.name).join(', ')}
                </Typography>
              )}
            </div>

            {rule.description && (
              <Typography variant="body2" component={'div'}>
                {/* eslint-disable-next-line react/no-children-prop -- false positive */}
                <ReactMarkdown children={rule.description} />
              </Typography>
            )}
          </CardContent>

          {detailed && rule.linkRuleDoc && (
            <CardActions>
              {rule.linkRuleDoc && (
                <Button size="small" href={rule.linkRuleDoc}>
                  📖 Rule Doc
                </Button>
              )}
            </CardActions>
          )}
        </div>

        {detailed && (
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 m-4">
            {rulesRelated && rulesRelated.length > 0 && (
              <Paper className="p-4 border" sx={{ boxShadow: 'none' }}>
                <Typography variant="button">🤝 Related</Typography>
                <ul>
                  {rulesRelated.map((ruleRelated) => (
                    <li key={ruleRelated.id}>
                      <Link
                        href={ruleToLinkUs(
                          ruleRelated,
                          ruleRelated.linter.package
                        )}
                        underline="none"
                      >
                        {ruleRelated.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Paper>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
