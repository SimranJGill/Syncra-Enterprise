import { Router } from 'express';
import authRoutes from '#@/modules/auth/api/v1/routes';
import roleRoutes from '#@/modules/role/api/v1/routes';
import inviteRoutes from '#@/modules/invite/api/v1/routes';
import organizationRoutes from '#@/modules/organization/api/v1/routes';
import roleDelegationRoutes from '#@/modules/role-delegation/api/v1/routes';
import roleAssignmentRoutes from '#@/modules/role-assignment/api/v1/routes';

const router = Router();

// API v1 Mount Points
router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);
router.use('/invites', inviteRoutes);
router.use('/organizations', organizationRoutes);
router.use('/role-delegation-policies', roleDelegationRoutes);
router.use('/role-assignment-policies', roleAssignmentRoutes);

// Health check endpoint
router.get('/health', (req, res) => res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Enterprise Workforce Management Platform with AI Operations Assistant'
}));

export default router;
