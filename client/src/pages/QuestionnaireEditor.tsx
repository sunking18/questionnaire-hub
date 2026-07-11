import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Send, Plus, Trash2, GripVertical, ArrowLeft } from 'lucide-react';
import { questionnaireApi } from '../api';
import type { Question, QuestionOption } from '../types';

const QUESTION_TYPES = [
  { value: 'radio', label: '单选题' },
  { value: 'checkbox', label: '多选题' },
  { value: 'text', label: '填空题' },
  { value: 'textarea', label: '多行文本' },
  { value: 'rating', label: '评分题' },
];

export default function QuestionnaireEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      questionnaireApi.getById(id).then(res => {
        const q = res.data.data;
        setTitle(q.title);
        setDescription(q.description || '');
        setQuestions(q.questions as Question[]);
      }).catch(() => navigate('/questionnaires'));
    }
  }, [id]);

  const addQuestion = (type: string = 'radio') => {
    const newQ: Question = {
      id: `q-${Date.now()}`,
      type: type as Question['type'],
      title: '',
      required: true,
      options: type === 'radio' || type === 'checkbox' ? [
        { value: '0', label: '' },
        { value: '1', label: '' },
      ] : undefined,
      scoreRange: type === 'rating' ? { min: 1, max: 5 } : undefined,
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[idx] as any)[field] = value;
    setQuestions(updated);
  };

  const addOption = (qIdx: number) => {
    const updated = [...questions];
    const q = updated[qIdx];
    if (q.options) {
      q.options = [...q.options, { value: String(q.options.length), label: '' }];
    }
    setQuestions(updated);
  };

  const updateOption = (qIdx: number, oIdx: number, field: string, value: string) => {
    const updated = [...questions];
    if (updated[qIdx].options) {
      (updated[qIdx].options![oIdx] as any)[field] = value;
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
  };

  const handleSave = async (status: string = 'draft') => {
    if (!title.trim()) return alert('请输入问卷标题');
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        questions: questions.filter(q => q.title.trim()),
        status,
        settings: { fillLimit: 'unlimited', timeLimit: 30, anonymous: true },
      };
      if (isEdit && id) {
        await questionnaireApi.update(id, data);
      } else {
        await questionnaireApi.create(data);
      }
      navigate('/questionnaires');
    } catch (err: any) {
      alert(err.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/questionnaires')} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-text">{isEdit ? '编辑问卷' : '新建问卷'}</h2>
          <p className="text-text-muted text-sm mt-1">首页 / 问卷管理 / {isEdit ? '编辑' : '新建'}</p>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Basic Info */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-text">基本信息</h3>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              问卷标题 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：PHQ-9 抑郁症筛查量表"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">描述 / 指导语</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="请根据过去两周的实际情况作答..."
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
            />
          </div>
        </div>

        {/* Questions */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text">题项列表 ({questions.length})</h3>
            <div className="flex items-center gap-2">
              {QUESTION_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => addQuestion(t.value)}
                  className="text-xs px-2.5 py-1.5 border border-border rounded-lg hover:bg-primary-light hover:border-primary text-text-secondary transition"
                >
                  + {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <div key={q.id} className="border border-border rounded-lg p-4 hover:border-primary/30 transition">
                <div className="flex items-start gap-3">
                  <GripVertical size={18} className="text-text-muted mt-2 cursor-grab" />
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-1.5 shrink-0">
                    {qIdx + 1}
                  </span>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={q.title}
                        onChange={(e) => updateQuestion(qIdx, 'title', e.target.value)}
                        placeholder="输入题目标题..."
                        className="flex-1 px-3 py-1.5 border border-border rounded text-sm focus:ring-1 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-text-muted">
                        {QUESTION_TYPES.find(t => t.value === q.type)?.label}
                      </span>
                      <label className="flex items-center gap-1 text-xs text-text-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(qIdx, 'required', e.target.checked)}
                          className="rounded"
                        />
                        必答
                      </label>
                      <button onClick={() => removeQuestion(qIdx)} className="p-1 text-text-muted hover:text-danger transition">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Options for radio/checkbox */}
                    {(q.type === 'radio' || q.type === 'checkbox') && q.options && (
                      <div className="space-y-1.5 pl-2">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
                            <input
                              type="text"
                              value={opt.label}
                              onChange={(e) => updateOption(qIdx, oIdx, 'label', e.target.value)}
                              placeholder={`选项 ${oIdx + 1}`}
                              className="flex-1 px-2 py-1 border border-border rounded text-sm focus:ring-1 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                            <input
                              type="text"
                              value={opt.value}
                              onChange={(e) => updateOption(qIdx, oIdx, 'value', e.target.value)}
                              placeholder="分值"
                              className="w-16 px-2 py-1 border border-border rounded text-sm text-center outline-none"
                            />
                            <button onClick={() => removeOption(qIdx, oIdx)} className="text-text-muted hover:text-danger">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addOption(qIdx)} className="text-primary text-xs hover:underline">
                          + 添加选项
                        </button>
                      </div>
                    )}

                    {/* Rating score range */}
                    {q.type === 'rating' && (
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <span>评分范围：</span>
                        <input
                          type="number"
                          value={q.scoreRange?.min || 1}
                          onChange={(e) => updateQuestion(qIdx, 'scoreRange', { ...q.scoreRange, min: Number(e.target.value) })}
                          className="w-16 px-2 py-1 border border-border rounded text-center text-sm outline-none"
                        />
                        <span>~</span>
                        <input
                          type="number"
                          value={q.scoreRange?.max || 5}
                          onChange={(e) => updateQuestion(qIdx, 'scoreRange', { ...q.scoreRange, max: Number(e.target.value) })}
                          className="w-16 px-2 py-1 border border-border rounded text-center text-sm outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {questions.length === 0 && (
              <div className="text-center py-12 text-text-muted">
                <p>还没有题项，点击上方按钮添加</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={() => navigate('/questionnaires')}
            className="px-4 py-2.5 border border-border rounded-lg text-text-secondary hover:bg-gray-50 text-sm transition"
          >
            取消
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-4 py-2.5 border border-border rounded-lg text-text-secondary hover:bg-gray-50 flex items-center gap-2 text-sm transition disabled:opacity-50"
          >
            <Save size={16} />
            保存草稿
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg flex items-center gap-2 text-sm font-medium transition disabled:opacity-50"
          >
            <Send size={16} />
            保存并发布
          </button>
        </div>
      </div>
    </div>
  );
}
