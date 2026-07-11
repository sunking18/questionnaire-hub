import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { questionnaireApi } from '../api';
import type { StatisticsData, Questionnaire } from '../types';

export default function Statistics() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQ, setSelectedQ] = useState('');
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    questionnaireApi.list({ status: 'published', limit: 100 }).then(res => setQuestionnaires(res.data.data));
  }, []);

  useEffect(() => {
    if (!selectedQ) return;
    setLoading(true);
    apiClient.get(`/statistics/${selectedQ}`)
      .then(res => setStats(res.data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [selectedQ]);

  if (!stats) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text">统计分析</h2>
          <p className="text-text-muted text-sm mt-1">首页 / 统计分析</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 mb-6">
          <select value={selectedQ} onChange={(e) => setSelectedQ(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-white outline-none min-w-[250px]">
            <option value="">选择问卷</option>
            {questionnaires.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
          </select>
        </div>
        {loading ? <div className="text-center py-12 text-text-muted">加载中...</div> :
          <div className="text-center py-12 text-text-muted bg-surface rounded-xl border border-border">
            {selectedQ ? '暂无统计数据' : '请选择一份已发布的问卷'}
          </div>
        }
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text">统计分析</h2>
        <p className="text-text-muted text-sm mt-1">首页 / 统计分析</p>
      </div>

      <div className="bg-surface rounded-xl border border-border p-4 mb-6">
        <select value={selectedQ} onChange={(e) => setSelectedQ(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white outline-none min-w-[250px]">
          <option value="">选择问卷</option>
          {questionnaires.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
        </select>
      </div>

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-sm:grid-cols-2">
          {[
            { label: '答卷总数', value: stats.totalResponses },
            { label: '平均分', value: stats.avgTotalScore?.toFixed(1) },
            { label: '中位数', value: stats.medianTotalScore?.toFixed(1) },
            { label: '标准差', value: stats.stddevTotalScore?.toFixed(2) },
            { label: '分数范围', value: `${stats.minTotalScore} ~ ${stats.maxTotalScore}` },
          ].map(s => (
            <div key={s.label} className="bg-surface rounded-xl border border-border p-4 shadow-sm">
              <p className="text-text-muted text-sm">{s.label}</p>
              <p className="text-2xl font-bold text-text mt-1">{s.value ?? '-'}</p>
            </div>
          ))}
        </div>

        {/* Severity Distribution */}
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-text mb-4">严重程度分布</h3>
          <div className="space-y-3">
            {Object.entries(stats.severityDistribution).map(([label, count]) => {
              const pct = Math.round((count as number) / stats.totalResponses * 100);
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">{label}</span>
                    <span className="font-medium">{count as number}人 ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score Distribution Histogram */}
        <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-text mb-4">总分分布</h3>
          <div className="flex items-end gap-3 h-40">
            {stats.scoreDistribution.map((bin) => {
              const maxCount = Math.max(...stats.scoreDistribution.map(b => b.count), 1);
              const height = (bin.count / maxCount) * 100;
              return (
                <div key={bin.range} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-text">{bin.count}</span>
                  <div className="w-full bg-primary/80 rounded-t hover:bg-primary transition" style={{ height: `${Math.max(height, 4)}%` }} />
                  <span className="text-xs text-text-muted">{bin.range}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question Stats */}
        {stats.questionStats.length > 0 && (
          <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold text-text">逐题分析</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-text-muted border-b border-border bg-gray-50/50">
                    <th className="px-5 py-3 font-medium">题号</th>
                    <th className="px-5 py-3 font-medium">题项</th>
                    <th className="px-5 py-3 font-medium">均值</th>
                    <th className="px-5 py-3 font-medium">标准差</th>
                    <th className="px-5 py-3 font-medium">中位数</th>
                    <th className="px-5 py-3 font-medium">众数</th>
                    <th className="px-5 py-3 font-medium">选项分布</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.questionStats.map((qs, idx) => (
                    <tr key={qs.questionId} className="border-b border-border hover:bg-gray-50">
                      <td className="px-5 py-3 text-text-muted">{idx + 1}</td>
                      <td className="px-5 py-3 text-sm max-w-[200px] truncate">{qs.title}</td>
                      <td className="px-5 py-3 font-medium">{qs.avgScore}</td>
                      <td className="px-5 py-3">{qs.stddev}</td>
                      <td className="px-5 py-3">{qs.median}</td>
                      <td className="px-5 py-3">{qs.mode}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-end gap-1 h-8">
                          {Object.entries(qs.optionDistribution).map(([opt, count]) => {
                            const maxOpt = Math.max(...Object.values(qs.optionDistribution).map(Number), 1);
                            const h = (Number(count) / maxOpt) * 100;
                            return (
                              <div key={opt} className="flex flex-col items-center flex-1">
                                <div className="w-full bg-primary/60 rounded-t" style={{ height: `${Math.max(h, 8)}%` }} />
                                <span className="text-[10px] text-text-muted">{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
