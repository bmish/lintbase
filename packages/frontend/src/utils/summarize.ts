import { Configuration, OpenAIApi } from 'openai';
import { env } from '@/env.mjs';
import { Prisma } from '@prisma/client';

async function createChatCompletion(
  messages: { role: 'user' | 'system' | 'assistant'; content: string }[]
) {
  const configuration = new Configuration({
    apiKey: env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages,
  });

  if (
    !response.data.choices[0].message ||
    response.data.choices[0].message.content === ''
  ) {
    throw new Error('no message returned');
  }

  return response.data.choices[0].message.content;
}

export async function summarizeLinter(
  linter: Prisma.LinterGetPayload<{
    include: { rules: true; configs: true; package: true };
  }>
): Promise<string> {
  const messageIntro = [
    'Generate a concise, one-paragraph summary (1-3 sentences) about the specified linting plugin.',
    'Focus on high-level information about the plugin including what categories of rules it contains.',
    'Do not include the name of the plugin nor plain lists of rules/configs.',
    'Do not include generalities that could apply to any linting plugin.',
    'Do not mention the presence of recommended/all configs as these are common in most plugins.',
    'Avoid generalities like "It offers a wide range of configurable rules and provides multiple pre-defined configurations to suit different linting needs.".',
  ].join('\n');

  const ruleNames = linter.rules.map((rule) => rule.name).join(', ');
  const configNames = linter.configs.map((config) => config.name).join(', ');

  const linterInfo = [
    `Lint plugin: ${linter.package.name}`,
    linter.package.description
      ? `Description: ${linter.package.description}`
      : '',
    linter.rules.length > 0 ? `Rules: ${ruleNames}` : '',
    linter.configs.length > 0 ? `Configs: ${configNames}` : '',
  ].join('\n');

  const result = await createChatCompletion([
    // Introduce the task.
    {
      role: 'system',
      content: messageIntro,
    },

    // TODO: Demonstrate usage.

    {
      role: 'user',
      content: linterInfo,
    },
  ]);

  if (!result) {
    throw new Error(
      `Unable to generate linter summary for ${linter.package.name}`
    );
  }

  return result;
}

export async function summarizeConfig(
  config: Prisma.ConfigGetPayload<{
    include: {
      ruleConfigs: { include: { rule: true } };
      linter: { include: { package: true } };
    };
  }>
): Promise<string> {
  const messageIntro = [
    'A lint config is a collection of lint rules that are usually related or used together.',
    'Generate a short, concise, brief, one-sentence summary of a lint config based on the types of rules it includes.',
    'Do not mention the name of the lint config nor the plugin.',
  ].join('\n');

  const ruleNames = config.ruleConfigs
    .map((ruleConfig) => ruleConfig.rule.name)
    .join(', ');

  const linterInfo = [
    `ESLint plugin name: ${config.linter.package.name}`,
    config.linter.package.description
      ? `Lint plugin description: ${config.linter.package.description}`
      : '',
    `Lint config name: ${config.name}`,
    config.ruleConfigs.some((ruleConfig) => ruleConfig.severity === 'error')
      ? `Rules enabled in config: ${ruleNames}`
      : '',
    config.ruleConfigs.some((ruleConfig) => ruleConfig.severity === 'warn')
      ? `Rules set to warn in config: ${ruleNames}`
      : '',
    config.ruleConfigs.some((ruleConfig) => ruleConfig.severity === 'off')
      ? `Rules disabled in config: ${ruleNames}`
      : '',
  ].join('\n');

  const result = await createChatCompletion([
    // Introduce the task.
    {
      role: 'system',
      content: messageIntro,
    },

    // TODO: Demonstrate usage.

    {
      role: 'user',
      content: linterInfo,
    },
  ]);

  if (!result) {
    throw new Error(
      `Unable to generate config summary for linter ${config.linter.package.name}`
    );
  }

  return result;
}

export async function clusterNamesForRules(
  ruleLists: string
): Promise<string[]> {
  const messageIntro =
    'A cluster is a set of related lint rules. Generate a human-readable name to distinguish each cluster of lint rules. Use only a few words in each cluster name and avoid any boilerplate. Return a JSON array of cluster names and nothing else.';

  const result = await createChatCompletion([
    // Introduce the task.
    {
      role: 'system',
      content: messageIntro,
    },

    // Demonstrate usage with sample from eslint-plugin-ember.
    {
      role: 'user',
      content: [
        'Cluster 1:',
        '\tno-implicit-service-injection-argument	- disallow omitting the injected service name argument',
        '\tno-unnecessary-service-injection-argument - disallow unnecessary argument when injecting services',
        '',
        'Cluster 2:',
        '\torder-in-components - enforce proper order of properties in components',
        '\torder-in-controllers	- enforce proper order of properties in controllers',
        '\torder-in-models - enforce proper order of properties in models',
        '',
        'Cluster 3:',
        '\tno-invalid-test-waiters - disallow incorrect usage of test waiter APIs',
        '\tno-pause-test - disallow usage of the pauseTest helper in tests',
        '\tno-restricted-resolver-tests - disallow the use of patterns that use the restricted resolver in tests',

        // TODO: add "and" example.
      ].join('\n'),
    },
    {
      role: 'assistant',
      content: '["Service Injections", "Ordering", "Tests"]',
    },

    // Actual question.
    {
      role: 'user',
      content: ruleLists,
    },
  ]);

  if (!result) {
    throw new Error('Unable to generate cluster names.');
  }

  return JSON.parse(result) as string[];
}
