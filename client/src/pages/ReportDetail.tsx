import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Download } from 'lucide-react';
import { reportApi } from '../api';
import type { Report } from '../types';

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    reportApi.getById(id).then(res => {
      setReport(res.data.data);
    }).catch(() => navigate('/reports')).finally(() => setLoading(false));
  }, [id]);

  const handleRegenerate = async () => {
    if (!report) return;
    try {
      const res = await reportApi.regenerate(report.responseId);
      setReport(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || '重新生成失败');
    }
  };

  if (loading) return <div className="text-center py-12 text-text-muted">加载中...</div>;
  if (!report) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/reports')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-text">报告详情</h2>
            <p className="text-text-muted text-sm mt-1">首页 / AI 报告 / 详情</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRegenerate} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-gray-50 transition">
            <RefreshCw size={16} /> 重新生成
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="bg-surface rounded-xl border border-border p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 text-sm">
          <div><span className="text-text-muted">问卷：</span>{report.questionnaire?.title || '-'}</div>
          <div><span className="text-text-muted">总分：</span><strong>{report.totalScore}</strong></div>
          <div><span className="text-text-muted">等级：</span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ml-1 ${
              report.severityLevel?.includes('重度') ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
            }`}>{report.severityLevel}</span>
          </div>
          <div><span className="text-text-muted">AI模型：</span>{report.aiModel}</div>
          <div><span className="text-text-muted">Token消耗：</span>{report.tokensUsed}</div>
          <div><span className="text-text-muted">生成耗时：</span>{report.generationTime}ms</div>
          <div><span className="text-text-muted">提交时间：</span>{new Date(report.createdAt).toLocaleString('zh-CN')}</div>
          <div><span className="text-text-muted">匹配规则：</span>{report.matchedRuleId || '-'}</div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <h3 className="font-semibold text-text mb-4">AI 生成报告</h3>
        {report.aiHtml ? (
          <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed"
            dangerouslySetInnerHTML={{ __html: report.aiHtml }} />
        ) : (
          <pre className="whitespace-pre-wrap text-text-secondary text-sm leading-relaxed">{report.aiContent || '暂无内容'}</pre>
        )}
      </div>
    </div>
  );
}
