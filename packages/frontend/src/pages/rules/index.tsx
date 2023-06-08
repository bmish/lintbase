import Header from '@/components/Header';
import { Rule } from '@/types';
import {
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { prisma } from '@/server/db';
import { fixRule } from '@/utils';

export async function getServerSideProps(context: { query: { q: string } }) {
  const { query } = context;

  // Access individual query parameters
  const { q } = query;

  const rules = await prisma.rule.findMany({
    include: {
      plugin: true,
    },
    take: 50,
    where: q
      ? {
          OR: [
            {
              name: {
                contains: q,
              },
            },
            {
              description: {
                contains: q,
              },
            },
          ],
        }
      : {},
  });
  const rulesFixed = await rules.map((rule) => fixRule(rule));

  return {
    props: { data: { rules: rulesFixed } },
  };
}

export default function Rules({
  data: { rules },
}: {
  data: { rules: Rule[] };
}) {
  return (
    <div className="bg-gray-100 h-full">
      <Header />

      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 mx-auto">
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell scope="col">Name</TableCell>
                <TableCell scope="col" align="left">
                  Description
                </TableCell>
                <TableCell scope="col" align="right">
                  🔧
                </TableCell>
                <TableCell scope="col" align="right">
                  💡
                </TableCell>
                <TableCell scope="col" align="right">
                  Updated
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow
                  key={`${rule.plugin.name}/${rule.name}`}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell scope="row">
                    <Link
                      href={`/npm/${encodeURIComponent(
                        rule.plugin.name
                      )}/${encodeURIComponent(rule.name)}`}
                      underline="none"
                    >
                      {rule.name}
                    </Link>
                  </TableCell>
                  <TableCell align="left">{rule.description}</TableCell>
                  <TableCell align="right">
                    {rule.fixable ? '🔧' : ''}
                  </TableCell>
                  <TableCell align="right">
                    {rule.hasSuggestions ? '💡' : ''}
                  </TableCell>
                  <TableCell align="right">
                    {new Date(rule.updatedAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </main>
    </div>
  );
}
