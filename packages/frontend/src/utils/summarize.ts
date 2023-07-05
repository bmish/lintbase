import { Configuration, OpenAIApi } from 'openai';

async function createChatCompletion(
  messages: { role: 'user' | 'system' | 'assistant'; content: string }[]
) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
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
