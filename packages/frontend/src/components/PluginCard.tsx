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
            <Link href={plugin.linkUs} underline="none">
              {plugin.name}
            </Link>
          )}
        </Typography>
        <div className="mb-4">
          <Typography sx={{ fontSize: 14 }} color="text.secondary">
            {plugin.configs.length > 0 &&
              `${plugin.configs.length} Config${
                plugin.configs.length > 1 ? 's' : ''
              } • `}
            {plugin.rules.length > 0 &&
              `${plugin.rules.length} Rule${
                plugin.rules.length > 1 ? 's' : ''
              } • `}
            {plugin.countWeeklyDownloads} Weekly Downloads
          </Typography>
          {detailed && plugin.keywords && plugin.keywords.length > 0 && (
            <Typography sx={{ fontSize: 14 }} color="text.secondary">
              {plugin.keywords.map((obj) => obj.keyword).join(' • ')}
            </Typography>
          )}
        </div>

        <Typography variant="body2">{plugin.description}</Typography>
      </CardContent>
      {detailed && (
        <CardActions>
          {plugin.linkReadme && (
            <Button size="small" href={plugin.linkReadme}>
              README
            </Button>
          )}

          <Button size="small" href={plugin.linkPackageRegistry}>
            {plugin.linkPackageRegistry.startsWith('https://www.npmjs.com/')
              ? 'npm'
              : 'Package Registry'}
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
