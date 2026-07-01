import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Role Delegation module placeholder operational.' });
});

export default router;
