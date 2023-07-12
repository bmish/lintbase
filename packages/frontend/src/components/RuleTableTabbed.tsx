import RuleTable from '@/components/RuleTable';
import { Box, Tab, Tabs } from '@mui/material';
import { Prisma, Package as PrismaPackage } from '@prisma/client';
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
  configToEmoji,
  pkg,
}: {
  listsOfRules: {
    title?: string;
    rules: readonly Prisma.RuleGetPayload<{
      include: { options: true; ruleConfigs: { include: { config: true } } };
    }>[];
  }[];
  pkg: PrismaPackage;
  configToEmoji: Record<string, string | undefined>;
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
              <Tab
                key={i}
                label={obj.title}
                id={`rule-list-tab-${i}`}
                // Separate groups of tabs.
                sx={{ 'margin-right': obj.title === 'Alphabetical' ? 24 : 0 }}
              />
            ))}
          </Tabs>
        </Box>
      )}
      {listsOfRules.map((obj, i) => (
        <TabPanel value={currentRuleListIndex} index={i} key={i}>
          <RuleTable
            rules={obj.rules}
            pkg={pkg}
            configToEmoji={configToEmoji}
          />
        </TabPanel>
      ))}
    </div>
  );
}
