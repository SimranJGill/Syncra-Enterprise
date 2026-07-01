import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Organization module placeholder operational.' });
});

export default router;
