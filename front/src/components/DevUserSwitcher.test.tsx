import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DevUserSwitcher, { DEV_USERS } from './DevUserSwitcher';

describe('DevUserSwitcher', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    // Mock window.location properly
    delete (window as any).location;
    window.location = {
      hostname: 'localhost',
      reload: vi.fn(),
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render when on localhost', () => {
    render(<DevUserSwitcher />);
    expect(screen.getByText('로그인 필요')).toBeInTheDocument();
  });

  it('should not render when not on localhost', () => {
    window.location = { hostname: 'openrun.app' } as any;

    const { container } = render(<DevUserSwitcher />);
    expect(container.firstChild).toBeNull();
  });

  it('should display current user name when userId is in localStorage', () => {
    (window.localStorage.getItem as any).mockReturnValue('1');

    render(<DevUserSwitcher />);
    expect(screen.getByText('정주상')).toBeInTheDocument();
  });

  it('should toggle dropdown when clicked', async () => {
    render(<DevUserSwitcher />);

    const switcher = screen.getByTitle('개발용 사용자 전환');
    expect(screen.queryByText('사용자 전환 (개발용)')).not.toBeInTheDocument();

    fireEvent.click(switcher);

    await waitFor(() => {
      expect(screen.getByText('사용자 전환 (개발용)')).toBeInTheDocument();
    });
  });

  it('should have correct number of users in DEV_USERS', () => {
    expect(DEV_USERS).toHaveLength(10);
  });

  it('should display all user options when dropdown is open', async () => {
    render(<DevUserSwitcher />);

    const switcher = screen.getByTitle('개발용 사용자 전환');
    fireEvent.click(switcher);

    await waitFor(() => {
      DEV_USERS.forEach(user => {
        expect(screen.getByText(user.name)).toBeInTheDocument();
      });
    });
  });

  it('should call localStorage.setItem when user is selected', async () => {
    render(<DevUserSwitcher />);

    const switcher = screen.getByTitle('개발용 사용자 전환');
    fireEvent.click(switcher);

    await waitFor(() => {
      const userButton = screen.getAllByText('최승연')[0];
      fireEvent.click(userButton);
    });

    expect(window.localStorage.setItem).toHaveBeenCalledWith('devUserId', '2');
  });
});
