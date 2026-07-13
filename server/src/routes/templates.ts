import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const templateRouter = Router();

// GET /api/templates - 获取模板列表
templateRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, category, tag } = req.query;
    const where: any = { isPublic: true };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (category) {
      where.category = category as string;
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: { fillCount: 'desc' },
    });

    const filtered = tag
      ? templates.filter((t: any) => (t.tags as string[]).includes(tag as string))
      : templates;

    res.json({ success: true, data: filtered });
  } catch (error) {
    next(error);
  }
});

// GET /api/templates/:id - 获取模板详情
templateRouter.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const template = await prisma.template.findUnique({
      where: { id },
    });
    if (!template) {
      throw new AppError('模板不存在', 404);
    }
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

// POST /api/templates/:id/use - 使用模板创建问卷（可选）
templateRouter.post('/:id/use', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const template = await prisma.template.findUnique({
      where: { id },
    });
    if (!template) {
      throw new AppError('模板不存在', 404);
    }

    const questionnaire = await prisma.questionnaire.create({
      data: {
        userId: req.userId!,
        title: template.name,
        description: template.description,
        type: 'survey',
        questions: template.questions || [],
        sourceTemplateId: template.id,
        settings: template.settings || {},
      },
    });

    res.status(201).json({ success: true, data: questionnaire });
  } catch (error) {
    next(error);
  }
});
