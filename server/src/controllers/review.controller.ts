import type { Request, Response } from 'express';
import * as reviewService from '@/services/review.service';
import type { CreateReviewInput } from '@/validators/review.validator';

export async function createReview(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateReviewInput;

  const review = await reviewService.createReview(req.user!.id, input);

  res.status(201).json({
    success: true,
    data: { review },
  });
}

export async function getReviewsForUser(req: Request, res: Response): Promise<void> {
  const reviews = await reviewService.getReviewsForUser(req.params.userId as string);

  res.status(200).json({
    success: true,
    data: { reviews },
  });
}

export async function getMyReviewStatus(req: Request, res: Response): Promise<void> {
  const status = await reviewService.getMyReviewStatus(
    req.user!.id,
    req.params.agreementId as string
  );

  res.status(200).json({
    success: true,
    data: status,
  });
}
