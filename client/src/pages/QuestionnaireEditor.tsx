import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save, Plus, Trash2, GripVertical, ArrowLeft, Settings, Image as ImageIcon, Layers, Copy, X, Star, Heart, Smile, SlidersHorizontal,
  CircleDot, CheckSquare, List, AlignLeft, Text, Calendar, Grid3X3, ThumbsUp, MousePointer2, Type
} from 'lucide-react';
import { questionnaireApi } from '../api';
import type { Question, CoverSettings, ScaleConfig } from '../types';

const QUESTION_TYPES = [
  { group: '选择题', items: [
    { type: 'radio', label: '单选题', icon: CircleDot },
    { type: 'checkbox', label: '多选题', icon: CheckSquare },
    { type: 'dropdown', label: '下拉框', icon: List },
  ]},
  { group: '填空题', items: [
    { type: 'text', label: '单行文本', icon: Type },
    { type: 'textarea', label: '多行文本', icon: AlignLeft },
    { type: 'number', label: '数字', icon: Text },
    { type: 'date', label: '日期', icon: Calendar },
  ]},
  { group: '评分题', items: [
    { type: 'rating', label: '评分题', icon: Star },
    { type: 'scale', label: '量表题', icon: SlidersHorizontal },
    { type: 'nps', label: 'NPS', icon: ThumbsUp },
    { type: 'slider', label: '滑动条', icon: MousePointer2 },
  ]},
  { group: '高级题型', items: [
    { type: 'matrix', label: '矩阵量表', icon: Grid3X3 },
  ]},
];

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
  const isEdit = !!id;

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
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      questionnaireApi.getById(id).then(res => {
        const q = res.data.data;
        setTitle(q.title);
        setDescription(q.description || '');
        setQuestions(q.questions || []);
        setCoverSettings(q.coverSettings || {
          enabled: false, title: q.title, description: q.description || '', submitButtonText: '开始作答', showProgress: true, showTimer: false,
        });
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

  const addQuestion = (type: Question['type']) => {
    const newQ: Question = {
      id: `q-${Date.now()}`,
      type,
      title: '',
      required: true,
    };
    if (type === 'radio' || type === 'checkbox' || type === 'dropdown') {
      newQ.options = [
        { value: '0', label: '选项1' },
        { value: '1', label: '选项2' },
      ];
    }
    if (type === 'rating' || type === 'scale') {
      newQ.scaleConfig = { min: 1, max: 5, minLabel: '非常不满意', maxLabel: '非常满意', type: 'star' };
    }
    if (type === 'nps') {
      newQ.scaleConfig = { min: 0, max: 10, minLabel: '不可能', maxLabel: '极有可能', type: 'number' };
    }
    if (type === 'matrix') {
      newQ.matrixRows = [{ id: 'r0', label: '行标题1' }, { id: 'r1', label: '行标题2' }];
      newQ.matrixColumns = [{ id: 'c0', label: '1' }, { id: 'c1', label: '2' }, { id: 'c2', label: '3' }, { id: 'c3', label: '4' }, { id: 'c4', label: '5' }];
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

            {(q.type === 'radio' || q.type === 'checkbox' || q.type === 'dropdown') && q.options && (
              <div className="space-y-2 mb-3">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    {q.type === 'radio' && <CircleDot size={16} className="text-text-muted" />}
                    {q.type === 'checkbox' && <CheckSquare size={16} className="text-text-muted" />}
                    {q.type === 'dropdown' && <span className="text-text-muted text-sm">{oIdx + 1}.</span>}
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

            {(q.type === 'text' || q.type === 'textarea' || q.type === 'number' || q.type === 'date') && (
              <input
                type="text"
                disabled
                value={q.type === 'textarea' ? '答题者在此输入多行文本...' : '答题者在此输入...'}
                className="input bg-background text-text-muted text-sm mb-3"
              />
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
      <div className="bg-surface border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-10">
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
          <button onClick={() => setShowBulkAdd(true)} className="btn-secondary text-sm flex items-center gap-2">
            <Layers size={16} /> 批量添加
          </button>
          <button onClick={() => setActiveTab('cover')} className="btn-secondary text-sm flex items-center gap-2">
            <ImageIcon size={16} /> 封面设置
          </button>
          <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
            <Save size={16} /> {saving ? '保存中...' : '保存问卷'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - question types */}
        <div className="w-64 bg-surface border-r border-border overflow-y-auto p-4">
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
                  <button onClick={() => setShowBulkAdd(true)} className="btn-primary text-sm">批量添加题目</button>
                </div>
              ) : (
                questions.map((q, idx) => renderQuestionEditor(q, idx))
              )}
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
          <div className="bg-surface rounded-2xl max-w-2xl w-full p-6 shadow-hover">
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
        </div>
      )}
    </div>
  );
}
