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
import { TableComponents, TableVirtuoso } from 'react-virtuoso';
import React from 'react';

export async function getServerSideProps(context: { query: { q: string } }) {
  const { query } = context;

  // Access individual query parameters
  const { q } = query;

  const plugins = await prisma.plugin.findMany({
    include: {
      rules: true,
      configs: true,
    },
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

type PluginRow = {
  name: string;
  description: string;
  rules: number;
  countStars: number;
  updatedAt: string;
};

interface ColumnData {
  dataKey: keyof PluginRow;
  label: string;
  numeric?: boolean;
}

const columns: ColumnData[] = [
  {
    label: 'Name',
    dataKey: 'name',
  },
  {
    label: 'Description',
    dataKey: 'description',
  },
  {
    label: 'Rules',
    dataKey: 'rules',
    numeric: true,
  },
  {
    label: 'Stars',
    dataKey: 'countStars',
    numeric: true,
  },
  {
    label: 'Last Published',
    dataKey: 'updatedAt',
    numeric: true,
  },
];

const VirtuosoTableComponents: TableComponents<PluginRow> = {
  // eslint-disable-next-line react/display-name
  Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
    <TableContainer component={Paper} {...props} ref={ref} />
  )),
  Table: (props) => (
    <Table
      {...props}
      sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }}
    />
  ),
  TableHead,
  TableRow: ({ item: _item, ...props }) => <TableRow {...props} />,
  // eslint-disable-next-line react/display-name
  TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableBody {...props} ref={ref} />
  )),
};

function fixedHeaderContent() {
  return (
    <TableRow>
      {columns.map((column) => (
        <TableCell
          key={column.dataKey}
          variant="head"
          align={column.numeric || false ? 'right' : 'left'}
          sx={{
            backgroundColor: 'background.paper',
          }}
        >
          {column.label}
        </TableCell>
      ))}
    </TableRow>
  );
}

function rowContent(_index: number, row: PluginRow) {
  return (
    <React.Fragment>
      {columns.map((column) => (
        <TableCell
          key={column.dataKey}
          align={column.numeric || false ? 'right' : 'left'}
        >
          {column.dataKey === 'name' && (
            <Link
              href={`/npm/${encodeURIComponent(row.name)}`}
              underline="none"
            >
              {row.name}
            </Link>
          )}
          {column.dataKey !== 'name' && row[column.dataKey]}
        </TableCell>
      ))}
    </React.Fragment>
  );
}

export default function Plugins({
  data: { plugins },
}: {
  data: { plugins: Plugin[] };
}) {
  const rows = plugins.map((plugin) => ({
    name: plugin.name,
    description: plugin.description,
    rules: plugin.rules.length,
    countStars: plugin.countStars,
    updatedAt: new Date(plugin.updatedAt).toLocaleDateString(),
  }));
  return (
    <div className="bg-gray-100 h-full">
      <Header />

      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 max-w-4xl mx-auto">
        <Paper className="h-screen">
          <TableVirtuoso
            data={rows}
            components={VirtuosoTableComponents}
            fixedHeaderContent={fixedHeaderContent}
            itemContent={rowContent}
          />
        </Paper>
        {/* <TableContainer component={Paper}>
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
        </TableContainer> */}
      </main>
    </div>
  );
}
