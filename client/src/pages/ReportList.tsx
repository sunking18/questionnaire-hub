import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, RefreshCw } from 'lucide-react';
import { reportApi } from '../api';
import { questionnaireApi } from '../api';
import type { Report, Questionnaire } from '../types';

export default function ReportList() {
  const [reports, setReports] = useState<Report[]>([]);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQ, setSelectedQ] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    questionnaireApi.list({ status: 'all', limit: 100 }).then(res => setQuestionnaires(res.data.data));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await reportApi.list({
        questionnaireId: selectedQ || undefined,
        severityLevel: severityFilter,
        page, limit: 20,
      });
      setReports(res.data.data);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, selectedQ, severityFilter]);

  const handleRegenerate = async (responseId: string) => {
    if (!confirm('确定要重新生成此报告吗？')) return;
    try {
      await reportApi.regenerate(responseId);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || '重新生成失败');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text">AI 报告列表</h2>
          <p className="text-text-muted text-sm mt-1">首页 / AI 报告 / 报告列表</p>
        </div>
        <Link to="/reports/aggregate" className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
          整体分析报告
        </Link>
      </div>

      <div className="bg-surface rounded-xl border border-border p-4 mb-6 flex items-center gap-4 flex-wrap">
        <select value={selectedQ} onChange={(e) => { setSelectedQ(e.target.value); setPage(1); }}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white outline-none">
          <option value="">全部问卷</option>
          {questionnaires.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
        </select>
        <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white outline-none">
          <option value="all">全部等级</option>
          <option value="正常">正常</option>
          <option value="轻度抑郁倾向">轻度抑郁倾向</option>
          <option value="中度抑郁倾向">中度抑郁倾向</option>
          <option value="中重度抑郁倾向">中重度抑郁倾向</option>
          <option value="重度抑郁倾向">重度抑郁倾向</option>
        </select>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-text-muted border-b border-border bg-gray-50/50">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">问卷</th>
                <th className="px-5 py-3 font-medium">总分</th>
                <th className="px-5 py-3 font-medium">严重程度</th>
                <th className="px-5 py-3 font-medium">AI模型</th>
                <th className="px-5 py-3 font-medium">Token</th>
                <th className="px-5 py-3 font-medium">提交时间</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-text-muted">加载中...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-text-muted">暂无报告</td></tr>
              ) : (
                reports.map((r, idx) => (
                  <tr key={r.id} className="border-b border-border hover:bg-gray-50 transition">
                    <td className="px-5 py-3 text-text-muted">{(page - 1) * 20 + idx + 1}</td>
                    <td className="px-5 py-3 text-sm max-w-[200px] truncate">
                      {(r as any).questionnaire?.title || '-'}
                    </td>
                    <td className="px-5 py-3 font-medium">{r.totalScore}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.severityLevel?.includes('重度') ? 'bg-red-100 text-red-700' :
                        r.severityLevel?.includes('中度') ? 'bg-orange-100 text-orange-700' :
                        r.severityLevel?.includes('轻度') ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{r.severityLevel}</span>
                    </td>
                    <td className="px-5 py-3 text-text-muted text-sm">{r.aiModel}</td>
                    <td className="px-5 py-3 text-text-muted text-sm">{r.tokensUsed}</td>
                    <td className="px-5 py-3 text-text-muted text-sm">
                      {new Date(r.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/reports/${r.id}`} className="p-1.5 text-text-muted hover:text-primary transition">
                          <Eye size={16} />
                        </Link>
                        <button onClick={() => handleRegenerate(r.responseId)} className="p-1.5 text-text-muted hover:text-warning transition" title="重新生成">
                          <RefreshCw size={16} />
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
    </div>
  );
}
