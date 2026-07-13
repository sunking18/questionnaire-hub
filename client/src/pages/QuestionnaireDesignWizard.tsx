import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle, BarChart3, Users, FileEdit, FileText, SlidersHorizontal, LayoutGrid,
  Pause, Play, ExternalLink, ChevronRight, Crown, ToggleLeft, ToggleRight
} from 'lucide-react';
import { questionnaireApi } from '../api';
import QuestionnaireDesignNav from '../components/QuestionnaireDesignNav';
import type { Questionnaire } from '../types';

export default function QuestionnaireDesignWizard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveContacts, setSaveContacts] = useState(false);

  useEffect(() => {
    if (!id) return;
    questionnaireApi.getById(id)
      .then(res => {
        const q = res.data.data;
        setQuestionnaire(q);
        setSaveContacts(q.settings?.other?.saveContacts || false);
      })
      .catch(() => navigate('/questionnaires'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleStatus = async () => {
    if (!questionnaire || !id) return;
    const next = questionnaire.status === 'published' ? 'paused' : 'published';
    try {
      setSaving(true);
      await questionnaireApi.update(id, { status: next });
      setQuestionnaire({ ...questionnaire, status: next });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContacts = async (value: boolean) => {
    if (!questionnaire || !id) return;
    setSaveContacts(value);
    const nextSettings = {
      ...questionnaire.settings,
      other: { ...questionnaire.settings?.other, saveContacts: value },
    };
    try {
      await questionnaireApi.update(id, { settings: nextSettings });
      setQuestionnaire({ ...questionnaire, settings: nextSettings });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-text-muted">加载中...</div>;
  if (!questionnaire) return null;

  const isRunning = questionnaire.status === 'published';
  const reportEnabled = questionnaire.reportConfigs && questionnaire.reportConfigs.length > 0 && questionnaire.reportConfigs[0].enabled;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <QuestionnaireDesignNav
        questionnaire={questionnaire}
        activeTab="wizard"
        questionnaireId={questionnaire.id}
        onTitleChange={async (title) => {
          if (!id) return;
          await questionnaireApi.update(id, { title });
          setQuestionnaire({ ...questionnaire, title });
        }}
      />

      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Status banner */}
          <div className="card p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isRunning ? 'bg-warning-light text-warning' : 'bg-success-light text-success'}`}>
                <AlertCircle size={20} />
              </div>
              <div>
                <p className="text-text-primary font-medium">
                  {isRunning ? '此问卷正在运行，您可以查看结果、发送问卷或者' : '此问卷已暂停，您可以查看结果、发送问卷或者'}
                </p>
                <p className="text-sm text-text-secondary">
                  <Link to={`/statistics?questionnaireId=${questionnaire.id}`} className="text-primary hover:underline">查看结果</Link>
                  <span className="mx-1">、</span>
                  <Link to={`/distribution?questionnaireId=${questionnaire.id}`} className="text-primary hover:underline">发送问卷</Link>
                  <span className="mx-1">或者</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleStatus}
              disabled={saving}
              className={`px-5 py-2 rounded-lg text-white text-sm font-medium transition flex items-center gap-2 ${
                isRunning ? 'bg-warning hover:bg-warning-hover' : 'bg-success hover:bg-success-hover'
              }`}
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              {saving ? '处理中...' : (isRunning ? '暂停接收答卷' : '开始接收答卷')}
            </button>
          </div>

          {/* Evaluation report */}
          <div className="card p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-light flex items-center justify-center text-success">
                <BarChart3 size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-text-primary mb-2">测评报告</h3>
                <p className="text-sm text-text-secondary mb-3">
                  根据每个人的测评总分或维度分，显示不同测评结果页面
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigate(`/questionnaires/${questionnaire.id}/preview`)}
                    className="px-4 py-2 border border-primary text-primary rounded-lg text-sm hover:bg-primary-light transition"
                  >
                    预览当前报告
                  </button>
                  <Link to={`/questionnaires/${questionnaire.id}/edit`} state={{ openReportConfig: true }} className="text-sm text-primary hover:underline flex items-center gap-1">
                    <Crown size={14} /> 根据总得分设置结果
                  </Link>
                  <Link to={`/questionnaires/${questionnaire.id}/edit`} state={{ openReportConfig: true }} className="text-sm text-primary hover:underline flex items-center gap-1">
                    <Crown size={14} /> 根据维度分设置测评报告
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Save contacts */}
          <div className="card p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-info-light flex items-center justify-center text-info">
                <Users size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-text-primary">将答题者保存为联系人</h3>
                  <button onClick={() => handleSaveContacts(!saveContacts)}>
                    {saveContacts ? <ToggleRight size={24} className="text-success" /> : <ToggleLeft size={24} className="text-text-muted" />}
                  </button>
                </div>
                <p className="text-sm text-text-secondary">
                  引导填写者关注公众号，以便多次投放问卷。通过问卷自动同步标签，让您更了解您的客户。
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <Link to="/" className="text-primary hover:underline">查看联系人</Link>
                  <Link to="/" className="text-primary hover:underline">详细了解联系人</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <LayoutGrid size={18} className="text-primary" /> 问卷设计
            </h3>
            <div className="space-y-4">
              <ActionRow
                icon={<FileEdit size={18} className="text-primary" />}
                title="编辑问卷"
                desc="可以进入问卷编辑页面，进行问卷内容的修改和增加"
                linkText="编辑问卷"
                onClick={() => navigate(`/questionnaires/${questionnaire.id}/edit-mode`)}
                extra={<Link to="/" className="text-sm text-text-muted hover:text-primary ml-4">问卷编辑记录</Link>}
              />
              <ActionRow
                icon={<FileText size={18} className="text-success" />}
                title="导出问卷到word"
                desc="可以将编辑好的问卷内容导出到word"
                linkText="导出问卷到word"
                onClick={() => alert('导出功能开发中')}
              />
              <ActionRow
                icon={<SlidersHorizontal size={18} className="text-warning" />}
                title="答题控制"
                desc="可以建立筛选规则，或者为题目选项设置配额"
                linkText="答题控制"
                onClick={() => navigate(`/questionnaires/${questionnaire.id}/settings`)}
                extra={<Link to={`/questionnaires/${questionnaire.id}/settings`} className="text-sm text-text-muted hover:text-primary ml-4">筛选规则</Link>}
                extra2={<Link to={`/questionnaires/${questionnaire.id}/settings`} className="text-sm text-text-muted hover:text-primary ml-4">设置配额</Link>}
              />
              <ActionRow
                icon={<LayoutGrid size={18} className="text-info" />}
                title="维度设置"
                desc="将多个题目绑定到一个维度，各维度权重占比等，可以在报告中显示各个维度的得分"
                linkText="维度设置"
                onClick={() => navigate(`/questionnaires/${questionnaire.id}/edit`)}
              />
            </div>
          </div>

          {/* Report status hint */}
          <div className="card p-5 bg-primary-light/30 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-primary">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">AI 测评报告</h3>
                <p className="text-sm text-text-secondary">
                  {reportEnabled
                    ? '已启用测评报告，答题者提交后可查看个性化结果。'
                    : '尚未配置测评报告，点击上方「根据总得分设置结果」进行配置。'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionRow({
  icon, title, desc, linkText, onClick, extra, extra2
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  linkText: string;
  onClick: () => void;
  extra?: React.ReactNode;
  extra2?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h4 className="font-medium text-text-primary">{title}</h4>
          <p className="text-sm text-text-secondary mt-0.5">{desc}</p>
          <div className="flex items-center mt-2">
            <button onClick={onClick} className="text-sm text-primary hover:underline flex items-center gap-1">
              {linkText} <ChevronRight size={14} />
            </button>
            {extra}
            {extra2}
          </div>
        </div>
      </div>
      <ExternalLink size={16} className="text-text-muted flex-shrink-0" />
    </div>
  );
}
