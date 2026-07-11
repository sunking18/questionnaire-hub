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

  // 创建问卷模板
  const templates = [
    {
      id: 'tmpl-consumer',
      name: '大学生消费情况调查',
      description: '了解大学生日常消费结构、消费观念与理财习惯，适用于高校消费行为研究。',
      category: '大学生',
      tags: ['大学生', '消费', '行为研究'],
      questions: [
        { id: 'q1', type: 'radio', title: '您的性别是', required: true, options: [{value:'0',label:'男'},{value:'1',label:'女'}] },
        { id: 'q2', type: 'radio', title: '您每月生活费约为', required: true, options: [{value:'0',label:'1000元以下'},{value:'1',label:'1000-2000元'},{value:'2',label:'2000-3000元'},{value:'3',label:'3000元以上'}] },
        { id: 'q3', type: 'checkbox', title: '您的主要消费项目有哪些？（可多选）', required: true, options: [{value:'0',label:'餐饮'},{value:'1',label:'服饰'},{value:'2',label:'娱乐'},{value:'3',label:'学习用品'},{value:'4',label:'交通'},{value:'5',label:'电子产品'}] },
        { id: 'q4', type: 'scale', title: '您对个人消费状况的满意程度', required: true, scaleConfig: {min:1,max:5,minLabel:'非常不满意',maxLabel:'非常满意',type:'star'} },
        { id: 'q5', type: 'textarea', title: '您认为大学生应树立怎样的消费观？', required: false },
      ],
    },
    {
      id: 'tmpl-love',
      name: '大学生恋爱观调查',
      description: '探索当代大学生恋爱态度、择偶标准与情感需求，适用于心理学与社会学研究。',
      category: '大学生',
      tags: ['大学生', '恋爱观', '心理'],
      questions: [
        { id: 'q1', type: 'radio', title: '您目前的恋爱状态是', required: true, options: [{value:'0',label:'单身'},{value:'1',label:'恋爱中'},{value:'2',label:'已婚'},{value:'3',label:'不愿透露'}] },
        { id: 'q2', type: 'radio', title: '您认为自己开始恋爱的合适年龄是', required: true, options: [{value:'0',label:'18岁以下'},{value:'1',label:'18-22岁'},{value:'2',label:'22-25岁'},{value:'3',label:'25岁以上'}] },
        { id: 'q3', type: 'checkbox', title: '您择偶时最看重哪些因素？（可多选）', required: true, options: [{value:'0',label:'性格'},{value:'1',label:'外貌'},{value:'2',label:'经济条件'},{value:'3',label:'家庭背景'},{value:'4',label:'共同兴趣'},{value:'5',label:'价值观一致'}] },
        { id: 'q4', type: 'scale', title: '您对恋爱中独立空间的重视程度', required: true, scaleConfig: {min:1,max:5,minLabel:'不重视',maxLabel:'非常重视',type:'heart'} },
        { id: 'q5', type: 'textarea', title: '请简述您理想中的亲密关系', required: false },
      ],
    },
    {
      id: 'tmpl-enterprise-sat',
      name: '企业满意度调查',
      description: '评估员工对企业整体环境、管理制度与发展空间的满意度，助力组织管理优化。',
      category: '企业',
      tags: ['企业', '满意度', '员工'],
      questions: [
        { id: 'q1', type: 'radio', title: '您在本企业工作年限', required: true, options: [{value:'0',label:'1年以下'},{value:'1',label:'1-3年'},{value:'2',label:'3-5年'},{value:'3',label:'5年以上'}] },
        { id: 'q2', type: 'scale', title: '您对公司的整体满意度', required: true, scaleConfig: {min:1,max:5,minLabel:'非常不满意',maxLabel:'非常满意',type:'star'} },
        { id: 'q3', type: 'scale', title: '您对直属领导的满意度', required: true, scaleConfig: {min:1,max:5,minLabel:'非常不满意',maxLabel:'非常满意',type:'star'} },
        { id: 'q4', type: 'scale', title: '您对工作环境的满意度', required: true, scaleConfig: {min:1,max:5,minLabel:'非常不满意',maxLabel:'非常满意',type:'star'} },
        { id: 'q5', type: 'checkbox', title: '您希望企业改善的方面有？（可多选）', required: false, options: [{value:'0',label:'薪酬福利'},{value:'1',label:'晋升机会'},{value:'2',label:'培训发展'},{value:'3',label:'工作氛围'},{value:'4',label:'办公环境'}] },
        { id: 'q6', type: 'textarea', title: '您对企业管理的其他建议', required: false },
      ],
    },
    {
      id: 'tmpl-qwl',
      name: '企业员工工作生活质量调查',
      description: '从工作负荷、工作生活平衡、职业成长等维度评估员工工作生活质量。',
      category: '企业',
      tags: ['企业', '生活质量', '心理健康'],
      questions: [
        { id: 'q1', type: 'scale', title: '我认为目前工作量适中', required: true, scaleConfig: {min:1,max:5,minLabel:'完全不同意',maxLabel:'完全同意',type:'number'} },
        { id: 'q2', type: 'scale', title: '我能够平衡好工作与生活', required: true, scaleConfig: {min:1,max:5,minLabel:'完全不同意',maxLabel:'完全同意',type:'number'} },
        { id: 'q3', type: 'scale', title: '我在这份工作中有成长感', required: true, scaleConfig: {min:1,max:5,minLabel:'完全不同意',maxLabel:'完全同意',type:'number'} },
        { id: 'q4', type: 'scale', title: '同事之间的支持让我感到温暖', required: true, scaleConfig: {min:1,max:5,minLabel:'完全不同意',maxLabel:'完全同意',type:'number'} },
        { id: 'q5', type: 'scale', title: '我对未来职业发展有信心', required: true, scaleConfig: {min:1,max:5,minLabel:'完全不同意',maxLabel:'完全同意',type:'number'} },
        { id: 'q6', type: 'textarea', title: '请描述您当前工作中最大的压力来源', required: false },
      ],
    },
    {
      id: 'tmpl-teacher-sat',
      name: '教师满意度调查',
      description: '了解教师对教学环境、职业发展、薪酬福利及学校支持的满意度。',
      category: '教育',
      tags: ['教师', '满意度', '教育'],
      questions: [
        { id: 'q1', type: 'radio', title: '您的教龄', required: true, options: [{value:'0',label:'1-5年'},{value:'1',label:'6-10年'},{value:'2',label:'11-20年'},{value:'3',label:'20年以上'}] },
        { id: 'q2', type: 'scale', title: '您对学校教学设施的满意度', required: true, scaleConfig: {min:1,max:5,minLabel:'非常不满意',maxLabel:'非常满意',type:'star'} },
        { id: 'q3', type: 'scale', title: '您对学校薪酬福利的满意度', required: true, scaleConfig: {min:1,max:5,minLabel:'非常不满意',maxLabel:'非常满意',type:'star'} },
        { id: 'q4', type: 'scale', title: '您对职业发展空间满意度', required: true, scaleConfig: {min:1,max:5,minLabel:'非常不满意',maxLabel:'非常满意',type:'star'} },
        { id: 'q5', type: 'checkbox', title: '您认为学校最需要改进的方面是？（可多选）', required: false, options: [{value:'0',label:'教学设备'},{value:'1',label:'培训机会'},{value:'2',label:'福利待遇'},{value:'3',label:'管理制度'},{value:'4',label:'学生支持'}] },
        { id: 'q6', type: 'textarea', title: '您对学校发展的其他建议', required: false },
      ],
    },
  ];

  for (const t of templates) {
    await prisma.template.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        tags: t.tags,
        questions: t.questions,
        isPublic: true,
      },
    });
    console.log('✅ Created template:', t.name);
  }

  console.log('\n🎉 Seed complete!');
  console.log('📧 Login: researcher@example.com');
  console.log('🔑 Password: password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
