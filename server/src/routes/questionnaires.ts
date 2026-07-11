import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const questionnaireRouter = Router();

// GET /api/questionnaires - 获取问卷列表
questionnaireRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId: req.userId,
      deletedAt: null,
    };

    if (search) {
      where.title = { contains: search as string, mode: 'insensitive' };
    }
    if (status && status !== 'all') {
      where.status = status as string;
    }

    const [questionnaires, total] = await Promise.all([
      prisma.questionnaire.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          fillCount: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { responses: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.questionnaire.count({ where }),
    ]);

    res.json({
      success: true,
      data: questionnaires,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/questionnaires/:id - 获取问卷详情
questionnaireRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const questionnaire = await prisma.questionnaire.findFirst({
      where: { id: req.params.id, userId: req.userId, deletedAt: null },
      include: {
        reportConfigs: true,
        aggregateAnalysis: true,
        sourceScale: {
          select: { id: true, name: true, nameEn: true, abbreviation: true },
        },
      },
    });

    if (!questionnaire) {
      throw new AppError('问卷不存在', 404);
    }

    res.json({ success: true, data: questionnaire });
  } catch (error) {
    next(error);
  }
});

// POST /api/questionnaires - 创建问卷
questionnaireRouter.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      title, description, status = 'draft', sourceScaleId,
      settings, theme, questions, validFrom, validUntil,
    } = req.body;

    if (!title) {
      throw new AppError('问卷标题不能为空', 400);
    }

    const questionnaire = await prisma.questionnaire.create({
      data: {
        userId: req.userId!,
        title,
        description,
        status,
        sourceScaleId,
        settings: settings || {},
        theme: theme || {},
        questions: questions || [],
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
      },
    });

    res.status(201).json({ success: true, data: questionnaire });
  } catch (error) {
    next(error);
  }
});

// PUT /api/questionnaires/:id - 更新问卷
questionnaireRouter.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.questionnaire.findFirst({
      where: { id: req.params.id, userId: req.userId, deletedAt: null },
    });
    if (!existing) {
      throw new AppError('问卷不存在', 404);
    }

    const { title, description, status, sourceScaleId, settings, theme, questions, validFrom, validUntil } = req.body;

    const questionnaire = await prisma.questionnaire.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(sourceScaleId !== undefined && { sourceScaleId }),
        ...(settings !== undefined && { settings }),
        ...(theme !== undefined && { theme }),
        ...(questions !== undefined && { questions }),
        ...(validFrom !== undefined && { validFrom: validFrom ? new Date(validFrom) : null }),
        ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
      },
    });

    res.json({ success: true, data: questionnaire });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/questionnaires/:id - 软删除问卷
questionnaireRouter.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.questionnaire.findFirst({
      where: { id: req.params.id, userId: req.userId, deletedAt: null },
    });
    if (!existing) {
      throw new AppError('问卷不存在', 404);
    }

    await prisma.questionnaire.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

// GET /api/questionnaires/public/:shareCode - 公开访问问卷（填写者使用）
questionnaireRouter.get('/public/:shareCode', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const distribution = await prisma.distribution.findUnique({
      where: { shareCode: req.params.shareCode },
      include: {
        questionnaire: {
          select: {
            id: true, title: true, description: true, questions: true,
            settings: true, theme: true, status: true, validFrom: true, validUntil: true,
          },
        },
      },
    });

    if (!distribution) {
      throw new AppError('问卷链接不存在或已失效', 404);
    }

    const q = distribution.questionnaire;
    if (q.status !== 'published') {
      throw new AppError('问卷暂未发布', 404);
    }

    if (q.validUntil && new Date(q.validUntil) < new Date()) {
      throw new AppError('问卷已过期', 410);
    }

    if (distribution.maxFills && distribution.fillCount >= distribution.maxFills) {
      throw new AppError('问卷已达到最大填写次数', 410);
    }

    res.json({ success: true, data: q });
  } catch (error) {
    next(error);
  }
});
