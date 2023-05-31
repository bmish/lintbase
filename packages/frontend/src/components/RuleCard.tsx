import {
  Button,
  Card,
  CardActions,
  CardContent,
  Link,
  Typography,
} from '@mui/material';
import { Rule } from '@/types';

export default function RuleCard({
  rule,
  detailed = false,
}: {
  rule: Rule;
  detailed?: boolean;
}) {
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          {rule.ecosystem} • {rule.plugin.name}
        </Typography>
        <Typography variant="h5" component="div">
          {detailed && rule.name}
          {!detailed && (
            <Link href={rule.links.us} underline="none">
              {rule.name}
            </Link>
          )}{' '}
          {rule.fixable ? '🔧' : ''}
          {rule.hasSuggestions ? '💡' : ''}
          {rule.options ? '⚙️' : ''}
          {rule.requiresTypeChecking ? '💭' : ''}
          {rule.type === 'layout' ? '📏' : ''}
          {rule.type === 'problem' ? '❗' : ''}
          {rule.type === 'suggestion' ? '📖' : ''}
          {rule.deprecated ? '❌' : ''}
        </Typography>
        <Typography
          sx={{ mb: 1.5, fontSize: 14 }}
          color="text.secondary"
        ></Typography>

        <Typography variant="body2">{rule.description}</Typography>
      </CardContent>
      {detailed && (
        <CardActions>
          <Button size="small" href={rule.plugin.links.us}>
            plugin
          </Button>

          <Button size="small" href={rule.links.ruleDoc}>
            Rule Doc
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
