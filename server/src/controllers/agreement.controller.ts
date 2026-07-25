import type { Request, Response } from 'express';
import * as agreementService from '@/services/agreement.service';
import type { CreateAgreementInput } from '@/validators/agreement.validator';

export async function createAgreement(req: Request, res: Response): Promise<void> {
  const { applicationId } = req.body as CreateAgreementInput;

  const agreement = await agreementService.createAgreement(
    req.user!.id,
    applicationId
  );

  res.status(201).json({
    success: true,
    data: { agreement },
  });
}

export async function getMyAgreements(req: Request, res: Response): Promise<void> {
  const agreements = await agreementService.getMyAgreements(req.user!.id);

  res.status(200).json({
    success: true,
    data: { agreements },
  });
}

export async function getAgreement(req: Request, res: Response): Promise<void> {
  const agreement = await agreementService.getAgreement(
    req.params.id as string,
    req.user!.id
  );

  res.status(200).json({
    success: true,
    data: { agreement },
  });
}

export async function signAgreement(req: Request, res: Response): Promise<void> {
  const agreement = await agreementService.signAgreement(
    req.user!.id,
    req.params.id as string
  );

  res.status(200).json({
    success: true,
    data: { agreement },
  });
}
