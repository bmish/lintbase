export type EmberTemplateLint = {
  configurations?: Record<
    string,
    {
      rules: Record<
        string,
        'error' | 'warn' | 'off' | ['error' | 'warn' | 'off', config: unknown]
      >;
    }
  >;
  rules?: Record<string, object>;
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
