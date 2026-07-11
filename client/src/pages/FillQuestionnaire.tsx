import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Send, CheckCircle } from 'lucide-react';
import { questionnaireApi } from '../api';
import { responseApi } from '../api';
import type { Questionnaire, Question } from '../types';

export default function FillQuestionnaire() {
  const { shareCode } = useParams();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shareCode) return;
    questionnaireApi.getByShareCode(shareCode)
      .then(res => {
        setQuestionnaire(res.data.data);
        // Initialize answers
        const init: Record<string, string> = {};
        (res.data.data.questions as Question[]).forEach(q => { init[q.id] = ''; });
        setAnswers(init);
      })
      .catch(err => setError(err.response?.data?.message || '问卷加载失败'))
      .finally(() => setLoading(false));
  }, [shareCode]);

  const handleSubmit = async () => {
    if (!questionnaire || !shareCode) return;

    // Validate required
    const questions = questionnaire.questions as Question[];
    const missing = questions.filter(q => q.required && !answers[q.id]);
    if (missing.length > 0) {
      alert(`请完成所有必答题（共 ${missing.length} 题未答）`);
      return;
    }

    // Calculate scores
    let totalScore = 0;
    const score: Record<string, number> = {};
    questions.forEach(q => {
      const val = parseInt(answers[q.id]) || 0;
      score[q.id] = val;
      totalScore += val;
    });

    // Determine severity
    let severityLevel = '未知';
    if (totalScore <= 4) severityLevel = '正常';
    else if (totalScore <= 9) severityLevel = '轻度抑郁倾向';
    else if (totalScore <= 14) severityLevel = '中度抑郁倾向';
    else if (totalScore <= 19) severityLevel = '中重度抑郁倾向';
    else severityLevel = '重度抑郁倾向';

    setSubmitting(true);
    try {
      const res = await responseApi.submit(shareCode, {
        answers,
        score,
        totalScore,
        severityLevel,
      });
      setResult(res.data.data);
      setSubmitted(true);
    } catch (err: any) {
      alert(err.response?.data?.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-text-muted">加载中...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><p className="text-danger text-lg mb-2">{error}</p></div></div>;
  if (!questionnaire) return null;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <CheckCircle size={56} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-text mb-2">提交成功！</h2>
          <p className="text-text-secondary mb-4">感谢您的参与</p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <p className="text-sm"><span className="text-text-muted">总分：</span><strong className="text-lg">{result?.response?.totalScore}</strong></p>
            <p className="text-sm"><span className="text-text-muted">评估等级：</span><span className="font-medium">{result?.response?.severityLevel}</span></p>
          </div>
          {result?.report?.id && (
            <a href={`/report/${result.response.id}`}
              className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-hover transition">
              查看 AI 评估报告 →
            </a>
          )}
        </div>
      </div>
    );
  }

  const questions = questionnaire.questions as Question[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-text">{questionnaire.title}</h1>
          {questionnaire.description && (
            <p className="text-text-secondary mt-2 leading-relaxed">{questionnaire.description}</p>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-4 mb-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border border-border p-5">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-sm font-bold text-primary mt-0.5">{idx + 1}.</span>
                <div>
                  <p className="text-text font-medium">
                    {q.title}
                    {q.required && <span className="text-danger ml-1">*</span>}
                  </p>
                  {q.dimension && <span className="text-xs text-text-muted">[{q.dimension}]</span>}
                </div>
              </div>

              {q.type === 'radio' && q.options && (
                <div className="space-y-2 ml-6">
                  {q.options.map(opt => (
                    <label key={opt.value} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition ${
                      answers[q.id] === opt.value ? 'border-primary bg-primary-light' : 'border-border hover:border-primary/30'
                    }`}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.value}
                        checked={answers[q.id] === opt.value}
                        onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="text-primary"
                      />
                      <span className="text-sm text-text-secondary">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'text' && (
                <input
                  type="text"
                  value={answers[q.id] || ''}
                  onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className="ml-6 w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="请输入..."
                />
              )}

              {q.type === 'textarea' && (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                  rows={3}
                  className="ml-6 w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="请输入..."
                />
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="sticky bottom-4">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
          >
            <Send size={20} />
            {submitting ? '提交中...' : '提交答卷'}
          </button>
        </div>
      </div>
    </div>
  );
}
