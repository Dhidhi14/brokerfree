import type { Request, Response } from 'express';
import * as applicationService from '@/services/application.service';
import type {
  CreateApplicationInput,
  ReceivedApplicationsQuery,
  RespondApplicationInput,
} from '@/validators/application.validator';

export async function createApplication(req: Request, res: Response): Promise<void> {
  const application = await applicationService.createApplication(
    req.user!.id,
    req.body as CreateApplicationInput
  );

  res.status(201).json({
    success: true,
    data: { application },
  });
}

export async function getMyApplications(req: Request, res: Response): Promise<void> {
  const applications = await applicationService.getMyApplications(req.user!.id);

  res.status(200).json({
    success: true,
    data: { applications },
  });
}

export async function getReceivedApplications(req: Request, res: Response): Promise<void> {
  const applications = await applicationService.getReceivedApplications(
    req.user!.id,
    req.validatedQuery as ReceivedApplicationsQuery
  );

  res.status(200).json({
    success: true,
    data: { applications },
  });
}

export async function getApplication(req: Request, res: Response): Promise<void> {
  const application = await applicationService.getApplicationById(
    req.params.id as string,
    req.user!.id
  );

  res.status(200).json({
    success: true,
    data: { application },
  });
}

export async function respondToApplication(req: Request, res: Response): Promise<void> {
  const application = await applicationService.respondToApplication(
    req.user!.id,
    req.params.id as string,
    req.body as RespondApplicationInput
  );

  res.status(200).json({
    success: true,
    data: { application },
  });
}

export async function withdrawApplication(req: Request, res: Response): Promise<void> {
  const application = await applicationService.withdrawApplication(
    req.user!.id,
    req.params.id as string
  );

  res.status(200).json({
    success: true,
    data: { application },
  });
}
