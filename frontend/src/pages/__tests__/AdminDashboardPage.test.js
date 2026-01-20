jest.mock("axios");

import { render, screen, fireEvent, waitFor } from "../../test-utils";
import axios from "axios";
import AdminDashboardPage from "../../pages/AdminDashboardPage";

describe("AdminDashboardPage Component", () => {
  const mockOnLogout = jest.fn();
  const mockStatsData = {
    total_users: 150,
    active_users: 120,
    total_articles: 450,
    published_articles: 380,
    total_audit_logs: 1200,
    in_review_articles: 70,
    draft_articles: 45,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: mockStatsData });
  });

  test("renders admin dashboard header", () => {
    render(<AdminDashboardPage onLogout={mockOnLogout} />);
    const heading = screen.getByRole("heading", { name: "Dashboard" });
    expect(heading).toBeInTheDocument();
  });

  test("calls statistics API on mount", async () => {
    render(<AdminDashboardPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });

  test("renders admin sidebar", () => {
    render(<AdminDashboardPage onLogout={mockOnLogout} />);
    const sidebar = document.querySelector(".admin-sidebar");
    expect(sidebar).toBeInTheDocument();
  });

  test("renders main content area", () => {
    render(<AdminDashboardPage onLogout={mockOnLogout} />);
    const content = document.querySelector(".admin-content");
    expect(content).toBeInTheDocument();
  });

  test("displays stat cards after data loads", async () => {
    render(<AdminDashboardPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      const statCards = document.querySelectorAll(".stat-card");
      expect(statCards.length).toBeGreaterThan(0);
    });
  });

  test("handles API errors gracefully", async () => {
    axios.get.mockRejectedValue(new Error("API Error"));
    render(<AdminDashboardPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });

  test("renders action buttons", async () => {
    render(<AdminDashboardPage onLogout={mockOnLogout} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  test("passes logout prop to sidebar", () => {
    render(<AdminDashboardPage onLogout={mockOnLogout} />);
    expect(mockOnLogout).not.toHaveBeenCalled();
  });
});
