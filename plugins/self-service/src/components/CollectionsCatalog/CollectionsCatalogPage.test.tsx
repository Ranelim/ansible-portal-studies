import { screen } from '@testing-library/react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import { discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { CollectionsCatalogPage } from './CollectionsCatalogPage';

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: () => ({ allowed: true }),
}));

jest.mock('./CollectionsListPage', () => ({
  CollectionsContent: () => (
    <div>
      <span data-testid="collections-content">CollectionsContent</span>
    </div>
  ),
}));

const mockDiscoveryApi = {
  getBaseUrl: jest.fn().mockResolvedValue('http://localhost:7007/api/catalog'),
};
const mockFetchApi = { fetch: jest.fn() };

const theme = createTheme();

describe('CollectionsCatalogPage', () => {
  it('renders page with Collections header', async () => {
    await renderInTestApp(
      <TestApiProvider
        apis={[
          [discoveryApiRef, mockDiscoveryApi],
          [fetchApiRef, mockFetchApi],
        ]}
      >
        <ThemeProvider theme={theme}>
          <CollectionsCatalogPage />
        </ThemeProvider>
      </TestApiProvider>,
    );

    expect(screen.getByText('Collections')).toBeInTheDocument();
  });

  it('renders CollectionsContent', async () => {
    await renderInTestApp(
      <TestApiProvider
        apis={[
          [discoveryApiRef, mockDiscoveryApi],
          [fetchApiRef, mockFetchApi],
        ]}
      >
        <ThemeProvider theme={theme}>
          <CollectionsCatalogPage />
        </ThemeProvider>
      </TestApiProvider>,
    );

    expect(screen.getByTestId('collections-content')).toBeInTheDocument();
  });

  it('does not render Sync Now button on entity page', async () => {
    await renderInTestApp(
      <TestApiProvider
        apis={[
          [discoveryApiRef, mockDiscoveryApi],
          [fetchApiRef, mockFetchApi],
        ]}
      >
        <ThemeProvider theme={theme}>
          <CollectionsCatalogPage />
        </ThemeProvider>
      </TestApiProvider>,
    );

    expect(
      screen.queryByRole('button', { name: /Sync Now/i }),
    ).not.toBeInTheDocument();
  });
});
