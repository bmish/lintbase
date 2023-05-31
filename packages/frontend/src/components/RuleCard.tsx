import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from '@mui/material';
import { Rule } from '@/types';

export default function RuleCard({ rule }: { rule: Rule }) {
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          {rule.ecosystem} • {rule.plugin.name}
        </Typography>
        <Typography variant="h5" component="div">
          {rule.name} {rule.fixable ? '🔧' : ''}
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
      <CardActions>
        <Button size="small" href={rule.plugin.links.us}>
          plugin
        </Button>
        <Button size="small" href={rule.links.us}>
          rule doc
        </Button>
      </CardActions>
    </Card>
  );
}
