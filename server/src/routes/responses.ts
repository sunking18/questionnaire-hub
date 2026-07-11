import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { generateReport } from '../services/reportService';

export const responseRouter = Router();

// POST /api/responses/:shareCode - 填写者提交答卷（无需登录）
responseRouter.post('/:shareCode', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const distribution = await prisma.distribution.findUnique({
      where: { shareCode: req.params.shareCode },
    });

    if (!distribution) {
      throw new AppError('问卷链接不存在', 404);
    }

    const questionnaire = await prisma.questionnaire.findFirst({
      where: { id: distribution.questionnaireId, deletedAt: null, status: 'published' },
      include: { reportConfigs: true },
    });

    if (!questionnaire) {
      throw new AppError('问卷不存在或未发布', 404);
    }

    if (distribution.maxFills && distribution.fillCount >= distribution.maxFills) {
      throw new AppError('已达到最大填写次数', 410);
    }

    const { answers, score, totalScore, severityLevel, duration } = req.body;

    const response = await prisma.response.create({
      data: {
        questionnaireId: questionnaire.id,
        respondentId: req.userId || null,
        answers: answers || {},
        score: score || {},
        totalScore: totalScore || null,
        severityLevel: severityLevel || null,
        duration: duration || null,
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    // 更新分发计数和问卷填写计数
    await prisma.distribution.update({
      where: { id: distribution.id },
      data: { fillCount: { increment: 1 } },
    });

    await prisma.questionnaire.update({
      where: { id: questionnaire.id },
      data: { fillCount: { increment: 1 } },
    });

    // 如果开启了AI报告，自动生成
    let report = null;
    if (questionnaire.reportConfigs?.enabled) {
      try {
        report = await generateReport(questionnaire, response);
      } catch (reportError) {
        console.error('AI报告生成失败:', reportError);
        // 报告生成失败不影响答卷提交
      }
    }

    res.status(201).json({
      success: true,
      data: {
        response: {
          id: response.id,
          totalScore: response.totalScore,
          severityLevel: response.severityLevel,
          createdAt: response.createdAt,
        },
        report: report ? {
          id: report.id,
          severityLevel: report.severityLevel,
          status: report.status,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/responses - 获取答卷列表（管理者）
responseRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { questionnaireId, search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const where: any = {};
    if (questionnaireId) {
      where.questionnaireId = questionnaireId as string;
      // 确保是用户的问卷
      const q = await prisma.questionnaire.findFirst({
        where: { id: questionnaireId as string, userId: req.userId },
      });
      if (!q) {
        throw new AppError('问卷不存在', 404);
      }
    } else {
      // 只看自己问卷的答卷
      where.questionnaire = { userId: req.userId, deletedAt: null };
    }

    const [responses, total] = await Promise.all([
      prisma.response.findMany({
        where,
        select: {
          id: true,
          questionnaireId: true,
          respondentId: true,
          totalScore: true,
          severityLevel: true,
          duration: true,
          status: true,
          createdAt: true,
          questionnaire: { select: { title: true } },
          report: { select: { id: true, severityLevel: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.response.count({ where }),
    ]);

    res.json({
      success: true,
      data: responses,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/responses/:id - 获取答卷详情
responseRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const response = await prisma.response.findUnique({
      where: { id: req.params.id },
      include: {
        questionnaire: {
          select: { title: true, questions: true, userId: true },
        },
        report: true,
      },
    });

    if (!response) {
      throw new AppError('答卷不存在', 404);
    }

    if (response.questionnaire.userId !== req.userId) {
      throw new AppError('无权查看此答卷', 403);
    }

    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/responses/:id - 删除答卷
responseRouter.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const response = await prisma.response.findUnique({
      where: { id: req.params.id },
      include: { questionnaire: { select: { userId: true } } },
    });

    if (!response) {
      throw new AppError('答卷不存在', 404);
    }
    if (response.questionnaire.userId !== req.userId) {
      throw new AppError('无权删除此答卷', 403);
    }

    await prisma.response.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    next(error);
  }
});

// GET /api/responses/export/:questionnaireId - 导出答卷
responseRouter.get('/export/:questionnaireId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const q = await prisma.questionnaire.findFirst({
      where: { id: req.params.questionnaireId, userId: req.userId, deletedAt: null },
    });
    if (!q) {
      throw new AppError('问卷不存在', 404);
    }

    const responses = await prisma.response.findMany({
      where: { questionnaireId: req.params.questionnaireId },
      orderBy: { createdAt: 'asc' },
    });

    // 构建 CSV
    const questions = q.questions as any[];
    const headers = ['序号', '提交时间', '总分', '严重程度', '耗时(秒)'];
    questions.forEach((q: any, i: number) => {
      headers.push(`Q${i + 1}-${q.title?.substring(0, 20) || ''}`);
    });

    const rows = responses.map((r, idx) => {
      const row = [
        idx + 1,
        r.createdAt.toISOString(),
        r.totalScore?.toString() || '',
        r.severityLevel || '',
        r.duration?.toString() || '',
      ];
      const answers = r.answers as Record<string, any>;
      questions.forEach((q: any) => {
        row.push(answers[q.id]?.toString() || '');
      });
      return row;
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=responses-${q.title}.csv`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    next(error);
  }
});
