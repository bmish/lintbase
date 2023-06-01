import Header from '@/components/Header';
import { Plugin } from '@/types';
import { getPlugins } from '@/utils';
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

export async function getServerSideProps() {
  const plugins = await getPlugins();

  return {
    props: {
      data: {
        plugins,
      },
    },
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
                <TableCell>Name</TableCell>
                <TableCell align="left">Description</TableCell>
                <TableCell align="right">Rules</TableCell>
                <TableCell align="right">Stars</TableCell>
                <TableCell align="right">Last Published</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plugins.map((plugin) => (
                <TableRow
                  key={plugin.name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <Link href={`/npm/${plugin.name}`} underline="none">
                      {plugin.name}
                    </Link>
                  </TableCell>
                  <TableCell align="left">{plugin.description}</TableCell>
                  <TableCell align="right">{plugin.rules.length}</TableCell>
                  <TableCell align="right">{plugin.stats.stars}</TableCell>
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
