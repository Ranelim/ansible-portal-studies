import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useRouteRef: () => () => '/self-service',
}));

jest.mock('../../routes', () => ({
  rootRouteRef: { id: 'root-route-ref' },
}));

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: () => ({ allowed: true }),
}));

jest.mock('@backstage/core-components', () => ({
  Page: ({ children }: any) => <div data-testid="page">{children}</div>,
  Header: ({ title, children }: any) => (
    <header data-testid="header">
      {title}
      {children}
    </header>
  ),
  HeaderTabs: ({ selectedIndex, onChange, tabs }: any) => (
    <div data-testid="header-tabs">
      {tabs.map((t: any, i: number) => (
        <button
          key={i}
          data-testid={`tab-btn-${i}`}
          aria-pressed={selectedIndex === i}
          onClick={() => onChange(i)}
        >
          <span data-testid={`tab-label-${i}`}>
            {typeof t.label === 'string'
              ? t.label
              : (t.label?.props?.children ?? `tab-${i}`)}
          </span>
        </button>
      ))}
    </div>
  ),
  Content: ({ children }: any) => <main data-testid="content">{children}</main>,
}));

jest.mock('./catalog/CatalogContent', () => ({
  EntityCatalogContent: ({ onTabSwitch }: any) => (
    <div data-testid="entity-catalog-content">
      EntityCatalogContent
      <button data-testid="to-create" onClick={() => onTabSwitch(1)}>
        go-create
      </button>
    </div>
  ),
}));

jest.mock('../common/CreateFromTemplateDialog', () => ({
  CreateFromTemplateDialog: ({ open }: any) =>
    open ? <div data-testid="create-template-dialog">CreateFromTemplateDialog</div> : null,
}));

const mockUseLocation = jest
  .fn()
  .mockReturnValue({ pathname: '/self-service/ee/catalog', state: {} });
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
    Link: ({ children }: any) => children,
  };
});

import { EETabs, EEHeader } from './TabviewPage';

describe('EETabs + EEHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockUseLocation.mockReturnValue({
      pathname: '/self-service/ee/catalog',
      state: {},
    });
  });

  test('renders list content without Create tab chrome when URL is /ee/catalog', () => {
    render(<EETabs />);

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('page')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByTestId('entity-catalog-content')).toBeInTheDocument();
    // Single-tab host: HeaderTabs omitted (create is modal, not a tab)
    expect(screen.queryByTestId('header-tabs')).not.toBeInTheDocument();
  });

  test('legacy /ee/create deep link opens create modal and redirects to catalog', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/self-service/ee/create',
      state: {},
    });

    render(<EETabs />);

    expect(screen.getByTestId('entity-catalog-content')).toBeInTheDocument();
    expect(screen.getByTestId('create-template-dialog')).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/self-service/ee/catalog', {
      replace: true,
    });
  });

  test('location.state.tabIndex 1 opens create modal and stays on catalog', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/self-service/ee/catalog',
      state: { tabIndex: 1 },
    });

    render(<EETabs />);

    expect(screen.getByTestId('create-template-dialog')).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/self-service/ee/catalog', {
      replace: true,
      state: {},
    });
  });

  test('onTabSwitch(1) opens create modal instead of navigating to Create tab', async () => {
    render(<EETabs />);

    expect(screen.getByTestId('entity-catalog-content')).toBeInTheDocument();
    expect(screen.queryByTestId('create-template-dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('to-create'));

    expect(screen.getByTestId('create-template-dialog')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith('/self-service/ee/create');
  });

  test('Actions → Create definition opens create modal', async () => {
    render(<EETabs />);

    await userEvent.click(screen.getByRole('button', { name: /Actions/i }));
    await userEvent.click(screen.getByText('Create definition'));

    expect(screen.getByTestId('create-template-dialog')).toBeInTheDocument();
  });
});

describe('EEHeader', () => {
  test('renders header title', () => {
    render(<EEHeader />);

    const header = screen.getByTestId('header');
    expect(header).toBeInTheDocument();

    expect(
      screen.getByText(/Execution Environments definition files/i),
    ).toBeInTheDocument();
  });
});
