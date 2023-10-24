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
        <title>Lintbase About</title>
        <meta property="og:title" content="Lintbase About" key="title" />
      </Head>
      <main className="py-8 px-6 max-w-4xl mx-auto min-h-screen">
        <Grid container spacing={4}>
          <Grid item xs={12} md={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" marginBottom={2}>
                  Message us
                </Typography>
                <p>
                  Feedback, bug reports, suggestions for additional linters to
                  support, etc...
                </p>
              </CardContent>
              <CardActions>
                <Button href="mailto:info@lintbase.com">Email</Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        <Card className=" mt-8">
          <CardContent>
            <Typography variant="h5" marginBottom={2}>
              Why linting?
            </Typography>
            <div className="  flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
              <div className="md:w-1/3">
                <Typography variant="button" marginBottom={2}>
                  Improve app quality
                </Typography>
                <p className="mt-4 ">
                  Automatically enforce best practices and detect common
                  mistakes, reducing bugs and improving product reliability.
                </p>
              </div>
              <div className="md:w-1/3">
                <Typography variant="button" marginBottom={2}>
                  Boost developer productivity
                </Typography>

                <p className="mt-4 ">
                  Supercharge your workflow with instant feedback and shorter
                  development cycles.
                </p>
              </div>

              <div className="md:w-1/3 ">
                <Typography variant="button" marginBottom={2}>
                  Stay modern and up-to-date
                </Typography>

                <p className="mt-4">
                  Detect and automatically fix usage of deprecated syntax to
                  facilitate dependency, framework, and language upgrades and
                  security patches.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Footer />
      </main>
    </div>
  );
}
