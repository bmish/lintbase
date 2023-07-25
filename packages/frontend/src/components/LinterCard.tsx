import {
  ecosystemToDisplayName,
  lintFrameworkToLinkUs,
  linterToLinkPackageRegistry,
  packageToLinkUs,
} from '@/utils/dynamic-fields';
import {
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  Link,
  Typography,
} from '@mui/material';
import millify from 'millify';
import GetAppIcon from '@mui/icons-material/GetApp';
import { Prisma } from '@prisma/client';
import { format } from 'timeago.js';

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
        };
      };
      configs: true;
      rules: true;
      lintFramework: true;
    };
  }>;
  detailed?: boolean;
}) {
  const repositoryLink = getRepositoryLink(linter.package.linkRepository);

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
            {linter.lintFramework.name === 'eslint'
              ? 'ESLint'
              : linter.lintFramework.name}
          </Link>
        </Breadcrumbs>

        <Typography variant="h5" component="div">
          {detailed && linter.package.name}
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
            <GetAppIcon fontSize="inherit" titleAccess="Downloads" /> •{' '}
            <time
              dateTime={new Date(linter.package.packageUpdatedAt).toISOString()}
              title={new Date(linter.package.packageUpdatedAt).toUTCString()}
            >
              {format(new Date(linter.package.packageUpdatedAt))}
            </time>
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
        </CardActions>
      )}
    </Card>
  );
}
