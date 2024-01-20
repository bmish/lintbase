export default function EmojiSeverityWarn({ config }: { config: string }) {
  return <span title={`Warns in ${config}`}>⚠️</span>;
}
