import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const statisticsRouter = Router();

// GET /api/statistics/:questionnaireId - 获取统计数据
statisticsRouter.get('/:questionnaireId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const qId = req.params.questionnaireId as string;
    const questionnaire = await prisma.questionnaire.findFirst({
      where: { id: qId, userId: req.userId, deletedAt: null },
    });
    if (!questionnaire) {
      throw new AppError('问卷不存在', 404);
    }

    const responses = await prisma.response.findMany({
      where: { questionnaireId: qId },
      orderBy: { createdAt: 'asc' },
    });

    const totalResponses = responses.length;

    if (totalResponses === 0) {
      return res.json({
        success: true,
        data: {
          totalResponses: 0,
          avgTotalScore: null,
          medianTotalScore: null,
          stddevTotalScore: null,
          minTotalScore: null,
          maxTotalScore: null,
          severityDistribution: {},
          scoreDistribution: [],
          dimensionStats: [],
          questionStats: [],
        },
      });
    }

    // 基本统计
    const scores = responses.map((r: any) => Number(r.totalScore)).sort((a: number, b: number) => a - b);
    const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / totalResponses;
    const medianScore = totalResponses % 2 === 0
      ? (scores[totalResponses / 2 - 1] + scores[totalResponses / 2]) / 2
      : scores[Math.floor(totalResponses / 2)];
    const variance = scores.reduce((sum: number, s: number) => sum + Math.pow(s - avgScore, 2), 0) / totalResponses;
    const stddevScore = Math.sqrt(variance);

    // 严重程度分布
    const severityDist: Record<string, number> = {};
    responses.forEach((r: any) => {
      const level = r.severityLevel || '未知';
      severityDist[level] = (severityDist[level] || 0) + 1;
    });

    // 分数段分布
    const maxScore = Math.max(...scores);
    const binCount = 5;
    const binSize = Math.ceil(maxScore / binCount) || 1;
    const scoreDist = [];
    for (let i = 0; i < binCount; i++) {
      const min = i * binSize;
      const max = (i + 1) * binSize - 1;
      const count = scores.filter((s: number) => s >= min && s <= max).length;
      scoreDist.push({ range: `${min}-${max}`, min, max, count });
    }

    // 维度统计
    const questions = questionnaire.questions as any[];
    const dimensionMap = new Map<string, number[]>();
    questions.forEach((q: any) => {
      if (q.dimension) {
        if (!dimensionMap.has(q.dimension)) dimensionMap.set(q.dimension, []);
        dimensionMap.get(q.dimension)!.push(questions.indexOf(q));
      }
    });

    const dimensionStats: any[] = [];
    dimensionMap.forEach((indices, dimName) => {
      const dimScores: number[] = [];
      responses.forEach((r: any) => {
        const answers = r.answers as Record<string, any>;
        let dimTotal = 0;
        indices.forEach((idx: number) => {
          const q = questions[idx];
          const val = parseFloat(answers[q.id]) || 0;
          dimTotal += val;
        });
        dimScores.push(dimTotal);
      });
      const dimAvg = dimScores.reduce((a, b) => a + b, 0) / dimScores.length;
      const dimStd = Math.sqrt(
        dimScores.reduce((sum, s) => sum + Math.pow(s - dimAvg, 2), 0) / dimScores.length
      );
      dimensionStats.push({
        dimension: dimName,
        itemCount: indices.length,
        avgScore: Math.round(dimAvg * 100) / 100,
        stddev: Math.round(dimStd * 100) / 100,
        maxPossibleScore: indices.length * 3, // 假设每题最高3分
      });
    });

    // 逐题统计
    const questionStats = questions.map((q: any) => {
      const vals = responses.map((r: any) => {
        const answers = r.answers as Record<string, any>;
        return parseFloat(answers[q.id]) || 0;
      });
      const avg = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
      const sorted = [...vals].sort((a, b) => a - b);
      const median = vals.length % 2 === 0
        ? (sorted[vals.length / 2 - 1] + sorted[vals.length / 2]) / 2
        : sorted[Math.floor(vals.length / 2)];

      // 众数
      const freqMap = new Map<number, number>();
      vals.forEach((v: number) => freqMap.set(v, (freqMap.get(v) || 0) + 1));
      let mode = 0;
      let maxFreq = 0;
      freqMap.forEach((freq, val) => {
        if (freq > maxFreq) { maxFreq = freq; mode = val; }
      });

      // 选项分布
      const optDist: Record<string, number> = {};
      vals.forEach((v: number) => { optDist[v.toString()] = (optDist[v.toString()] || 0) + 1; });

      return {
        questionId: q.id,
        title: q.title,
        type: q.type,
        avgScore: Math.round(avg * 100) / 100,
        stddev: Math.round(Math.sqrt(vals.reduce((s: number, v: number) => s + Math.pow(v - avg, 2), 0) / vals.length) * 100) / 100,
        median,
        mode,
        optionDistribution: optDist,
      };
    });

    res.json({
      success: true,
      data: {
        totalResponses,
        avgTotalScore: Math.round(avgScore * 100) / 100,
        medianTotalScore: Math.round(medianScore * 100) / 100,
        stddevTotalScore: Math.round(stddevScore * 100) / 100,
        minTotalScore: scores[0],
        maxTotalScore: scores[scores.length - 1],
        severityDistribution: severityDist,
        scoreDistribution: scoreDist,
        dimensionStats,
        questionStats,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/statistics/dashboard/overview - 仪表盘概览
statisticsRouter.get('/dashboard/overview', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [totalQuestionnaires, publishedCount, totalResponses, totalScales] = await Promise.all([
      prisma.questionnaire.count({ where: { userId: req.userId, deletedAt: null } }),
      prisma.questionnaire.count({ where: { userId: req.userId, deletedAt: null, status: 'published' } }),
      prisma.response.count({
        where: { questionnaire: { userId: req.userId, deletedAt: null } },
      }),
      prisma.scale.count({ where: { deletedAt: null } }),
    ]);

    // 最近问卷
    const recentQuestionnaires = await prisma.questionnaire.findMany({
      where: { userId: req.userId, deletedAt: null },
      select: {
        id: true, title: true, status: true, fillCount: true,
        createdAt: true, updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        totalQuestionnaires,
        publishedCount,
        totalResponses,
        totalScales,
        recentQuestionnaires,
      },
    });
  } catch (error) {
    next(error);
  }
});
