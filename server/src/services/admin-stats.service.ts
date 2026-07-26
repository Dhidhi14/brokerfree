import { Agreement } from '@/models/agreement.model';
import { Application } from '@/models/application.model';
import { Escrow } from '@/models/escrow.model';
import { Property } from '@/models/property.model';
import { Review } from '@/models/review.model';
import { User } from '@/models/user.model';

export interface DashboardStats {
  users: {
    total: number;
    tenants: number;
    owners: number;
    admins: number;
  };
  properties: {
    total: number;
    live: number;
    pendingVerification: number;
    inactive: number;
  };
  kyc: {
    pendingCount: number;
  };
  applications: {
    total: number;
    pending: number;
  };
  escrow: {
    heldCount: number;
    heldTotalAmount: number;
    disputedCount: number;
  };
  agreements: {
    total: number;
    executed: number;
  };
  reviews: {
    total: number;
    averagePlatformRating: number;
  };
}

interface RoleCountRow {
  _id: string;
  count: number;
}

interface StatusCountRow {
  _id: string;
  count: number;
}

interface EscrowHeldAggregate {
  heldCount: number;
  heldTotalAmount: number;
}

interface ReviewAggregate {
  total: number;
  averagePlatformRating: number;
}

function countByKey(rows: StatusCountRow[], key: string): number {
  return rows.find((row) => row._id === key)?.count ?? 0;
}

/**
 * Aggregated platform overview for the admin dashboard.
 * Uses countDocuments / group aggregations only — no full document loads.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    userRoleCounts,
    usersTotal,
    propertyStatusCounts,
    propertiesTotal,
    kycPendingCount,
    applicationsTotal,
    applicationsPending,
    escrowHeld,
    escrowDisputedCount,
    agreementsTotal,
    agreementsExecuted,
    reviewStats,
  ] = await Promise.all([
    User.aggregate<RoleCountRow>([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.countDocuments(),
    Property.aggregate<StatusCountRow>([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Property.countDocuments(),
    User.countDocuments({ 'kyc.status': 'pending' }),
    Application.countDocuments(),
    Application.countDocuments({ status: 'pending' }),
    Escrow.aggregate<EscrowHeldAggregate>([
      { $match: { status: 'held' } },
      {
        $group: {
          _id: null,
          heldCount: { $sum: 1 },
          heldTotalAmount: { $sum: '$amount' },
        },
      },
    ]).then((rows) => rows[0] ?? { heldCount: 0, heldTotalAmount: 0 }),
    Escrow.countDocuments({ status: 'disputed' }),
    Agreement.countDocuments(),
    Agreement.countDocuments({ status: 'executed' }),
    Review.aggregate<ReviewAggregate>([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          averagePlatformRating: { $avg: '$rating' },
        },
      },
    ]).then((rows) => rows[0] ?? { total: 0, averagePlatformRating: 0 }),
  ]);

  const roleCount = (role: string): number =>
    userRoleCounts.find((row) => row._id === role)?.count ?? 0;

  return {
    users: {
      total: usersTotal,
      tenants: roleCount('tenant'),
      owners: roleCount('owner'),
      admins: roleCount('admin'),
    },
    properties: {
      total: propertiesTotal,
      live: countByKey(propertyStatusCounts, 'live'),
      pendingVerification: countByKey(propertyStatusCounts, 'pending-verification'),
      inactive: countByKey(propertyStatusCounts, 'inactive'),
    },
    kyc: {
      pendingCount: kycPendingCount,
    },
    applications: {
      total: applicationsTotal,
      pending: applicationsPending,
    },
    escrow: {
      heldCount: escrowHeld.heldCount,
      heldTotalAmount: escrowHeld.heldTotalAmount,
      disputedCount: escrowDisputedCount,
    },
    agreements: {
      total: agreementsTotal,
      executed: agreementsExecuted,
    },
    reviews: {
      total: reviewStats.total,
      averagePlatformRating:
        reviewStats.total > 0
          ? Math.round(reviewStats.averagePlatformRating * 100) / 100
          : 0,
    },
  };
}
