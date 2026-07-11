import OpenAI from 'openai';
import { prisma } from '../utils/prisma';

const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'sk-your-openai-api-key') {
    return null;
  }
  return new OpenAI({ apiKey });
};

interface QuestionnaireWithConfig {
  id: string;
  title: string;
  questions: any;
  userId: string;
  reportConfigs?: {
    enabled: boolean;
    reportTitle?: string | null;
    reportStyle: string;
    aiModel: string;
    showOnSubmit: boolean;
    allowDownload: boolean;
    scoringRules: any;
  } | null;
}

interface ResponseData {
  id: string;
  answers: any;
  score: any;
  totalScore: any;
  severityLevel?: string | null;
  createdAt: Date;
}

// 根据总分匹配评分规则
function matchRule(scoringRules: any[], totalScore: number) {
  if (!scoringRules || !Array.isArray(scoringRules)) return null;

  for (const rule of scoringRules) {
    const min = rule.min ?? -Infinity;
    const max = rule.max ?? Infinity;
    if (totalScore >= min && totalScore <= max) {
      return rule;
    }
  }
  return null;
}

// 替换变量
function replaceVariables(template: string, variables: Record<string, any>) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value ?? ''));
  }
  return result;
}

// 生成个人报告
export async function generateReport(
  questionnaire: QuestionnaireWithConfig,
  response: ResponseData,
  forceRegenerate = false
) {
  const openai = getOpenAI();

  if (!questionnaire.reportConfigs?.enabled) {
    throw new Error('该问卷未启用AI报告');
  }

  const config = questionnaire.reportConfigs;
  const scoringRules = (config.scoringRules as any[]) || [];
  const totalScore = Number(response.totalScore);
  const matchedRule = matchRule(scoringRules, totalScore);

  const questions = questionnaire.questions as any[];
  const questionDetails = questions.map((q: any) => {
    const answer = (response.answers as Record<string, any>)[q.id];
    return `- **Q: ${q.title}** | 得分: ${answer ?? '未答'} | 维度: ${q.dimension || '无'}`;
  }).join('\n');

  // 提取维度得分
  const dimensionScores = (response.score as Record<string, any>) || {};
  const dimensionDetails = Object.entries(dimensionScores)
    .map(([dim, score]) => `- ${dim}: ${score}分`)
    .join('\n');

  const variables = {
    totalScore,
    maxScore: questions.length * 3,
    severityLevel: response.severityLevel || '未知',
    dimensionScores: dimensionDetails || '无维度数据',
    questionDetails,
    submitTime: response.createdAt.toISOString(),
    reportDate: new Date().toISOString().split('T')[0],
    questionnaireTitle: questionnaire.title,
  };

  let aiContent = '';
  let aiHtml = '';
  let tokensUsed = 0;
  let generationTime = 0;

  if (openai && matchedRule?.systemPrompt) {
    const systemPrompt = replaceVariables(matchedRule.systemPrompt, variables);
    const userPrompt = replaceVariables(matchedRule.userPrompt || '请根据以上规则和数据生成报告', variables);

    const startTime = Date.now();

    try {
      const completion = await openai.chat.completions.create({
        model: config.aiModel || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      generationTime = Date.now() - startTime;
      tokensUsed = completion.usage?.total_tokens || 0;
      aiContent = completion.choices[0]?.message?.content || '';

      // 简单 Markdown 转 HTML
      aiHtml = aiContent
        .replace(/### (.+)/g, '<h3>$1</h3>')
        .replace(/## (.+)/g, '<h2>$1</h2>')
        .replace(/# (.+)/g, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n- /g, '\n<li>')
        .replace(/\n/g, '<br/>');
      aiHtml = `<p>${aiHtml}</p>`;
    } catch (error) {
      console.error('OpenAI API error:', error);
      aiContent = `[AI报告生成失败，请稍后重试]`;
      aiHtml = `<p>${aiContent}</p>`;
    }
  } else {
    // 无 AI 时的默认报告
    const style = config.reportStyle === 'warm' ? '温暖关怀' : '专业学术';
    aiContent = `## ${config.reportTitle || '评估报告'}

### 评估概述
根据您的答题结果，总分为 ${totalScore} 分，评估等级为：**${response.severityLevel || '待定'}**。

### 详细分析
${dimensionDetails}

### 逐题回顾
${questionDetails}

### 建议
建议您结合专业意见进行进一步评估。

---
*本报告由 AI 自动生成（${style}风格），仅供参考。*
`;
    aiHtml = aiContent
      .replace(/### (.+)/g, '<h3>$1</h3>')
      .replace(/## (.+)/g, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n- /g, '\n<li>')
      .replace(/\n/g, '<br/>');
    aiHtml = `<p>${aiHtml}</p>`;
  }

  // Upsert 报告
  const report = await prisma.report.upsert({
    where: { responseId: response.id },
    create: {
      questionnaireId: questionnaire.id,
      responseId: response.id,
      totalScore,
      severityLevel: response.severityLevel || '未知',
      matchedRuleId: matchedRule?.id || null,
      aiModel: config.aiModel,
      aiContent,
      aiHtml,
      tokensUsed,
      generationTime,
      status: 'completed',
    },
    update: {
      totalScore,
      severityLevel: response.severityLevel || '未知',
      matchedRuleId: matchedRule?.id || null,
      aiContent,
      aiHtml,
      tokensUsed,
      generationTime,
      status: 'completed',
    },
  });

  return report;
}

// 生成整体分析报告
export async function generateAggregateAnalysis(questionnaire: QuestionnaireWithConfig) {
  const openai = getOpenAI();

  const responses = await prisma.response.findMany({
    where: { questionnaireId: questionnaire.id },
  });

  const totalResponses = responses.length;
  if (totalResponses === 0) {
    throw new Error('没有足够的答卷数据');
  }

  const scores = responses.map(r => Number(r.totalScore)).sort((a, b) => a - b);
  const avgScore = scores.reduce((a, b) => a + b, 0) / totalResponses;
  const medianScore = totalResponses % 2 === 0
    ? (scores[totalResponses / 2 - 1] + scores[totalResponses / 2]) / 2
    : scores[Math.floor(totalResponses / 2)];
  const variance = scores.reduce((s, v) => s + Math.pow(v - avgScore, 2), 0) / totalResponses;
  const stddevScore = Math.sqrt(variance);

  // 严重程度分布
  const severityDist: Record<string, number> = {};
  responses.forEach(r => {
    const level = r.severityLevel || '未知';
    severityDist[level] = (severityDist[level] || 0) + 1;
  });

  // 维度平均
  const questions = questionnaire.questions as any[];
  const dimensionMap = new Map<string, { total: number; count: number }>();
  questions.forEach((q: any) => {
    if (q.dimension) {
      if (!dimensionMap.has(q.dimension)) dimensionMap.set(q.dimension, { total: 0, count: 0 });
    }
  });

  responses.forEach(r => {
    const answers = r.answers as Record<string, any>;
    questions.forEach((q: any) => {
      if (q.dimension) {
        const val = parseFloat(answers[q.id]) || 0;
        const dim = dimensionMap.get(q.dimension)!;
        dim.total += val;
        dim.count += 1;
      }
    });
  });

  const dimensionAvg: Record<string, number> = {};
  dimensionMap.forEach((v, k) => {
    dimensionAvg[k] = Math.round((v.total / v.count) * 100) / 100;
  });

  // 分数段分布
  const maxScore = Math.max(...scores);
  const binCount = 5;
  const binSize = Math.ceil(maxScore / binCount) || 1;
  const scoreDist = [];
  for (let i = 0; i < binCount; i++) {
    const min = i * binSize;
    const max = (i + 1) * binSize - 1;
    const count = scores.filter(s => s >= min && s <= max).length;
    scoreDist.push({ range: `${min}-${max}`, min, max, count });
  }

  // AI 生成预警和整体分析
  let analysisContent = '';
  let analysisHtml = '';
  let alerts: any[] = [];
  let tokensUsed = 0;

  if (openai) {
    const severitySummary = Object.entries(severityDist)
      .map(([k, v]) => `${k}: ${v}人 (${Math.round((v as number) / totalResponses * 100)}%)`)
      .join(', ');

    const prompt = `你是一位心理健康数据分析专家。请根据以下问卷 "${questionnaire.title}" 的整体数据生成一份分析报告。

数据概览：
- 总答卷数：${totalResponses}
- 平均分：${avgScore.toFixed(1)}
- 中位数：${medianScore.toFixed(1)}
- 标准差：${stddevScore.toFixed(2)}
- 严重程度分布：${severitySummary}
- 各维度平均分：${JSON.stringify(dimensionAvg)}

请生成以下内容的 JSON 格式响应：
{
  "alerts": [
    { "level": "critical|warning|info", "title": "标题", "description": "描述" }
  ],
  "analysis": "Markdown格式的完整分析报告，包含：总体概述、关键发现(3-5点)、风险人群画像、干预建议(分级)、方法说明"
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: '你是数据分析专家，请严格返回JSON格式。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });

      tokensUsed = completion.usage?.total_tokens || 0;
      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      alerts = result.alerts || [];
      analysisContent = result.analysis || '';
      analysisHtml = analysisContent
        .replace(/### (.+)/g, '<h3>$1</h3>')
        .replace(/## (.+)/g, '<h2>$1</h2>')
        .replace(/# (.+)/g, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n- /g, '\n<li>')
        .replace(/\n/g, '<br/>');
      analysisHtml = `<p>${analysisHtml}</p>`;
    } catch (error) {
      console.error('Aggregate analysis AI error:', error);
    }
  }

  // 默认预警（当 AI 不可用时）
  if (alerts.length === 0) {
    const moderatePct = (severityDist['中重度'] || severityDist['重度'] || 0) / totalResponses;
    if (moderatePct > 0.2) {
      alerts.push({ level: 'critical', title: '中重度占比偏高', description: `中重度及以上占比 ${Math.round(moderatePct * 100)}%，建议关注` });
    }
    alerts.push({ level: 'info', title: '数据概览', description: `共收集 ${totalResponses} 份有效答卷，平均分 ${avgScore.toFixed(1)}` });
  }

  if (!analysisContent) {
    analysisContent = `## 总体概述\n共收集 ${totalResponses} 份答卷，平均分为 ${avgScore.toFixed(1)}，标准差 ${stddevScore.toFixed(2)}。\n\n## 关键发现\n1. 严重程度分布：${Object.entries(severityDist).map(([k, v]) => `${k} ${v}人`).join('，')}\n2. 各维度平均分请参考上方图表\n\n## 建议\n请结合实际情况进行分析判断。`;
  }

  // Upsert 整体分析
  const analysis = await prisma.aggregateAnalysis.upsert({
    where: { questionnaireId: questionnaire.id },
    create: {
      questionnaireId: questionnaire.id,
      totalResponses,
      avgTotalScore: avgScore,
      medianTotalScore: medianScore,
      stddevTotalScore: stddevScore,
      dimensionAvg,
      severityDist,
      scoreDist,
      analysisContent,
      analysisHtml,
      alerts,
      tokensUsed,
    },
    update: {
      totalResponses,
      avgTotalScore: avgScore,
      medianTotalScore: medianScore,
      stddevTotalScore: stddevScore,
      dimensionAvg,
      severityDist,
      scoreDist,
      analysisContent,
      analysisHtml,
      alerts,
      tokensUsed,
    },
  });

  return analysis;
}
