import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, Library, Share2, BarChart3, TrendingUp, Users, Edit, FileText, X, Search, Copy, Loader2 } from 'lucide-react';
import apiClient from '../api/client';
import { questionnaireApi } from '../api';
import type { Questionnaire } from '../types';

interface DashboardData {
  totalQuestionnaires: number;
  publishedCount: number;
  totalResponses: number;
  totalScales: number;
  recentQuestionnaires: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const navigate = useNavigate();

  // 引用/复制已有问卷弹窗
  const [showImportModal, setShowImportModal] = useState(false);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(false);
  const [importSearch, setImportSearch] = useState('');
  const [importingId, setImportingId] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/statistics/dashboard/overview').then(res => setData(res.data.data)).catch(() => {});
  }, []);

  const openImportModal = () => {
    setShowImportModal(true);
    setLoadingQuestionnaires(true);
    questionnaireApi.list({ limit: 100 })
      .then(res => setQuestionnaires(res.data.data || []))
      .catch(() => setQuestionnaires([]))
      .finally(() => setLoadingQuestionnaires(false));
  };

  const handleCopyQuestionnaire = async (q: Questionnaire) => {
    setImportingId(q.id);
    try {
      const detailRes = await questionnaireApi.getById(q.id);
      const source = detailRes.data.data;
      const res = await questionnaireApi.create({
        title: `${source.title} 的副本`,
        type: source.type || 'survey',
        description: source.description,
        questions: source.questions || [],
        coverSettings: source.coverSettings,
      });
      const newId = res.data?.data?.id;
      if (newId) {
        navigate(`/questionnaires/${newId}/edit`);
      }
    } catch (err) {
      console.error('复制问卷失败:', err);
      alert('复制问卷失败，请稍后重试');
    } finally {
      setImportingId(null);
    }
  };

  const stats = [
    { label: '问卷总数', value: data?.totalQuestionnaires ?? '-', icon: ClipboardList, color: 'text-cyan-600 bg-cyan-50' },
    { label: '已发布', value: data?.publishedCount ?? '-', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: '总答卷数', value: data?.totalResponses ?? '-', icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: '收录量表', value: data?.totalScales ?? '-', icon: Library, color: 'text-orange-600 bg-orange-50' },
  ];

  const quickActions = [
    { to: '/questionnaires/new', icon: ClipboardList, label: '新建问卷', color: 'bg-cyan-500' },
    { onClick: openImportModal, icon: Library, label: '引用量表', color: 'bg-green-500' },
    { to: '/distribution', icon: Share2, label: '分发问卷', color: 'bg-purple-500' },
    { to: '/statistics', icon: BarChart3, label: '数据分析', color: 'bg-orange-500' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text">工作台</h2>
        <p className="text-text-muted mt-1">欢迎回来，查看您的问卷数据概览</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface rounded-xl p-5 border border-border shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{stat.value}</p>
                <p className="text-sm text-text-muted">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-text mb-4">快捷操作</h3>
        <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {quickActions.map((action, idx) => (
            action.to ? (
              <Link
                key={action.to}
                to={action.to}
                className={`${action.color} text-white rounded-xl p-5 flex items-center gap-3 hover:opacity-90 transition shadow-sm`}
              >
                <action.icon size={22} />
                <span className="font-medium">{action.label}</span>
              </Link>
            ) : (
              <button
                key={idx}
                onClick={action.onClick}
                className={`${action.color} text-white rounded-xl p-5 flex items-center gap-3 hover:opacity-90 transition shadow-sm text-left w-full`}
              >
                <action.icon size={22} />
                <span className="font-medium">{action.label}</span>
              </button>
            )
          ))}
        </div>
      </div>

      {/* Recent Questionnaires */}
      <div className="bg-surface rounded-xl border border-border shadow-sm">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-text">最近问卷</h3>
          <Link to="/questionnaires" className="text-primary text-sm hover:text-primary-hover">查看全部 →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-text-muted border-b border-border">
                <th className="px-5 py-3 font-medium">问卷名称</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">答卷数</th>
                <th className="px-5 py-3 font-medium">更新时间</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentQuestionnaires?.map((q: any) => (
                <tr key={q.id} className="border-b border-border hover:bg-gray-50 transition">
                  <td className="px-5 py-3">
                    <Link to={`/questionnaires/${q.id}/edit`} className="text-text hover:text-primary font-medium">
                      {q.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      q.status === 'published' ? 'bg-green-100 text-green-700' :
                      q.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {q.status === 'published' ? '已发布' : q.status === 'draft' ? '草稿' : q.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{q.fillCount}</td>
                  <td className="px-5 py-3 text-text-muted text-sm">
                    {new Date(q.updatedAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/questionnaires/${q.id}/edit`)}
                        className="text-primary text-sm hover:underline flex items-center gap-1"
                        title="编辑问卷"
                      >
                        <Edit size={14} /> 编辑
                      </button>
                      {q.status === 'published' && (
                        <button
                          onClick={() => navigate(`/statistics?questionnaireId=${q.id}`)}
                          className="text-text-secondary text-sm hover:text-primary flex items-center gap-1"
                          title="查看数据"
                        >
                          <FileText size={14} /> 数据
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!data?.recentQuestionnaires || data.recentQuestionnaires.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-text-muted">
                    暂无问卷，<Link to="/questionnaires/new" className="text-primary hover:underline">创建第一个问卷</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import/Copy Questionnaire Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-hover">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-text-primary">引用已有问卷</h3>
                <p className="text-sm text-text-secondary mt-0.5">选择一份已有问卷，复制其题目和设置生成新问卷</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-background transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 border-b border-border">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={importSearch}
                  onChange={(e) => setImportSearch(e.target.value)}
                  placeholder="搜索问卷名称..."
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {loadingQuestionnaires ? (
                <div className="py-12 text-center text-text-muted flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> 加载中...
                </div>
              ) : questionnaires.length === 0 ? (
                <div className="py-12 text-center text-text-muted">
                  暂无已有问卷，<Link to="/questionnaires/new" className="text-primary hover:underline" onClick={() => setShowImportModal(false)}>创建新问卷</Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {questionnaires
                    .filter(q => q.title.toLowerCase().includes(importSearch.toLowerCase()))
                    .map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between p-4 rounded-xl hover:bg-background transition group"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-medium text-text-primary truncate">{q.title}</p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {q.status === 'published' ? '已发布' : q.status === 'draft' ? '草稿' : q.status} · {q.fillCount || 0} 份答卷 · {q.questions?.length || 0} 道题目
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopyQuestionnaire(q)}
                          disabled={importingId === q.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-primary bg-primary-light hover:bg-primary/10 disabled:opacity-60 transition"
                        >
                          {importingId === q.id ? (
                            <><Loader2 size={14} className="animate-spin" /> 复制中...</>
                          ) : (
                            <><Copy size={14} /> 引用复制</>
                          )}
                        </button>
                      </div>
                    ))}
                  {questionnaires.filter(q => q.title.toLowerCase().includes(importSearch.toLowerCase())).length === 0 && (
                    <div className="py-8 text-center text-text-muted">未找到匹配的问卷</div>
                  )}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-border flex justify-end">
              <button onClick={() => setShowImportModal(false)} className="btn-ghost text-sm">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
