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
  Typography,
} from '@mui/material';
import millify from 'millify';
import GetAppIcon from '@mui/icons-material/GetApp';
import { Prisma } from '@prisma/client';
import { format } from 'timeago.js';
import EmojiAi from './EmojiAi';

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
  detailed = false,
}: {
  linter: Prisma.LinterGetPayload<{
    include: {
      package: {
        include: {
          keywords: true;
          ecosystem: true;
          versions: {
            include: {
              tags: true;
            };
          };
          deprecatedReplacements: true;
        };
      };
      configs: true;
      rules: true;
      lintFramework: true;
      lintees: true;
    };
  }>;
  detailed?: boolean;
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

  return (
    <Card>
      <CardContent>
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

        <Typography variant="h5" component="div">
          {detailed && linter.package.name}
          {detailed && linter.package.deprecated && ' '}
          {detailed && linter.package.deprecated && (
            <Chip
              color="error"
              label="Deprecated"
              title={linter.package.deprecatedReason || ''}
            />
          )}
          {detailed && linter.package.deprecatedReplacements.length > 0 && ' '}
          {detailed &&
            linter.package.deprecatedReplacements.map((replacementPackage) => (
              <Link
                key={replacementPackage.id}
                href={packageToLinkUs(replacementPackage)}
              >
                <Chip color="success" label={replacementPackage.name} />
              </Link>
            ))}
          {!detailed && (
            <Link href={packageToLinkUs(linter.package)} underline="none">
              {linter.package.name}
            </Link>
          )}
        </Typography>

        <div className="mb-4">
          <Typography sx={{ fontSize: 14 }} color="text.secondary">
            {linter.configs.length > 0 &&
              `${linter.configs.length} Config${
                linter.configs.length > 1 ? 's' : ''
              } • `}
            {linter.rules.length > 0 &&
              `${linter.rules.length} Rule${
                linter.rules.length > 1 ? 's' : ''
              } • `}
            {millify(linter.package.countWeeklyDownloads)} Wkly{' '}
            <GetAppIcon fontSize="inherit" titleAccess="Downloads" />
            {versionToDisplay && ' • '}
            {versionToDisplay && (
              <time
                dateTime={new Date(versionToDisplay.publishedAt).toISOString()}
                title={new Date(versionToDisplay.publishedAt).toUTCString()}
              >
                {format(new Date(versionToDisplay.publishedAt))}
              </time>
            )}
            {detailed && versionToDisplay && ' • '}
            {detailed && versionToDisplay && (
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
            )}
          </Typography>
          {detailed &&
            linter.package.keywords &&
            linter.package.keywords.length > 0 &&
            !linter.package.keywords.every((obj) =>
              linter.package.name.includes(obj.name)
            ) && (
              <Typography sx={{ fontSize: 14 }} color="text.secondary">
                {linter.package.keywords.map((obj) => obj.name).join(' • ')}
              </Typography>
            )}
        </div>

        <Typography variant="body2">{linter.package.description}</Typography>

        {detailed && linter.descriptionAI && (
          <div className="flex flex-row mt-4">
            <Typography variant="body2" component={'p'}>
              <EmojiAi /> {linter.descriptionAI}
            </Typography>
          </div>
        )}
      </CardContent>
      {detailed && (
        <CardActions>
          {linter.package.linkHomepage && (
            <Button size="small" href={linter.package.linkHomepage}>
              {['readme', 'github.com'].some(
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

          <Button
            size="small"
            href={linterToLinkPackageRegistry(linter.package)}
          >
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
    </Card>
  );
}
