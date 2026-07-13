import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Save, Plus, Trash2, GripVertical, ArrowLeft, Settings, Image as ImageIcon, Layers, Copy, X, Star, Heart, Smile, SlidersHorizontal,
  CircleDot, CheckSquare, List, AlignLeft, Text, Calendar, Grid3X3, ThumbsUp, MousePointer2, Type,
  FileText, ChevronDown, Bot, Download, Eye, Upload, ArrowUpDown, Layout, Menu, BookOpen, Search,
  User, Users, CreditCard, Hash, CalendarDays, Clock, MapPin, Mail, Phone, Building, Briefcase, Lock, Home, Smartphone, Globe,
  ClipboardList, BarChart3, MessageSquare, Database, BrainCircuit, PanelLeftClose
} from 'lucide-react';
import { questionnaireApi, reportApi } from '../api';
import type { Question, Questionnaire, CoverSettings, ScaleConfig, ReportConfig } from '../types';
import ReportConfigPanel from '../components/ReportConfigPanel';

const QUESTION_TYPES = [
  { group: '选择题', items: [
    { type: 'radio', label: '单选题', icon: CircleDot },
    { type: 'checkbox', label: '多选题', icon: CheckSquare },
    { type: 'dropdown', label: '下拉框', icon: List },
    { type: 'sort', label: '排序题', icon: ArrowUpDown },
    { type: 'file', label: '文件上传', icon: Upload },
    { type: 'scale', label: '量表题', icon: SlidersHorizontal },
  ]},
  { group: '填空题', items: [
    { type: 'text', label: '单行文本', icon: Type },
    { type: 'textarea', label: '多行文本', icon: AlignLeft },
    { type: 'number', label: '数字', icon: Hash },
    { type: 'date', label: '日期', icon: Calendar },
  ]},
  { group: '评分题', items: [
    { type: 'rating', label: '评分题', icon: Star },
    { type: 'scale', label: '量表题', icon: SlidersHorizontal },
    { type: 'nps', label: 'NPS', icon: ThumbsUp },
    { type: 'slider', label: '滑动条', icon: MousePointer2 },
  ]},
  { group: '矩阵题', items: [
    { type: 'matrix', label: '矩阵量表', icon: Grid3X3 },
  ]},
  { group: '分页说明', items: [
    { type: 'page', label: '分页栏', icon: Layout },
    { type: 'paragraph', label: '段落说明', icon: FileText },
    { type: 'section', label: '折叠栏目', icon: Menu },
  ]},
];

export const PERSONAL_INFO_TYPES = [
  { type: 'name', label: '姓名', icon: User, defaultTitle: '您的姓名' },
  { type: 'idcard', label: '身份证号', icon: CreditCard, defaultTitle: '您的身份证号' },
  { type: 'age', label: '年龄段', icon: CalendarDays, defaultTitle: '您的年龄段' },
  { type: 'gender', label: '性别', icon: Users, defaultTitle: '您的性别' },
  { type: 'education', label: '学历', icon: BookOpen, defaultTitle: '您的学历' },
  { type: 'ethnicity', label: '民族', icon: Users, defaultTitle: '您的民族' },
  { type: 'marriage', label: '婚姻', icon: Users, defaultTitle: '您的婚姻状况' },
  { type: 'country', label: '国家及地区', icon: Globe, defaultTitle: '您所在的国家及地区' },
  { type: 'province', label: '省市', icon: MapPin, defaultTitle: '您所在的省市' },
  { type: 'region', label: '省市区', icon: MapPin, defaultTitle: '您所在的省市区' },
  { type: 'email', label: '邮箱', icon: Mail, defaultTitle: '您的邮箱' },
  { type: 'phone', label: '手机', icon: Phone, defaultTitle: '您的手机号' },
  { type: 'phoneVerify', label: '手机验证', icon: Smartphone, defaultTitle: '请验证您的手机号' },
  { type: 'birthday', label: '日期/生日', icon: CalendarDays, defaultTitle: '您的出生日期' },
  { type: 'time', label: '时间', icon: Clock, defaultTitle: '请选择时间' },
  { type: 'occupation', label: '职业', icon: Briefcase, defaultTitle: '您的职业' },
  { type: 'university', label: '高校', icon: BookOpen, defaultTitle: '您就读的高校' },
  { type: 'industry', label: '行业', icon: Building, defaultTitle: '您所在的行业' },
  { type: 'password', label: '密码', icon: Lock, defaultTitle: '请输入密码' },
  { type: 'address', label: '邮寄地址', icon: Home, defaultTitle: '您的邮寄地址' },
  { type: 'device', label: '设备信息', icon: Smartphone, defaultTitle: '设备信息' },
  { type: 'cityLevel', label: '城市级别', icon: MapPin, defaultTitle: '城市级别' },
  { type: 'company', label: '企业信息', icon: Building, defaultTitle: '企业信息' },
];

const PERSONAL_INFO_OPTIONS: Record<string, string[]> = {
  gender: ['男', '女', '保密'],
  age: ['18岁以下', '18-25岁', '26-35岁', '36-45岁', '46-55岁', '56岁及以上'],
  education: ['小学及以下', '初中', '高中/中专', '大专', '本科', '硕士', '博士及以上'],
  ethnicity: ['汉族', '蒙古族', '回族', '藏族', '维吾尔族', '苗族', '彝族', '壮族', '其他'],
  marriage: ['未婚', '已婚', '离异', '丧偶', '保密'],
  cityLevel: ['一线城市', '新一线城市', '二线城市', '三线城市', '四线及以下'],
};

const SCALE_TYPES: { value: ScaleConfig['type']; label: string; icon: any }[] = [
  { value: 'number', label: '数字', icon: Text },
  { value: 'star', label: '星星', icon: Star },
  { value: 'heart', label: '爱心', icon: Heart },
  { value: 'emoji', label: '表情', icon: Smile },
  { value: 'slider', label: '滑块', icon: SlidersHorizontal },
];

export default function QuestionnaireEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;
  const openReportConfigFromList = (location.state as { openReportConfig?: boolean } | null)?.openReportConfig;

  const [title, setTitle] = useState('未命名问卷');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [coverSettings, setCoverSettings] = useState<CoverSettings>({
    enabled: false, title: '', description: '', submitButtonText: '开始作答', showProgress: true, showTimer: false,
  });
  const [activeTab, setActiveTab] = useState<'design' | 'cover'>('design');
  const [saving, setSaving] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [activeBulkTab, setActiveBulkTab] = useState<'text' | 'bank'>('text');
  const [bankQuestionnaires, setBankQuestionnaires] = useState<Questionnaire[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBankQuestionnaireId, setSelectedBankQuestionnaireId] = useState<string | null>(null);
  const [selectedBankQuestionnaire, setSelectedBankQuestionnaire] = useState<Questionnaire | null>(null);
  const [selectedBankQuestionIds, setSelectedBankQuestionIds] = useState<Set<string>>(new Set());
  const [stripNumberOnImport, setStripNumberOnImport] = useState(true);
  const [showSelectedBankQuestions, setShowSelectedBankQuestions] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [showReportConfig, setShowReportConfig] = useState(false);
  const [reportConfig, setReportConfig] = useState<ReportConfig | null>(null);

  // Q-hub sidebar state - auto-hide to the left, show on hover
  const [hubOpen, setHubOpen] = useState(false);
  const hubTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hubRef = useRef<HTMLDivElement>(null);

  const handleHubMouseEnter = useCallback(() => {
    if (hubTimeoutRef.current) clearTimeout(hubTimeoutRef.current);
    setHubOpen(true);
  }, []);

  const handleHubMouseLeave = useCallback(() => {
    hubTimeoutRef.current = setTimeout(() => {
      setHubOpen(false);
    }, 300);
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      Promise.all([
        questionnaireApi.getById(id),
        reportApi.getConfig(id).catch(() => ({ data: { data: null } })),
      ]).then(([qRes, cRes]) => {
        const q = qRes.data.data;
        setTitle(q.title);
        setDescription(q.description || '');
        setQuestions(q.questions || []);
        setCoverSettings(q.coverSettings || {
          enabled: false, title: q.title, description: q.description || '', submitButtonText: '开始作答', showProgress: true, showTimer: false,
        });
        setReportConfig(cRes.data.data);
        if (openReportConfigFromList) {
          setShowReportConfig(true);
          window.history.replaceState({}, document.title);
        }
      }).catch(() => navigate('/questionnaires'));
    }
  }, [id]);

  const save = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await questionnaireApi.update(id, { title, description, questions, coverSettings });
    } finally {
      setSaving(false);
    }
  };

  const saveAndPreview = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await questionnaireApi.update(id, { title, description, questions, coverSettings });
      navigate(`/questionnaires/${id}/preview`);
    } finally {
      setSaving(false);
    }
  };

  const saveAndReturn = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await questionnaireApi.update(id, { title, description, questions, coverSettings });
      navigate('/questionnaires');
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = (type: Question['type'], defaultTitle?: string) => {
    const newQ: Question = {
      id: `q-${Date.now()}`,
      type,
      title: defaultTitle || '',
      required: true,
    };
    if (type === 'radio' || type === 'checkbox' || type === 'dropdown' || type === 'sort') {
      newQ.options = [
        { value: '0', label: '选项1' },
        { value: '1', label: '选项2' },
      ];
    }
    if (type === 'sort') newQ.title = '请对以下选项排序';
    if (type === 'file') {
      newQ.title = '请上传文件';
      newQ.placeholder = '支持 jpg、png、pdf 等格式';
    }
    if (type === 'page') newQ.title = '分页标题';
    if (type === 'paragraph') {
      newQ.title = '段落说明';
      newQ.description = '在此输入说明文字';
      newQ.required = false;
    }
    if (type === 'section') {
      newQ.title = '折叠栏目';
      newQ.description = '点击展开/收起内容';
      newQ.required = false;
    }
    if (type === 'rating' || type === 'scale') {
      newQ.scaleConfig = { min: 1, max: 5, minLabel: '非常不满意', maxLabel: '非常满意', type: 'star' };
    }
    if (type === 'nps') {
      newQ.scaleConfig = { min: 0, max: 10, minLabel: '不可能', maxLabel: '极有可能', type: 'number' };
    }
    if (type === 'slider') {
      newQ.scaleConfig = { min: 0, max: 100, minLabel: '0', maxLabel: '100', type: 'slider' };
    }
    if (type === 'matrix') {
      newQ.matrixRows = [{ id: 'r0', label: '行标题1' }, { id: 'r1', label: '行标题2' }];
      newQ.matrixColumns = [{ id: 'c0', label: '1' }, { id: 'c1', label: '2' }, { id: 'c2', label: '3' }, { id: 'c3', label: '4' }, { id: 'c4', label: '5' }];
    }
    // 个人信息题：赋默认标题和选项
    if (PERSONAL_INFO_OPTIONS[type]) {
      newQ.options = PERSONAL_INFO_OPTIONS[type].map((label, i) => ({ value: String(i), label }));
      newQ.personalInfoType = type;
    } else if (['name', 'idcard', 'email', 'phone', 'phoneVerify', 'address', 'university', 'occupation', 'industry', 'company', 'region', 'country', 'birthday', 'time'].includes(type)) {
      newQ.placeholder = defaultTitle || newQ.title;
      newQ.personalInfoType = type;
    }
    setQuestions([...questions, newQ]);
    setSelectedQuestion(questions.length);
  };

  const updateQuestion = (idx: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const addOption = (qIdx: number) => {
    const updated = [...questions];
    const q = updated[qIdx];
    if (q.options) {
      q.options = [...q.options, { value: String(q.options.length), label: `选项${q.options.length + 1}` }];
    }
    setQuestions(updated);
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const updated = [...questions];
    if (updated[qIdx].options) {
      updated[qIdx].options![oIdx].label = value;
    }
    setQuestions(updated);
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    const updated = [...questions];
    if (updated[qIdx].options) {
      updated[qIdx].options = updated[qIdx].options!.filter((_, i) => i !== oIdx);
    }
    setQuestions(updated);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
    if (selectedQuestion === idx) setSelectedQuestion(null);
  };

  const duplicateQuestion = (idx: number) => {
    const q = questions[idx];
    setQuestions([...questions.slice(0, idx + 1), { ...q, id: `q-${Date.now()}` }, ...questions.slice(idx + 1)]);
  };

  const parseBulkQuestions = () => {
    const blocks = bulkText.split(/\n\s*\n/).filter(b => b.trim());
    return blocks.map((block, idx) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      const title = lines[0].replace(/^\d+[\.、\s]+/, '');
      const options = lines.slice(1).map((l, i) => ({
        value: String(i),
        label: l.replace(/^[A-Da-d][\.、\s]+/, '').replace(/^\d+[\.、\s]+/, ''),
      })).filter(o => o.label);
      return {
        id: `q-${Date.now()}-${idx}`,
        type: options.length > 0 ? 'radio' as const : 'text' as const,
        title,
        required: true,
        options: options.length > 0 ? options : undefined,
      };
    });
  };

  const submitBulkAdd = () => {
    if (!bulkText.trim()) return;
    setQuestions([...questions, ...parseBulkQuestions()]);
    setBulkText('');
    setShowBulkAdd(false);
  };

  const loadBankQuestionnaires = useCallback(async () => {
    setBankLoading(true);
    try {
      const res = await questionnaireApi.list({ status: 'all', limit: 100 });
      setBankQuestionnaires(res.data.data);
    } catch {
      setBankQuestionnaires([]);
    } finally {
      setBankLoading(false);
    }
  }, []);

  const handleSelectBankQuestionnaire = useCallback(async (qid: string) => {
    setSelectedBankQuestionnaireId(qid);
    setSelectedBankQuestionIds(new Set());
    try {
      const res = await questionnaireApi.getById(qid);
      setSelectedBankQuestionnaire(res.data.data);
    } catch {
      setSelectedBankQuestionnaire(null);
    }
  }, []);

  const toggleBankQuestionSelection = (qid: string) => {
    setSelectedBankQuestionIds(prev => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid);
      else next.add(qid);
      return next;
    });
  };

  const toggleAllBankQuestions = () => {
    const allIds = selectedBankQuestionnaire?.questions.map(q => q.id) || [];
    if (selectedBankQuestionIds.size === allIds.length) {
      setSelectedBankQuestionIds(new Set());
    } else {
      setSelectedBankQuestionIds(new Set(allIds));
    }
  };

  const stripQuestionNumber = (title: string) => {
    if (!stripNumberOnImport) return title;
    return title.replace(/^\d+[\.、\s]+/, '').trim();
  };

  const submitBankAdd = () => {
    if (!selectedBankQuestionnaire || selectedBankQuestionIds.size === 0) return;
    const selectedQuestions = selectedBankQuestionnaire.questions.filter(q => selectedBankQuestionIds.has(q.id));
    const imported = selectedQuestions.map(q => ({
      ...q,
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: stripQuestionNumber(q.title),
    }));
    setQuestions([...questions, ...imported]);
    setSelectedBankQuestionIds(new Set());
    setSelectedBankQuestionnaire(null);
    setSelectedBankQuestionnaireId(null);
    setShowBulkAdd(false);
    setActiveBulkTab('text');
  };

  const filteredBankQuestionnaires = bankQuestionnaires.filter(q =>
    q.title.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const renderQuestionEditor = (q: Question, idx: number) => {
    const isSelected = selectedQuestion === idx;
    return (
      <div
        key={q.id}
        onClick={() => setSelectedQuestion(idx)}
        className={`card p-5 mb-4 cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-primary/30 border-primary' : 'border-transparent'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1 text-text-muted font-medium text-sm">{idx + 1}.</div>
          <div className="flex-1">
            <input
              type="text"
              value={q.title}
              onChange={(e) => updateQuestion(idx, 'title', e.target.value)}
              placeholder="请输入题目"
              className="input mb-3 font-medium"
            />

            {(q.type === 'radio' || q.type === 'checkbox' || q.type === 'dropdown' || q.type === 'sort') && q.options && (
              <div className="space-y-2 mb-3">
                {q.type === 'sort' && (
                  <p className="text-xs text-text-muted mb-1">答题者将按优先级拖拽排序以下选项</p>
                )}
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    {q.type === 'radio' && <CircleDot size={16} className="text-text-muted" />}
                    {q.type === 'checkbox' && <CheckSquare size={16} className="text-text-muted" />}
                    {(q.type === 'dropdown' || q.type === 'sort') && <span className="text-text-muted text-sm">{oIdx + 1}.</span>}
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => updateOption(idx, oIdx, e.target.value)}
                      className="flex-1 input py-2 text-sm"
                      placeholder={`选项${oIdx + 1}`}
                    />
                    <button onClick={(e) => { e.stopPropagation(); removeOption(idx, oIdx); }} className="text-text-muted hover:text-danger">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button onClick={(e) => { e.stopPropagation(); addOption(idx); }} className="text-primary text-sm flex items-center gap-1 mt-2">
                  <Plus size={14} /> 添加选项
                </button>
              </div>
            )}

            {(q.type === 'text' || q.type === 'textarea' || q.type === 'number' || q.type === 'date' || q.type === 'name' || q.type === 'idcard' || q.type === 'email' || q.type === 'phone' || q.type === 'phoneVerify' || q.type === 'address' || q.type === 'university' || q.type === 'occupation' || q.type === 'industry' || q.type === 'company' || q.type === 'country' || q.type === 'password' || q.type === 'time') && (
              <input
                type="text"
                disabled
                value={q.placeholder || '答题者在此输入...'}
                className="input bg-background text-text-muted text-sm mb-3"
              />
            )}

            {(q.type === 'birthday' || q.type === 'age') && (
              <input
                type="text"
                disabled
                value={q.placeholder || '请选择...'}
                className="input bg-background text-text-muted text-sm mb-3"
              />
            )}

            {(q.type === 'province' || q.type === 'region' || q.type === 'cityLevel') && q.options && (
              <div className="space-y-2 mb-3">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <CircleDot size={16} className="text-text-muted" />
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => updateOption(idx, oIdx, e.target.value)}
                      className="flex-1 input py-2 text-sm"
                      placeholder={`选项${oIdx + 1}`}
                    />
                    <button onClick={(e) => { e.stopPropagation(); removeOption(idx, oIdx); }} className="text-text-muted hover:text-danger">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button onClick={(e) => { e.stopPropagation(); addOption(idx); }} className="text-primary text-sm flex items-center gap-1 mt-2">
                  <Plus size={14} /> 添加选项
                </button>
              </div>
            )}

            {q.type === 'file' && (
              <div className="bg-background rounded-lg p-4 mb-3 flex items-center gap-3 text-text-muted text-sm">
                <Upload size={18} />
                <span>{q.placeholder || '点击上传文件'}</span>
              </div>
            )}

            {q.type === 'page' && (
              <div className="border-t-2 border-dashed border-primary/30 py-3 my-2">
                <p className="text-sm text-text-muted">分页栏 — 答题者点击「下一页」后进入后续题目</p>
              </div>
            )}

            {q.type === 'paragraph' && (
              <textarea
                value={q.description}
                onChange={(e) => updateQuestion(idx, 'description', e.target.value)}
                placeholder="在此输入说明文字"
                rows={3}
                className="w-full input text-sm mb-3"
              />
            )}

            {q.type === 'section' && (
              <div className="bg-background rounded-lg p-4 mb-3">
                <p className="text-sm text-text-muted mb-2">折叠栏目 — 默认收起，点击展开</p>
                <textarea
                  value={q.description}
                  onChange={(e) => updateQuestion(idx, 'description', e.target.value)}
                  placeholder="展开后显示的内容"
                  rows={3}
                  className="w-full input text-sm"
                />
              </div>
            )}

            {(q.type === 'rating' || q.type === 'scale' || q.type === 'nps' || q.type === 'slider') && q.scaleConfig && (
              <div className="bg-background rounded-lg p-4 mb-3">
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <label className="label">最小值</label>
                    <input
                      type="number"
                      value={q.scaleConfig.min}
                      onChange={(e) => updateQuestion(idx, 'scaleConfig', { ...q.scaleConfig, min: Number(e.target.value) })}
                      className="input w-20"
                    />
                  </div>
                  <div>
                    <label className="label">最大值</label>
                    <input
                      type="number"
                      value={q.scaleConfig.max}
                      onChange={(e) => updateQuestion(idx, 'scaleConfig', { ...q.scaleConfig, max: Number(e.target.value) })}
                      className="input w-20"
                    />
                  </div>
                  <div>
                    <label className="label">样式</label>
                    <select
                      value={q.scaleConfig.type}
                      onChange={(e) => updateQuestion(idx, 'scaleConfig', { ...q.scaleConfig, type: e.target.value as ScaleConfig['type'] })}
                      className="input w-28"
                    >
                      {SCALE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={q.scaleConfig.minLabel}
                    onChange={(e) => updateQuestion(idx, 'scaleConfig', { ...q.scaleConfig, minLabel: e.target.value })}
                    className="input text-sm"
                    placeholder="最低分标签"
                  />
                  <input
                    type="text"
                    value={q.scaleConfig.maxLabel}
                    onChange={(e) => updateQuestion(idx, 'scaleConfig', { ...q.scaleConfig, maxLabel: e.target.value })}
                    className="input text-sm"
                    placeholder="最高分标签"
                  />
                </div>
              </div>
            )}

            {q.type === 'matrix' && (
              <div className="bg-background rounded-lg p-4 mb-3 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2"></th>
                      {q.matrixColumns?.map((col, cIdx) => (
                        <th key={col.id} className="p-2 text-center min-w-[60px]">
                          <input
                            value={col.label}
                            onChange={(e) => {
                              const cols = [...(q.matrixColumns || [])];
                              cols[cIdx].label = e.target.value;
                              updateQuestion(idx, 'matrixColumns', cols);
                            }}
                            className="input text-center py-1"
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {q.matrixRows?.map((row, rIdx) => (
                      <tr key={row.id}>
                        <td className="p-2">
                          <input
                            value={row.label}
                            onChange={(e) => {
                              const rows = [...(q.matrixRows || [])];
                              rows[rIdx].label = e.target.value;
                              updateQuestion(idx, 'matrixRows', rows);
                            }}
                            className="input py-1"
                          />
                        </td>
                        {q.matrixColumns?.map((col) => (
                          <td key={col.id} className="p-2 text-center">
                            <CircleDot size={14} className="mx-auto text-text-muted" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex gap-2 mt-2">
                  <button onClick={(e) => { e.stopPropagation(); updateQuestion(idx, 'matrixRows', [...(q.matrixRows || []), { id: `r-${Date.now()}`, label: '' }]); }} className="text-primary text-xs flex items-center gap-1">
                    <Plus size={12} /> 添加行
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); updateQuestion(idx, 'matrixColumns', [...(q.matrixColumns || []), { id: `c-${Date.now()}`, label: String((q.matrixColumns?.length || 0) + 1) }]); }} className="text-primary text-xs flex items-center gap-1">
                    <Plus size={12} /> 添加列
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mt-3">
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) => updateQuestion(idx, 'required', e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                必填
              </label>
              <button onClick={(e) => { e.stopPropagation(); duplicateQuestion(idx); }} className="text-sm text-text-secondary hover:text-primary flex items-center gap-1">
                <Copy size={14} /> 复制
              </button>
              <button onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }} className="text-sm text-danger hover:text-danger-hover flex items-center gap-1">
                <Trash2 size={14} /> 删除
              </button>
            </div>
          </div>
          <div className="cursor-grab text-text-muted">
            <GripVertical size={18} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="bg-surface border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/questionnaires')} className="text-text-secondary hover:text-text-primary">
            <ArrowLeft size={20} />
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-bold text-lg bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 text-text-primary"
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowReportConfig(true)} className={`btn-secondary text-sm flex items-center gap-2 ${reportConfig?.enabled ? 'text-primary' : ''}`}>
            <Bot size={16} /> 报告配置
            {reportConfig?.enabled && <span className="w-2 h-2 rounded-full bg-success" />}
          </button>
          <button onClick={() => { setActiveBulkTab('text'); setShowBulkAdd(true); }} className="btn-secondary text-sm flex items-center gap-2">
            <Layers size={16} /> 批量添加
          </button>
          <button onClick={() => { setActiveBulkTab('bank'); setShowBulkAdd(true); loadBankQuestionnaires(); }} className="btn-secondary text-sm flex items-center gap-2">
            <BookOpen size={16} /> 从我的题库
          </button>
          <button onClick={() => setActiveTab('cover')} className="btn-secondary text-sm flex items-center gap-2">
            <ImageIcon size={16} /> 封面设置
          </button>
          <button onClick={save} disabled={saving} className="btn-secondary text-sm flex items-center gap-2">
            <Save size={16} /> {saving ? '保存中...' : '保存'}
          </button>
          <button onClick={saveAndPreview} disabled={saving} className="btn-secondary text-sm flex items-center gap-2">
            <Eye size={16} /> {saving ? '保存中...' : '预览'}
          </button>
          <button onClick={saveAndReturn} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
            <Save size={16} /> {saving ? '保存中...' : '完成编辑'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Q-hub sidebar - auto-hide to left, slides out on hover */}
        <div
          ref={hubRef}
          className="relative z-10 flex-shrink-0"
          onMouseEnter={handleHubMouseEnter}
          onMouseLeave={handleHubMouseLeave}
        >
          {/* Invisible hover trigger zone - always visible as a thin strip */}
          <div className="absolute left-0 top-0 bottom-0 w-3 z-0" />

          {/* Q-hub panel */}
          <div
            className={`h-full bg-surface border-r border-border overflow-y-auto transition-all duration-300 ease-in-out relative z-10 ${
              hubOpen ? 'w-56' : 'w-0'
            }`}
          >
            <div className="w-56 p-4" style={{ minWidth: '14rem' }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-white font-bold text-xs">Q</span>
                  </div>
                  <span className="font-bold text-text-primary text-lg">Q-hub</span>
                </div>
                <button
                  onClick={() => setHubOpen(false)}
                  className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-background transition-colors"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                <button
                  onClick={() => { navigate('/questionnaires'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-primary-light hover:text-primary transition-all"
                >
                  <ClipboardList size={18} />
                  问卷管理
                </button>
                <button
                  onClick={() => { /* 当前页 */ }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm bg-primary-light text-primary font-medium transition-all"
                >
                  <FileText size={18} />
                  问卷编辑
                </button>
                <button
                  onClick={() => { /* navigate to statistics */ }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-primary-light hover:text-primary transition-all"
                >
                  <BarChart3 size={18} />
                  数据统计
                </button>
                <button
                  onClick={() => { /* navigate to responses */ }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-primary-light hover:text-primary transition-all"
                >
                  <MessageSquare size={18} />
                  答卷管理
                </button>
                <button
                  onClick={() => { /* navigate to AI tools */ }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-primary-light hover:text-primary transition-all"
                >
                  <BrainCircuit size={18} />
                  AI 工具
                </button>
                <button
                  onClick={() => { /* navigate to templates */ }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-primary-light hover:text-primary transition-all"
                >
                  <Database size={18} />
                  题库模板
                </button>
              </nav>

              {/* Divider */}
              <div className="border-t border-border my-4" />

              {/* Quick info */}
              <div className="px-3">
                <p className="text-xs text-text-muted mb-2">当前问卷</p>
                <p className="text-sm font-medium text-text-primary truncate">{title}</p>
                <p className="text-xs text-text-muted mt-1">{questions.length} 道题目</p>
              </div>
            </div>
          </div>
        </div>

        {/* Left sidebar - question types */}
        <div className="w-64 bg-surface border-r border-border overflow-y-auto p-4 flex-shrink-0">
          <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
            <Plus size={18} className="text-primary" /> 添加题型
          </h3>
          {QUESTION_TYPES.map(group => (
            <div key={group.group} className="mb-5">
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">{group.group}</h4>
              <div className="space-y-1">
                {group.items.map(item => (
                  <button
                    key={item.type}
                    onClick={() => addQuestion(item.type as Question['type'])}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-primary-light hover:text-primary transition-all"
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Main canvas */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'design' ? (
            <div className="max-w-3xl mx-auto">
              {/* Survey header card */}
              <div className="card p-6 mb-6">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-2xl font-bold text-text-primary bg-transparent border-b border-transparent focus:border-primary focus:outline-none text-center mb-3"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="添加问卷说明..."
                  className="w-full text-text-secondary bg-transparent border-b border-transparent focus:border-primary focus:outline-none text-center resize-none"
                  rows={2}
                />
                <div className="text-center mt-2">
                  <button onClick={() => setActiveTab('cover')} className="text-primary text-sm flex items-center gap-1 mx-auto">
                    <Settings size={14} /> 问卷封面设置
                  </button>
                </div>
              </div>

              {/* Questions */}
              {questions.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
                    <Plus size={28} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-text-primary mb-2">开始设计问卷</h3>
                  <p className="text-text-secondary mb-4">从左侧选择题型添加题目，或使用批量添加功能</p>
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => { setActiveBulkTab('text'); setShowBulkAdd(true); }} className="btn-primary text-sm">批量添加题目</button>
                    <button onClick={() => { setActiveBulkTab('bank'); setShowBulkAdd(true); loadBankQuestionnaires(); }} className="btn-secondary text-sm flex items-center gap-2">
                      <BookOpen size={16} /> 从我的题库
                    </button>
                  </div>
                </div>
              ) : (
                questions.map((q, idx) => renderQuestionEditor(q, idx))
              )}

              {/* Post-submit report config */}
              <div className="card p-5 mt-6">
                <button
                  onClick={() => setShowReportConfig(true)}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                      <FileText className="text-primary" size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary">提交答卷后处理方式</h4>
                      <p className="text-sm text-text-secondary">
                        {reportConfig?.enabled
                          ? `已启用 AI 报告 · ${reportConfig.reportTitle || '评估报告'} · ${reportConfig.scoringRules?.length || 0} 条评分规则`
                          : '未启用 AI 报告，点击配置'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {reportConfig?.enabled ? (
                      <span className="px-2.5 py-1 rounded-full bg-success-light text-success text-xs font-medium flex items-center gap-1">
                        <Bot size={12} /> 已启用
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-background text-text-muted text-xs font-medium">未启用</span>
                    )}
                    <ChevronDown size={18} className="text-text-muted group-hover:text-primary transition-colors" />
                  </div>
                </button>
                {reportConfig?.enabled && (
                  <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Eye size={14} />
                      {reportConfig.showOnSubmit ? '提交后显示' : '不自动显示'}
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Download size={14} />
                      {reportConfig.allowDownload ? '允许下载' : '禁止下载'}
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Bot size={14} />
                      {reportConfig.aiModel}
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Settings size={14} />
                      {reportConfig.reportStyle === 'warm' ? '温暖关怀' : reportConfig.reportStyle === 'concise' ? '简洁明快' : '专业学术'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="card p-6">
                <h2 className="text-xl font-bold text-text-primary mb-6">问卷封面设置</h2>
                <div className="space-y-5">
                  <label className="flex items-center justify-between">
                    <span className="font-medium text-text-primary">启用封面</span>
                    <input
                      type="checkbox"
                      checked={coverSettings.enabled}
                      onChange={(e) => setCoverSettings({ ...coverSettings, enabled: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary w-5 h-5"
                    />
                  </label>
                  {coverSettings.enabled && (
                    <>
                      <div>
                        <label className="label">封面标题</label>
                        <input
                          type="text"
                          value={coverSettings.title}
                          onChange={(e) => setCoverSettings({ ...coverSettings, title: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">封面说明</label>
                        <textarea
                          value={coverSettings.description}
                          onChange={(e) => setCoverSettings({ ...coverSettings, description: e.target.value })}
                          className="input"
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="label">作答按钮文字</label>
                        <input
                          type="text"
                          value={coverSettings.submitButtonText}
                          onChange={(e) => setCoverSettings({ ...coverSettings, submitButtonText: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 text-text-secondary">
                          <input
                            type="checkbox"
                            checked={coverSettings.showProgress}
                            onChange={(e) => setCoverSettings({ ...coverSettings, showProgress: e.target.checked })}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                          显示进度条
                        </label>
                        <label className="flex items-center gap-2 text-text-secondary">
                          <input
                            type="checkbox"
                            checked={coverSettings.showTimer}
                            onChange={(e) => setCoverSettings({ ...coverSettings, showTimer: e.target.checked })}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                          显示计时器
                        </label>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-end mt-6">
                  <button onClick={() => setActiveTab('design')} className="btn-primary">返回编辑</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk add modal */}
      {showBulkAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-5xl shadow-hover flex flex-col max-h-[85vh]">
            {/* Header tabs */}
            <div className="flex items-center border-b border-border px-6 pt-5 pb-0">
              <button
                onClick={() => setActiveBulkTab('text')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeBulkTab === 'text' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                批量添加
              </button>
              <button
                onClick={() => setActiveBulkTab('bank')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeBulkTab === 'bank' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                从我的题库添加
              </button>
              <button onClick={() => setShowBulkAdd(false)} className="ml-auto text-text-muted hover:text-text-primary p-1">
                <X size={20} />
              </button>
            </div>

            {activeBulkTab === 'text' ? (
              <div className="p-6">
                <h3 className="text-lg font-bold text-text-primary mb-2">批量添加题目</h3>
                <p className="text-sm text-text-secondary mb-4">题目之间空一行，题干一行，选项每行一个（自动识别为单选题）。</p>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={12}
                  className="input mb-4 font-mono text-sm"
                  placeholder="1. 您平时每周运动几次？\nA. 从不\nB. 1-2次\nC. 3-5次\nD. 每天\n\n2. 请描述您最近的压力来源："
                />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowBulkAdd(false)} className="btn-ghost">取消</button>
                  <button onClick={submitBulkAdd} className="btn-primary">确定导入</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row overflow-hidden" style={{ minHeight: '520px' }}>
                {/* Left: questionnaire list */}
                <div className="w-full md:w-72 border-r border-border flex flex-col bg-gray-50/50">
                  <div className="p-4 border-b border-border">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        type="text"
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        placeholder="全站搜索"
                        className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {bankLoading ? (
                      <div className="text-center py-8 text-text-muted text-sm">加载中...</div>
                    ) : filteredBankQuestionnaires.length === 0 ? (
                      <div className="text-center py-8 text-text-muted text-sm">暂无问卷</div>
                    ) : (
                      <div className="space-y-1">
                        {filteredBankQuestionnaires.map(q => (
                          <button
                            key={q.id}
                            onClick={() => handleSelectBankQuestionnaire(q.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                              selectedBankQuestionnaireId === q.id ? 'bg-primary text-white' : 'hover:bg-white text-text-primary'
                            }`}
                          >
                            <FileText size={16} />
                            <span className="truncate">{q.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: questions preview */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-white">
                    <h3 className="font-semibold text-text-primary">请选择题目</h3>
                    <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBankQuestionnaire ? selectedBankQuestionIds.size === selectedBankQuestionnaire.questions.length && selectedBankQuestionnaire.questions.length > 0 : false}
                        onChange={toggleAllBankQuestions}
                        disabled={!selectedBankQuestionnaire || selectedBankQuestionnaire.questions.length === 0}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      全选
                    </label>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 bg-white">
                    {!selectedBankQuestionnaire ? (
                      <div className="text-center py-12 text-text-muted text-sm">从左侧选择一份问卷</div>
                    ) : selectedBankQuestionnaire.questions.length === 0 ? (
                      <div className="text-center py-12 text-text-muted text-sm">该问卷暂无题目</div>
                    ) : (
                      <div className="space-y-4">
                        {selectedBankQuestionnaire.questions.map((q, idx) => (
                          <div key={q.id} className="bg-surface rounded-lg border border-border p-4">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedBankQuestionIds.has(q.id)}
                                onChange={() => toggleBankQuestionSelection(q.id)}
                                className="mt-1 rounded border-border text-primary focus:ring-primary"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-text-primary mb-2">{idx + 1}. {q.title}</p>
                                {(q.type === 'radio' || q.type === 'checkbox' || q.type === 'dropdown') && q.options && (
                                  <div className="space-y-1 pl-1">
                                    {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-center gap-2 text-sm text-text-secondary">
                                        {q.type === 'radio' && <CircleDot size={14} className="text-text-muted" />}
                                        {q.type === 'checkbox' && <CheckSquare size={14} className="text-text-muted" />}
                                        {q.type === 'dropdown' && <span className="text-text-muted text-xs">{oIdx + 1}.</span>}
                                        <span>{opt.label}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {q.type === 'textarea' && <div className="text-sm text-text-muted">多行文本</div>}
                                {q.type === 'text' && <div className="text-sm text-text-muted">单行文本</div>}
                                {q.type === 'number' && <div className="text-sm text-text-muted">数字</div>}
                                {q.type === 'date' && <div className="text-sm text-text-muted">日期</div>}
                                {(q.type === 'rating' || q.type === 'scale' || q.type === 'nps' || q.type === 'slider') && <div className="text-sm text-text-muted">评分/量表</div>}
                                {q.type === 'matrix' && <div className="text-sm text-text-muted">矩阵量表</div>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border p-4 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-text-primary">已选 <span className="font-semibold text-primary">{selectedBankQuestionIds.size}</span> 题</span>
                    <button
                      onClick={() => setShowSelectedBankQuestions(true)}
                      disabled={selectedBankQuestionIds.size === 0}
                      className="text-sm text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                    >
                      查看已选题目
                    </button>
                    <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stripNumberOnImport}
                        onChange={(e) => setStripNumberOnImport(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      导入后删除自带题号
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowBulkAdd(false)} className="btn-ghost">关闭</button>
                    <button
                      onClick={submitBankAdd}
                      disabled={selectedBankQuestionIds.size === 0}
                      className="btn-primary disabled:opacity-50"
                    >
                      确定
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected questions preview modal */}
      {showSelectedBankQuestions && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-surface rounded-2xl max-w-2xl w-full max-h-[70vh] flex flex-col shadow-hover">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary">已选题目 ({selectedBankQuestionIds.size})</h3>
              <button onClick={() => setShowSelectedBankQuestions(false)} className="text-text-muted hover:text-text-primary">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-3">
                {selectedBankQuestionnaire?.questions
                  .filter(q => selectedBankQuestionIds.has(q.id))
                  .map((q, idx) => (
                    <div key={q.id} className="p-3 bg-gray-50 rounded-lg text-sm text-text-primary">
                      {idx + 1}. {q.title}
                    </div>
                  ))}
              </div>
            </div>
            <div className="p-5 border-t border-border flex justify-end">
              <button onClick={() => setShowSelectedBankQuestions(false)} className="btn-primary">关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* Report config modal */}
      {showReportConfig && id && (
        <ReportConfigPanel
          questionnaireId={id}
          onClose={() => setShowReportConfig(false)}
          onSaved={(config) => setReportConfig(config)}
        />
      )}
    </div>
  );
}
