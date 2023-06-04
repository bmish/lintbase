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
      readme: string | null;
      us: string;
    };
  };
};

export type Config = {
  name: string;
  description: string | undefined; // TODO: try to get this from README or future config property?
};

export type Plugin = {
  name: string;

  ecosystem: 'node';
  linter: 'eslint' | 'ember-template-lint';

  description: string | null; // could be multiple sources for this
  keywords: readonly string[] | null; // npm or github source

  rules: readonly Rule[];
  configs: readonly Config[];

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
    readme: string | null;
    us: string;
  };
};
