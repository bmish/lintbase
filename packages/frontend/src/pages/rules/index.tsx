import Header from '@/components/Header';
import { FAKE_PLUGINS } from '@/data';
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

const rules = [
  FAKE_PLUGINS[0].rules[0],
  FAKE_PLUGINS[0].rules[0],
  FAKE_PLUGINS[0].rules[0],
  FAKE_PLUGINS[0].rules[0],
  FAKE_PLUGINS[0].rules[0],
];

export default function Rules() {
  return (
    <div className="bg-gray-100 h-screen">
      <Header />

      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6 max-w-4xl mx-auto">
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="left">Description</TableCell>
                <TableCell align="right">Fixable</TableCell>
                <TableCell align="right">Has Suggestions</TableCell>
                <TableCell align="right">Last Published</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow
                  key={rule.name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <Link href={`/npm/${rule.name}`}>{rule.name}</Link>
                  </TableCell>
                  <TableCell align="left">{rule.description}</TableCell>
                  <TableCell align="right">{rule.fixable}</TableCell>
                  <TableCell align="right">{rule.hasSuggestions}</TableCell>
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
