import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useRouter } from 'next/router';

export default function DatabaseNavigation() {
  const router = useRouter();

  const pathParts = router.pathname.split('/');

  const value =
    pathParts.length === 2 && pathParts[1] === 'db'
      ? 'home'
      : pathParts.length > 2 &&
        pathParts[1] === 'db' &&
        ['linters', 'plugins', 'rules'].includes(pathParts[2])
      ? pathParts[2]
      : undefined;

  return (
    <nav className="pt-8 w-full px-6">
      <ToggleButtonGroup
        color="primary"
        value={value}
        exclusive
        aria-label="Platform"
        className="mx-auto bg-white"
        fullWidth={true}
      >
        <ToggleButton value="home" href="/db">
          Summary
        </ToggleButton>
        <ToggleButton value="linters" href="/db/linters">
          Linters
        </ToggleButton>
        <ToggleButton value="plugins" href="/db/plugins">
          Plugins
        </ToggleButton>
        <ToggleButton value="rules" href="/db/rules">
          Rules
        </ToggleButton>
      </ToggleButtonGroup>
    </nav>
  );
}
