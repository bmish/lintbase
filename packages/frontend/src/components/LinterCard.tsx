import {
  ecosystemToDisplayName,
  lintFrameworkToLinkUs,
  lintFrameworkToDisplayName,
  linterToLinkPackageRegistry,
  packageToLinkUs,
} from '@/utils/dynamic-fields';
import {
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Link,
  Paper,
  Typography,
} from '@mui/material';
import millify from 'millify';
import GetAppIcon from '@mui/icons-material/GetApp';
import { Prisma } from '@prisma/client';
import { format } from 'timeago.js';
import EmojiAi from './EmojiAi';
import StarIcon from '@mui/icons-material/Star';
import prettyBytes from 'pretty-bytes';
import { ContentCopy } from '@mui/icons-material';
import { semverPretty } from '@/utils/npm';
import Image from 'next/image';

function getRepositoryLink(linkRepository: string | null): string | undefined {
  if (!linkRepository) {
    return undefined;
  }
  if (
    linkRepository.includes('github:') ||
    /^\w+\/\w+$/u.test(linkRepository)
  ) {
    return `https://github.com/${linkRepository.replace('github:', '')}`;
  }
  if (
    linkRepository.startsWith('https://') &&
    linkRepository.endsWith('.git')
  ) {
    return linkRepository.replace('.git', '');
  }
  return undefined;
}

// eslint-disable-next-line complexity
export default function LinterCard({
  linter,
  userId = undefined, // eslint-disable-line unicorn/no-useless-undefined
  detailed = false,
  lintersRelated = undefined, // eslint-disable-line unicorn/no-useless-undefined
}: {
  linter: Prisma.LinterGetPayload<{
    include: {
      package: {
        include: {
          keywords: true;
          ecosystem: true;
          engines: true;
          peerDependencies: true;
          versions: {
            include: {
              tags: true;
            };
          };
          deprecatedReplacements: true;
          repository: { include: { stars: true; topics: true } };
        };
      };
      configs: true;
      rules: true;
      processors: true;
      lintFramework: true;
      lintees: true;
    };
  }>;
  detailed?: boolean;
  userId?: string | undefined;
  lintersRelated?:
    | Prisma.LinterGetPayload<{ include: { package: true } }>[]
    | undefined;
}) {
  const repositoryLink = getRepositoryLink(linter.package.linkRepository);
  const versionToDisplay =
    linter.package.versions.length === 0
      ? undefined
      : linter.package.versions.find((version) =>
          version.tags.some((tag) => tag.name === 'latest')
        ) || linter.package.versions.at(-1);

  const versionLoaded = linter.package.versions.find(
    (version) => version.isLoaded
  );
  const versionLoadedToDisplay =
    versionLoaded &&
    versionToDisplay &&
    versionToDisplay.version !== versionLoaded.version &&
    versionLoaded;

  const keywordsToDisplay = [
    ...new Set(
      [
        ...linter.package.keywords.map((keyword) => keyword.name),
        ...(linter.package.repository?.topics?.map((topic) => topic.name) ||
          []),
      ]
        .sort((a, b) => a.localeCompare(b))
        .filter((keyword) => !linter.package.name.includes(keyword))
    ),
  ];

  return (
    <Card>
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 flex flex-col">
          <CardContent className="flex-1">
            <Breadcrumbs aria-label="breadcrumb" className="mb-1">
              <Typography sx={{ fontSize: 14 }} color="text.secondary">
                {ecosystemToDisplayName(linter.package.ecosystem)}
              </Typography>
              <Link
                underline="hover"
                sx={{ fontSize: 14 }}
                color="text.secondary"
                href={lintFrameworkToLinkUs(linter.lintFramework)}
              >
                {lintFrameworkToDisplayName(linter.lintFramework)}
              </Link>
            </Breadcrumbs>

            <Typography variant={detailed ? 'h5' : 'h6'} component="div">
              {detailed && linter.package.name}{' '}
              {detailed && linter.package.deprecated && (
                <Chip
                  color="error"
                  label="Deprecated"
                  title={linter.package.deprecatedReason || ''}
                />
              )}{' '}
              {detailed &&
                linter.package.deprecatedReplacements.map(
                  (replacementPackage) => (
                    <Link
                      key={replacementPackage.id}
                      href={packageToLinkUs(replacementPackage)}
                    >
                      <Chip color="success" label={replacementPackage.name} />
                    </Link>
                  )
                )}{' '}
              {detailed &&
                linter.package.repository?.stars.find(
                  (star) => star.userId === userId
                ) && <StarIcon titleAccess="Starred by you on GitHub" />}
              {!detailed && (
                <Link href={packageToLinkUs(linter.package)} underline="none">
                  {linter.package.name}
                </Link>
              )}
            </Typography>

            <div className="mb-4">
              <Typography sx={{ fontSize: 14 }} color="text.secondary">
                {!detailed &&
                  linter.configs.length > 0 &&
                  `${linter.configs.length} Config${
                    linter.configs.length > 1 ? 's' : ''
                  }`}
                {!detailed &&
                  linter.configs.length > 0 &&
                  linter.rules.length > 0 &&
                  ' • '}
                {!detailed &&
                  linter.rules.length > 0 &&
                  `${linter.rules.length} Rule${
                    linter.rules.length > 1 ? 's' : ''
                  }`}
                {!detailed && linter.processors.length > 0 && ' • '}
                {!detailed &&
                  linter.processors.length > 0 &&
                  `${linter.processors.length} Processor${
                    linter.processors.length > 1 ? 's' : ''
                  }`}
                {!detailed && linter.package.countDownloadsThisWeek && ' • '}
                {!detailed && linter.package.countDownloadsThisWeek && (
                  <>
                    {millify(linter.package.countDownloadsThisWeek)} Wkly{' '}
                    <GetAppIcon fontSize="inherit" titleAccess="Downloads" />
                  </>
                )}
                {!detailed && versionToDisplay && ' • '}
                {!detailed && versionToDisplay && (
                  <time
                    dateTime={new Date(
                      versionToDisplay.publishedAt
                    ).toISOString()}
                    title={new Date(versionToDisplay.publishedAt).toUTCString()}
                  >
                    {format(new Date(versionToDisplay.publishedAt))}
                  </time>
                )}
              </Typography>
            </div>

            <Typography variant="body2">
              {linter.package.description}
            </Typography>

            {detailed && linter.descriptionAI && (
              <div className="flex flex-row mt-4">
                <Typography variant="body2" component={'p'}>
                  <EmojiAi /> {linter.descriptionAI}
                </Typography>
              </div>
            )}

            {detailed && (
              <div
                className="cursor-pointer text-xs p-2 mt-4 border w-fit"
                onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/no-floating-promises
                  navigator.clipboard.writeText(
                    `npm i --save-dev ${linter.package.name}`
                  );
                }}
              >
                <code className="mr-2">
                  npm i --save-dev {linter.package.name}
                </code>
                <ContentCopy fontSize="small" />
              </div>
            )}
          </CardContent>

          {detailed && (
            <CardActions>
              {linter.package.linkHomepage && (
                <Button size="small" href={linter.package.linkHomepage}>
                  {['readme'].some(
                    (str) =>
                      linter.package.linkHomepage &&
                      linter.package.linkHomepage.toLowerCase().includes(str)
                  )
                    ? 'README'
                    : 'Homepage'}
                </Button>
              )}

              {!linter.package.linkHomepage?.includes('github.com') &&
                repositoryLink && (
                  <Button size="small" href={repositoryLink}>
                    Repository
                  </Button>
                )}

              {linter.package.linkBugs &&
                linter.package.linkBugs !== linter.package.linkHomepage && (
                  <Button size="small" href={linter.package.linkBugs}>
                    Bugs
                  </Button>
                )}

              {linter.package.repository && (
                <Button
                  size="small"
                  href={`https://github.com/${
                    linter.package.repository.fullName.split('/')[0]
                  }/${linter.package.repository.name}`}
                >
                  <Image
                    src="/icon-github.svg"
                    width="12"
                    height="12"
                    alt="GitHub Logo"
                    className="mr-1 center"
                  />
                  GitHub
                </Button>
              )}

              <Button
                size="small"
                href={linterToLinkPackageRegistry(linter.package)}
              >
                {linterToLinkPackageRegistry(linter.package).startsWith(
                  'https://www.npmjs.com/'
                ) && (
                  <Image
                    src="/icon-npm.svg"
                    width="12"
                    height="12"
                    alt="npm Logo"
                    className="mr-1 center"
                  />
                )}
                {linterToLinkPackageRegistry(linter.package).startsWith(
                  'https://www.npmjs.com/'
                )
                  ? 'npm'
                  : 'Package Registry'}
              </Button>

              {linter.lintees.map((lintee) => (
                <Button
                  key={lintee.id}
                  size="small"
                  href={linterToLinkPackageRegistry(lintee)}
                >
                  {lintee.name}
                </Button>
              ))}
            </CardActions>
          )}
        </div>

        {detailed && (
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 m-4">
            {linter &&
              (linter.configs.length > 0 || linter.rules.length > 0) && (
                <Paper className="p-4 border" sx={{ boxShadow: 'none' }}>
                  <Typography variant="button">Linter</Typography>
                  <ul>
                    {linter.configs.length > 0 && (
                      <li>
                        {linter.configs.length} Config
                        {linter.configs.length > 1 ? 's' : ''}
                      </li>
                    )}
                    {linter.rules.length > 0 && (
                      <li>
                        {linter.rules.length} Rule
                        {linter.rules.length > 1 ? 's' : ''}
                      </li>
                    )}
                    {linter.processors.length > 0 && (
                      <li>
                        {linter.processors.length} Processor
                        {linter.processors.length > 1 ? 's' : ''}
                      </li>
                    )}
                  </ul>
                </Paper>
              )}

            {linter.package.repository && (
              <Paper className="p-4 border" sx={{ boxShadow: 'none' }}>
                <Typography variant="button">GitHub</Typography>
                <ul>
                  {linter.package.repository.language && (
                    <li title="Primary language used in repository">
                      {linter.package.repository.language}
                    </li>
                  )}
                  {linter.package.repository.countStargazers &&
                    linter.package.repository.countStargazers > 0 && (
                      <li>
                        {millify(linter.package.repository.countStargazers)}{' '}
                        Stars
                      </li>
                    )}
                  {linter.package.repository.countWatchers &&
                    linter.package.repository.countWatchers > 0 && (
                      <li>
                        {millify(linter.package.repository.countWatchers)}{' '}
                        Watchers
                      </li>
                    )}
                  {linter.package.repository.archived && <li>Archived</li>}
                  {linter.package.repository.fork && <li>Fork</li>}
                  {linter.package.repository.disabled && <li>Disabled</li>}
                </ul>
              </Paper>
            )}

            <Paper className="p-4 border" sx={{ boxShadow: 'none' }}>
              <Typography variant="button">npm</Typography>
              <ul>
                {linter.package.countDownloadsThisWeek &&
                  linter.package.countDownloadsThisWeek > 0 && (
                    <li>
                      {millify(linter.package.countDownloadsThisWeek)} Wkly{' '}
                      <GetAppIcon fontSize="inherit" titleAccess="Downloads" />
                    </li>
                  )}
                {typeof linter.package.percentDownloadsWeekOverWeek ===
                  'number' && (
                  <li title="Change in week-over-week downloads">
                    {linter.package.percentDownloadsWeekOverWeek >= 0
                      ? '+'
                      : ''}
                    {linter.package.percentDownloadsWeekOverWeek}% WoW
                  </li>
                )}
                <li>
                  {versionToDisplay && (
                    <>
                      <span
                        title={[
                          versionToDisplay.tags.length > 0
                            ? `Tags for this version: ${versionToDisplay.tags
                                .map((tag) => tag.name)
                                .join(', ')}`
                            : '',
                          versionLoadedToDisplay
                            ? `Some data from ${versionLoadedToDisplay.version}`
                            : undefined,
                        ]
                          .filter((line) => line !== undefined)
                          .join('\n')}
                      >
                        {versionToDisplay.version}
                      </span>
                      {linter.package.sizeUnpacked && (
                        <span title="Unpacked size">
                          {' '}
                          • {prettyBytes(linter.package.sizeUnpacked)}
                        </span>
                      )}
                    </>
                  )}
                </li>
                <li>
                  {versionToDisplay && (
                    <time
                      dateTime={new Date(
                        versionToDisplay.publishedAt
                      ).toISOString()}
                      title={new Date(
                        versionToDisplay.publishedAt
                      ).toUTCString()}
                    >
                      {format(new Date(versionToDisplay.publishedAt))}
                    </time>
                  )}
                </li>
                <li>
                  {linter.package.packageCreatedAt && (
                    <time
                      dateTime={new Date(
                        linter.package.packageCreatedAt
                      ).toISOString()}
                      title={new Date(
                        linter.package.packageCreatedAt
                      ).toUTCString()}
                    >
                      {format(
                        new Date(linter.package.packageCreatedAt)
                      ).replace('ago', 'old')}
                    </time>
                  )}
                </li>
              </ul>
            </Paper>

            {linter.package.engines.length > 0 && (
              <Paper className="p-4 border" sx={{ boxShadow: 'none' }}>
                <Typography
                  variant="button"
                  title="Engines and peer dependencies"
                >
                  Requirements
                </Typography>
                <ul>
                  {linter.package.engines.map((engine) => (
                    <li key={engine.id}>
                      {engine.name === 'node' ? 'Node' : engine.name}:{' '}
                      <span title={engine.value}>
                        {semverPretty(engine.value)}
                      </span>
                    </li>
                  ))}
                  {linter.package.peerDependencies
                    .slice(0, 4)
                    .map((peerDependency) => (
                      <li key={peerDependency.id}>
                        <span title={peerDependency.name}>
                          {peerDependency.name === 'eslint'
                            ? 'ESLint'
                            : peerDependency.name.length > 20
                            ? `${peerDependency.name.slice(0, 18)}...`
                            : peerDependency.name}
                        </span>
                        :{' '}
                        <span title={peerDependency.value}>
                          {semverPretty(peerDependency.value).length > 20
                            ? `${semverPretty(peerDependency.value).slice(
                                0,
                                18
                              )}...`
                            : semverPretty(peerDependency.value)}
                        </span>
                      </li>
                    ))}
                  {linter.package.peerDependencies.length > 4 && (
                    <li title="Some peer dependencies not shown">...</li>
                  )}
                </ul>
              </Paper>
            )}

            {lintersRelated && lintersRelated.length > 0 && (
              <Paper className="p-4 border" sx={{ boxShadow: 'none' }}>
                <Typography variant="button">Related</Typography>
                <ul>
                  {lintersRelated.map((linterRelated) => (
                    <li key={linterRelated.id}>
                      <Link
                        href={packageToLinkUs(linterRelated.package)}
                        underline="none"
                      >
                        {linterRelated.package.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Paper>
            )}

            {keywordsToDisplay.length > 0 && (
              <Paper className="p-4 border" sx={{ boxShadow: 'none' }}>
                <Typography
                  variant="button"
                  title={keywordsToDisplay.join(', ')}
                >
                  Keywords
                </Typography>
                <ul>
                  {keywordsToDisplay.slice(0, 5).map((keyword) => (
                    <li key={keyword}>{keyword}</li>
                  ))}
                  {keywordsToDisplay.length > 5 && (
                    <li title="Some keywords not shown">...</li>
                  )}
                </ul>
              </Paper>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
