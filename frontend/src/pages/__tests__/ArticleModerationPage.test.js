jest.mock("axios");

import { render, screen, fireEvent, waitFor } from "../../test-utils";
import axios from "axios";
import ArticleModerationPage from "../../pages/ArticleModerationPage";

describe("ArticleModerationPage Component", () => {
  const mockOnLogout = jest.fn();
  const mockArticlesData = {
    results: [
      {
        id: 1,
        title_en: "Test Article 1 - Longer Title",
        title_id: "Artikel 1",
        author: { id: 1, username: "john" },
        category: { id: 1, name_en: "Tech" },
        status: "PENDING",
        created_at: "2024-01-01T10:00:00Z",
      },
    ],
    count: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: mockArticlesData });
    axios.post.mockResolvedValue({ data: {} });
  });

  test("renders moderation page", async () => {
    render(<ArticleModerationPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });

  test("displays loaded articles", async () => {
    render(<ArticleModerationPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      expect(screen.getByText(/Test Article 1/)).toBeInTheDocument();
    });
  });

  test("displays author name", async () => {
    render(<ArticleModerationPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      expect(screen.getByText("john")).toBeInTheDocument();
    });
  });

  test("displays category", async () => {
    render(<ArticleModerationPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      expect(screen.getByText("Tech")).toBeInTheDocument();
    });
  });

  test("displays PENDING status badge", async () => {
    render(<ArticleModerationPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      expect(screen.getByText("PENDING")).toBeInTheDocument();
    });
  });

  test("renders action buttons", async () => {
    render(<ArticleModerationPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  test("calls API when component mounts", async () => {
    render(<ArticleModerationPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });

  test("handles axios errors gracefully", async () => {
    axios.get.mockRejectedValue(new Error("API Error"));
    render(<ArticleModerationPage onLogout={mockOnLogout} />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });
});
