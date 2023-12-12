import Footer from '@/components/Footer';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from '@mui/material';
import Head from 'next/head';
import Link from 'next/link';

export default function About() {
  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>Lintbase About</title>
        <meta property="og:title" content="Lintbase About" key="title" />
      </Head>
      <main className="py-8 px-6 max-w-4xl mx-auto min-h-screen">
        <Card>
          <CardContent>
            <Typography variant="h5" marginBottom={2}>
              About
            </Typography>
            <p>
              Lintbase is <i>npm for linters</i>.
            </p>
            <p className="mt-4">
              Instead of searching disparate GitHub repositories and package
              READMEs for relevant linting to apply to your codebases, we
              aggregate thousands of linters in one place, exposing rich
              information about lint rules and configurations in a standard
              format.
            </p>
            <p className="mt-4">
              We are currently focusing on ESLint for
              JavaScript/TypeScript/Node, but will later expand to other linters
              and languages.
            </p>
            <p className="mt-4">
              For ESLint plugin authors, we also recommended setting up{' '}
              <Link href="https://github.com/bmish/eslint-doc-generator">
                eslint-doc-generator
              </Link>{' '}
              to improve the documentation files stored inside your repository.
            </p>
            <p className="mt-4">
              Join our <Link href="/waitlist/">mailing list</Link> to stay
              up-to-date with new features, early access, and other
              announcements.
            </p>
          </CardContent>
        </Card>

        <Card className=" mt-8">
          <CardContent>
            <Typography variant="h5" marginBottom={2}>
              Message us
            </Typography>
            <p>Feedback, bug reports, suggestions, etc...</p>
          </CardContent>
          <CardActions>
            <Button href="mailto:info@lintbase.com">Email</Button>
          </CardActions>
        </Card>

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
