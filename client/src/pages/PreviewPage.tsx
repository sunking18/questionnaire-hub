import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Smartphone, Monitor, X, Settings, CheckCircle, AlertCircle,
  CircleDot, CheckSquare, List, AlignLeft, Text, Hash, Calendar, Star, SlidersHorizontal,
  ThumbsUp, MousePointer2, Grid3X3, Upload, Layout, FileText, Menu, ChevronDown,
  User, Users, CreditCard, CalendarDays, Clock, MapPin, Mail, Phone, Building, Briefcase, Lock, Home, Globe,
  BookOpen
} from 'lucide-react';
import { questionnaireApi } from '../api';
import type { Questionnaire, Question } from '../types';

const TYPE_ICONS: Record<string, React.ElementType> = {
  radio: CircleDot, checkbox: CheckSquare, dropdown: List, sort: List,
  text: Text, textarea: AlignLeft, number: Hash, date: Calendar,
  rating: Star, scale: SlidersHorizontal, nps: ThumbsUp, slider: MousePointer2,
  matrix: Grid3X3, file: Upload, page: Layout, paragraph: FileText, section: Menu,
  name: User, gender: Users, age: CalendarDays, education: BookOpen, ethnicity: Users,
  marriage: Users, country: Globe, province: MapPin, region: MapPin, email: Mail,
  phone: Phone, phoneVerify: Phone, birthday: CalendarDays, time: Clock,
  occupation: Briefcase, university: BookOpen, industry: Building, company: Building,
  idcard: CreditCard, password: Lock, address: Home,
};

const TYPE_LABELS: Record<string, string> = {
  radio: '单选', checkbox: '多选', dropdown: '下拉', sort: '排序',
  text: '文本', textarea: '多行文本', number: '数字', date: '日期',
  rating: '评分', scale: '量表', nps: 'NPS', slider: '滑动条',
  matrix: '矩阵', file: '文件', page: '分页', paragraph: '段落', section: '折叠',
  name: '姓名', gender: '性别', age: '年龄', education: '学历', ethnicity: '民族',
  marriage: '婚姻', country: '国家', province: '省市', region: '地区', email: '邮箱',
  phone: '手机', phoneVerify: '手机验证', birthday: '生日', time: '时间',
  occupation: '职业', university: '高校', industry: '行业', company: '企业',
  idcard: '身份证', password: '密码', address: '地址',
};

export default function PreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'mobile' | 'desktop'>('mobile');
  const [showAppearance, setShowAppearance] = useState(false);
  const [showCover, setShowCover] = useState(true);
  const [validateLogic, setValidateLogic] = useState(false);

  useEffect(() => {
    if (!id) return;
    questionnaireApi.getById(id)
      .then(res => {
        const q = res.data.data;
        setQuestionnaire(q);
        setShowCover(q.coverSettings?.enabled ?? false);
      })
      .catch(err => setError(err.response?.data?.message || '问卷加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  const validationIssues = useMemo(() => {
    if (!validateLogic || !questionnaire) return [];
    const issues: string[] = [];
    questionnaire.questions.forEach((q, idx) => {
      if (!q.title?.trim()) issues.push(`第 ${idx + 1} 题标题为空`);
      if ((q.type === 'radio' || q.type === 'checkbox' || q.type === 'dropdown') && (!q.options || q.options.length < 2)) {
        issues.push(`第 ${idx + 1} 题选项不足`);
      }
    });
    return issues;
  }, [validateLogic, questionnaire]);

  const handleClose = () => {
    navigate(`/questionnaires/${id}/edit`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-text-muted">加载中...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-danger">{error}</p></div>;
  if (!questionnaire) return null;

  const questions = questionnaire.questions as Question[];
  const showCoverPanel = showCover && questionnaire.coverSettings?.enabled;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-border px-6 py-3 flex flex-col md:flex-row md:items-center gap-3 justify-between z-10">
        <div className="flex items-center gap-2 text-sm text-orange-600">
          <AlertCircle size={16} />
          <span>提示：此为预览页面，不能参与作答！</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('mobile')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition ${
              mode === 'mobile' ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            <Smartphone size={16} /> 手机预览
          </button>
          <button
            onClick={() => setMode('desktop')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition ${
              mode === 'desktop' ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            <Monitor size={16} /> 电脑预览
          </button>
          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-gray-100 text-text-secondary hover:bg-gray-200 transition"
          >
            <X size={16} /> 关闭预览
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAppearance(!showAppearance)}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <Settings size={14} /> 设置外观
          </button>
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={validateLogic}
              onChange={e => setValidateLogic(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            验证题目逻辑关系
          </label>
        </div>
      </div>

      {/* Appearance panel */}
      {showAppearance && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-3">
          <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={showCover}
              onChange={e => setShowCover(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            显示问卷封面（需先在编辑页开启封面）
          </label>
        </div>
      )}

      {/* Validation issues */}
      {validateLogic && validationIssues.length > 0 && (
        <div className="bg-orange-50 border-b border-orange-100 px-6 py-3">
          <div className="flex items-start gap-2 text-sm text-orange-700">
            <AlertCircle size={16} className="mt-0.5" />
            <div>
              <p className="font-medium">发现 {validationIssues.length} 处问题：</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {validationIssues.map((issue, i) => <li key={i}>{issue}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Preview canvas */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className={`mx-auto transition-all ${mode === 'mobile' ? 'max-w-[400px]' : 'max-w-3xl'}`}>
          {/* Device frame */}
          <div className={`bg-white shadow-lg overflow-hidden ${mode === 'mobile' ? 'rounded-[32px] border-[8px] border-gray-800 min-h-[700px]' : 'rounded-2xl border border-border min-h-[500px]'}`}>
            {/* Cover */}
            {showCoverPanel && (
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center border-b border-border">
                <h1 className="text-2xl font-bold text-primary mb-3">{questionnaire.coverSettings?.title || questionnaire.title}</h1>
                {questionnaire.coverSettings?.description && (
                  <p className="text-text-secondary text-sm leading-relaxed">{questionnaire.coverSettings.description}</p>
                )}
                <button className="mt-6 bg-primary text-white px-8 py-2.5 rounded-lg text-sm font-medium">
                  {questionnaire.coverSettings?.submitButtonText || '开始作答'}
                </button>
              </div>
            )}

            {/* Questions */}
            <div className="p-6 space-y-5">
              {!showCoverPanel && (
                <div className="text-center mb-6">
                  <h1 className="text-xl font-bold text-text-primary">{questionnaire.title}</h1>
                  {questionnaire.description && <p className="text-sm text-text-secondary mt-2">{questionnaire.description}</p>}
                </div>
              )}

              {questions.length === 0 ? (
                <div className="text-center py-12 text-text-muted text-sm">暂无题目</div>
              ) : (
                questions.map((q, idx) => (
                  <div key={q.id} className="border-b border-border last:border-0 pb-5 last:pb-0">
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-sm font-bold text-primary mt-0.5">{idx + 1}.</span>
                      <div className="flex-1">
                        <p className="text-text-primary font-medium text-sm">
                          {q.title}
                          {q.required && <span className="text-danger ml-1">*</span>}
                        </p>
                        {q.dimension && <span className="text-xs text-text-muted">[{q.dimension}]</span>}
                      </div>
                      {q.personalInfoType && (
                        <span className="text-[10px] bg-gray-100 text-text-muted px-1.5 py-0.5 rounded flex items-center gap-1">
                          {(() => {
                            const Icon = TYPE_ICONS[q.personalInfoType] || User;
                            return <Icon size={10} />;
                          })()}
                          {TYPE_LABELS[q.personalInfoType] || q.personalInfoType}
                        </span>
                      )}
                    </div>

                    {q.type === 'radio' && q.options && (
                      <div className="space-y-2 ml-6">
                        {q.options.map(opt => (
                          <label key={opt.value} className="flex items-center gap-2 p-2 rounded border border-border cursor-pointer hover:bg-gray-50">
                            <CircleDot size={16} className="text-text-muted" />
                            <span className="text-sm text-text-secondary">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'checkbox' && q.options && (
                      <div className="space-y-2 ml-6">
                        {q.options.map(opt => (
                          <label key={opt.value} className="flex items-center gap-2 p-2 rounded border border-border cursor-pointer hover:bg-gray-50">
                            <CheckSquare size={16} className="text-text-muted" />
                            <span className="text-sm text-text-secondary">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {(q.type === 'dropdown' || q.type === 'sort') && q.options && (
                      <div className="ml-6">
                        <div className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text-muted bg-white flex items-center justify-between">
                          <span>{q.type === 'dropdown' ? '请选择' : '请排序'}</span>
                          <ChevronDown size={16} />
                        </div>
                        {q.type === 'sort' && (
                          <div className="mt-2 space-y-1">
                            {q.options.map((opt, i) => (
                              <div key={opt.value} className="flex items-center gap-2 text-sm text-text-secondary p-1.5 border border-border rounded">
                                <span className="text-text-muted">{i + 1}.</span>
                                <span>{opt.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {(q.type === 'text' || q.type === 'name' || q.type === 'email' || q.type === 'phone' || q.type === 'idcard' || q.type === 'password') && (
                      <input type="text" disabled placeholder="请输入..." className="ml-6 w-full px-3 py-2 border border-border rounded-lg text-sm bg-gray-50 text-text-muted" />
                    )}

                    {(q.type === 'textarea' || q.type === 'address' || q.type === 'company' || q.type === 'university' || q.type === 'occupation' || q.type === 'industry') && (
                      <textarea disabled rows={3} placeholder="请输入..." className="ml-6 w-full px-3 py-2 border border-border rounded-lg text-sm bg-gray-50 text-text-muted resize-none" />
                    )}

                    {(q.type === 'number' || q.type === 'age') && (
                      <input type="number" disabled placeholder="请输入数字..." className="ml-6 w-full px-3 py-2 border border-border rounded-lg text-sm bg-gray-50 text-text-muted" />
                    )}

                    {q.type === 'date' && (
                      <input type="date" disabled className="ml-6 w-full px-3 py-2 border border-border rounded-lg text-sm bg-gray-50 text-text-muted" />
                    )}

                    {(q.type === 'rating' || q.type === 'scale' || q.type === 'nps') && (
                      <div className="ml-6">
                        <div className="flex items-center gap-2">
                          {Array.from({ length: (q.scaleConfig?.max ?? 5) - (q.scaleConfig?.min ?? 1) + 1 }).map((_, i) => (
                            <Star key={i} size={20} className="text-gray-300" />
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-text-muted mt-2">
                          <span>{q.scaleConfig?.minLabel || '非常不满意'}</span>
                          <span>{q.scaleConfig?.maxLabel || '非常满意'}</span>
                        </div>
                      </div>
                    )}

                    {q.type === 'slider' && (
                      <div className="ml-6">
                        <div className="h-2 bg-gray-200 rounded-full mt-2" />
                        <div className="flex justify-between text-xs text-text-muted mt-1">
                          <span>{q.scaleConfig?.min || 0}</span>
                          <span>{q.scaleConfig?.max || 100}</span>
                        </div>
                      </div>
                    )}

                    {q.type === 'matrix' && q.matrixColumns && q.matrixRows && (
                      <div className="ml-6 overflow-x-auto">
                        <table className="w-full text-sm border border-border">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="p-2 text-left text-text-muted"></th>
                              {q.matrixColumns.map(c => <th key={c.id} className="p-2 text-center text-text-muted">{c.label}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {q.matrixRows.map(r => (
                              <tr key={r.id} className="border-t border-border">
                                <td className="p-2 text-text-secondary">{r.label}</td>
                                {q.matrixColumns!.map(c => (
                                  <td key={c.id} className="p-2 text-center"><CircleDot size={14} className="text-text-muted inline" /></td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {q.type === 'file' && (
                      <div className="ml-6 px-4 py-3 border border-dashed border-border rounded-lg bg-gray-50 text-sm text-text-muted flex items-center gap-2">
                        <Upload size={16} /> 点击上传文件
                      </div>
                    )}

                    {q.type === 'paragraph' && (
                      <p className="ml-6 text-sm text-text-secondary leading-relaxed">{q.description || '说明段落'}</p>
                    )}

                    {q.type === 'section' && (
                      <div className="ml-6 bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-text-primary">{q.title}</p>
                        <p className="text-xs text-text-secondary mt-1">{q.description || '点击展开内容'}</p>
                      </div>
                    )}

                    {q.type === 'page' && (
                      <div className="ml-6 border-t-2 border-dashed border-primary/30 py-2">
                        <p className="text-xs text-text-muted">分页栏</p>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Submit */}
              {questions.length > 0 && (
                <div className="pt-4">
                  <button disabled className="w-full bg-primary/50 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                    <CheckCircle size={18} /> 提交
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer brand */}
          <div className="text-center mt-6 text-xs text-text-muted">
            <span>问卷星</span> 提供技术支持
          </div>
        </div>
      </div>
    </div>
  );
}
