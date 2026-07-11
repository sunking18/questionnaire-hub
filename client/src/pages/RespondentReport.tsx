import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { reportApi } from '../api';
import type { Report } from '../types';

const DIMENSION_COLORS: Record<string, string> = {
  '情感': '#EF4444', '兴趣': '#F59E0B', '躯体': '#10B981',
  '认知': '#3B82F6', '行为': '#8B5CF6', '自伤': '#EC4899',
};

export default function RespondentReport() {
  const { responseId } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!responseId) return;
    reportApi.getByResponseId(responseId)
      .then(res => setReport(res.data.data))
      .catch(err => setError(err.response?.data?.message || '报告加载失败'))
      .finally(() => setLoading(false));
  }, [responseId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-text-muted">加载中...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-danger">{error}</p></div>;
  if (!report) return null;

  const response = report.response as any;
  const questions = (report.questionnaire as any)?.questions || [];
  const score = response?.score || {};

  // Extract dimension scores
  const dimScores: Record<string, number> = {};
  const dimMax: Record<string, number> = {};
  questions.forEach((q: any) => {
    if (q.dimension) {
      dimMax[q.dimension] = (dimMax[q.dimension] || 0) + 3;
      dimScores[q.dimension] = (dimScores[q.dimension] || 0) + (parseInt(score[q.id]) || 0);
    }
  });

  const dimEntries = Object.entries(dimScores);
  const severityLevel = report.severityLevel;
  const isSevere = severityLevel?.includes('重度');
  const isModerate = severityLevel?.includes('中度');

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Warm Tip Banner */}
        <div className={`rounded-2xl p-5 ${
          isSevere ? 'bg-red-50 border border-red-200' :
          isModerate ? 'bg-orange-50 border border-orange-200' :
          'bg-green-50 border border-green-200'
        }`}>
          <div className="flex items-start gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isSevere ? '#DC2626' : isModerate ? '#EA580C' : '#059669'} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <div>
              <p className="font-medium text-text">
                {isSevere ? '您的感受很重要，我们在这里支持您' :
                 isModerate ? '感谢您的坦诚，让我们一起看看结果' :
                 '感谢您关注自己的心理健康'}
              </p>
              <p className="text-sm text-text-secondary mt-1">
                本报告基于您的答题结果生成，仅供参考，不能替代专业医疗诊断。
              </p>
            </div>
          </div>
        </div>

        {/* Result Overview */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold text-text mb-4">评估结果总览</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-primary">{report.totalScore}</p>
              <p className="text-sm text-text-muted">总分 (满分 {questions.length * 3})</p>
            </div>
            <div className={`rounded-xl p-4 text-center ${
              isSevere ? 'bg-red-50' : isModerate ? 'bg-orange-50' : 'bg-green-50'
            }`}>
              <p className={`text-lg font-bold ${isSevere ? 'text-red-600' : isModerate ? 'text-orange-600' : 'text-green-600'}`}>
                {severityLevel}
              </p>
              <p className="text-sm text-text-muted">评估等级</p>
            </div>
          </div>
        </div>

        {/* Radar Chart - SVG */}
        {dimEntries.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-semibold text-text mb-4">维度雷达图</h3>
            <div className="flex justify-center">
              <svg viewBox="0 0 400 400" className="w-full max-w-[400px]">
                {/* Grid circles */}
                {[1, 2, 3, 4, 5].map(i => (
                  <circle key={i} cx="200" cy="200" r={30 * i} fill="none" stroke="#E2E8F0" strokeWidth="1" />
                ))}
                {/* Axis lines */}
                {dimEntries.map((_, i) => {
                  const angle = (Math.PI * 2 * i) / dimEntries.length - Math.PI / 2;
                  return (
                    <line key={i} x1="200" y1="200"
                      x2={200 + 150 * Math.cos(angle)} y2={200 + 150 * Math.sin(angle)}
                      stroke="#E2E8F0" strokeWidth="1" />
                  );
                })}
                {/* Data polygon */}
                {(() => {
                  const points = dimEntries.map(([dim, score], i) => {
                    const maxPossible = dimMax[dim] || 3;
                    const ratio = Math.min(score / maxPossible, 1);
                    const angle = (Math.PI * 2 * i) / dimEntries.length - Math.PI / 2;
                    const r = 150 * ratio;
                    return `${200 + r * Math.cos(angle)},${200 + r * Math.sin(angle)}`;
                  }).join(' ');
                  return <polygon points={points} fill="url(#radarGrad)" stroke="#0891B2" strokeWidth="2" opacity="0.8" />;
                })()}
                <defs>
                  <radialGradient id="radarGrad">
                    <stop offset="0%" stopColor="#0891B2" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0891B2" stopOpacity="0.05" />
                  </radialGradient>
                </defs>
                {/* Data points & labels */}
                {dimEntries.map(([dim, score], i) => {
                  const maxPossible = dimMax[dim] || 3;
                  const ratio = Math.min(score / maxPossible, 1);
                  const angle = (Math.PI * 2 * i) / dimEntries.length - Math.PI / 2;
                  const x = 200 + 150 * ratio * Math.cos(angle);
                  const y = 200 + 150 * ratio * Math.sin(angle);
                  const lx = 200 + 170 * Math.cos(angle);
                  const ly = 200 + 170 * Math.sin(angle);
                  return (
                    <g key={dim}>
                      <circle cx={x} cy={y} r="4" fill="#0891B2" />
                      <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                        fontSize="13" fill="#475569" fontWeight="500">{dim}</text>
                      <text x={x} y={y - 12} textAnchor="middle" fontSize="11" fill="#0891B2" fontWeight="600">
                        {score.toFixed(1)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* Dimension Scores */}
        {dimEntries.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-semibold text-text mb-4">各维度得分详情</h3>
            <div className="space-y-3">
              {dimEntries.map(([dim, score]) => {
                const maxPossible = dimMax[dim] || 3;
                const pct = Math.min((score / maxPossible) * 100, 100);
                const color = DIMENSION_COLORS[dim] || '#0891B2';
                return (
                  <div key={dim}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">{dim}</span>
                      <span className="font-medium" style={{ color }}>{score.toFixed(1)} / {maxPossible}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Report Content */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="font-semibold text-text mb-4">AI 评估报告</h3>
          {report.aiHtml ? (
            <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed"
              dangerouslySetInnerHTML={{ __html: report.aiHtml }} />
          ) : (
            <pre className="whitespace-pre-wrap text-text-secondary text-sm">{report.aiContent || '暂无内容'}</pre>
          )}
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-sm text-text-secondary">
          <p className="font-medium text-text mb-2">⚠️ 重要声明</p>
          <p>本报告由 AI 自动生成，仅供参考，不能替代专业医疗诊断。</p>
          <p className="mt-1">如您感到持续的情绪困扰，请寻求专业心理医生的帮助。</p>
          <p className="mt-3 font-medium text-text">心理援助热线：</p>
          <p>全国心理援助热线：<strong>12320</strong></p>
          <p>北京心理危机研究与干预中心：<strong>010-82951332</strong></p>
        </div>
      </div>
    </div>
  );
}
