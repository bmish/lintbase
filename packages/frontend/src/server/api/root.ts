import { repositoryRouter } from '@/server/api/routers/repository';
import { userWaitlistRouter } from '@/server/api/routers/user-waitlist';
import { createTRPCRouter } from '@/server/api/trpc';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  repository: repositoryRouter,
  userWaitlist: userWaitlistRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
