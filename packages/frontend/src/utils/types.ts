export type EmberTemplateLint = {
  configurations?: Record<string, { rules: {} }>;
  rules?: Record<string, {}>;
};

export type Stylelint = {
  rules?: Record<
    string,
    {
      meta?: {
        deprecated?: boolean;
        fixable?: boolean;
        url?: string;
      };
    }
  >;
};

export type StylelintPlugin = {
  ruleName: string;
  rule: {
    meta?: {
      deprecated?: boolean;
      fixable?: boolean;
      url?: string;
    };
  };
}[];
