import Footer from '@/components/Footer';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  TextField,
  Typography,
} from '@mui/material';
import Head from 'next/head';
import { useState } from 'react';
import { api } from '@/utils/api';

export default function Waitlist() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const waitlistJoinMutation = api.userWaitlist.join.useMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await waitlistJoinMutation.mutateAsync({ email });

    setSubmitted(true);
  };

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>Lintbase Waitlist</title>
        <meta property="og:title" content="Lintbase Waitlist" key="title" />
      </Head>
      <main className="py-8 px-6 max-w-4xl mx-auto min-h-screen">
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises*/}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent>
              <Typography variant="h6" marginBottom={2}>
                Join the waitlist
              </Typography>
              <p>
                Powerful new features and streamlined developer experience
                workflows await.
              </p>
              <br />
              <div>
                {submitted ? (
                  <Typography>Thanks for joining!</Typography>
                ) : (
                  <TextField
                    label="Email"
                    type="email"
                    variant="outlined"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    sx={{ width: '300px' }}
                  />
                )}
              </div>
            </CardContent>
            {!submitted && (
              <CardActions>
                <Button type="submit">Join</Button>
              </CardActions>
            )}
          </Card>
        </form>

        <Footer />
      </main>
    </div>
  );
}
