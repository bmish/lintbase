export default function EmojiSeverityOff({ config }: { config: string }) {
  return <span title={`Disabled in ${config}`}>🚫</span>;
}
