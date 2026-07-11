import { useEffect, useState } from 'react';
import { Search, Download, Eye, Trash2 } from 'lucide-react';
import { responseApi } from '../api';
import { questionnaireApi } from '../api';
import type { Response, Questionnaire } from '../types';

export default function DataManagement() {
  const [responses, setResponses] = useState<Response[]>([]);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQ, setSelectedQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);

  useEffect(() => {
    questionnaireApi.list({ status: 'all', limit: 100 }).then(res => {
      setQuestionnaires(res.data.data);
    });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await responseApi.list({ questionnaireId: selectedQ || undefined, page, limit: 20 });
      setResponses(res.data.data);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, selectedQ]);

  const handleExportCsv = async () => {
    if (!selectedQ) return alert('请先选择问卷');
    try {
      const res = await responseApi.exportCsv(selectedQ);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `responses-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('导出失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此答卷？')) return;
    try {
      await responseApi.delete(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text">数据管理</h2>
        <p className="text-text-muted text-sm mt-1">首页 / 数据管理</p>
      </div>

      <div className="bg-surface rounded-xl border border-border p-4 mb-6 flex items-center gap-4 flex-wrap">
        <select
          value={selectedQ}
          onChange={(e) => { setSelectedQ(e.target.value); setPage(1); }}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white outline-none"
        >
          <option value="">选择问卷</option>
          {questionnaires.map(q => (
            <option key={q.id} value={q.id}>{q.title}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索答卷..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm outline-none"
          />
        </div>
        <button onClick={handleExportCsv} className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition">
          <Download size={16} /> 导出 CSV
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-text-muted border-b border-border bg-gray-50/50">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">提交时间</th>
                <th className="px-5 py-3 font-medium">总分</th>
                <th className="px-5 py-3 font-medium">严重程度</th>
                <th className="px-5 py-3 font-medium">耗时(秒)</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-text-muted">加载中...</td></tr>
              ) : responses.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-text-muted">暂无数据，请先选择问卷</td></tr>
              ) : (
                responses.map((r, idx) => (
                  <tr key={r.id} className="border-b border-border hover:bg-gray-50 transition">
                    <td className="px-5 py-3 text-text-muted">{(page - 1) * 20 + idx + 1}</td>
                    <td className="px-5 py-3 text-sm">{new Date(r.createdAt).toLocaleString('zh-CN')}</td>
                    <td className="px-5 py-3 font-medium">{r.totalScore ?? '-'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.severityLevel?.includes('重度') ? 'bg-red-100 text-red-700' :
                        r.severityLevel?.includes('中度') ? 'bg-orange-100 text-orange-700' :
                        r.severityLevel?.includes('轻度') ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {r.severityLevel || '未知'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{r.duration ?? '-'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedResponse(r)} className="p-1.5 text-text-muted hover:text-primary transition">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 text-text-muted hover:text-danger transition">
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

        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-text-muted">共 {totalPages} 页</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-40">‹</button>
              <span className="px-3 py-1.5 text-sm">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-40">›</button>
            </div>
          </div>
        )}
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedResponse(null)}>
          <div className="bg-surface rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">答卷详情</h3>
              <button onClick={() => setSelectedResponse(null)} className="text-text-muted hover:text-text text-xl">×</button>
            </div>
            <div className="space-y-3">
              <p className="text-sm"><span className="text-text-muted">总分：</span><strong>{selectedResponse.totalScore}</strong></p>
              <p className="text-sm"><span className="text-text-muted">等级：</span>{selectedResponse.severityLevel}</p>
              <p className="text-sm"><span className="text-text-muted">耗时：</span>{selectedResponse.duration}秒</p>
              <p className="text-sm"><span className="text-text-muted">提交时间：</span>{new Date(selectedResponse.createdAt).toLocaleString('zh-CN')}</p>
              <div className="border-t pt-3 mt-3">
                <h4 className="font-medium mb-2">答案详情</h4>
                {Object.entries(selectedResponse.answers).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-1 text-sm border-b border-border/50">
                    <span className="text-text-secondary">{key}</span>
                    <span className="font-medium">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
