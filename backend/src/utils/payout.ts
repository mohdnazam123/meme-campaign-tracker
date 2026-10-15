export interface Milestone {
  views: number;
  payout: number;
}

export interface PayoutChange {
  newPayout: number;
  additionalPayout: number;
  budgetInsufficient: boolean;
}


export function getTargetPayout(milestones: Milestone[], views: number): number {
  let targetPayout = 0;
  let highestThreshold = 0;

  for (const milestone of milestones) {
    if (views >= milestone.views && milestone.views > highestThreshold) {
      highestThreshold = milestone.views;
      targetPayout = milestone.payout;
    }
  }

  return targetPayout;
}

export function calculatePayoutChange(
  currentPayout: number,
  targetPayout: number,
  remainingBudget: number
): PayoutChange {
  const additionalPayout = targetPayout - currentPayout;

  if (additionalPayout <= 0) {
    return { newPayout: currentPayout, additionalPayout: 0, budgetInsufficient: false };
  }

  if (additionalPayout > remainingBudget) {
    return { newPayout: currentPayout, additionalPayout: 0, budgetInsufficient: true };
  }

  return { newPayout: targetPayout, additionalPayout, budgetInsufficient: false };
}