import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const scaleRouter = Router();

// GET /api/scales - 获取量表库列表
scaleRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, category, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { nameEn: { contains: search as string, mode: 'insensitive' } },
        { abbreviation: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (category && category !== 'all') {
      where.category = category as string;
    }

    const [scales, total] = await Promise.all([
      prisma.scale.findMany({
        where,
        select: {
          id: true, name: true, nameEn: true, abbreviation: true,
          category: true, cronbachAlpha: true, author: true, year: true,
          source: true, createdAt: true,
          _count: { select: { questions: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.scale.count({ where }),
    ]);

    res.json({
      success: true,
      data: scales.map(s => ({
        ...s,
        questionCount: (s.questions as any)?.length || 0,
      })),
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/scales/:id - 获取量表详情
scaleRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const scale = await prisma.scale.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });

    if (!scale) {
      throw new AppError('量表不存在', 404);
    }

    res.json({ success: true, data: scale });
  } catch (error) {
    next(error);
  }
});

// POST /api/scales - 创建量表
scaleRouter.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, nameEn, abbreviation, category, description, instructions, questions, dimensions, scoringRules, cronbachAlpha, author, year, source, isPublic } = req.body;

    const scale = await prisma.scale.create({
      data: {
        userId: req.userId!,
        name, nameEn, abbreviation, category, description, instructions,
        questions: questions || [],
        dimensions: dimensions || [],
        scoringRules,
        cronbachAlpha,
        author, year, source,
        isPublic: isPublic || false,
      },
    });

    res.status(201).json({ success: true, data: scale });
  } catch (error) {
    next(error);
  }
});

// PUT /api/scales/:id - 更新量表
scaleRouter.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.scale.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!existing) {
      throw new AppError('量表不存在', 404);
    }

    const updateData: any = {};
    const fields = ['name', 'nameEn', 'abbreviation', 'category', 'description', 'instructions', 'questions', 'dimensions', 'scoringRules', 'cronbachAlpha', 'author', 'year', 'source', 'isPublic'];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const scale = await prisma.scale.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ success: true, data: scale });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/scales/:id - 软删除量表
scaleRouter.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.scale.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!existing) {
      throw new AppError('量表不存在', 404);
    }

    await prisma.scale.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    next(error);
  }
});
