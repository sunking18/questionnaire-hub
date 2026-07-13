import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { generateReport, generateAggregateAnalysis } from '../services/reportService';

export const reportRouter = Router();

// GET /api/reports - 获取报告列表
reportRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { questionnaireId, severityLevel, search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const where: any = {};
    if (questionnaireId) {
      where.questionnaireId = questionnaireId as string;
    }
    if (severityLevel && severityLevel !== 'all') {
      where.severityLevel = severityLevel as string;
    }

    // 只看自己问卷的报告
    where.questionnaire = { userId: req.userId, deletedAt: null };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        select: {
          id: true,
          questionnaireId: true,
          responseId: true,
          totalScore: true,
          severityLevel: true,
          matchedRuleId: true,
          aiModel: true,
          tokensUsed: true,
          generationTime: true,
          status: true,
          createdAt: true,
          questionnaire: { select: { title: true } },
          response: { select: { respondentId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.report.count({ where }),
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/:id - 获取报告详情
reportRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        questionnaire: { select: { title: true, questions: true, userId: true } },
        response: { select: { answers: true, score: true } },
      },
    });

    if (!report) {
      throw new AppError('报告不存在', 404);
    }

    if (report.questionnaire.userId !== req.userId) {
      throw new AppError('无权查看此报告', 403);
    }

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/respondent/:responseId - 填写者查看自己的报告
reportRouter.get('/respondent/:responseId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const responseId = req.params.responseId as string;
    const report = await prisma.report.findFirst({
      where: { responseId },
      include: {
        questionnaire: { select: { title: true, questions: true } },
        response: { select: { answers: true, score: true, totalScore: true, severityLevel: true } },
      },
    });

    if (!report) {
      throw new AppError('报告不存在或尚未生成', 404);
    }

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// POST /api/reports/:responseId/regenerate - 重新生成报告
reportRouter.post('/:responseId/regenerate', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const responseId = req.params.responseId as string;
    const existing = await prisma.report.findFirst({
      where: { responseId },
      include: {
        questionnaire: {
          include: { reportConfigs: true },
        },
        response: true,
      },
    });

    if (!existing) {
      throw new AppError('报告不存在', 404);
    }

    if (existing.questionnaire.userId !== req.userId) {
      throw new AppError('无权操作', 403);
    }

    const newReport = await generateReport(existing.questionnaire, existing.response, true);

    res.json({ success: true, data: newReport });
  } catch (error) {
    next(error);
  }
});

// POST /api/reports/aggregate/:questionnaireId - 生成整体分析报告
reportRouter.post('/aggregate/:questionnaireId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const qId = req.params.questionnaireId as string;
    const questionnaire = await prisma.questionnaire.findFirst({
      where: { id: qId, userId: req.userId, deletedAt: null },
      include: { reportConfigs: true },
    });

    if (!questionnaire) {
      throw new AppError('问卷不存在', 404);
    }

    const analysis = await generateAggregateAnalysis(questionnaire);

    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/aggregate/:questionnaireId - 获取整体分析报告
reportRouter.get('/aggregate/:questionnaireId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const qId = req.params.questionnaireId as string;
    const analysis = await prisma.aggregateAnalysis.findUnique({
      where: { questionnaireId: qId },
    });

    if (!analysis) {
      throw new AppError('整体分析报告尚未生成', 404);
    }

    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
});

// PUT /api/reports/config/:questionnaireId - 更新报告配置
reportRouter.put('/config/:questionnaireId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const qId = req.params.questionnaireId as string;
    const questionnaire = await prisma.questionnaire.findFirst({
      where: { id: qId, userId: req.userId },
    });
    if (!questionnaire) {
      throw new AppError('问卷不存在', 404);
    }

    const { enabled, reportTitle, reportStyle, aiModel, showOnSubmit, allowDownload, scoringRules } = req.body;

    const config = await prisma.reportConfig.upsert({
      where: { questionnaireId: qId },
      create: {
        questionnaireId: qId,
        enabled: enabled ?? false,
        reportTitle,
        reportStyle: reportStyle || 'professional',
        aiModel: aiModel || 'gpt-4o',
        showOnSubmit: showOnSubmit ?? true,
        allowDownload: allowDownload ?? true,
        scoringRules: scoringRules || [],
      },
      update: {
        ...(enabled !== undefined && { enabled }),
        ...(reportTitle !== undefined && { reportTitle }),
        ...(reportStyle !== undefined && { reportStyle }),
        ...(aiModel !== undefined && { aiModel }),
        ...(showOnSubmit !== undefined && { showOnSubmit }),
        ...(allowDownload !== undefined && { allowDownload }),
        ...(scoringRules !== undefined && { scoringRules }),
      },
    });

    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/config/:questionnaireId - 获取报告配置
reportRouter.get('/config/:questionnaireId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const qId = req.params.questionnaireId as string;
    const config = await prisma.reportConfig.findUnique({
      where: { questionnaireId: qId },
    });

    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});
