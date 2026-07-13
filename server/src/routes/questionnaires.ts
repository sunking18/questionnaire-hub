import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const questionnaireRouter = Router();

// GET /api/questionnaires - 获取问卷列表
questionnaireRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, status, page = '1', limit = '20', trash, starred } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId: req.userId,
    };

    if (trash === 'true') {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (starred === 'true') {
      where.isStarred = true;
      where.deletedAt = null;
    }

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
          deletedAt: true,
          isStarred: true,
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
    const id = req.params.id as string;
    const questionnaire = await prisma.questionnaire.findFirst({
      where: { id, userId: req.userId },
      include: {
        reportConfigs: true,
        aggregateAnalysis: true,
        notificationConfig: true,
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
      title, description, status = 'draft', type = 'survey', sourceScaleId, sourceTemplateId,
      coverImage, coverSettings, settings, theme, questions, validFrom, validUntil,
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
        type,
        sourceScaleId,
        sourceTemplateId,
        coverImage,
        coverSettings: coverSettings || undefined,
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
    const id = req.params.id as string;
    const existing = await prisma.questionnaire.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      throw new AppError('问卷不存在', 404);
    }

    const { title, description, status, sourceScaleId, sourceTemplateId, coverImage, coverSettings, type, settings, theme, questions, validFrom, validUntil, isStarred } = req.body;

    const questionnaire = await prisma.questionnaire.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(type !== undefined && { type }),
        ...(sourceScaleId !== undefined && { sourceScaleId }),
        ...(sourceTemplateId !== undefined && { sourceTemplateId }),
        ...(coverImage !== undefined && { coverImage }),
        ...(coverSettings !== undefined && { coverSettings }),
        ...(settings !== undefined && { settings }),
        ...(theme !== undefined && { theme }),
        ...(questions !== undefined && { questions }),
        ...(isStarred !== undefined && { isStarred }),
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
    const id = req.params.id as string;
    const existing = await prisma.questionnaire.findFirst({
      where: { id, userId: req.userId, deletedAt: null },
    });
    if (!existing) {
      throw new AppError('问卷不存在', 404);
    }

    await prisma.questionnaire.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

// POST /api/questionnaires/:id/clone - 复制问卷
questionnaireRouter.post('/:id/clone', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { title, includeSettings = false } = req.body;

    const existing = await prisma.questionnaire.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      throw new AppError('问卷不存在', 404);
    }

    const newTitle = title || `${existing.title} 副本`;
    const cloned = await prisma.questionnaire.create({
      data: {
        userId: req.userId!,
        title: newTitle,
        description: existing.description,
        type: existing.type,
        coverImage: existing.coverImage,
        coverSettings: existing.coverSettings as any,
        questions: existing.questions as any,
        settings: includeSettings ? (existing.settings as any) : {},
        theme: includeSettings ? (existing.theme as any) : {},
        validFrom: existing.validFrom,
        validUntil: existing.validUntil,
        status: 'draft',
        sourceScaleId: existing.sourceScaleId,
        sourceTemplateId: existing.sourceTemplateId,
      },
    });

    res.status(201).json({ success: true, data: cloned });
  } catch (error) {
    next(error);
  }
});

// PUT /api/questionnaires/:id/star - 星标/取消星标
questionnaireRouter.put('/:id/star', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { isStarred } = req.body;

    const existing = await prisma.questionnaire.findFirst({
      where: { id, userId: req.userId, deletedAt: null },
    });
    if (!existing) {
      throw new AppError('问卷不存在', 404);
    }

    await prisma.questionnaire.update({
      where: { id },
      data: { isStarred: !!isStarred },
    });

    res.json({ success: true, message: '设置成功' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/questionnaires/:id/restore - 恢复已删除问卷
questionnaireRouter.put('/:id/restore', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.questionnaire.findFirst({
      where: { id, userId: req.userId, deletedAt: { not: null } },
    });
    if (!existing) {
      throw new AppError('问卷不存在或不在回收站中', 404);
    }

    await prisma.questionnaire.update({
      where: { id },
      data: { deletedAt: null },
    });

    res.json({ success: true, message: '恢复成功' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/questionnaires/:id/permanent - 彻底删除问卷
questionnaireRouter.delete('/:id/permanent', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.questionnaire.findFirst({
      where: { id, userId: req.userId, deletedAt: { not: null } },
    });
    if (!existing) {
      throw new AppError('问卷不存在或不在回收站中', 404);
    }

    await prisma.questionnaire.delete({
      where: { id },
    });

    res.json({ success: true, message: '已彻底删除' });
  } catch (error) {
    next(error);
  }
});

// GET /api/questionnaires/:id/notifications - 获取提醒配置
questionnaireRouter.get('/:id/notifications', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.questionnaire.findFirst({
      where: { id, userId: req.userId, deletedAt: null },
    });
    if (!existing) {
      throw new AppError('问卷不存在', 404);
    }

    const config = await prisma.questionnaireNotificationConfig.findUnique({
      where: { questionnaireId: id },
    });

    res.json({ success: true, data: config || {} });
  } catch (error) {
    next(error);
  }
});

// PUT /api/questionnaires/:id/notifications - 保存提醒配置
questionnaireRouter.put('/:id/notifications', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.questionnaire.findFirst({
      where: { id, userId: req.userId, deletedAt: null },
    });
    if (!existing) {
      throw new AppError('问卷不存在', 404);
    }

    const {
      wechatEnabled, wechatOpenId,
      emailEnabled, emailAddresses, useCustomEmailServer,
      wecomEnabled, wecomWebhook,
      dingtalkEnabled, dingtalkWebhook,
      feishuEnabled, feishuWebhook,
    } = req.body;

    const config = await prisma.questionnaireNotificationConfig.upsert({
      where: { questionnaireId: id },
      create: {
        questionnaireId: id,
        wechatEnabled: !!wechatEnabled,
        wechatOpenId: wechatOpenId || null,
        emailEnabled: !!emailEnabled,
        emailAddresses: emailAddresses || null,
        useCustomEmailServer: !!useCustomEmailServer,
        wecomEnabled: !!wecomEnabled,
        wecomWebhook: wecomWebhook || null,
        dingtalkEnabled: !!dingtalkEnabled,
        dingtalkWebhook: dingtalkWebhook || null,
        feishuEnabled: !!feishuEnabled,
        feishuWebhook: feishuWebhook || null,
      },
      update: {
        ...(wechatEnabled !== undefined && { wechatEnabled: !!wechatEnabled }),
        ...(wechatOpenId !== undefined && { wechatOpenId: wechatOpenId || null }),
        ...(emailEnabled !== undefined && { emailEnabled: !!emailEnabled }),
        ...(emailAddresses !== undefined && { emailAddresses: emailAddresses || null }),
        ...(useCustomEmailServer !== undefined && { useCustomEmailServer: !!useCustomEmailServer }),
        ...(wecomEnabled !== undefined && { wecomEnabled: !!wecomEnabled }),
        ...(wecomWebhook !== undefined && { wecomWebhook: wecomWebhook || null }),
        ...(dingtalkEnabled !== undefined && { dingtalkEnabled: !!dingtalkEnabled }),
        ...(dingtalkWebhook !== undefined && { dingtalkWebhook: dingtalkWebhook || null }),
        ...(feishuEnabled !== undefined && { feishuEnabled: !!feishuEnabled }),
        ...(feishuWebhook !== undefined && { feishuWebhook: feishuWebhook || null }),
      },
    });

    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

// GET /api/questionnaires/public/:shareCode - 公开访问问卷（填写者使用）
questionnaireRouter.get('/public/:shareCode', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const shareCode = req.params.shareCode as string;
    const distribution = await prisma.distribution.findUnique({
      where: { shareCode },
      include: {
        questionnaire: {
          select: {
            id: true, title: true, description: true, coverImage: true, coverSettings: true,
            questions: true, settings: true, theme: true, status: true, validFrom: true, validUntil: true,
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
