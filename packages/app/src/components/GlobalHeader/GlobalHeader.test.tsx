import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const React = require('react');

jest.mock(
  '@red-hat-developer-hub/backstage-plugin-global-header/dist/components/GlobalHeaderComponent.esm.js',
  () => ({
    GlobalHeaderComponent: ({ globalHeaderMountPoints }: any) =>
      React.createElement(
        'nav',
        { id: 'global-header', 'data-testid': 'rhdh-global-header' },
        globalHeaderMountPoints?.map((mp: any, i: number) =>
          React.createElement(mp.Component, {
            key: i,
            ...(mp.config?.props || {}),
          }),
        ),
      ),
  }),
);

jest.mock(
  '@red-hat-developer-hub/backstage-plugin-global-header/dist/components/Spacer/Spacer.esm.js',
  () => ({ Spacer: () => null }),
);

jest.mock('./PortalStarredMenu', () => ({
  PortalStarredMenu: () =>
    React.createElement('button', { 'aria-label': 'Starred' }, 'Starred'),
}));

jest.mock(
  '@red-hat-developer-hub/backstage-plugin-global-header/dist/components/HeaderDropdownComponent/StarredDropdown.esm.js',
  () => ({
    StarredDropdown: () =>
      React.createElement('button', { 'aria-label': 'Starred' }, 'Starred'),
  }),
);

jest.mock(
  '@red-hat-developer-hub/backstage-plugin-global-header/dist/components/Divider/Divider.esm.js',
  () => ({ Divider: () => null }),
);

jest.mock('./AutomationPortalBrand', () => ({
  AutomationPortalBrand: () => (
    <a href="/">
      <span>Automation Portal</span>
    </a>
  ),
}));

jest.mock('./PortalHeaderSearch', () => ({
  PortalHeaderSearch: () => (
    <input aria-label="Search" placeholder="Search..." />
  ),
}));

jest.mock('./PortalCreateButton', () => ({
  PortalCreateButton: () => (
    <button type="button" title="All templates" aria-label="All templates">
      Create
    </button>
  ),
}));

jest.mock('./PortalNotificationButton', () => ({
  PortalNotificationButton: () => (
    <a href="/notifications" aria-label="Notifications">
      Notifications
    </a>
  ),
}));

jest.mock('./PortalHelpMenu', () => ({
  PortalHelpMenu: () => (
    <button type="button" aria-label="Help">
      Help
    </button>
  ),
}));

jest.mock('./PortalProfileMenu', () => ({
  PortalProfileMenu: () => (
    <button type="button" aria-label="Profile">
      Guest
    </button>
  ),
}));

import { GlobalHeader } from './GlobalHeader';

describe('GlobalHeader', () => {
  it('composes RHDH header with Automation Portal brand and quiet search', () => {
    render(
      <MemoryRouter>
        <GlobalHeader />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('rhdh-global-header')).toBeInTheDocument();
    expect(screen.getByText('Automation Portal')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.queryByText(/Error fetching results/i)).not.toBeInTheDocument();
    expect(screen.getByTitle('All templates')).toBeInTheDocument();
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    expect(screen.getByLabelText('Profile')).toBeInTheDocument();
  });

  it('hides on setup routes', () => {
    render(
      <MemoryRouter initialEntries={['/setup']}>
        <GlobalHeader />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('rhdh-global-header')).not.toBeInTheDocument();
  });
});
