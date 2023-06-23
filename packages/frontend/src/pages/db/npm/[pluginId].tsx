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
import { prisma } from '@/server/db';
import { fixPlugin } from '@/utils/normalize';
import { ruleToLinkUs } from '@/utils/dynamic-fields';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import { EMOJI_CONFIGS } from '@/utils/eslint';
import { Prisma } from '@prisma/client';
import Head from 'next/head';
import EmojiHasSuggestions from '@/components/EmojiHasSuggestions';
import EmojiFixable from '@/components/EmojiFixable';
import EmojiRequiresTypeChecking from '@/components/EmojiRequiresTypeChecking';
import EmojiTypeLayout from '@/components/EmojiTypeLayout';
import EmojiTypeProblem from '@/components/EmojiTypeProblem';
import EmojiTypeSuggestion from '@/components/EmojiTypeSuggestion';
import EmojiOptions from '@/components/EmojiOptions';
import EmojiDeprecated from '@/components/EmojiDeprecated';
import EmojiType from '@/components/EmojiType';
import EmojiSeverityWarn from '@/components/EmojiSeverityWarn';
import EmojiSeverityOff from '@/components/EmojiSeverityOff';
import Footer from '@/components/Footer';

interface IQueryParam {
  pluginId: string;
}

const include = {
  rules: {
    orderBy: {
      name: Prisma.SortOrder.asc,
    },
    include: {
      options: true,
      ruleConfigs: {
        include: {
          config: true,
        },
      },
    },
  },
  configs: {
    orderBy: {
      name: Prisma.SortOrder.asc,
    },
  },
  keywords: true,
};

export async function getServerSideProps({ params }: { params: IQueryParam }) {
  const { pluginId } = params;

  const plugin = await prisma.plugin.findFirstOrThrow({
    where: {
      name: pluginId,
    },
    include,
  });
  const pluginFixed = fixPlugin(plugin);

  return {
    props: { data: { plugin: pluginFixed } },
  };
}
export default function Plugin({
  data: { plugin },
}: {
  data: {
    plugin: Prisma.PluginGetPayload<{ include: typeof include }>;
  };
}) {
  const relevantConfigEmojis = Object.entries(EMOJI_CONFIGS).filter(
    ([config]) =>
      plugin.configs.some((pluginConfig) => config === pluginConfig.name)
  );

  return (
    <div className="bg-gray-100 h-full">
      <Head>
        <title>LintBase: {plugin.name}</title>
        <meta
          property="og:title"
          content={`LintBase: ${plugin.name}`}
          key="title"
        />
      </Head>
      <main className="flex-grow overflow-y-auto bg-gray-100 pt-8 px-6 mx-auto min-h-screen">
        {plugin && <PluginCard plugin={plugin} detailed={true}></PluginCard>}

        {plugin && plugin.configs.length > 0 && (
          <TableContainer component={Paper} className="mt-8">
            <Table sx={{ minWidth: 650 }} aria-label="plugin config list">
              <TableHead>
                <TableRow>
                  <TableCell scope="col" colSpan={2}>
                    Configuration
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plugin.configs.map((config) => (
                  <TableRow
                    key={`${plugin.name}/${config.name}`}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell scope="row">{config.name}</TableCell>
                    <TableCell align="right" title={config.name}>
                      {
                        relevantConfigEmojis.find(
                          ([commonConfig]) => commonConfig === config.name
                        )?.[1]
                      }
                    </TableCell>
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
                    <EmojiFixable />
                  </TableCell>
                  <TableCell scope="col" align="right">
                    <EmojiHasSuggestions />
                  </TableCell>
                  <TableCell scope="col" align="right">
                    <EmojiRequiresTypeChecking />
                  </TableCell>
                  <TableCell scope="col" align="right">
                    <EmojiType />
                  </TableCell>
                  <TableCell scope="col" align="right">
                    <EmojiOptions />
                  </TableCell>
                  <TableCell scope="col" align="right">
                    <EmojiDeprecated />
                  </TableCell>
                  {relevantConfigEmojis.map(([config, emoji]) => (
                    <TableCell
                      key={config}
                      align="right"
                      title={`Config: ${config}`}
                    >
                      {emoji}
                    </TableCell>
                  ))}
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
                      {rule.fixable ? <EmojiFixable /> : ''}
                    </TableCell>
                    <TableCell align="right">
                      {rule.hasSuggestions ? <EmojiHasSuggestions /> : ''}
                    </TableCell>
                    <TableCell align="right">
                      {rule.requiresTypeChecking ? (
                        <EmojiRequiresTypeChecking />
                      ) : (
                        ''
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {rule.type === 'layout' ? <EmojiTypeLayout /> : ''}
                      {rule.type === 'problem' ? <EmojiTypeProblem /> : ''}
                      {rule.type === 'suggestion' ? (
                        <EmojiTypeSuggestion />
                      ) : (
                        ''
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {rule.options.length > 0 ? <EmojiOptions /> : ''}
                    </TableCell>
                    <TableCell align="right">
                      {rule.deprecated ? <EmojiDeprecated /> : ''}
                    </TableCell>
                    {relevantConfigEmojis.map(([config, emoji]) => (
                      <TableCell key={config} align="right">
                        {rule.ruleConfigs.some(
                          (ruleConfig) =>
                            ruleConfig.config.name === config &&
                            ruleConfig.severity === 'error'
                        ) ? (
                          <span title={`Errors in ${config}`}>{emoji}</span>
                        ) : (
                          ''
                        )}
                        {rule.ruleConfigs.some(
                          (ruleConfig) =>
                            ruleConfig.config.name === config &&
                            ruleConfig.severity === 'warn'
                        ) ? (
                          <EmojiSeverityWarn config={config} />
                        ) : (
                          ''
                        )}
                        {rule.ruleConfigs.some(
                          (ruleConfig) =>
                            ruleConfig.config.name === config &&
                            ruleConfig.severity === 'off'
                        ) ? (
                          <EmojiSeverityOff config={config} />
                        ) : (
                          ''
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Footer />
      </main>
    </div>
  );
}
