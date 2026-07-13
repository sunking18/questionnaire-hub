import { useEffect, useState } from 'react';
import { X, Plus, Trash2, Settings, FileText, Sparkles, Download, Eye, AlertCircle } from 'lucide-react';
import { reportApi } from '../api';
import type { ReportConfig, ScoringRule } from '../types';

interface ReportConfigPanelProps {
  questionnaireId: string;
  onClose: () => void;
  onSaved?: (config: ReportConfig) => void;
}

const REPORT_STYLES = [
  { value: 'professional', label: '专业学术', description: '严谨客观，适合科研与临床场景' },
  { value: 'warm', label: '温暖关怀', description: '亲切易懂，适合大众心理科普' },
  { value: 'concise', label: '简洁明快', description: '重点突出，适合快速阅读' },
];

const AI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

const SEVERITY_PRESETS = ['正常', '轻度', '中度', '中重度', '重度', '待定'];
const COLOR_PRESETS = ['#81B29A', '#F2CC8F', '#F4A261', '#E07A5F', '#E76F51', '#3D405B'];

const emptyRule = (): ScoringRule => ({
  id: `rule-${Date.now()}`,
  name: '',
  min: 0,
  max: 0,
  color: COLOR_PRESETS[0],
  systemPrompt: '你是一位专业心理咨询师。请根据用户的问卷得分和答题情况，生成一份温暖、专业、具有建设性的评估报告。报告应包含：总体评估、得分解读、维度分析、建议与资源。',
  userPrompt: '请根据以下问卷「{questionnaireTitle}」的答题数据生成评估报告：\n\n总分：{totalScore}\n严重程度：{severityLevel}\n维度得分：\n{dimensionScores}\n\n逐题回顾：\n{questionDetails}',
});

const defaultConfig = (questionnaireTitle: string): Partial<ReportConfig> => ({
  enabled: false,
  reportTitle: `${questionnaireTitle}评估报告`,
  reportStyle: 'professional',
  aiModel: 'gpt-4o',
  showOnSubmit: true,
  allowDownload: true,
  scoringRules: [emptyRule()],
});

export default function ReportConfigPanel({ questionnaireId, onClose, onSaved }: ReportConfigPanelProps) {
  const [config, setConfig] = useState<Partial<ReportConfig>>(defaultConfig(''));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'rules' | 'prompts'>('basic');

  useEffect(() => {
    reportApi.getConfig(questionnaireId).then(res => {
      const data = res.data.data;
      if (data) {
        setConfig({
          enabled: data.enabled ?? false,
          reportTitle: data.reportTitle || '',
          reportStyle: data.reportStyle || 'professional',
          aiModel: data.aiModel || 'gpt-4o',
          showOnSubmit: data.showOnSubmit ?? true,
          allowDownload: data.allowDownload ?? true,
          scoringRules: data.scoringRules?.length ? data.scoringRules : [emptyRule()],
        });
      } else {
        setConfig(defaultConfig(''));
      }
    }).catch(() => {
      setConfig(defaultConfig(''));
    }).finally(() => setLoading(false));
  }, [questionnaireId]);

  const updateField = <K extends keyof ReportConfig>(field: K, value: ReportConfig[K]) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const addRule = () => {
    setConfig(prev => ({
      ...prev,
      scoringRules: [...(prev.scoringRules || []), emptyRule()],
    }));
  };

  const updateRule = (idx: number, field: keyof ScoringRule, value: any) => {
    setConfig(prev => ({
      ...prev,
      scoringRules: prev.scoringRules?.map((r, i) => i === idx ? { ...r, [field]: value } : r) || [],
    }));
  };

  const removeRule = (idx: number) => {
    setConfig(prev => ({
      ...prev,
      scoringRules: prev.scoringRules?.filter((_, i) => i !== idx) || [],
    }));
  };

  const handleSave = async () => {
    if (!config.reportTitle?.trim()) {
      setError('请输入报告标题');
      return;
    }
    const rules = config.scoringRules || [];
    for (const rule of rules) {
      if (!rule.name.trim()) {
        setError('请填写所有评分规则的名称');
        return;
      }
      if (rule.min > rule.max) {
        setError(`规则「${rule.name}」的最小分数不能大于最大分数`);
        return;
      }
      if (!rule.systemPrompt.trim()) {
        setError(`规则「${rule.name}」的系统提示词不能为空`);
        return;
      }
    }

    setSaving(true);
    setError('');
    try {
      const res = await reportApi.updateConfig(questionnaireId, config);
      onSaved?.(res.data.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-surface rounded-2xl p-8 shadow-hover">加载中...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-hover flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
              <Settings className="text-primary" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">提交答卷后处理方式</h3>
              <p className="text-sm text-text-secondary">配置是否生成 AI 报告及报告内容</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 flex gap-2 border-b border-border">
          {[
            { id: 'basic', label: '基础设置', icon: FileText },
            { id: 'rules', label: '评分规则', icon: AlertCircle },
            { id: 'prompts', label: '提示词模板', icon: Sparkles },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-px ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger-light text-danger text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Basic Settings */}
          {activeTab === 'basic' && (
            <div className="space-y-5">
              <label className="flex items-center justify-between p-4 bg-background rounded-xl cursor-pointer">
                <div>
                  <span className="font-medium text-text-primary">启用 AI 报告</span>
                  <p className="text-sm text-text-secondary">答卷提交后自动根据评分规则生成个性化报告</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => updateField('enabled', e.target.checked)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
              </label>

              <div>
                <label className="label">报告标题</label>
                <input
                  type="text"
                  value={config.reportTitle || ''}
                  onChange={(e) => updateField('reportTitle', e.target.value)}
                  className="input"
                  placeholder="例如：心理健康评估报告"
                />
              </div>

              <div>
                <label className="label">AI 模型</label>
                <div className="grid grid-cols-3 gap-3">
                  {AI_MODELS.map(model => (
                    <button
                      key={model.value}
                      onClick={() => updateField('aiModel', model.value)}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        config.aiModel === model.value
                          ? 'border-primary bg-primary-light text-primary'
                          : 'border-border bg-surface text-text-secondary hover:border-primary/30'
                      }`}
                    >
                      {model.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">报告风格</label>
                <div className="space-y-3">
                  {REPORT_STYLES.map(style => (
                    <button
                      key={style.value}
                      onClick={() => updateField('reportStyle', style.value)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                        config.reportStyle === style.value
                          ? 'border-primary bg-primary-light'
                          : 'border-border bg-surface hover:border-primary/30'
                      }`}
                    >
                      <div className={`font-medium ${config.reportStyle === style.value ? 'text-primary' : 'text-text-primary'}`}>
                        {style.label}
                      </div>
                      <div className="text-sm text-text-secondary">{style.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-text-secondary">
                  <input
                    type="checkbox"
                    checked={config.showOnSubmit}
                    onChange={(e) => updateField('showOnSubmit', e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <Eye size={16} />
                  提交后立即显示
                </label>
                <label className="flex items-center gap-2 text-text-secondary">
                  <input
                    type="checkbox"
                    checked={config.allowDownload}
                    onChange={(e) => updateField('allowDownload', e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <Download size={16} />
                  允许下载报告
                </label>
              </div>
            </div>
          )}

          {/* Scoring Rules */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                根据总分区间设定评估等级。答卷提交时，系统会自动匹配对应的规则并调用 AI 生成报告。
              </p>
              {(config.scoringRules || []).map((rule, idx) => (
                <div key={rule.id} className="bg-background rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-muted">规则 {idx + 1}</span>
                    <button onClick={() => removeRule(idx)} className="text-danger hover:text-danger-hover text-sm flex items-center gap-1">
                      <Trash2 size={14} /> 删除
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">规则名称</label>
                      <input
                        type="text"
                        value={rule.name}
                        onChange={(e) => updateRule(idx, 'name', e.target.value)}
                        className="input"
                        placeholder="例如：正常范围"
                      />
                    </div>
                    <div>
                      <label className="label">严重程度</label>
                      <select
                        value={rule.severity || ''}
                        onChange={(e) => updateRule(idx, 'severity', e.target.value)}
                        className="input"
                      >
                        <option value="">请选择</option>
                        {SEVERITY_PRESETS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3">
                      <label className="label">最小分</label>
                      <input
                        type="number"
                        value={rule.min}
                        onChange={(e) => updateRule(idx, 'min', Number(e.target.value))}
                        className="input"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="label">最大分</label>
                      <input
                        type="number"
                        value={rule.max}
                        onChange={(e) => updateRule(idx, 'max', Number(e.target.value))}
                        className="input"
                      />
                    </div>
                    <div className="col-span-6">
                      <label className="label">标识颜色</label>
                      <div className="flex items-center gap-2">
                        {COLOR_PRESETS.map(color => (
                          <button
                            key={color}
                            onClick={() => updateRule(idx, 'color', color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              rule.color === color ? 'border-text-primary scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <input
                          type="color"
                          value={rule.color}
                          onChange={(e) => updateRule(idx, 'color', e.target.value)}
                          className="w-8 h-8 rounded-full overflow-hidden border-0 p-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addRule}
                className="w-full py-3 border border-dashed border-border rounded-xl text-text-secondary hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> 添加评分规则
              </button>
            </div>
          )}

          {/* Prompts */}
          {activeTab === 'prompts' && (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                为每个评分规则设定 AI 提示词。支持使用变量：{'{totalScore}'}、{'{severityLevel}'}、{'{dimensionScores}'}、{'{questionDetails}'}、{'{questionnaireTitle}'}。
              </p>
              {(config.scoringRules || []).map((rule, idx) => (
                <div key={rule.id} className="bg-background rounded-xl p-4 space-y-4">
                  <div className="font-medium text-text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rule.color }} />
                    {rule.name || `规则 ${idx + 1}`}
                    <span className="text-sm text-text-muted">({rule.min} - {rule.max} 分)</span>
                  </div>
                  <div>
                    <label className="label">系统提示词（System Prompt）</label>
                    <textarea
                      value={rule.systemPrompt}
                      onChange={(e) => updateRule(idx, 'systemPrompt', e.target.value)}
                      className="input font-mono text-sm"
                      rows={4}
                      placeholder="设定 AI 的角色、报告结构与输出要求..."
                    />
                  </div>
                  <div>
                    <label className="label">用户提示词（User Prompt）</label>
                    <textarea
                      value={rule.userPrompt}
                      onChange={(e) => updateRule(idx, 'userPrompt', e.target.value)}
                      className="input font-mono text-sm"
                      rows={5}
                      placeholder="输入需要 AI 分析的数据模板..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-background">
          <button onClick={onClose} className="btn-ghost">取消</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  );
}
