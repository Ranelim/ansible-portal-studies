import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import { EmptyState } from './EmptyState';

const mockUsePermission = jest.fn().mockReturnValue({ allowed: true });
jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: (...args: unknown[]) => mockUsePermission(...args),
}));

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('EmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "No content sources configured" when hasConfiguredSources is false', () => {
    renderWithTheme(
      <EmptyState hasConfiguredSources={false} />,
    );

    expect(
      screen.getByText('No content sources configured'),
    ).toBeInTheDocument();
  });

  it('shows "No collections found" when hasConfiguredSources is true and no collections', () => {
    renderWithTheme(
      <EmptyState hasConfiguredSources />,
    );

    expect(screen.getByText('No collections found')).toBeInTheDocument();
    expect(
      screen.getByText(
        /No collections were retrieved|No collections are available/,
      ),
    ).toBeInTheDocument();
  });

  it('shows "No collections found" when hasConfiguredSources is null (default)', () => {
    renderWithTheme(<EmptyState />);

    expect(screen.getByText('No collections found')).toBeInTheDocument();
  });

  it('directs admin users to Administration > Connections for sync', () => {
    renderWithTheme(
      <EmptyState hasConfiguredSources />,
    );

    expect(
      screen.getByText(/Administration > Connections/),
    ).toBeInTheDocument();
  });

  it('renders View Documentation link when hasConfiguredSources is false and allowed', () => {
    renderWithTheme(
      <EmptyState hasConfiguredSources={false} />,
    );

    expect(screen.getByText('View Documentation')).toBeInTheDocument();
  });

  it('shows admin message when allowed is false and hasConfiguredSources is false', () => {
    mockUsePermission.mockReturnValueOnce({ allowed: false });

    renderWithTheme(
      <EmptyState hasConfiguredSources={false} />,
    );

    expect(
      screen.getByText(/Content sources are not currently configured/),
    ).toBeInTheDocument();
    expect(screen.queryByText('View Documentation')).not.toBeInTheDocument();
  });

  it('shows admin message when allowed is false and sources configured', () => {
    mockUsePermission.mockReturnValueOnce({ allowed: false });

    renderWithTheme(
      <EmptyState hasConfiguredSources />,
    );

    expect(
      screen.getByText(/No collections are available in the catalog/),
    ).toBeInTheDocument();
  });
});
