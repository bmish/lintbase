export type Rule = {
  name: string;
  plugin: {
    name: string;
    links: {
      us: string;
      packageRegistry: string;
      readme: string;
    };
  };
  ecosystem: string;
  description: string;
  fixable: 'code' | 'whitespace' | undefined;
  hasSuggestions: boolean;
  type: 'problem' | 'suggestion' | 'layout' | undefined;
  deprecated: boolean;
  replacedBy: readonly string[];
  requiresTypeChecking: boolean;
  category: string; // meta.docs.category
  options: any | readonly any[];
  links: {
    us: string;
    ruleDoc: string;
  };
  updatedAt: string;
  createdAt: string;
};

export type Plugin = {
  name: string;
  ecosystem: string;
  description: string; // could be multiple sources for this
  keywords: readonly string[]; // npm or github source
  rules: readonly Rule[];
  stats: {
    prs: number;
    issues: number;
    stars: number;
    watching: number;
    forks: number;
    contributors: number;
    weeklyDownloads: number;
  };
  links: {
    us: string;
    packageRegistry: string;
    readme: string;
  };
  updatedAt: string;
  createdAt: string;
};
