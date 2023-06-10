/* eslint filenames/match-exported:"off",unicorn/filename-case:"off" */
import PluginCard from '@/components/PluginCard';
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
import { Plugin as PluginType } from '@/utils/types';
import { prisma } from '@/server/db';
import { fixPlugin } from '@/utils/normalize';
import { ruleToLinkUs } from '@/utils/dynamic-fields';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';

interface IQueryParam {
  pluginId: string;
}

export async function getServerSideProps({ params }: { params: IQueryParam }) {
  const { pluginId } = params;

  const plugin = await prisma.plugin.findFirstOrThrow({
    where: {
      name: pluginId,
    },
    include: {
      rules: true,
      configs: true,
      keywords: true,
      versions: true,
    },
  });
  const pluginFixed = fixPlugin(plugin);

  return {
    props: { data: { plugin: pluginFixed } },
  };
}

export default function Plugin({
  data: { plugin },
}: {
  data: { plugin: PluginType };
}) {
  return (
    <div className="bg-gray-100 h-full">
      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 mx-auto min-h-screen">
        {plugin && <PluginCard plugin={plugin} detailed={true}></PluginCard>}

        {plugin && plugin.configs.length > 0 && (
          <TableContainer component={Paper} className="mt-8">
            <Table sx={{ minWidth: 650 }} aria-label="plugin config list">
              <TableHead>
                <TableRow>
                  <TableCell scope="col">Configuration</TableCell>
                  {/* <TableCell scope="col" align="right">
                    Description
                  </TableCell> */}
                </TableRow>
              </TableHead>
              <TableBody>
                {plugin.configs.map((config) => (
                  <TableRow
                    key={`${plugin.name}/${config.name}`}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell scope="row">{config.name}</TableCell>
                    {/* <TableCell align="right">{config.description}</TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {plugin && plugin.rules.length > 0 && (
          <TableContainer component={Paper} className="mt-8">
            <Table sx={{ minWidth: 650 }} aria-label="plugin rule list">
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
                    key={`${plugin.name}/${rule.name}`}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell scope="row">
                      <Link href={ruleToLinkUs(rule, plugin)} underline="none">
                        {rule.name}
                      </Link>
                    </TableCell>
                    <TableCell align="left">
                      {rule.description && (
                        // eslint-disable-next-line react/no-children-prop -- false positive
                        <ReactMarkdown children={rule.description} />
                      )}
                    </TableCell>
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
