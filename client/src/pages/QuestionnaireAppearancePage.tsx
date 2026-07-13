import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Smartphone, Monitor, Search, AlignLeft, AlignCenter, AlignRight,
  Save, ChevronRight, Upload, Palette, Layout, X
} from 'lucide-react';
import { questionnaireApi, userThemeApi } from '../api';
import type { UserTheme } from '../api';
import QuestionnaireDesignNav from '../components/QuestionnaireDesignNav';
import type { Questionnaire, QuestionnaireTheme, Question } from '../types';

interface PresetTheme {
  id: string;
  name: string;
  primaryColor: string;
  background: NonNullable<QuestionnaireTheme['background']>;
  cover?: string;
}

const presetThemes: PresetTheme[] = [
  { id: 'default', name: '默认', primaryColor: '#3b82f6', background: { type: 'color', color: '#f8fafc' } },
  { id: 'classic', name: '经典封面', primaryColor: '#2563eb', background: { type: 'color', color: '#eff6ff' } },
  { id: 'planet', name: '知识星球', primaryColor: '#8b5cf6', background: { type: 'gradient', gradient: 'linear-gradient(135deg, #ede9fe 0%, #f3e8ff 100%)' } },
  { id: 'newyear', name: '骏驰新岁', primaryColor: '#dc2626', background: { type: 'gradient', gradient: 'linear-gradient(135deg, #fef2f2 0%, #ffedd5 100%)' } },
  { id: 'fun', name: '趣味学习', primaryColor: '#10b981', background: { type: 'gradient', gradient: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' } },
  { id: 'tech', name: '未来科技', primaryColor: '#0ea5e9', background: { type: 'gradient', gradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' } },
  { id: 'vital', name: '活力橙几何', primaryColor: '#f97316', background: { type: 'gradient', gradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' } },
  { id: 'learning', name: '学习之旅', primaryColor: '#f59e0b', background: { type: 'gradient', gradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' } },
];

const fontOptions = [
  { value: 'system', label: '系统默认' },
  { value: '"PingFang SC", "Microsoft YaHei", sans-serif', label: '苹方/雅黑' },
  { value: 'Georgia, serif', label: '衬线体' },
];

const fontSizeOptions = [
  { value: 'small', label: '小', size: '14px' },
  { value: 'normal', label: '中', size: '16px' },
  { value: 'large', label: '大', size: '18px' },
];

const defaultTheme: QuestionnaireTheme = {
  themeId: 'default',
  primaryColor: '#3b82f6',
  background: { type: 'color', color: '#f8fafc' },
  cover: { enabled: false, title: '', description: '' },
  header: { enabled: false, text: '', align: 'center' },
  footer: { enabled: false, text: '', align: 'center' },
  textStyle: { fontFamily: 'system', fontSize: 'normal', titleColor: '#111827', textColor: '#374151' },
  display: { showQuestionNumber: true, showProgress: true, showTimer: false, showRequiredMark: true, compactMode: false },
};

function mergeTheme(theme: QuestionnaireTheme | null | undefined): QuestionnaireTheme {
  return { ...defaultTheme, ...theme, background: { ...defaultTheme.background, ...theme?.background }, cover: { ...defaultTheme.cover, ...theme?.cover }, header: { ...defaultTheme.header, ...theme?.header }, footer: { ...defaultTheme.footer, ...theme?.footer }, textStyle: { ...defaultTheme.textStyle, ...theme?.textStyle }, display: { ...defaultTheme.display, ...theme?.display } };
}

function getBackgroundStyle(theme: QuestionnaireTheme) {
  const bg = theme.background;
  if (!bg) return { backgroundColor: '#f8fafc' };
  if (bg.type === 'gradient' && bg.gradient) return { background: bg.gradient };
  if (bg.type === 'image' && bg.image) return { backgroundImage: `url(${bg.image})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  return { backgroundColor: bg.color || '#f8fafc' };
}

function previewTextStyle(theme: QuestionnaireTheme) {
  const fs = theme.textStyle?.fontSize || 'normal';
  const size = fontSizeOptions.find(f => f.value === fs)?.size || '16px';
  return {
    fontFamily: theme.textStyle?.fontFamily === 'system' ? '"PingFang SC", "Microsoft YaHei", sans-serif' : theme.textStyle?.fontFamily,
    fontSize: size,
    color: theme.textStyle?.textColor || '#374151',
  };
}

export default function QuestionnaireAppearancePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [theme, setTheme] = useState<QuestionnaireTheme>(defaultTheme);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [activeTab, setActiveTab] = useState<'my' | 'recommended'>('recommended');
  const [search, setSearch] = useState('');
  const [activePanel, setActivePanel] = useState<string>('cover');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<'cover' | 'background' | 'logo' | null>(null);
  const [myThemes, setMyThemes] = useState<UserTheme[]>([]);
  const [themesLoading, setThemesLoading] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    if (!id) return;
    questionnaireApi.getById(id)
      .then(res => {
        const q = res.data.data;
        setQuestionnaire(q);
        setTheme(mergeTheme(q.theme));
      })
      .catch(() => navigate('/questionnaires'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadMyThemes();
  }, []);

  const loadMyThemes = async () => {
    setThemesLoading(true);
    try {
      const res = await userThemeApi.list();
      setMyThemes(res.data.data || []);
    } catch (err) {
      console.error('加载我的主题失败', err);
    } finally {
      setThemesLoading(false);
    }
  };

  const filteredThemes = useMemo(() => {
    if (!search.trim()) return presetThemes;
    return presetThemes.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const applyTheme = (preset: PresetTheme) => {
    setTheme(prev => ({
      ...prev,
      themeId: preset.id,
      primaryColor: preset.primaryColor,
      background: { ...preset.background },
    }));
  };

  const updateTheme = (patch: Partial<QuestionnaireTheme>) => {
    setTheme(prev => ({ ...prev, ...patch }));
  };

  const updateBackground = (patch: Partial<QuestionnaireTheme['background']>) => {
    setTheme(prev => ({ ...prev, background: { ...prev.background, ...patch } }));
  };

  const updateCover = (patch: Partial<QuestionnaireTheme['cover']>) => {
    setTheme(prev => ({ ...prev, cover: { ...prev.cover, ...patch } }));
  };

  const updateHeader = (patch: Partial<QuestionnaireTheme['header']>) => {
    setTheme(prev => ({ ...prev, header: { ...prev.header, ...patch } }));
  };

  const updateFooter = (patch: Partial<QuestionnaireTheme['footer']>) => {
    setTheme(prev => ({ ...prev, footer: { ...prev.footer, ...patch } }));
  };

  const updateTextStyle = (patch: Partial<QuestionnaireTheme['textStyle']>) => {
    setTheme(prev => ({ ...prev, textStyle: { ...prev.textStyle, ...patch } }));
  };

  const updateDisplay = (patch: Partial<QuestionnaireTheme['display']>) => {
    setTheme(prev => ({ ...prev, display: { ...prev.display, ...patch } }));
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await questionnaireApi.update(id, { theme });
      alert('保存成功');
    } catch (err) {
      console.error(err);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadClick = (target: 'cover' | 'background' | 'logo') => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    const url = URL.createObjectURL(file);
    if (uploadTarget === 'cover') updateCover({ image: url });
    if (uploadTarget === 'background') updateBackground({ type: 'image', image: url });
    if (uploadTarget === 'logo') updateHeader({ logo: url });
    e.target.value = '';
  };

  const previewQuestions: Question[] = questionnaire?.questions.slice(0, 3) || [];

  if (loading) return <div className="min-h-screen flex items-center justify-center text-text-muted">加载中...</div>;
  if (!questionnaire) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <QuestionnaireDesignNav questionnaire={questionnaire} activeTab="appearance" questionnaireId={questionnaire.id} />
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: themes */}
        <div className="w-56 border-r border-border bg-white flex flex-col">
          <div className="flex items-center border-b border-border">
            <button onClick={() => setActiveTab('my')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'my' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}>我的主题</button>
            <button onClick={() => setActiveTab('recommended')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'recommended' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}>推荐主题</button>
          </div>
          <div className="p-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索主题" className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg outline-none focus:border-primary" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {activeTab === 'recommended' ? (
              filteredThemes.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyTheme(preset)}
                  className={`w-full text-left rounded-xl border p-2 transition hover:shadow-md ${theme.themeId === preset.id ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
                >
                  <div className="h-16 rounded-lg mb-2" style={{ ...getBackgroundStyle({ background: preset.background } as QuestionnaireTheme), border: '1px solid #e2e8f0' }}>
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="w-16 h-3 rounded-full" style={{ backgroundColor: preset.primaryColor }} />
                    </div>
                  </div>
                  <div className="text-xs text-text-primary font-medium">{preset.name}</div>
                </button>
              ))
            ) : themesLoading ? (
              <div className="text-center text-sm text-text-muted py-10">加载中...</div>
            ) : myThemes.length === 0 ? (
              <div className="text-center text-sm text-text-muted py-10">暂无自定义主题</div>
            ) : (
              myThemes.map(mt => {
                const t = mergeTheme(mt.theme as QuestionnaireTheme);
                return (
                  <button
                    key={mt.id}
                    onClick={() => {
                      setTheme(mergeTheme(mt.theme as QuestionnaireTheme));
                      setActiveTab('my');
                    }}
                    className={`w-full text-left rounded-xl border p-2 transition hover:shadow-md ${theme.themeId === mt.id ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
                  >
                    <div className="h-16 rounded-lg mb-2 flex items-center justify-center" style={{ ...getBackgroundStyle(t), border: '1px solid #e2e8f0' }}>
                      <div className="w-16 h-3 rounded-full" style={{ backgroundColor: t.primaryColor }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-text-primary font-medium truncate flex-1">{mt.name}</div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`确定删除主题「${mt.name}」？`)) {
                            userThemeApi.delete(mt.id).then(() => loadMyThemes());
                          }
                        }}
                        className="text-text-muted hover:text-red-500 transition flex-shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Middle preview */}
        <div className="flex-1 bg-[#f4f6f9] flex flex-col items-center overflow-y-auto">
          <div className="w-full sticky top-0 z-20 bg-[#f4f6f9]/90 backdrop-blur px-4 py-3 flex items-center justify-center gap-3">
            <div className="inline-flex bg-white border border-border rounded-lg p-1">
              <button onClick={() => setPreviewMode('mobile')} className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition ${previewMode === 'mobile' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-background'}`}><Smartphone size={14} /> 手机预览</button>
              <button onClick={() => setPreviewMode('desktop')} className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition ${previewMode === 'desktop' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-background'}`}><Monitor size={14} /> 电脑预览</button>
            </div>
            <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-1.5">
              <Palette size={14} className="text-text-muted" />
              <span className="text-sm text-text-secondary">修改配色</span>
              <input type="color" value={theme.primaryColor} onChange={e => updateTheme({ primaryColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
              <span className="text-xs text-text-muted font-mono">{theme.primaryColor}</span>
            </div>
            <button onClick={() => updateTheme({ primaryColor: '#3b82f6', background: { type: 'color', color: '#f8fafc' } })} className="text-sm text-text-secondary hover:text-primary">还原</button>
          </div>

          <div className={`transition-all ${previewMode === 'mobile' ? 'w-[360px]' : 'w-full max-w-3xl'} my-6`}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden min-h-[600px]" style={previewMode === 'mobile' ? {} : getBackgroundStyle(theme)}>
              {theme.header?.enabled && (
                <div className={`px-6 py-4 text-sm border-b border-border ${theme.header.align === 'center' ? 'text-center' : theme.header.align === 'right' ? 'text-right' : 'text-left'}`} style={{ color: theme.textStyle?.textColor }}>
                  {theme.header.logo && <img src={theme.header.logo} alt="logo" className="h-8 mb-2 inline-block" />}
                  {theme.header.text}
                </div>
              )}
              <div style={previewMode === 'mobile' ? { ...getBackgroundStyle(theme), minHeight: '600px' } : {}} className="p-6">
                {theme.cover?.enabled ? (
                  <div className="rounded-xl overflow-hidden mb-6">
                    {theme.cover.image && <img src={theme.cover.image} alt="cover" className="w-full h-40 object-cover" />}
                    <div className="p-5 bg-white border border-border border-t-0 rounded-b-xl">
                      <h3 className="text-lg font-bold mb-2" style={{ color: theme.primaryColor }}>{theme.cover.title || questionnaire.title}</h3>
                      <p className="text-sm text-text-secondary">{theme.cover.description || questionnaire.description}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold mb-3" style={{ color: theme.textStyle?.titleColor }}>{questionnaire.title}</h2>
                    {questionnaire.description && <p className="text-sm leading-relaxed" style={{ color: theme.textStyle?.textColor }}>{questionnaire.description}</p>}
                  </div>
                )}

                <div style={previewTextStyle(theme)}>
                  {previewQuestions.map((q, idx) => {
                    if (q.type === 'page' || q.type === 'section') return null;
                    return (
                      <div key={q.id} className={`mb-5 ${theme.display?.compactMode ? 'mb-3' : 'mb-5'} p-4 rounded-xl border border-gray-100 bg-white/80`}>
                        <div className="font-medium mb-3" style={{ color: theme.textStyle?.titleColor }}>
                          {theme.display?.showQuestionNumber !== false ? `${idx + 1}. ` : ''}{q.title}
                          {q.required && theme.display?.showRequiredMark !== false && <span className="text-red-500 ml-1">*</span>}
                        </div>
                        {q.type === 'radio' && (
                          <div className="space-y-2">
                            {q.options?.map(opt => (
                              <label key={opt.value} className="flex items-center gap-2 text-sm">
                                <span className="w-4 h-4 rounded-full border border-gray-300" />
                                {opt.label}
                              </label>
                            ))}
                          </div>
                        )}
                        {q.type === 'text' && <div className="h-9 border border-gray-300 rounded-md bg-white" />}
                        {q.type !== 'radio' && q.type !== 'text' && <div className="h-9 border border-gray-300 rounded-md bg-white" />}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-8">
                  {theme.display?.showProgress && (
                    <div className="flex-1 mr-4">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: '33%', backgroundColor: theme.primaryColor }} />
                      </div>
                      <div className="text-xs text-text-muted mt-1">进度 33%</div>
                    </div>
                  )}
                  <button className="px-6 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: theme.primaryColor }}>提交</button>
                </div>
              </div>
              {theme.footer?.enabled && (
                <div className={`px-6 py-4 text-xs border-t border-border ${theme.footer.align === 'center' ? 'text-center' : theme.footer.align === 'right' ? 'text-right' : 'text-left'}`} style={{ color: theme.textStyle?.textColor }}>
                  {theme.footer.text}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar: settings */}
        <div className="w-72 border-l border-border bg-white flex flex-col">
          <div className="px-4 py-3 border-b border-border font-medium text-sm text-text-primary flex items-center gap-2">
            <Layout size={16} /> 设置面板
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <PanelButton id="cover" label="设置封面" active={activePanel} onClick={setActivePanel} />
            <PanelButton id="background" label="设置背景" active={activePanel} onClick={setActivePanel} />
            <PanelButton id="header" label="页眉页脚" active={activePanel} onClick={setActivePanel} />
            <PanelButton id="text" label="文字格式" active={activePanel} onClick={setActivePanel} />
            <PanelButton id="display" label="显示设置" active={activePanel} onClick={setActivePanel} />

            {activePanel === 'cover' && (
              <div className="pt-2 border-t border-border space-y-4">
                <ToggleRow label="启用封面" value={theme.cover?.enabled} onChange={v => updateCover({ enabled: v })} />
                <div>
                  <label className="block text-xs text-text-muted mb-1">封面标题</label>
                  <input type="text" value={theme.cover?.title} onChange={e => updateCover({ title: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">封面描述</label>
                  <textarea value={theme.cover?.description} onChange={e => updateCover({ description: e.target.value })} rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">封面图片</label>
                  <ImageUpload value={theme.cover?.image} onUpload={() => handleUploadClick('cover')} onRemove={() => updateCover({ image: undefined })} />
                </div>
              </div>
            )}

            {activePanel === 'background' && (
              <div className="pt-2 border-t border-border space-y-4">
                <div>
                  <label className="block text-xs text-text-muted mb-2">背景类型</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['color', 'gradient', 'image'] as const).map(type => (
                      <button key={type} onClick={() => updateBackground({ type })} className={`px-2 py-1.5 text-xs border rounded-lg ${theme.background?.type === type ? 'border-primary text-primary bg-primary-light' : 'border-border text-text-secondary'}`}>
                        {type === 'color' ? '纯色' : type === 'gradient' ? '渐变' : '图片'}
                      </button>
                    ))}
                  </div>
                </div>
                {theme.background?.type === 'color' && (
                  <div className="flex items-center gap-2">
                    <input type="color" value={theme.background?.color} onChange={e => updateBackground({ color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                    <input type="text" value={theme.background?.color} onChange={e => updateBackground({ color: e.target.value })} className="flex-1 border border-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                )}
                {theme.background?.type === 'gradient' && (
                  <div className="space-y-2">
                    <label className="text-xs text-text-muted">渐变 CSS</label>
                    <textarea value={theme.background?.gradient} onChange={e => updateBackground({ gradient: e.target.value })} rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-primary resize-none" />
                  </div>
                )}
                {theme.background?.type === 'image' && (
                  <div>
                    <label className="block text-xs text-text-muted mb-1">背景图片</label>
                    <ImageUpload value={theme.background?.image} onUpload={() => handleUploadClick('background')} onRemove={() => updateBackground({ image: undefined })} />
                  </div>
                )}
              </div>
            )}

            {activePanel === 'header' && (
              <div className="pt-2 border-t border-border space-y-4">
                <ToggleRow label="启用页眉" value={theme.header?.enabled} onChange={v => updateHeader({ enabled: v })} />
                {theme.header?.enabled && (
                  <>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">页眉 Logo</label>
                      <ImageUpload value={theme.header?.logo} onUpload={() => handleUploadClick('logo')} onRemove={() => updateHeader({ logo: undefined })} />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">页眉文字</label>
                      <input type="text" value={theme.header?.text} onChange={e => updateHeader({ text: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-2">对齐方式</label>
                      <div className="flex border border-border rounded-lg overflow-hidden">
                        <AlignButton active={theme.header?.align === 'left'} onClick={() => updateHeader({ align: 'left' })} icon={AlignLeft} />
                        <AlignButton active={theme.header?.align === 'center'} onClick={() => updateHeader({ align: 'center' })} icon={AlignCenter} />
                        <AlignButton active={theme.header?.align === 'right'} onClick={() => updateHeader({ align: 'right' })} icon={AlignRight} />
                      </div>
                    </div>
                  </>
                )}
                <div className="border-t border-border pt-4">
                  <ToggleRow label="启用页脚" value={theme.footer?.enabled} onChange={v => updateFooter({ enabled: v })} />
                  {theme.footer?.enabled && (
                    <>
                      <div className="mt-3">
                        <label className="block text-xs text-text-muted mb-1">页脚文字</label>
                        <input type="text" value={theme.footer?.text} onChange={e => updateFooter({ text: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs text-text-muted mb-2">对齐方式</label>
                        <div className="flex border border-border rounded-lg overflow-hidden">
                          <AlignButton active={theme.footer?.align === 'left'} onClick={() => updateFooter({ align: 'left' })} icon={AlignLeft} />
                          <AlignButton active={theme.footer?.align === 'center'} onClick={() => updateFooter({ align: 'center' })} icon={AlignCenter} />
                          <AlignButton active={theme.footer?.align === 'right'} onClick={() => updateFooter({ align: 'right' })} icon={AlignRight} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activePanel === 'text' && (
              <div className="pt-2 border-t border-border space-y-4">
                <div>
                  <label className="block text-xs text-text-muted mb-2">字体</label>
                  <select value={theme.textStyle?.fontFamily} onChange={e => updateTextStyle({ fontFamily: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white">
                    {fontOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-2">字号</label>
                  <div className="grid grid-cols-3 gap-2">
                    {fontSizeOptions.map(fs => (
                      <button key={fs.value} onClick={() => updateTextStyle({ fontSize: fs.value as any })} className={`px-2 py-1.5 text-xs border rounded-lg ${theme.textStyle?.fontSize === fs.value ? 'border-primary text-primary bg-primary-light' : 'border-border text-text-secondary'}`}>{fs.label}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-muted flex-1">标题颜色</label>
                  <input type="color" value={theme.textStyle?.titleColor} onChange={e => updateTextStyle({ titleColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-muted flex-1">文字颜色</label>
                  <input type="color" value={theme.textStyle?.textColor} onChange={e => updateTextStyle({ textColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                </div>
              </div>
            )}

            {activePanel === 'display' && (
              <div className="pt-2 border-t border-border space-y-3">
                <ToggleRow label="显示题号" value={theme.display?.showQuestionNumber} onChange={v => updateDisplay({ showQuestionNumber: v })} />
                <ToggleRow label="显示进度" value={theme.display?.showProgress} onChange={v => updateDisplay({ showProgress: v })} />
                <ToggleRow label="显示计时" value={theme.display?.showTimer} onChange={v => updateDisplay({ showTimer: v })} />
                <ToggleRow label="显示必填标记" value={theme.display?.showRequiredMark} onChange={v => updateDisplay({ showRequiredMark: v })} />
                <ToggleRow label="紧凑模式" value={theme.display?.compactMode} onChange={v => updateDisplay({ compactMode: v })} />
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border space-y-2">
            {showSaveDialog ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder="主题名称"
                  className="flex-1 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                  autoFocus
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && saveName.trim()) {
                      try {
                        await userThemeApi.create({ name: saveName.trim(), theme });
                        setShowSaveDialog(false);
                        setSaveName('');
                        loadMyThemes();
                        alert('保存成功');
                      } catch {
                        alert('保存失败');
                      }
                    }
                  }}
                />
                <button
                  onClick={async () => {
                    if (!saveName.trim()) return;
                    try {
                      await userThemeApi.create({ name: saveName.trim(), theme });
                      setShowSaveDialog(false);
                      setSaveName('');
                      loadMyThemes();
                      alert('保存成功');
                    } catch {
                      alert('保存失败');
                    }
                  }}
                  className="px-3 py-2 bg-primary text-white rounded-lg text-xs hover:bg-primary/90"
                >
                  确定
                </button>
                <button
                  onClick={() => { setShowSaveDialog(false); setSaveName(''); }}
                  className="px-3 py-2 border border-border rounded-lg text-xs text-text-secondary hover:bg-background"
                >
                  取消
                </button>
              </div>
            ) : (
              <button onClick={() => setShowSaveDialog(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-background transition">
                <Palette size={14} /> 存为我的主题
              </button>
            )}
            <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition disabled:opacity-50">
              <Save size={14} /> {saving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelButton({ id, label, active, onClick }: { id: string; label: string; active: string; onClick: (id: string) => void }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition ${active === id ? 'bg-primary-light text-primary font-medium' : 'text-text-secondary hover:bg-background'}`}
    >
      {label}
      <ChevronRight size={14} className={`transition ${active === id ? 'text-primary' : 'text-text-muted'}`} />
    </button>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value?: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-primary">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full relative transition ${value ? 'bg-primary' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function ImageUpload({ value, onUpload, onRemove }: { value?: string; onUpload: () => void; onRemove: () => void }) {
  return value ? (
    <div className="relative rounded-lg overflow-hidden border border-border group">
      <img src={value} alt="uploaded" className="w-full h-24 object-cover" />
      <button onClick={onRemove} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition">
        <X size={12} />
      </button>
    </div>
  ) : (
    <button onClick={onUpload} className="w-full h-24 border border-dashed border-border rounded-lg flex flex-col items-center justify-center text-text-secondary hover:border-primary hover:text-primary transition">
      <Upload size={18} />
      <span className="text-xs mt-1">点击上传</span>
    </button>
  );
}

function AlignButton({ active, onClick, icon: Icon }: { active: boolean; onClick: () => void; icon: React.ElementType }) {
  return (
    <button onClick={onClick} className={`flex-1 py-1.5 flex items-center justify-center transition ${active ? 'bg-primary text-white' : 'text-text-secondary hover:bg-background'}`}>
      <Icon size={14} />
    </button>
  );
}
