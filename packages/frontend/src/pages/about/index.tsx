import Footer from '@/components/Footer';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  Typography,
} from '@mui/material';
import Head from 'next/head';

export default function About() {
  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>LintBase About</title>
        <meta property="og:title" content="LintBase About" key="title" />
      </Head>
      <main className="py-8 px-6 max-w-4xl mx-auto min-h-screen">
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" marginBottom={2}>
                  Message us
                </Typography>
                <p>
                  Bug reports, suggestions for additional linters to support,
                  etc...
                </p>
              </CardContent>
              <CardActions>
                <Button href="mailto:info@lintbase.com">Email</Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" marginBottom={2}>
                  Sign up for announcements
                </Typography>
                <p>Hear about our latest developments...</p>
              </CardContent>
              <CardActions>
                <Button href="https://docs.google.com/forms/d/e/1FAIpQLSfc5yLA4DVIYsNAQVc-I-0By0fizM1gxJ96YjP23oVHg7Ku5A/viewform">
                  Sign up
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        <Footer />
      </main>
    </div>
  );
}
