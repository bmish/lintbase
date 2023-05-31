import { Plugin } from '@/types';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from '@mui/material';

export default function PluginCard({ plugin }: { plugin: Plugin }) {
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          JavaScript
        </Typography>
        <Typography variant="h5" component="div">
          {plugin.name}
        </Typography>
        <Typography sx={{ mb: 1.5, fontSize: 14 }} color="text.secondary">
          {plugin.rules.length} Rules • {plugin.stats.stars} Stars •{' '}
          {plugin.stats.weeklyDownloads} Weekly Downloads
        </Typography>

        <Typography variant="body2">{plugin.description}</Typography>
      </CardContent>
      <CardActions>
        <Button size="small" href={plugin.links.us}>
          README
        </Button>
      </CardActions>
    </Card>
  );
}
