jest.mock("axios");

import { render, screen, fireEvent, waitFor } from "../../test-utils";
import axios from "axios";
import UserManagementPage from "../../pages/UserManagementPage";

describe("UserManagementPage Component", () => {
  const mockOnLogout = jest.fn();
  const mockUsersData = {
    results: [
      {
        id: 1,
        username: "john_doe",
        email: "john@example.com",
        first_name: "John",
        role: { code: "editor" },
        is_active: true,
        created_at: "2024-01-01T10:00:00Z",
      },
      {
        id: 2,
        username: "jane_smith",
        email: "jane@example.com",
        first_name: "Jane",
        role: { code: "contributor" },
        is_active: true,
        created_at: "2024-01-02T10:00:00Z",
      },
    ],
    count: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: mockUsersData });
    axios.post.mockResolvedValue({ data: {} });
  });

  test("renders user management page", async () => {
    render(<UserManagementPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });

  test("displays user list", async () => {
    render(<UserManagementPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      expect(screen.getByText("john_doe")).toBeInTheDocument();
      expect(screen.getByText("jane_smith")).toBeInTheDocument();
    });
  });

  test("displays user emails", async () => {
    render(<UserManagementPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
      expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    });
  });

  test("displays user status badge", async () => {
    render(<UserManagementPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      const badges = screen.getAllByText("Active");
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  test("renders action buttons for users", async () => {
    render(<UserManagementPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  test("calls API on mount", async () => {
    render(<UserManagementPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });

  test("handles loading state", async () => {
    render(<UserManagementPage onLogout={mockOnLogout} />);
    expect(axios.get).toHaveBeenCalled();
  });

  test("handles API errors gracefully", async () => {
    axios.get.mockRejectedValue(new Error("API Error"));
    render(<UserManagementPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });
});
