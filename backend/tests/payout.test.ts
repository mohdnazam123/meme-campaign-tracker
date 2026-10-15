
import {
  getTargetPayout,
  calculatePayoutChange,
} from "../src/utils/payout";

describe("getTargetPayout", () => {
  const milestones = [
    { views: 100, payout: 100 },
    { views: 500, payout: 300 },
  ];

  test("returns zero before the first milestone", () => {
    expect(getTargetPayout(milestones, 50)).toBe(0);
  });

  test("returns the payout for the first milestone", () => {
    expect(getTargetPayout(milestones, 100)).toBe(100);
  });

  test("returns the highest reached milestone payout", () => {
    expect(getTargetPayout(milestones, 5000)).toBe(300);
  });
});

describe("calculatePayoutChange", () => {
  test("pays only the difference for a higher milestone", () => {
    expect(calculatePayoutChange(100, 300, 900)).toEqual({
      newPayout: 300,
      additionalPayout: 200,
      budgetInsufficient: false,
    });
  });

  test("does not pay twice for the same milestone", () => {
    expect(calculatePayoutChange(100, 100, 900)).toEqual({
      newPayout: 100,
      additionalPayout: 0,
      budgetInsufficient: false,
    });
  });

  test("does not increase payout when budget is insufficient", () => {
    expect(calculatePayoutChange(100, 300, 150)).toEqual({
      newPayout: 100,
      additionalPayout: 0,
      budgetInsufficient: true,
    });
  });
});
