export type Rule = {
  name: string;

  ecosystem: 'node';

  // rule meta data
  category: string | null;
  deprecated: boolean;
  description: string | null;
  fixable: 'code' | 'whitespace' | null;
  hasSuggestions: boolean;
  options: any | readonly any[];
  replacedBy: readonly string[];
  requiresTypeChecking: boolean;
  type: 'problem' | 'suggestion' | 'layout' | null;

  createdAt: string;
  updatedAt: string;

  links: {
    ruleDoc: string | null;
    us: string;
  };

  plugin: {
    name: string;
    links: {
      packageRegistry: string;
      readme: string;
      us: string;
    };
  };
};

export type Plugin = {
  name: string;

  ecosystem: 'node';

  description: string | null; // could be multiple sources for this
  keywords: readonly string[]; // npm or github source

  rules: readonly Rule[];

  createdAt: string;
  updatedAt: string;

  stats: {
    contributors: number;
    forks: number;
    issues: number;
    prs: number;
    stars: number;
    watching: number;
    weeklyDownloads: number;
  };

  links: {
    packageRegistry: string;
    readme: string;
    us: string;
  };
};
