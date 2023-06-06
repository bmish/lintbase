import Header from '@/components/Header';
import { Plugin } from '@/types';
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

export async function getStaticProps() {
  const plugins = await prisma.plugin.findMany({
    include: {
      rules: true,
      configs: true,
    },
  });
  const pluginsFixed = await plugins.map((plugin) => {
    return {
      ...plugin,
      rules: plugin.rules.map((rule) => ({
        ...rule,
        createdAt: rule.createdAt.toISOString(), // Since DataTime can't be serialized by next.
        updatedAt: rule.updatedAt.toISOString(), // Since DataTime can't be serialized by next.
        linkUs: `/npm/${encodeURIComponent(plugin.name)}/${encodeURIComponent(
          rule.name
        )}`,
      })),
      linkUs: `/npm/${encodeURIComponent(plugin.name)}`,
      createdAt: plugin.createdAt.toISOString(), // Since DataTime can't be serialized by next.
      updatedAt: plugin.updatedAt.toISOString(), // Since DataTime can't be serialized by next.
    };
  });

  return {
    props: { data: { plugins: pluginsFixed } },
  };
}

export default function Plugins({
  data: { plugins },
}: {
  data: { plugins: Plugin[] };
}) {
  return (
    <div className="bg-gray-100 h-full">
      <Header />

      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 max-w-4xl mx-auto">
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell scope="col">Name</TableCell>
                <TableCell scope="col" align="left">
                  Description
                </TableCell>
                <TableCell scope="col" align="right">
                  Rules
                </TableCell>
                <TableCell scope="col" align="right">
                  Stars
                </TableCell>
                <TableCell scope="col" align="right">
                  Last Published
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plugins.map((plugin) => (
                <TableRow
                  key={plugin.name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell scope="row">
                    <Link
                      href={`/npm/${encodeURIComponent(plugin.name)}`}
                      underline="none"
                    >
                      {plugin.name}
                    </Link>
                  </TableCell>
                  <TableCell align="left">{plugin.description}</TableCell>
                  <TableCell align="right">{plugin.rules.length}</TableCell>
                  <TableCell align="right">{plugin.countStars}</TableCell>
                  <TableCell align="right">
                    {new Date(plugin.updatedAt).toLocaleDateString()}
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
