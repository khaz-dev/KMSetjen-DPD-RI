import { render, screen, fireEvent, waitFor } from "../../test-utils";
import AdminSidebar from "../../components/AdminSidebar";

jest.mock("axios");

describe("AdminSidebar Component", () => {
  const mockOnLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders sidebar element", () => {
    render(<AdminSidebar onLogout={mockOnLogout} />);
    const sidebar = document.querySelector(".admin-sidebar");
    expect(sidebar).toBeInTheDocument();
  });

  test("renders menu buttons", () => {
    render(<AdminSidebar onLogout={mockOnLogout} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  test("renders navigation items", () => {
    render(<AdminSidebar onLogout={mockOnLogout} />);
    const navItems = document.querySelectorAll(".nav-item");
    expect(navItems.length).toBeGreaterThan(0);
  });

  test("renders sidebar header", () => {
    render(<AdminSidebar onLogout={mockOnLogout} />);
    const header = document.querySelector(".sidebar-header");
    expect(header).toBeInTheDocument();
  });

  test("renders multiple menu items", () => {
    render(<AdminSidebar onLogout={mockOnLogout} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(2);
  });

  test("buttons are functional elements", () => {
    render(<AdminSidebar onLogout={mockOnLogout} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toBeDefined();
  });

  test("sidebar has correct CSS class", () => {
    const { container } = render(<AdminSidebar onLogout={mockOnLogout} />);
    const sidebar = container.querySelector(".admin-sidebar");
    expect(sidebar).toBeInTheDocument();
  });

  test("renders without crashing", () => {
    render(<AdminSidebar onLogout={mockOnLogout} />);
    const sidebar = document.querySelector(".admin-sidebar");
    expect(sidebar).toBeInTheDocument();
  });
});
