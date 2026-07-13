import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Settings, Send, Fingerprint, ShieldCheck, Share2, SlidersHorizontal, Save, ChevronRight,
  Globe, FileText, Monitor, Bell
} from 'lucide-react';
import { questionnaireApi } from '../api';
import QuestionnaireDesignNav from '../components/QuestionnaireDesignNav';
import type { Questionnaire, QuestionnaireSettings } from '../types';

type SettingsSection = 'basic' | 'afterSubmit' | 'answerLimit' | 'submitControl' | 'share' | 'other';

const sections: { key: SettingsSection; label: string; icon: React.ElementType }[] = [
  { key: 'basic', label: '基本设置', icon: Settings },
  { key: 'afterSubmit', label: '提交后显示', icon: Send },
  { key: 'answerLimit', label: '作答次数限制', icon: Fingerprint },
  { key: 'submitControl', label: '提交答卷控制', icon: ShieldCheck },
  { key: 'share', label: '分享与查询', icon: Share2 },
  { key: 'other', label: '其他设置', icon: SlidersHorizontal },
];

const defaultSettings: QuestionnaireSettings = {
  timeControl: { enabled: false },
  password: { enabled: false },
  language: 'zh-CN',
  afterSubmit: { type: 'thanks', thanksMessage: '您的答卷已经提交，感谢您的参与！' },
  answerLimit: { deviceControl: false, ipLimit: false, wechatOnly: false, enableMaxResponses: false, maxResponses: 100 },
  submitControl: { allowResume: false, allowPreview: false, allowViewAfterSubmit: false, enableCaptcha: false, hideSourceInfo: false },
  share: { allowCopy: false, allowSearchEngine: false, dataShare: false, externalQuery: false },
  other: { displaySettings: false, dataPush: false },
};

export default function QuestionnaireSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>('basic');
  const [settings, setSettings] = useState<QuestionnaireSettings>(defaultSettings);

  useEffect(() => {
    if (!id) return;
    questionnaireApi.getById(id)
      .then(res => {
        const q = res.data.data;
        setQuestionnaire(q);
        setSettings({ ...defaultSettings, ...(q.settings || {}) });
      })
      .catch(() => navigate('/questionnaires'))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (patch: Partial<QuestionnaireSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  };

  const save = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await questionnaireApi.update(id, { settings });
      alert('保存成功');
    } catch (err) {
      console.error(err);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const saveSection = async () => {
    await save();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-text-muted">加载中...</div>;
  if (!questionnaire) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <QuestionnaireDesignNav
        questionnaire={questionnaire}
        activeTab="settings"
        questionnaireId={questionnaire.id}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-56 bg-white border-r border-border flex-shrink-0 overflow-y-auto">
          <nav className="p-3 space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const active = activeSection === section.key;
              return (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                    active ? 'bg-primary-light text-primary font-medium' : 'text-text-secondary hover:bg-background'
                  }`}
                >
                  <Icon size={16} />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-3xl mx-auto space-y-6">
            {activeSection === 'basic' && (
              <SettingsCard title="基本设置" onSave={saveSection} saving={saving}>
                <ToggleRow
                  label="时间控制"
                  checked={settings.timeControl?.enabled || false}
                  onChange={v => update({ timeControl: { ...settings.timeControl, enabled: v } })}
                />
                {settings.timeControl?.enabled && (
                  <div className="pl-10 grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="label">开始时间</label>
                      <input
                        type="datetime-local"
                        value={settings.timeControl?.startTime?.slice(0, 16) || ''}
                        onChange={e => update({ timeControl: { ...settings.timeControl, startTime: e.target.value } })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">结束时间</label>
                      <input
                        type="datetime-local"
                        value={settings.timeControl?.endTime?.slice(0, 16) || ''}
                        onChange={e => update({ timeControl: { ...settings.timeControl, endTime: e.target.value } })}
                        className="input"
                      />
                    </div>
                  </div>
                )}

                <ToggleRow
                  label="答题密码"
                  checked={settings.password?.enabled || false}
                  onChange={v => update({ password: { ...settings.password, enabled: v } })}
                />
                {settings.password?.enabled && (
                  <div className="pl-10 mt-2">
                    <input
                      type="text"
                      value={settings.password?.value || ''}
                      onChange={e => update({ password: { ...settings.password, value: e.target.value } })}
                      placeholder="请输入答题密码"
                      className="input max-w-xs"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-text-muted" />
                    <span className="text-text-primary font-medium">标题及说明</span>
                  </div>
                  <button
                    onClick={() => navigate(`/questionnaires/${id}/edit`)}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {questionnaire.title} <ChevronRight size={14} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-text-muted" />
                    <span className="text-text-primary font-medium">问卷语言</span>
                    <button className="text-xs text-primary hover:underline">自动翻译其它语言</button>
                  </div>
                  <select
                    value={settings.language || 'zh-CN'}
                    onChange={e => update({ language: e.target.value })}
                    className="border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="zh-CN">简体中文</option>
                    <option value="zh-TW">繁體中文</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </SettingsCard>
            )}

            {activeSection === 'afterSubmit' && (
              <SettingsCard title="提交后显示" onSave={saveSection} saving={saving}>
                <RadioRow
                  label="显示感谢信息"
                  checked={settings.afterSubmit?.type === 'thanks'}
                  onChange={() => update({ afterSubmit: { ...settings.afterSubmit, type: 'thanks' } })}
                >
                  <textarea
                    value={settings.afterSubmit?.thanksMessage || ''}
                    onChange={e => update({ afterSubmit: { ...settings.afterSubmit, thanksMessage: e.target.value } })}
                    rows={2}
                    className="input mt-2 text-sm"
                  />
                </RadioRow>
                <RadioRow
                  label="跳转到指定页面"
                  checked={settings.afterSubmit?.type === 'redirect'}
                  onChange={() => update({ afterSubmit: { ...settings.afterSubmit, type: 'redirect' } })}
                  pro
                >
                  <input
                    type="url"
                    value={settings.afterSubmit?.redirectUrl || ''}
                    onChange={e => update({ afterSubmit: { ...settings.afterSubmit, redirectUrl: e.target.value } })}
                    placeholder="https://"
                    className="input mt-2 text-sm"
                  />
                </RadioRow>
                <RadioRow
                  label="按条件处理（可发送邮件和短信）"
                  checked={settings.afterSubmit?.type === 'conditional'}
                  onChange={() => update({ afterSubmit: { ...settings.afterSubmit, type: 'conditional' } })}
                  pro
                />
                <RadioRow
                  label="自定义答卷结果/自定义测评结果"
                  checked={settings.afterSubmit?.type === 'custom'}
                  onChange={() => update({ afterSubmit: { ...settings.afterSubmit, type: 'custom' } })}
                  pro
                />
                <CheckboxRow
                  label="开启核销码/优惠码"
                  checked={settings.afterSubmit?.enableCoupon || false}
                  onChange={v => update({ afterSubmit: { ...settings.afterSubmit, enableCoupon: v } })}
                  pro
                />
              </SettingsCard>
            )}

            {activeSection === 'answerLimit' && (
              <SettingsCard title="作答次数限制" onSave={saveSection} saving={saving}>
                <CheckboxRow
                  label="作答设备控制"
                  checked={settings.answerLimit?.deviceControl || false}
                  onChange={v => update({ answerLimit: { ...settings.answerLimit, deviceControl: v } })}
                />
                <CheckboxRow
                  label="IP地址限制"
                  checked={settings.answerLimit?.ipLimit || false}
                  onChange={v => update({ answerLimit: { ...settings.answerLimit, ipLimit: v } })}
                  pro
                />
                <CheckboxRow
                  label="微信作答控制"
                  checked={settings.answerLimit?.wechatOnly || false}
                  onChange={v => update({ answerLimit: { ...settings.answerLimit, wechatOnly: v } })}
                />
                <CheckboxRow
                  label="控制提交答卷总数"
                  checked={settings.answerLimit?.enableMaxResponses || false}
                  onChange={v => update({ answerLimit: { ...settings.answerLimit, enableMaxResponses: v } })}
                >
                  {settings.answerLimit?.enableMaxResponses && (
                    <input
                      type="number"
                      value={settings.answerLimit?.maxResponses || 100}
                      onChange={e => update({ answerLimit: { ...settings.answerLimit, maxResponses: Number(e.target.value) } })}
                      className="input w-28 mt-2 ml-7 text-sm"
                    />
                  )}
                </CheckboxRow>
              </SettingsCard>
            )}

            {activeSection === 'submitControl' && (
              <SettingsCard title="提交答卷控制" onSave={saveSection} saving={saving}>
                <CheckboxRow
                  label="允许断点续答"
                  checked={settings.submitControl?.allowResume || false}
                  onChange={v => update({ submitControl: { ...settings.submitControl, allowResume: v } })}
                  pro
                />
                <CheckboxRow
                  label="允许提交答卷前预览答卷"
                  checked={settings.submitControl?.allowPreview || false}
                  onChange={v => update({ submitControl: { ...settings.submitControl, allowPreview: v } })}
                />
                <CheckboxRow
                  label="允许提交后查看已填答卷"
                  checked={settings.submitControl?.allowViewAfterSubmit || false}
                  onChange={v => update({ submitControl: { ...settings.submitControl, allowViewAfterSubmit: v } })}
                  pro
                />
                <CheckboxRow
                  label="控制提交答卷总数"
                  checked={settings.submitControl?.enableCaptcha || false}
                  onChange={v => update({ submitControl: { ...settings.submitControl, enableCaptcha: v } })}
                />
                <CheckboxRow
                  label="提交答卷时需输入验证码（智能验证）"
                  checked={settings.submitControl?.enableCaptcha || false}
                  onChange={v => update({ submitControl: { ...settings.submitControl, enableCaptcha: v } })}
                />
                <CheckboxRow
                  label="隐藏答题者来源详情、IP地址信息（适用于要求匿名的场景，开启后不允许再取消）"
                  checked={settings.submitControl?.hideSourceInfo || false}
                  onChange={v => update({ submitControl: { ...settings.submitControl, hideSourceInfo: v } })}
                  pro
                />
              </SettingsCard>
            )}

            {activeSection === 'share' && (
              <SettingsCard title="分享与查询" onSave={saveSection} saving={saving}>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-text-primary font-medium">问卷内容</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-text-secondary">
                      <input
                        type="checkbox"
                        checked={settings.share?.allowCopy || false}
                        onChange={e => update({ share: { ...settings.share, allowCopy: e.target.checked } })}
                        className="rounded text-primary focus:ring-primary"
                      />
                      允许复制问卷
                    </label>
                    <label className="flex items-center gap-2 text-sm text-text-secondary">
                      <input
                        type="checkbox"
                        checked={settings.share?.allowSearchEngine || false}
                        onChange={e => update({ share: { ...settings.share, allowSearchEngine: e.target.checked } })}
                        className="rounded text-primary focus:ring-primary"
                      />
                      允许搜索引擎检索
                    </label>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary font-medium">数据分享</span>
                    <ProBadge />
                  </div>
                  <button className="text-sm text-primary hover:underline">设置</button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary font-medium">对外查询（答题者查询答卷）</span>
                    <ProBadge />
                  </div>
                  <button className="text-sm text-primary hover:underline">设置</button>
                </div>
              </SettingsCard>
            )}

            {activeSection === 'other' && (
              <SettingsCard title="其他设置" onSave={saveSection} saving={saving}>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Monitor size={18} className="text-text-muted" />
                    <span className="text-text-primary font-medium">显示设置</span>
                  </div>
                  <button
                    onClick={() => navigate(`/questionnaires/${id}/appearance`)}
                    className="text-sm text-primary hover:underline"
                  >
                    设置
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Bell size={18} className="text-text-muted" />
                    <span className="text-text-primary font-medium">数据推送</span>
                    <ProBadge />
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.other?.dataPush || false}
                    onChange={e => update({ other: { ...settings.other, dataPush: e.target.checked } })}
                    className="rounded text-primary focus:ring-primary"
                  />
                </div>
              </SettingsCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsCard({ title, children, onSave, saving }: { title: string; children: React.ReactNode; onSave: () => void; saving: boolean }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-text-primary">{title}</h2>
        <button onClick={onSave} disabled={saving} className="btn-primary text-sm px-5">
          <Save size={14} /> {saving ? '保存中...' : '保存'}
        </button>
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-text-primary font-medium">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

function RadioRow({ label, checked, onChange, pro, children }: { label: string; checked: boolean; onChange: () => void; pro?: boolean; children?: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-border last:border-0">
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="radio" checked={checked} onChange={onChange} className="text-primary focus:ring-primary" />
        <span className="text-text-primary font-medium">{label}</span>
        {pro && <ProBadge />}
      </label>
      {children && <div className="ml-7">{children}</div>}
    </div>
  );
}

function CheckboxRow({ label, checked, onChange, pro, children }: { label: string; checked: boolean; onChange: (v: boolean) => void; pro?: boolean; children?: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-border last:border-0">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="rounded text-primary focus:ring-primary"
        />
        <span className="text-text-primary font-medium">{label}</span>
        {pro && <ProBadge />}
      </label>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

function ProBadge() {
  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-light text-accent-hover">VIP</span>;
}
