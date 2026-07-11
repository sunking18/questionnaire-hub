import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import { questionnaireApi } from '../api';
import type { Questionnaire } from '../types';

export default function QuestionnaireList() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await questionnaireApi.list({ search: search || undefined, status: statusFilter, page, limit: 20 });
      setQuestionnaires(res.data.data);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, statusFilter]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定要删除「${title}」吗？`)) return;
    try {
      await questionnaireApi.delete(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      draft: { label: '草稿', cls: 'bg-gray-100 text-gray-600' },
      published: { label: '已发布', cls: 'bg-green-100 text-green-700' },
      paused: { label: '已暂停', cls: 'bg-yellow-100 text-yellow-700' },
      closed: { label: '已关闭', cls: 'bg-red-100 text-red-700' },
    };
    const item = map[s] || { label: s, cls: 'bg-gray-100 text-gray-600' };
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.cls}`}>{item.label}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text">问卷管理</h2>
          <p className="text-text-muted text-sm mt-1">首页 / 问卷管理</p>
        </div>
        <button
          onClick={() => navigate('/questionnaires/new')}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition"
        >
          <Plus size={18} />
          新建问卷
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-xl border border-border p-4 mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
            placeholder="搜索问卷名称..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="paused">已暂停</option>
          <option value="closed">已关闭</option>
        </select>
        <button onClick={fetchData} className="text-primary text-sm hover:underline">搜索</button>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-text-muted border-b border-border bg-gray-50/50">
                <th className="px-5 py-3 font-medium">问卷名称</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">答卷数</th>
                <th className="px-5 py-3 font-medium">创建时间</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-text-muted">加载中...</td></tr>
              ) : questionnaires.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-text-muted">暂无问卷</td></tr>
              ) : (
                questionnaires.map((q) => (
                  <tr key={q.id} className="border-b border-border hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <Link to={`/questionnaires/${q.id}`} className="text-text hover:text-primary font-medium">
                        {q.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{statusLabel(q.status)}</td>
                    <td className="px-5 py-3 text-text-secondary">{q.fillCount}</td>
                    <td className="px-5 py-3 text-text-muted text-sm">
                      {new Date(q.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/questionnaires/${q.id}`)} className="p-1.5 text-text-muted hover:text-primary transition" title="查看">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => navigate(`/questionnaires/${q.id}/edit`)} className="p-1.5 text-text-muted hover:text-primary transition" title="编辑">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(q.id, q.title)} className="p-1.5 text-text-muted hover:text-danger transition" title="删除">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-text-muted">共 {totalPages} 页</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-border rounded hover:bg-gray-50 disabled:opacity-40"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + Math.max(1, page - 2) - (page > 3 ? page - 3 : 0);
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 text-sm rounded ${
                      page === p ? 'bg-primary text-white' : 'border border-border hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-border rounded hover:bg-gray-50 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
