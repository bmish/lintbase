import {
  Button,
  Card,
  CardActions,
  CardContent,
  Link,
  Typography,
} from '@mui/material';
import { pluginToLinkUs, ruleToLinkUs } from '@/utils/dynamic-fields';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { Prisma } from '@prisma/client';

export default function RuleCard({
  rule,
  detailed = false,
}: {
  rule: Prisma.RuleGetPayload<{
    include: { plugin: true; options: true; replacedBy: true };
  }>;
  detailed?: boolean;
}) {
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          {rule.ecosystem === 'node' ? 'Node.js' : rule.ecosystem} •{' '}
          {rule.plugin.name}
        </Typography>
        <div className="mb-4">
          <Typography variant="h5" component="div">
            {detailed && rule.name}
            {!detailed && (
              <Link href={ruleToLinkUs(rule, rule.plugin)} underline="none">
                {rule.name}
              </Link>
            )}{' '}
            {rule.fixable ? '🔧' : ''}
            {rule.hasSuggestions ? '💡' : ''}
            {rule.options.length > 0 ? '⚙️' : ''}
            {rule.requiresTypeChecking ? '💭' : ''}
            {rule.type === 'layout' ? '📏' : ''}
            {rule.type === 'problem' ? '❗' : ''}
            {rule.type === 'suggestion' ? '📖' : ''}
            {rule.deprecated ? '❌' : ''}
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
          <Button size="small" href={pluginToLinkUs(rule.plugin)}>
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
