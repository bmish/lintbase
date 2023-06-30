import {
  Button,
  Card,
  CardActions,
  CardContent,
  Link,
  Typography,
} from '@mui/material';
import { packageToLinkUs, ruleToLinkUs } from '@/utils/dynamic-fields';
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
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          {rule.linter.package.ecosystem.name === 'node'
            ? 'Node.js'
            : rule.linter.package.ecosystem.name}{' '}
          •{' '}
          {rule.linter.lintFramework.name === 'eslint'
            ? 'ESLint'
            : rule.linter.lintFramework.name}{' '}
          • {rule.linter.package.name}
        </Typography>
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

      {detailed && (
        <CardActions>
          <Button size="small" href={packageToLinkUs(rule.linter.package)}>
            plugin
          </Button>

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
