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
  packageToLinkUs,
} from '@/utils/dynamic-fields';
import { Prisma } from '@prisma/client';

export default function LintFrameworkTable({
  lintFrameworks,
  ruleCounts,
  linterCounts,
}: {
  lintFrameworks: Prisma.LintFrameworkGetPayload<{
    include: {
      linter: { include: { package: true } };
      ecosystem: true;
    };
  }>[];
  ruleCounts: number[];
  linterCounts: number[];
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
            <TableCell scope="col" align="right">
              Plugins
            </TableCell>
            <TableCell scope="col" align="right">
              Rules
            </TableCell>
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
          {lintFrameworks.map((lintFramework, index) => (
            <TableRow
              key={lintFramework.name}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell scope="row">
                {ruleCounts[index] === 0 &&
                  linterCounts[index] === 0 &&
                  lintFramework.linter?.package && (
                    <Link
                      href={packageToLinkUs(lintFramework.linter?.package)}
                      underline="none"
                    >
                      {lintFramework.name}
                    </Link>
                  )}
                {(ruleCounts[index] > 0 || linterCounts[index] > 0) && (
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
              {ruleCounts[index] === 0 && linterCounts[index] === 0 && (
                <TableCell scope="row" align="right" colSpan={2}>
                  Coming Soon
                </TableCell>
              )}
              {(ruleCounts[index] > 0 || linterCounts[index] > 0) && (
                <TableCell scope="row" align="right">
                  {millify(linterCounts[index])}
                </TableCell>
              )}
              {(ruleCounts[index] > 0 || linterCounts[index] > 0) && (
                <TableCell scope="row" align="right">
                  {millify(ruleCounts[index])}
                </TableCell>
              )}
              <TableCell scope="row" align="right">
                {lintFramework.linter &&
                  lintFramework.linter.package.countDownloadsThisWeek &&
                  millify(lintFramework.linter.package.countDownloadsThisWeek)}
              </TableCell>
              <TableCell align="right">
                {lintFramework.linter &&
                  lintFramework.linter.package.packageUpdatedAt && (
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
