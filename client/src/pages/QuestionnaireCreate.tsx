import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Sparkles, FileSpreadsheet, Copy, ClipboardList, Heart, Building2, BookOpen, Search
} from 'lucide-react';
import { questionnaireApi } from '../api';
import { TEMPLATES } from '../data/templates';
import type { Question } from '../types';

const CATEGORIES = ['全部', '大学生', '企业', '教育', '心理'];

export default function QuestionnaireCreate() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'survey' | 'ai-interview'>('survey');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const [creating, setCreating] = useState(false);
  const [showTextImport, setShowTextImport] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [textInput, setTextInput] = useState('');

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === '全部' || t.category === category || t.tags.includes(category);
    return matchSearch && matchCategory;
  });

  const [createError, setCreateError] = useState('');

  const createFromBlank = async () => {
    setCreating(true);
    setCreateError('');
    try {
      const res = await questionnaireApi.create({
        title: '未命名问卷',
        type: activeTab,
        questions: [],
      });
      const id = res.data?.data?.id;
      if (!id) {
        throw new Error('创建问卷后未返回问卷 ID');
      }
      navigate(`/questionnaires/${id}/edit`, { replace: true });
    } catch (err: any) {
      console.error('创建问卷失败:', err);
      setCreateError(err?.response?.data?.message || err?.message || '创建失败，请稍后重试');
    } finally {
      setCreating(false);
    }
  };

  const createFromTemplate = async (template: typeof TEMPLATES[0]) => {
    setCreating(true);
    try {
      const res = await questionnaireApi.create({
        title: template.name,
        type: 'survey',
        description: template.description,
        questions: template.questions as Question[],
        sourceTemplateId: template.id,
      });
      navigate(`/questionnaires/${res.data.data.id}/edit`);
    } finally {
      setCreating(false);
    }
  };

  const parseTextQuestions = (): Question[] => {
    const blocks = textInput.split(/\n\s*\n/).filter(b => b.trim());
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

  const submitTextImport = async () => {
    if (!textInput.trim()) return;
    setCreating(true);
    try {
      const res = await questionnaireApi.create({
        title: '文本导入问卷',
        type: 'survey',
        questions: parseTextQuestions(),
      });
      setShowTextImport(false);
      navigate(`/questionnaires/${res.data.data.id}/edit`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">创建调查</h1>
          <p className="text-text-secondary mt-1">选择创建方式，快速开始心理学研究</p>
          {createError && (
            <div className="mt-4 p-3 rounded-lg bg-danger-light text-danger text-sm flex items-center gap-2">
              <span className="font-bold">创建失败：</span>{createError}
            </div>
          )}
        </div>

        {/* Scene selector */}
        <div className="bg-surface rounded-2xl p-1.5 shadow-card mb-8 inline-flex">
          <button
            onClick={() => setActiveTab('survey')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'survey'
                ? 'bg-primary text-white shadow-soft'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ClipboardList size={20} />
            问卷调查
          </button>
          <button
            onClick={() => setActiveTab('ai-interview')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'ai-interview'
                ? 'bg-secondary text-white shadow-soft'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sparkles size={20} />
            AI 访谈
          </button>
        </div>

        {activeTab === 'survey' ? (
          <>
            {/* Creation methods */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              <button
                onClick={createFromBlank}
                disabled={creating}
                className="card card-hover p-6 text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <FileText className="text-primary" size={24} />
                </div>
                <h3 className="font-bold text-text-primary mb-1">从空白创建</h3>
                <p className="text-sm text-text-secondary">自由设计题型与逻辑，适合专业研究</p>
              </button>

              <button
                onClick={() => setShowTextImport(true)}
                className="card card-hover p-6 text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Copy className="text-warning" size={24} />
                </div>
                <h3 className="font-bold text-text-primary mb-1">文本导入</h3>
                <p className="text-sm text-text-secondary">粘贴文本快速生成题目，自动识别选项</p>
              </button>

              <button
                onClick={() => setShowExcelImport(true)}
                className="card card-hover p-6 text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-success-light flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="text-success" size={24} />
                </div>
                <h3 className="font-bold text-text-primary mb-1">Excel 导入答卷</h3>
                <p className="text-sm text-text-secondary">上传已有问卷数据，快速导入历史答卷</p>
              </button>
            </div>

            {/* Templates */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary">复制模板问卷</h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="搜索模板..."
                      className="pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mb-4 flex-wrap">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      category === c
                        ? 'bg-primary text-white'
                        : 'bg-surface border border-border text-text-secondary hover:border-primary/30'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(template => (
                  <div key={template.id} className="card card-hover p-5 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
                          {template.category === '大学生' ? <Heart size={20} className="text-primary" /> :
                           template.category === '企业' ? <Building2 size={20} className="text-primary" /> :
                           <BookOpen size={20} className="text-primary" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-text-primary text-sm">{template.name}</h3>
                          <p className="text-xs text-text-muted">共 {template.questions.length} 题</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary mb-4 flex-1 line-clamp-2">{template.description}</p>
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {template.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-accent-light text-text-secondary text-xs rounded-full">{tag}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => createFromTemplate(template)}
                      disabled={creating}
                      className="btn-primary text-sm py-2"
                    >
                      引用模板
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary-light flex items-center justify-center mx-auto mb-4">
              <Sparkles size={32} className="text-secondary" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">AI 访谈</h2>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">基于自然语言的智能访谈，自动生成追问与总结，适合深度心理研究。</p>
            <button onClick={createFromBlank} disabled={creating} className="btn-primary">
              创建 AI 访谈
            </button>
          </div>
        )}
      </div>

      {/* Text import modal */}
      {showTextImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl max-w-2xl w-full p-6 shadow-hover">
            <h3 className="text-lg font-bold text-text-primary mb-2">文本导入题目</h3>
            <p className="text-sm text-text-secondary mb-4">
              题目之间空一行，题干一行，选项每行一个（会自动识别为单选题）。无选项则识别为文本题。
            </p>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={10}
              className="input mb-4 font-mono text-sm"
              placeholder="1. 您平时每周运动几次？\nA. 从不\nB. 1-2次\nC. 3-5次\nD. 每天\n\n2. 请描述您最近的压力来源："
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowTextImport(false)} className="btn-ghost">取消</button>
              <button onClick={submitTextImport} disabled={creating} className="btn-primary">确定导入</button>
            </div>
          </div>
        </div>
      )}

      {/* Excel import modal */}
      {showExcelImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-hover">
            <h3 className="text-lg font-bold text-text-primary mb-2">Excel 导入答卷</h3>
            <p className="text-sm text-text-secondary mb-4">
              请先创建问卷，再进入该问卷的「数据管理」页面上传 Excel 答卷。
            </p>
            <div className="flex justify-end">
              <button onClick={() => setShowExcelImport(false)} className="btn-primary">知道了</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
