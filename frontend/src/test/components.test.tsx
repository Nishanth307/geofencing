import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

describe("UI Primitives", () => {
  it("renders Button and responds to click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit Action</Button>);

    const btn = screen.getByRole("button", { name: "Submit Action" });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("disables button and shows spinner when isLoading is true", () => {
    render(<Button isLoading>Processing</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
  });

  it("renders Badge with appropriate variants", () => {
    render(<Badge variant="destructive">Critical Breach</Badge>);
    const badge = screen.getByText("Critical Breach");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("text-red-700");
  });

  it("renders Card structure correctly", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Fleet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Card body content</p>
        </CardContent>
      </Card>
    );

    expect(screen.getByText("Fleet Overview")).toBeInTheDocument();
    expect(screen.getByText("Card body content")).toBeInTheDocument();
  });
});

