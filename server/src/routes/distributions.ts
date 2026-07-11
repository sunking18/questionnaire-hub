import { Router, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const distributionRouter = Router();

// GET /api/distributions/:questionnaireId - 获取分发记录
distributionRouter.get('/:questionnaireId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const questionnaire = await prisma.questionnaire.findFirst({
      where: { id: req.params.questionnaireId, userId: req.userId, deletedAt: null },
    });
    if (!questionnaire) {
      throw new AppError('问卷不存在', 404);
    }

    const distributions = await prisma.distribution.findMany({
      where: { questionnaireId: req.params.questionnaireId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: distributions });
  } catch (error) {
    next(error);
  }
});

// POST /api/distributions/:questionnaireId - 创建分发链接
distributionRouter.post('/:questionnaireId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const questionnaire = await prisma.questionnaire.findFirst({
      where: { id: req.params.questionnaireId, userId: req.userId, deletedAt: null },
    });
    if (!questionnaire) {
      throw new AppError('问卷不存在', 404);
    }

    if (questionnaire.status !== 'published') {
      throw new AppError('请先发布问卷再创建分发链接', 400);
    }

    const { channelType = 'link', validFrom, validUntil, maxFills } = req.body;

    const distribution = await prisma.distribution.create({
      data: {
        questionnaireId: req.params.questionnaireId,
        channelType,
        shareCode: uuidv4().substring(0, 8),
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        maxFills,
      },
    });

    const shareUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/fill/${distribution.shareCode}`;

    res.status(201).json({
      success: true,
      data: { ...distribution, shareUrl },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/distributions/:id - 删除分发记录
distributionRouter.delete('/record/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const distribution = await prisma.distribution.findUnique({
      where: { id: req.params.id },
      include: { questionnaire: { select: { userId: true } } },
    });

    if (!distribution) {
      throw new AppError('分发记录不存在', 404);
    }
    if (distribution.questionnaire.userId !== req.userId) {
      throw new AppError('无权操作', 403);
    }

    await prisma.distribution.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    next(error);
  }
});
