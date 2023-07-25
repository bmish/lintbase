import {
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  Link,
  Typography,
} from '@mui/material';
import {
  ecosystemToDisplayName,
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

export default function RuleCard({
  rule,
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
      replacedBy: true;
    };
  }>;
  detailed?: boolean;
}) {
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Breadcrumbs aria-label="breadcrumb" className="mb-1">
          <Typography sx={{ fontSize: 14 }} color="text.secondary">
            {ecosystemToDisplayName(rule.linter.package.ecosystem)}
          </Typography>
          <Link
            underline="hover"
            sx={{ fontSize: 14 }}
            color="text.secondary"
            href={lintFrameworkToLinkUs(rule.linter.lintFramework)}
          >
            {rule.linter.lintFramework.name === 'eslint'
              ? 'ESLint'
              : rule.linter.lintFramework.name}
          </Link>
          <Link
            underline="hover"
            sx={{ fontSize: 14 }}
            color="text.secondary"
            href={packageToLinkUs(rule.linter.package)}
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
          {detailed && rule.replacedBy.length > 0 && (
            <Typography sx={{ fontSize: 14 }} color="text.secondary">
              Replaced by: {rule.replacedBy.map((obj) => obj.name).join(', ')}
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
              Rule Doc
            </Button>
          )}
        </CardActions>
      )}
    </Card>
  );
}
