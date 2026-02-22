import express from 'express';
import { askAI } from '../controllers/ai.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/askAi', verifyToken, askAI);
export default router;
