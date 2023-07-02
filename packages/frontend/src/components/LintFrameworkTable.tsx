import {
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import { format } from 'timeago.js';
import millify from 'millify';
import {
  ecosystemToDisplayName,
  lintFrameworkToLinkUs,
} from '@/utils/dynamic-fields';
import { Prisma } from '@prisma/client';

export default function LintFrameworkTable({
  lintFrameworks,
  isPreview,
}: {
  lintFrameworks: Prisma.LintFrameworkGetPayload<{
    include: {
      _count: {
        select: { linters: true };
      };
      linter: { include: { package: true } };
      ecosystem: true;
    };
  }>[];
  isPreview?: boolean;
}) {
  return (
    <TableContainer>
      <Table sx={{ minWidth: 650 }} aria-label="linter list">
        <TableHead>
          <TableRow>
            <TableCell scope="col">Name</TableCell>
            <TableCell scope="col">Description</TableCell>
            <TableCell scope="col" align="right">
              Ecosystem
            </TableCell>
            {!isPreview && (
              <TableCell scope="col" align="right">
                Plugins
              </TableCell>
            )}
            <TableCell scope="col" align="right">
              Wkly
              <GetAppIcon fontSize="inherit" titleAccess="Downloads" />
            </TableCell>
            <TableCell scope="col" align="right">
              Published
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lintFrameworks.map((lintFramework) => (
            <TableRow
              key={lintFramework.name}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell scope="row">
                {isPreview ? (
                  <span>{lintFramework.name}</span>
                ) : (
                  <Link
                    href={lintFrameworkToLinkUs(lintFramework)}
                    underline="none"
                  >
                    {lintFramework.name}
                  </Link>
                )}
              </TableCell>

              <TableCell scope="row">
                {lintFramework.linter?.package.description}
              </TableCell>
              <TableCell scope="row" align="right">
                {ecosystemToDisplayName(lintFramework.ecosystem)}
              </TableCell>
              {!isPreview && (
                <TableCell scope="row" align="right">
                  {millify(lintFramework._count.linters)}
                </TableCell>
              )}
              <TableCell scope="row" align="right">
                {lintFramework.linter &&
                  millify(lintFramework.linter.package.countWeeklyDownloads)}
              </TableCell>
              <TableCell align="right">
                {lintFramework.linter && (
                  <time
                    dateTime={new Date(
                      lintFramework.linter.package.packageUpdatedAt
                    ).toISOString()}
                    title={new Date(
                      lintFramework.linter.package.packageUpdatedAt
                    ).toUTCString()}
                  >
                    {format(
                      new Date(lintFramework.linter.package.packageUpdatedAt)
                    )}
                  </time>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
