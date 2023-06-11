import {
  pluginToLinkPackageRegistry,
  pluginToLinkUs,
} from '@/utils/dynamic-fields';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Link,
  Typography,
} from '@mui/material';
import millify from 'millify';
import GetAppIcon from '@mui/icons-material/GetApp';
import { Prisma } from '@prisma/client';

export default function PluginCard({
  plugin,
  detailed = false,
}: {
  plugin: Prisma.PluginGetPayload<{
    include: { configs: true; keywords: true; rules: true };
  }>;
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
            <Link href={pluginToLinkUs(plugin)} underline="none">
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
            {millify(plugin.countWeeklyDownloads)} Wkly{' '}
            <GetAppIcon fontSize="inherit" />
          </Typography>
          {detailed &&
            plugin.keywords &&
            plugin.keywords.length > 0 &&
            !plugin.keywords.every((obj) => plugin.name.includes(obj.name)) && (
              <Typography sx={{ fontSize: 14 }} color="text.secondary">
                {plugin.keywords.map((obj) => obj.name).join(' • ')}
              </Typography>
            )}
        </div>

        <Typography variant="body2">{plugin.description}</Typography>
      </CardContent>
      {detailed && (
        <CardActions>
          {plugin.linkHomepage && (
            <Button size="small" href={plugin.linkHomepage}>
              {['readme', 'github.com'].some(
                (str) =>
                  plugin.linkHomepage &&
                  plugin.linkHomepage.toLowerCase().includes(str)
              )
                ? 'README'
                : 'Homepage'}
            </Button>
          )}

          {plugin.linkBugs && plugin.linkBugs !== plugin.linkHomepage && (
            <Button size="small" href={plugin.linkBugs}>
              Bugs
            </Button>
          )}

          <Button size="small" href={pluginToLinkPackageRegistry(plugin)}>
            {pluginToLinkPackageRegistry(plugin).startsWith(
              'https://www.npmjs.com/'
            )
              ? 'npm'
              : 'Package Registry'}
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
