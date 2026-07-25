import type { Request, Response } from 'express';
import * as escrowService from '@/services/escrow.service';
import type {
  CreateOrderInput,
  DisputeInput,
  ReleaseRefundInput,
  VerifyPaymentInput,
} from '@/validators/escrow.validator';

export async function createOrder(req: Request, res: Response): Promise<void> {
  const { agreementId } = req.body as CreateOrderInput;

  const order = await escrowService.createEscrowOrder(req.user!.id, agreementId);

  res.status(201).json({
    success: true,
    data: { order },
  });
}

export async function verifyPayment(req: Request, res: Response): Promise<void> {
  const input = req.body as VerifyPaymentInput;

  const escrow = await escrowService.verifyAndCapturePayment(req.user!.id, input);

  res.status(200).json({
    success: true,
    data: { escrow },
  });
}

export async function getMyEscrows(req: Request, res: Response): Promise<void> {
  const escrows = await escrowService.getMyEscrows(req.user!.id);

  res.status(200).json({
    success: true,
    data: { escrows },
  });
}

export async function getAdminEscrows(_req: Request, res: Response): Promise<void> {
  const escrows = await escrowService.getAdminEscrows();

  res.status(200).json({
    success: true,
    data: { escrows },
  });
}

export async function getEscrow(req: Request, res: Response): Promise<void> {
  const escrow = await escrowService.getEscrowStatus(
    req.params.id as string,
    req.user!.id,
    req.user!.role
  );

  res.status(200).json({
    success: true,
    data: { escrow },
  });
}

export async function releaseEscrow(req: Request, res: Response): Promise<void> {
  const { note } = req.body as ReleaseRefundInput;

  const escrow = await escrowService.releaseToOwner(
    req.user!.id,
    req.params.id as string,
    note
  );

  res.status(200).json({
    success: true,
    data: { escrow },
  });
}

export async function refundEscrow(req: Request, res: Response): Promise<void> {
  const { note } = req.body as ReleaseRefundInput;

  const escrow = await escrowService.refundToTenant(
    req.user!.id,
    req.params.id as string,
    note
  );

  res.status(200).json({
    success: true,
    data: { escrow },
  });
}

export async function disputeEscrow(req: Request, res: Response): Promise<void> {
  const { note } = req.body as DisputeInput;

  const escrow = await escrowService.markDisputed(
    req.user!.id,
    req.params.id as string,
    note
  );

  res.status(200).json({
    success: true,
    data: { escrow },
  });
}
