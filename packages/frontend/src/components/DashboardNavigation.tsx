import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useRouter } from 'next/router';

export default function DashboardNavigation() {
  const router = useRouter();

  const pathParts = router.pathname.split('/');

  const value =
    pathParts.length === 2 && pathParts[1] === 'dashboard'
      ? 'home'
      : pathParts.length > 2 &&
        pathParts[1] === 'dashboard' &&
        ['home', 'repos'].includes(pathParts[2])
      ? pathParts[2]
      : undefined;

  return (
    <nav className="pt-8 w-full px-6">
      <ToggleButtonGroup
        color="primary"
        value={value}
        exclusive
        aria-label="Dashboard Navigation"
        className="mx-auto bg-white"
        fullWidth={true}
      >
        <ToggleButton value="home" href="/dashboard">
          Home
        </ToggleButton>
        <ToggleButton value="repos" href="/dashboard/repos">
          Repositories
        </ToggleButton>
      </ToggleButtonGroup>
    </nav>
  );
}
