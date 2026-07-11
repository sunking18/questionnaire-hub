import { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { reportApi } from '../api';
import { questionnaireApi } from '../api';
import type { AggregateAnalysis, Questionnaire } from '../types';

export default function AggregateAnalysisPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQ, setSelectedQ] = useState('');
  const [analysis, setAnalysis] = useState<AggregateAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    questionnaireApi.list({ status: 'published', limit: 100 }).then(res => setQuestionnaires(res.data.data));
  }, []);

  useEffect(() => {
    if (!selectedQ) return;
    setLoading(true);
    reportApi.getAggregate(selectedQ)
      .then(res => setAnalysis(res.data.data))
      .catch(() => setAnalysis(null))
      .finally(() => setLoading(false));
  }, [selectedQ]);

  const handleGenerate = async () => {
    if (!selectedQ) return;
    setGenerating(true);
    try {
      const res = await reportApi.generateAggregate(selectedQ);
      setAnalysis(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const alertIcons: Record<string, any> = { critical: AlertTriangle, warning: AlertCircle, info: Info };
  const alertColors: Record<string, string> = {
    critical: 'border-red-300 bg-red-50',
    warning: 'border-yellow-300 bg-yellow-50',
    info: 'border-blue-300 bg-blue-50',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text">整体分析报告</h2>
          <p className="text-text-muted text-sm mt-1">首页 / AI 报告 / 整体分析</p>
        </div>
      </div>

      {/* Selector */}
      <div className="bg-surface rounded-xl border border-border p-4 mb-6 flex items-center gap-4">
        <select value={selectedQ} onChange={(e) => setSelectedQ(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white outline-none min-w-[250px]">
          <option value="">选择问卷</option>
          {questionnaires.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
        </select>
        <button onClick={handleGenerate} disabled={!selectedQ || generating}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition disabled:opacity-50">
          <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
          {generating ? '生成中...' : (analysis ? '重新生成' : '生成分析报告')}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-muted">加载中...</div>
      ) : !analysis ? (
        <div className="text-center py-12 text-text-muted bg-surface rounded-xl border border-border">
          {selectedQ ? '暂无分析报告，点击"生成分析报告"按钮创建' : '请选择一份问卷'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-sm:grid-cols-2">
            {[
              { label: '总答卷数', value: analysis.totalResponses },
              { label: '平均分', value: analysis.avgTotalScore?.toFixed(1) },
              { label: '中位数', value: analysis.medianTotalScore?.toFixed(1) },
              { label: '标准差', value: analysis.stddevTotalScore?.toFixed(2) },
              { label: 'Token消耗', value: analysis.tokensUsed },
            ].map(stat => (
              <div key={stat.label} className="bg-surface rounded-xl border border-border p-4 shadow-sm">
                <p className="text-text-muted text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-text mt-1">{stat.value ?? '-'}</p>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {analysis.alerts?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-text">⚠️ 预警提示</h3>
              {analysis.alerts.map((alert, i) => {
                const Icon = alertIcons[alert.level] || Info;
                return (
                  <div key={i} className={`border rounded-xl p-4 flex items-start gap-3 ${alertColors[alert.level] || ''}`}>
                    <Icon size={20} className={alert.level === 'critical' ? 'text-danger' : alert.level === 'warning' ? 'text-warning' : 'text-primary'} />
                    <div>
                      <p className="font-medium text-sm text-text">{alert.title}</p>
                      <p className="text-sm text-text-secondary mt-0.5">{alert.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Severity Distribution */}
          {analysis.severityDist && Object.keys(analysis.severityDist).length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-text mb-4">严重程度分布</h3>
              <div className="flex items-center gap-8">
                <svg width="160" height="160" viewBox="0 0 160 160">
                  {(() => {
                    const entries = Object.entries(analysis.severityDist as Record<string, number>);
                    const total = entries.reduce((s, [, v]) => s + (v as number), 0) || 1;
                    const colors = ['#059669', '#D97706', '#EA580C', '#DC2626'];
                    let cumulative = 0;
                    return entries.map(([label, count], i) => {
                      const pct = (count as number) / total;
                      const startAngle = (cumulative * 360) - 90;
                      const endAngle = ((cumulative + pct) * 360) - 90;
                      cumulative += pct;
                      if (pct === 0) return null;
                      const r = 60, cx = 80, cy = 80;
                      const x1 = cx + r * Math.cos(startAngle * Math.PI / 180);
                      const y1 = cy + r * Math.sin(startAngle * Math.PI / 180);
                      const x2 = cx + r * Math.cos(endAngle * Math.PI / 180);
                      const y2 = cy + r * Math.sin(endAngle * Math.PI / 180);
                      const largeArc = pct > 0.5 ? 1 : 0;
                      return (
                        <g key={label}>
                          <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`}
                            fill={colors[i] || '#94A3B8'} opacity="0.85" />
                        </g>
                      );
                    });
                  })()}
                  <circle cx="80" cy="80" r="40" fill="white" />
                  <text x="80" y="76" textAnchor="middle" className="text-lg font-bold" fill="#164E63">
                    {analysis.totalResponses}
                  </text>
                  <text x="80" y="94" textAnchor="middle" className="text-xs" fill="#94A3B8">总人数</text>
                </svg>
                <div className="space-y-2">
                  {Object.entries(analysis.severityDist as Record<string, number>).map(([label, count], i) => {
                    const total = Object.values(analysis.severityDist as Record<string, number>).reduce((s, v) => s + (v as number), 0) || 1;
                    const colors = ['#059669', '#D97706', '#EA580C', '#DC2626'];
                    return (
                      <div key={label} className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i] || '#94A3B8' }} />
                        <span className="text-text-secondary">{label}</span>
                        <span className="font-medium">{count as number}人</span>
                        <span className="text-text-muted">({Math.round((count as number) / total * 100)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis Content */}
          {analysis.analysisHtml && (
            <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
              <h3 className="font-semibold text-text mb-4">📊 AI 整体分析报告</h3>
              <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed"
                dangerouslySetInnerHTML={{ __html: analysis.analysisHtml }} />
              <div className="mt-4 pt-4 border-t border-border text-xs text-text-muted">
                本报告由 AI 自动生成，仅供参考。生成消耗 {analysis.tokensUsed} tokens。
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
