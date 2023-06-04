/* eslint filenames/match-exported:"off",unicorn/filename-case:"off" */
import Header from '@/components/Header';
import PluginCard from '@/components/PluginCard';
import { useRouter } from 'next/router';
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
import { getPlugins } from '@/utils';
import { Plugin as PluginType } from '@/types';

interface IQueryParam {
  pluginId: string;
}

export function getServerSideProps() {
  const plugins = getPlugins();

  return {
    props: {
      data: {
        plugins,
      },
    },
  };
}

export default function Plugin({
  data: { plugins },
}: {
  data: { plugins: PluginType[] };
}) {
  const router = useRouter();
  const { pluginId } = router.query as unknown as IQueryParam;

  const plugin = plugins.find((plugin) => plugin.name === pluginId);

  return (
    <div className="bg-gray-100 h-full">
      <Header />

      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 max-w-4xl mx-auto">
        {plugin && <PluginCard plugin={plugin} detailed={true}></PluginCard>}

        {plugin && plugin.configs.length > 0 && (
          <TableContainer component={Paper} className="mt-8">
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell scope="col">Configuration</TableCell>
                  <TableCell scope="col" align="right">
                    Description
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plugin.configs.map((config) => (
                  <TableRow
                    key={`${plugin.name}/${config.name}`}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {config.name}
                    </TableCell>
                    <TableCell align="right">{config.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {plugin && plugin.rules.length > 0 && (
          <TableContainer component={Paper} className="mt-8">
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell scope="col">Rule</TableCell>
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
                {plugin.rules.map((rule) => (
                  <TableRow
                    key={`${rule.plugin.name}/${rule.name}`}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      <Link
                        href={`/npm/${encodeURIComponent(
                          plugin.name
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
        )}
      </main>
    </div>
  );
}
