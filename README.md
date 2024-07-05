# Lintbase

Lintbase is *npm for linters*.

Instead of searching disparate GitHub repositories and package READMEs for relevant linting to apply to your codebases, we aggregate thousands of linters in one place, exposing rich information about lint rules and configurations in a standard format.

## Status

This is currently a historical archive of the code behind lintbase.com with the UI viewable as [screenshots](./screenshots/).

## Setup

This is built as a full-stack Next.js / [T3](https://create.t3.gg/) app.

1. Clone the repository
1. Run `npm install` to install dependencies
1. Create `.env` from `.env.example`

### Setup the database

1. Create a database named `lintbase` with this Mac app: <https://www.postgresql.org/>
1. Fill in the database URL in `.env`, something like this:

   ```pt
   DATABASE_URL="postgresql://postgres:password@localhost:5432/lintbase"
   ```

View and manage the contents of the database with either of these tools:

- <https://www.pgadmin.org/>
- `npm exec prisma studio`

Run this command to push changes from `schema.prisma` to the database:

```pt
npm exec prisma db push
```

### Populate the database

Visit <http://localhost:3000/api/package-download> to download lint packages locally.

Visit <http://localhost:3000/api/package-load> to load downloaded lint packages into the database.

**TODO**: these APIs are currently broken.

## Usage

1. Start the local database with this Mac app: <https://www.postgresql.org/>
1. Run the development server:

   ```sh
   npm run dev
   ```

1. Visit: <http://localhost:3000/>

## Suggested VSCode extensions

Lint

- eslint
- prettier
- stylelint
- Markdownlint
- Markdown all in one
- Code spell checker
- npm intellisense

Git

- GitLens
- Git history

Testing

- jest

Utilities

- Sort lines
- Rainbow CSV

AI

- GitHub Copilot (and login to it)

T3 stack

- Tailwind CSS intellisense
- Prisma
