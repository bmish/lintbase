import { Plugin } from '@/types';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Link,
  Typography,
} from '@mui/material';

export default function PluginCard({
  plugin,
  detailed = false,
}: {
  plugin: Plugin;
  detailed?: boolean;
}) {
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          {plugin.ecosystem === 'node' ? 'Node.js' : plugin.ecosystem} •{' '}
          {plugin.linter === 'eslint' ? 'ESLint' : plugin.linter}
        </Typography>
        <Typography variant="h5" component="div">
          {detailed && plugin.name}
          {!detailed && (
            <Link href={plugin.links.us} underline="none">
              {plugin.name}
            </Link>
          )}
        </Typography>
        <Typography sx={{ mb: 1.5, fontSize: 14 }} color="text.secondary">
          {plugin.rules.length} Rules • {plugin.stats.stars} Stars •{' '}
          {plugin.stats.weeklyDownloads} Weekly Downloads
        </Typography>

        <Typography variant="body2">{plugin.description}</Typography>
      </CardContent>
      {detailed && (
        <CardActions>
          <Button size="small" href={plugin.links.readme}>
            README
          </Button>

          <Button size="small" href={plugin.links.packageRegistry}>
            Package Registry
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
