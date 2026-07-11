import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 创建测试用户
  const passwordHash = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'researcher@example.com' },
    update: {},
    create: {
      email: 'researcher@example.com',
      passwordHash,
      displayName: '张研究员',
      role: 'admin',
    },
  });
  console.log('✅ Created user:', user.email);

  // 创建 PHQ-9 量表
  const scale = await prisma.scale.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      userId: user.id,
      name: '病人健康问卷抑郁量表',
      nameEn: 'Patient Health Questionnaire-9',
      abbreviation: 'PHQ-9',
      category: '心理学',
      description: 'PHQ-9 是一种广泛使用的抑郁症筛查工具，包含 9 个条目，评估过去两周内的抑郁症状。该量表基于 DSM-IV 抑郁症诊断标准编制，具有良好的信效度。',
      instructions: '在过去的两周里，您有多少时候受到以下问题的困扰？请选择最符合您情况的选项。',
      questions: [
        {
          id: 'q1',
          type: 'radio',
          title: '做事时提不起劲或没有兴趣',
          required: true,
          dimension: '情感',
          options: [
            { value: '0', label: '完全不会' },
            { value: '1', label: '好几天' },
            { value: '2', label: '一半以上的天数' },
            { value: '3', label: '几乎每天' },
          ],
        },
        {
          id: 'q2',
          type: 'radio',
          title: '感到心情低落、沮丧或绝望',
          required: true,
          dimension: '情感',
          options: [
            { value: '0', label: '完全不会' },
            { value: '1', label: '好几天' },
            { value: '2', label: '一半以上的天数' },
            { value: '3', label: '几乎每天' },
          ],
        },
        {
          id: 'q3',
          type: 'radio',
          title: '入睡困难、睡不安稳或睡眠过多',
          required: true,
          dimension: '躯体',
          options: [
            { value: '0', label: '完全不会' },
            { value: '1', label: '好几天' },
            { value: '2', label: '一半以上的天数' },
            { value: '3', label: '几乎每天' },
          ],
        },
        {
          id: 'q4',
          type: 'radio',
          title: '感觉疲倦或没有活力',
          required: true,
          dimension: '躯体',
          options: [
            { value: '0', label: '完全不会' },
            { value: '1', label: '好几天' },
            { value: '2', label: '一半以上的天数' },
            { value: '3', label: '几乎每天' },
          ],
        },
        {
          id: 'q5',
          type: 'radio',
          title: '食欲不振或吃太多',
          required: true,
          dimension: '躯体',
          options: [
            { value: '0', label: '完全不会' },
            { value: '1', label: '好几天' },
            { value: '2', label: '一半以上的天数' },
            { value: '3', label: '几乎每天' },
          ],
        },
        {
          id: 'q6',
          type: 'radio',
          title: '觉得自己很糟，或觉得自己很失败，或让自己或家人失望',
          required: true,
          dimension: '认知',
          options: [
            { value: '0', label: '完全不会' },
            { value: '1', label: '好几天' },
            { value: '2', label: '一半以上的天数' },
            { value: '3', label: '几乎每天' },
          ],
        },
        {
          id: 'q7',
          type: 'radio',
          title: '对事物专注有困难，例如阅读报纸或看电视时',
          required: true,
          dimension: '认知',
          options: [
            { value: '0', label: '完全不会' },
            { value: '1', label: '好几天' },
            { value: '2', label: '一半以上的天数' },
            { value: '3', label: '几乎每天' },
          ],
        },
        {
          id: 'q8',
          type: 'radio',
          title: '动作或说话速度缓慢到别人已经觉察？或正好相反，您比平日更烦躁或坐立不安',
          required: true,
          dimension: '行为',
          options: [
            { value: '0', label: '完全不会' },
            { value: '1', label: '好几天' },
            { value: '2', label: '一半以上的天数' },
            { value: '3', label: '几乎每天' },
          ],
        },
        {
          id: 'q9',
          type: 'radio',
          title: '有不如死掉或用某种方式伤害自己的念头',
          required: true,
          dimension: '自伤',
          options: [
            { value: '0', label: '完全不会' },
            { value: '1', label: '好几天' },
            { value: '2', label: '一半以上的天数' },
            { value: '3', label: '几乎每天' },
          ],
        },
      ],
      dimensions: [
        { name: '情感', questionIds: ['q1', 'q2'], description: '情绪体验维度' },
        { name: '躯体', questionIds: ['q3', 'q4', 'q5'], description: '躯体症状维度' },
        { name: '认知', questionIds: ['q6', 'q7'], description: '认知功能维度' },
        { name: '行为', questionIds: ['q8'], description: '行为表现维度' },
        { name: '自伤', questionIds: ['q9'], description: '自伤风险维度' },
      ],
      scoringRules: {
        method: 'sum',
        range: { min: 0, max: 27 },
        severity: [
          { label: '正常', min: 0, max: 4 },
          { label: '轻度抑郁倾向', min: 5, max: 9 },
          { label: '中度抑郁倾向', min: 10, max: 14 },
          { label: '中重度抑郁倾向', min: 15, max: 19 },
          { label: '重度抑郁倾向', min: 20, max: 27 },
        ],
      },
      cronbachAlpha: 0.89,
      author: 'Kroenke K, Spitzer RL, Williams JB',
      year: 2001,
      source: 'Journal of General Internal Medicine, 16(9), 606-613',
      isPublic: true,
    },
  });
  console.log('✅ Created scale:', scale.name);

  // 创建 PHQ-9 问卷
  const questionnaire = await prisma.questionnaire.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      userId: user.id,
      title: 'PHQ-9 抑郁症筛查量表',
      description: '本问卷基于 PHQ-9 标准量表，用于抑郁症初步筛查。请根据您过去两周的实际情况如实作答。',
      status: 'published',
      isPublic: true,
      sourceScaleId: scale.id,
      settings: {
        fillLimit: 'unlimited',
        timeLimit: 30,
        anonymous: true,
      },
      theme: {
        primaryColor: '#0891B2',
        fontFamily: 'system-ui',
      },
      questions: scale.questions,
      fillCount: 0,
    },
  });
  console.log('✅ Created questionnaire:', questionnaire.title);

  // 创建 AI 报告配置
  await prisma.reportConfig.upsert({
    where: { questionnaireId: questionnaire.id },
    update: {},
    create: {
      questionnaireId: questionnaire.id,
      enabled: true,
      reportTitle: 'PHQ-9 心理健康评估报告',
      reportStyle: 'warm',
      aiModel: 'gpt-4o',
      showOnSubmit: true,
      allowDownload: true,
      scoringRules: [
        {
          id: 'rule-1',
          name: '正常范围',
          min: 0,
          max: 4,
          color: '#059669',
          systemPrompt: `你是一位温暖、专业的心理健康顾问。请根据以下评估结果，生成一份关怀备至的评估报告。

评估结果：
- 总分：{totalScore}/{maxScore}
- 等级：{severityLevel}
- 各维度得分：{dimensionScores}
- 逐题回顾：{questionDetails}

要求：
1. 语气温暖、共情、非评判性
2. 肯定填写者的自我关注行为
3. 简要说明评估结果的含义
4. 提供积极正向的生活建议
5. 字数：200-400字
6. 使用Markdown格式输出`,
          userPrompt: '请为本次PHQ-9评估生成报告',
        },
        {
          id: 'rule-2',
          name: '轻度抑郁倾向',
          min: 5,
          max: 9,
          color: '#D97706',
          systemPrompt: `你是一位温暖、专业的心理健康顾问。请根据以下评估结果，生成一份关怀备至的评估报告。

评估结果：
- 总分：{totalScore}/{maxScore}
- 等级：{severityLevel}
- 各维度得分：{dimensionScores}
- 逐题回顾：{questionDetails}

要求：
1. 语气温暖、共情、非评判性
2. 肯定填写者关注自身心理健康的勇气
3. 详细解释各维度的含义
4. 提供具体的自我调节建议
5. 建议如症状持续可寻求专业帮助
6. 字数：400-600字
7. 使用Markdown格式输出`,
          userPrompt: '请为本次PHQ-9评估生成报告',
        },
        {
          id: 'rule-3',
          name: '中重度及以上',
          min: 10,
          max: 27,
          color: '#DC2626',
          systemPrompt: `你是一位温暖、专业且谨慎的心理健康顾问。请根据以下评估结果，生成一份关怀备至的评估报告。

评估结果：
- 总分：{totalScore}/{maxScore}
- 等级：{severityLevel}
- 各维度得分：{dimensionScores}
- 逐题回顾：{questionDetails}

要求：
1. 语气温暖、共情，同时保持专业和谨慎
2. 强调这不是诊断，但结果提示需要专业评估
3. 详细分析各维度的表现
4. 提供危机支持资源（如心理援助热线）
5. 鼓励寻求专业心理医生的帮助
6. 如果自伤维度得分较高，需要特别关注并提供安全建议
7. 字数：500-800字
8. 使用Markdown格式输出`,
          userPrompt: '请为本次PHQ-4评估生成报告',
        },
      ],
    },
  });
  console.log('✅ Created report config');

  console.log('\n🎉 Seed complete!');
  console.log('📧 Login: researcher@example.com');
  console.log('🔑 Password: password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
