import RuleTable from '@/components/RuleTable';
import { Box, Tab, Tabs } from '@mui/material';
import { Prisma } from '@prisma/client';
import React from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Based on: https://mui.com/material-ui/react-tabs/
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rule-list-tab-panel-${index}`}
      aria-labelledby={`rule-list-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function RuleTableTabbed({
  listsOfRules,
  relevantConfigEmojis,
  pkg,
}: {
  listsOfRules: {
    title?: string;
    rules: readonly Prisma.RuleGetPayload<{
      include: { options: true; ruleConfigs: { include: { config: true } } };
    }>[];
  }[];
  pkg: Prisma.PackageGetPayload<object>;
  relevantConfigEmojis: [string, string][];
}) {
  const [currentRuleListIndex, setCurrentRuleListIndex] = React.useState(0);
  const handleChangeCurrentRuleListIndex = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    setCurrentRuleListIndex(newValue);
  };

  return (
    <div>
      {listsOfRules.length > 1 && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentRuleListIndex}
            onChange={handleChangeCurrentRuleListIndex}
            aria-label="rule list tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {listsOfRules.map((obj, i) => (
              <Tab key={i} label={obj.title} id={`rule-list-tab-${i}`} />
            ))}
          </Tabs>
        </Box>
      )}
      {listsOfRules.map((obj, i) => (
        <TabPanel value={currentRuleListIndex} index={i} key={i}>
          <RuleTable
            rules={obj.rules}
            pkg={pkg}
            relevantConfigEmojis={relevantConfigEmojis}
          />
        </TabPanel>
      ))}
    </div>
  );
}
