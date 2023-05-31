import Header from '@/components/Header';
import RuleCard from '@/components/RuleCard';
import { FAKE_PLUGINS } from '@/data';
import { Grid } from '@mui/material';

export default function Rules() {
  const rule = FAKE_PLUGINS[0].rules[0];
  return (
    <div className="bg-gray-100 h-min">
      <Header />

      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 max-w-4xl mx-auto">
        <Grid container spacing={2}>
          <Grid item xs={8}>
            <RuleCard rule={rule}></RuleCard>
          </Grid>
          <Grid item xs={8}>
            <RuleCard rule={rule}></RuleCard>
          </Grid>
          <Grid item xs={8}>
            <RuleCard rule={rule}></RuleCard>
          </Grid>
          <Grid item xs={8}>
            <RuleCard rule={rule}></RuleCard>
          </Grid>
          <Grid item xs={8}>
            <RuleCard rule={rule}></RuleCard>
          </Grid>
        </Grid>
      </main>
    </div>
  );
}
