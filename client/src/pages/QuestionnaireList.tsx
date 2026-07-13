import { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Edit, Trash2, Copy, Play, Pause,
  Folder, Bell, Star, Send, BarChart3, Inbox, ChevronDown,
  X, FolderOpen, AlertCircle, RotateCcw, Mail,
  MessageCircle, MessageSquare, Rocket, LayoutGrid, FileEdit, Settings, Palette, Gift, GitPullRequest
} from 'lucide-react';
import { questionnaireApi } from '../api';
import type { Questionnaire, NotificationConfig } from '../types';

type ViewType = 'all' | 'starred' | 'trash' | 'folder';

const statusLabel = (s: string) => {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    draft: { label: '未发布', cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
    published: { label: '已发布', cls: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
    paused: { label: '已暂停', cls: 'bg-yellow-50 text-yellow-700', dot: 'bg-yellow-500' },
    closed: { label: '已关闭', cls: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
  };
  return map[s] || { label: s, cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
};

const formatDate = (d?: string) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
};



export default function QuestionnaireList() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewType>('all');
  const [showPromo, setShowPromo] = useState(true);
  const navigate = useNavigate();

  // Modals
  const [cloneTarget, setCloneTarget] = useState<Questionnaire | null>(null);
  const [cloneTitle, setCloneTitle] = useState('');
  const [cloneSettings, setCloneSettings] = useState(false);
  const [cloneLoading, setCloneLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Questionnaire | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [designMenuOpen, setDesignMenuOpen] = useState<string | null>(null);
  const designMenuRef = useRef<HTMLDivElement>(null);

  const [reminderTarget, setReminderTarget] = useState<Questionnaire | null>(null);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminder, setReminder] = useState<NotificationConfig>({
    wechatEnabled: false,
    wechatOpenId: '',
    emailEnabled: false,
    emailAddresses: '',
    useCustomEmailServer: false,
    wecomEnabled: false,
    wecomWebhook: '',
    dingtalkEnabled: false,
    dingtalkWebhook: '',
    feishuEnabled: false,
    feishuWebhook: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        search: search || undefined,
        status: activeView === 'trash' ? undefined : statusFilter,
        page,
        limit: 20,
      };
      if (activeView === 'trash') {
        params.trash = true;
      } else if (activeView === 'starred') {
        params.starred = true;
      }
      const res = await questionnaireApi.list(params);
      let data = res.data.data || [];
      if (sortOrder === 'asc') {
        data = [...data].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
      }
      setQuestionnaires(data);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, statusFilter, sortOrder, activeView]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (designMenuRef.current && !designMenuRef.current.contains(e.target as Node)) {
        setDesignMenuOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleStatus = async (q: Questionnaire) => {
    const next = q.status === 'published' ? 'paused' : 'published';
    try {
      await questionnaireApi.update(q.id, { status: next });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('状态切换失败');
    }
  };

  const handleStar = async (q: Questionnaire, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await questionnaireApi.star(q.id, !q.isStarred);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('设置失败');
    }
  };

  const openClone = (q: Questionnaire) => {
    setCloneTarget(q);
    setCloneTitle(`${q.title} 副本`);
    setCloneSettings(false);
  };

  const submitClone = async () => {
    if (!cloneTarget) return;
    setCloneLoading(true);
    try {
      await questionnaireApi.clone(cloneTarget.id, { title: cloneTitle, includeSettings: cloneSettings });
      setCloneTarget(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('复制失败');
    } finally {
      setCloneLoading(false);
    }
  };

  const submitDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (activeView === 'trash') {
        await questionnaireApi.permanentDelete(deleteTarget.id);
      } else {
        await questionnaireApi.delete(deleteTarget.id);
      }
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('删除失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRestore = async (q: Questionnaire) => {
    try {
      await questionnaireApi.restore(q.id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('恢复失败');
    }
  };

  const openReminder = async (q: Questionnaire) => {
    setReminderTarget(q);
    setReminderLoading(true);
    try {
      const res = await questionnaireApi.getNotifications(q.id);
      const data = res.data.data || {};
      setReminder({
        wechatEnabled: data.wechatEnabled || false,
        wechatOpenId: data.wechatOpenId || '',
        emailEnabled: data.emailEnabled || false,
        emailAddresses: data.emailAddresses || '',
        useCustomEmailServer: data.useCustomEmailServer || false,
        wecomEnabled: data.wecomEnabled || false,
        wecomWebhook: data.wecomWebhook || '',
        dingtalkEnabled: data.dingtalkEnabled || false,
        dingtalkWebhook: data.dingtalkWebhook || '',
        feishuEnabled: data.feishuEnabled || false,
        feishuWebhook: data.feishuWebhook || '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setReminderLoading(false);
    }
  };

  const saveReminder = async () => {
    if (!reminderTarget) return;
    setReminderLoading(true);
    try {
      await questionnaireApi.saveNotifications(reminderTarget.id, reminder);
      setReminderTarget(null);
    } catch (err) {
      console.error(err);
      alert('保存失败');
    } finally {
      setReminderLoading(false);
    }
  };

  const navItems = useMemo(() => [
    { key: 'all', label: '全部问卷', icon: Inbox },
    { key: 'starred', label: '星标问卷', icon: Star },
    { key: 'trash', label: '回收站', icon: Trash2 },
    { key: 'folder', label: '文件夹', icon: Folder },
  ], []);

  const activeLabel = navItems.find(n => n.key === activeView)?.label || '全部问卷';

  const renderCard = (q: Questionnaire) => {
    const st = statusLabel(q.status);
    const isTrash = activeView === 'trash';

    return (
      <div key={q.id} className="card card-hover p-4 mb-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link to={`/questionnaires/${q.id}/edit`} className="text-text-primary hover:text-primary font-medium truncate">
                {q.title}
              </Link>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">调查</span>
              {!isTrash && (
                <button
                  onClick={(e) => handleStar(q, e)}
                  className={`${q.isStarred ? 'text-yellow-400' : 'text-text-muted'} hover:text-yellow-400 transition`}
                  title={q.isStarred ? '取消星标' : '设为星标'}
                >
                  <Star size={14} fill={q.isStarred ? 'currentColor' : 'none'} />
                </button>
              )}
            </div>
          </div>
          <div className="text-right text-sm flex-shrink-0">
            <div className="flex items-center justify-end gap-3 text-text-secondary whitespace-nowrap">
              <span>ID:{q.id}</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              <span>答卷:{q.fillCount}</span>
              <span className="text-text-muted">{formatDate(q.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1">
            <div className="relative" ref={designMenuOpen === q.id ? designMenuRef : undefined}>
              <button
                onClick={() => setDesignMenuOpen(designMenuOpen === q.id ? null : q.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-text-secondary hover:text-primary hover:bg-primary-light rounded-md transition"
                title="设计问卷"
              >
                <Edit size={14} /> 设计问卷 <ChevronDown size={12} />
              </button>
              {designMenuOpen === q.id && (
                <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-border rounded-xl shadow-lg z-30 py-1">
                  <DesignMenuItem icon={LayoutGrid} label="设计向导" onClick={() => { setDesignMenuOpen(null); navigate(`/questionnaires/${q.id}/design`); }} />
                  <DesignMenuItem icon={FileEdit} label="编辑问卷" onClick={() => { setDesignMenuOpen(null); navigate(`/questionnaires/${q.id}/edit-mode`); }} />
                  <DesignMenuItem icon={Settings} label="问卷设置" onClick={() => { setDesignMenuOpen(null); navigate(`/questionnaires/${q.id}/settings`); }} />
                  <DesignMenuItem icon={Palette} label="问卷外观" onClick={() => { setDesignMenuOpen(null); navigate(`/questionnaires/${q.id}/appearance`); }} />
                  <DesignMenuItem icon={GitPullRequest} label="流程审批" onClick={() => { setDesignMenuOpen(null); navigate(`/questionnaires/${q.id}/approval`); }} />
                  <DesignMenuItem icon={Gift} label="红包&奖品" onClick={() => { setDesignMenuOpen(null); navigate(`/questionnaires/${q.id}/rewards`); }} />
                </div>
              )}
            </div>
            <button onClick={() => navigate(`/distribution?questionnaireId=${q.id}`)} className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-text-secondary hover:text-warning hover:bg-warning-light rounded-md transition" title="发送问卷">
              <Send size={14} /> 发送问卷
            </button>
            <button onClick={() => navigate(`/statistics?questionnaireId=${q.id}`)} className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-text-secondary hover:text-info hover:bg-info-light rounded-md transition" title="分析&下载">
              <BarChart3 size={14} /> 分析&下载
            </button>
          </div>

          <div className="flex items-center gap-1">
            {!isTrash ? (
              <>
                <button
                  onClick={() => handleToggleStatus(q)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md transition ${
                    q.status === 'published'
                      ? 'text-text-secondary hover:text-warning hover:bg-warning-light'
                      : 'text-text-secondary hover:text-success hover:bg-success-light'
                  }`}
                  title={q.status === 'published' ? '停止' : '发布'}
                >
                  {q.status === 'published' ? <Pause size={14} /> : <Play size={14} />}
                  {q.status === 'published' ? '停止' : '发布'}
                </button>
                <button onClick={() => openClone(q)} className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-text-secondary hover:text-primary hover:bg-primary-light rounded-md transition" title="复制">
                  <Copy size={14} /> 复制
                </button>
                <button onClick={() => setDeleteTarget(q)} className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-text-secondary hover:text-danger hover:bg-danger-light rounded-md transition" title="删除">
                  <Trash2 size={14} /> 删除
                </button>
                <button className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-text-secondary hover:text-secondary hover:bg-secondary-light rounded-md transition" title="文件夹">
                  <Folder size={14} /> 文件夹
                </button>
                <button onClick={() => openReminder(q)} className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-text-secondary hover:text-info hover:bg-info-light rounded-md transition" title="提醒">
                  <Bell size={14} /> 提醒
                </button>
              </>
            ) : (
              <>
                <button onClick={() => handleRestore(q)} className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-text-secondary hover:text-success hover:bg-success-light rounded-md transition">
                  <RotateCcw size={14} /> 恢复
                </button>
                <button onClick={() => setDeleteTarget(q)} className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-text-secondary hover:text-danger hover:bg-danger-light rounded-md transition">
                  <Trash2 size={14} /> 彻底删除
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-6">
      {/* Left sidebar */}
      <aside className="w-56 flex-shrink-0 hidden lg:block">
        <div className="card p-2">
          <button
            onClick={() => navigate('/questionnaires/new')}
            className="btn-primary w-full mb-4"
          >
            <Plus size={18} /> 创建问卷
          </button>
          <button
            className="w-full mb-3 py-2 px-3 rounded-lg border border-dashed border-primary text-primary text-sm font-medium hover:bg-primary-light transition flex items-center justify-center gap-2"
          >
            <SparkIcon size={16} /> AI 创建
          </button>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => { setActiveView(item.key as ViewType); setPage(1); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                    active ? 'bg-primary-light text-primary font-medium' : 'text-text-secondary hover:bg-background hover:text-text-primary'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-4 p-3 rounded-lg bg-info-light border border-info/20">
            <p className="text-xs text-text-secondary leading-relaxed">绑定微信后，可在手机同步编辑、管理问卷，实时掌握数据动态。</p>
            <button className="mt-2 px-3 py-1.5 bg-success text-white text-xs rounded-md hover:bg-success-hover transition">绑定微信</button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">问卷列表</h2>
          </div>
          <div className="lg:hidden">
            <button onClick={() => navigate('/questionnaires/new')} className="btn-primary">
              <Plus size={18} /> 新建问卷
            </button>
          </div>
        </div>

        {/* Mobile nav pills */}
        <div className="lg:hidden flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setActiveView(item.key as ViewType); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                  active ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary'
                }`}
              >
                <Icon size={14} /> {item.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-xl border border-border p-4 mb-4 flex items-center gap-3 flex-wrap shadow-card">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span>时间倒序</span>
            <button onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')} className="flex items-center gap-1 text-primary hover:underline">
              {sortOrder === 'desc' ? '倒序' : '正序'} <ChevronDown size={14} className={`transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <div className="h-5 w-px bg-border" />
          {activeView !== 'trash' && (
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">全部状态</option>
              <option value="draft">未发布</option>
              <option value="published">已发布</option>
              <option value="paused">已暂停</option>
              <option value="closed">已关闭</option>
            </select>
          )}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              placeholder="请输入问卷名进行搜索..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <button onClick={fetchData} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition">搜索</button>
        </div>

        {/* Promo banner */}
        {showPromo && activeView === 'all' && (
          <div className="mb-4 p-3 rounded-lg bg-warning-light border border-warning/20 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2 text-warning-hover">
              <AlertCircle size={16} />
              <span>使用问卷星样本服务，快速回收高质量答卷（已精准收集超过5800万样本）<a href="#" className="underline ml-1">登记人群需求</a></span>
            </div>
            <button onClick={() => setShowPromo(false)} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
          </div>
        )}

        {/* Trash notice */}
        {activeView === 'trash' && (
          <div className="mb-4 p-3 rounded-lg bg-info-light border border-info/20 text-sm text-info-hover">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>如果您想释放上传文件题的空间，请点击“清空数据”，数据清空后将无法恢复，请谨慎操作！</span>
            </div>
          </div>
        )}

        {/* List */}
        <div className="min-h-[300px]">
          {loading ? (
            <div className="text-center py-16 text-text-muted">加载中...</div>
          ) : questionnaires.length === 0 ? (
            <div className="card p-12 text-center text-text-muted">
              <FolderOpen size={48} className="mx-auto mb-3 text-text-muted/50" />
              <p>暂无{activeLabel}</p>
            </div>
          ) : (
            <>
              {questionnaires.map(renderCard)}
              {totalPages > 1 && (
                <div className="p-4 mt-4 bg-surface rounded-xl border border-border flex items-center justify-between">
                  <span className="text-sm text-text-muted">共 {totalPages} 页</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-sm border border-border rounded hover:bg-gray-50 disabled:opacity-40"
                    >‹</button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const p = i + Math.max(1, page - 2) - (page > 3 ? page - 3 : 0);
                      if (p > totalPages) return null;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`px-3 py-1.5 text-sm rounded ${page === p ? 'bg-primary text-white' : 'border border-border hover:bg-gray-50'}`}
                        >{p}</button>
                      );
                    })}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 text-sm border border-border rounded hover:bg-gray-50 disabled:opacity-40"
                    >›</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Clone modal */}
      {cloneTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-text-primary">复制问卷</h3>
              <button onClick={() => setCloneTarget(null)} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">复制到</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-text-secondary">
                    <input type="radio" defaultChecked className="text-primary" /> 自己的账户
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text-secondary">
                    <input type="radio" disabled className="text-primary" /> 其他账户
                  </label>
                </div>
              </div>
              <div>
                <label className="label">复制设置</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-text-secondary">
                    <input type="radio" checked={!cloneSettings} onChange={() => setCloneSettings(false)} className="text-primary" /> 复制问卷内容
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text-secondary">
                    <input type="radio" checked={cloneSettings} onChange={() => setCloneSettings(true)} className="text-primary" /> 复制问卷内容及设置
                  </label>
                </div>
              </div>
              <div>
                <label className="label">问卷标题</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cloneTitle}
                    onChange={(e) => setCloneTitle(e.target.value)}
                    className="input flex-1"
                    placeholder="请输入"
                  />
                  <button onClick={() => setCloneTitle(`${cloneTarget.title} 副本`)} className="text-primary text-sm hover:underline whitespace-nowrap">使用原问卷名称</button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setCloneTarget(null)} className="px-5 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-background transition">取消</button>
              <button onClick={submitClone} disabled={cloneLoading || !cloneTitle.trim()} className="px-5 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition disabled:opacity-50">
                {cloneLoading ? '复制中...' : '确定'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">提示</h3>
              <button onClick={() => setDeleteTarget(null)} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
            </div>
            <p className="text-text-secondary text-sm mb-6">
              {activeView === 'trash'
                ? `确定要彻底删除「${deleteTarget.title}」吗？删除后无法恢复。`
                : `您确认要删除「${deleteTarget.title}」吗？删除后可在回收站中恢复。`}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-background transition">取消</button>
              <button onClick={submitDelete} disabled={deleteLoading} className="px-5 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition disabled:opacity-50">
                {deleteLoading ? '处理中...' : '确定'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder modal */}
      {reminderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-text-primary">新增答卷时提醒</h3>
              <button onClick={() => setReminderTarget(null)} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
            </div>
            <div className="space-y-5">
              <div className="p-3 rounded-lg bg-gray-50 border border-border flex items-start gap-3">
                <MessageCircle size={18} className="text-success mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">提醒到我的微信</span>
                    <input
                      type="checkbox"
                      checked={reminder.wechatEnabled}
                      onChange={(e) => setReminder(r => ({ ...r, wechatEnabled: e.target.checked }))}
                      className="w-4 h-4 text-primary rounded"
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1">OpenId:{reminder.wechatOpenId || 'o_d200pWm94LJw7S1ootdkdsqVrM'}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-gray-50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail size={18} className="text-success" />
                    <span className="text-sm font-medium text-text-primary">提醒至邮箱</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs text-text-secondary">
                      <input
                        type="checkbox"
                        checked={reminder.useCustomEmailServer}
                        onChange={(e) => setReminder(r => ({ ...r, useCustomEmailServer: e.target.checked }))}
                        className="w-3.5 h-3.5 text-primary rounded"
                      />
                      使用自有邮件发送
                    </label>
                    <input
                      type="checkbox"
                      checked={reminder.emailEnabled}
                      onChange={(e) => setReminder(r => ({ ...r, emailEnabled: e.target.checked }))}
                      className="w-4 h-4 text-primary rounded"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={reminder.emailAddresses}
                  onChange={(e) => setReminder(r => ({ ...r, emailAddresses: e.target.value }))}
                  placeholder="请输入邮件地址，多个用逗号分隔"
                  className="input"
                />
                <p className="text-xs text-text-muted mt-1">邮箱每10分钟最多10次提醒</p>
              </div>

              {[
                { key: 'wecom', label: '提醒至企业微信群聊', icon: MessageSquare, webhook: 'wecomWebhook', enabled: 'wecomEnabled' },
                { key: 'dingtalk', label: '提醒至钉钉群聊', icon: MessageCircle, webhook: 'dingtalkWebhook', enabled: 'dingtalkEnabled' },
                { key: 'feishu', label: '提醒至飞书群聊', icon: Rocket, webhook: 'feishuWebhook', enabled: 'feishuEnabled' },
              ].map((item) => {
                const Icon = item.icon;
                const enabled = (reminder as any)[item.enabled] as boolean;
                const webhook = (reminder as any)[item.webhook] as string;
                return (
                  <div key={item.key} className="p-3 rounded-lg bg-gray-50 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon size={18} className="text-info" />
                        <span className="text-sm font-medium text-text-primary">{item.label}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setReminder(r => ({ ...r, [item.enabled]: e.target.checked }))}
                        className="w-4 h-4 text-primary rounded"
                      />
                    </div>
                    <input
                      type="text"
                      value={webhook}
                      onChange={(e) => setReminder(r => ({ ...r, [item.webhook]: e.target.value }))}
                      placeholder="请输入 webhook"
                      className="input"
                    />
                    {item.key === 'dingtalk' && (
                      <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                        1、在钉钉群聊添加机器人时需设置关键词，关键词中需包含“提醒”才可正常发送。<br/>
                        2、钉钉机器人限制每分钟最多发送20条消息到群中，超过20条将限流10分钟。
                      </p>
                    )}
                  </div>
                );
              })}

              <p className="text-xs text-primary hover:underline cursor-pointer">升级企业版，提醒更多人 &gt;&gt;</p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setReminderTarget(null)} className="px-5 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-background transition">取消</button>
              <button onClick={saveReminder} disabled={reminderLoading} className="px-5 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition disabled:opacity-50">
                {reminderLoading ? '保存中...' : '确定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SparkIcon({ size, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3L14.5 8.5L20 9L16 13.5L17.5 19L12 16L6.5 19L8 13.5L4 9L9.5 8.5L12 3Z" />
    </svg>
  );
}

function DesignMenuItem({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-primary-light hover:text-primary transition text-left"
    >
      <Icon size={16} /> {label}
    </button>
  );
}
