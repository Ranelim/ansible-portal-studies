import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';

import { CreateCatalog } from './CreateCatalog';

const theme = createMuiTheme();

describe('CreateCatalog', () => {
  it('renders title, description and create button', () => {
    const onTabSwitch = jest.fn();

    render(
      <ThemeProvider theme={theme}>
        <CreateCatalog onTabSwitch={onTabSwitch} />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('catalog-content')).toBeInTheDocument();

    expect(
      screen.getByRole('heading', {
        name: /No execution environments yet/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Get started with execution environments/i),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /Create execution environment/i,
      }),
    ).toBeInTheDocument();
  });

  it('calls onTabSwitch with 1 when Create button is clicked', async () => {
    const onTabSwitch = jest.fn();
    render(
      <ThemeProvider theme={theme}>
        <CreateCatalog onTabSwitch={onTabSwitch} />
      </ThemeProvider>,
    );

    const createButton = screen.getByRole('button', {
      name: /Create execution environment/i,
    });
    await userEvent.click(createButton);

    expect(onTabSwitch).toHaveBeenCalledTimes(1);
    expect(onTabSwitch).toHaveBeenCalledWith(1);
  });
});
