import { EMOJI_CONFIGS } from '@/utils/eslint';
import { Prisma } from '@prisma/client';

export function getConfigEmojis(configs: Prisma.ConfigGetPayload<object>[]) {
  const genEmoji = generateEmoji();
  const configToEmoji = Object.fromEntries(
    configs.map((config) => [
      config.name,
      (EMOJI_CONFIGS as Record<string, string | undefined>)[config.name] ||
        genEmoji.next().value ||
        undefined,
    ]),
  );

  return configToEmoji;
}

const emojis = [
  // circles
  '🔴',
  '🟠',
  '🟡',
  '🟢',
  '🔵',
  '🟣',
  '🟤',
  '⚫',
  '⚪',
  // squares
  '🟥',
  '🟧',
  '🟨',
  '🟩',
  '🟦',
  '🟪',
  '🟫',
  '⬛',
  '⬜',
];

function* generateEmoji() {
  let i = 0;

  while (true) {
    yield emojis[i];
    i++;
  }
}
