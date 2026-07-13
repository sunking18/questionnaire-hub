import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Trash2, Copy, ArrowRight } from 'lucide-react';
import { questionnaireApi } from '../api';
import QuestionnaireDesignNav from '../components/QuestionnaireDesignNav';
import type { Questionnaire } from '../types';

export default function QuestionnaireEditMode() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<'keep' | 'delete' | 'copy'>('keep');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!id) return;
    questionnaireApi.getById(id)
      .then(res => setQuestionnaire(res.data.data))
      .catch(() => navigate('/questionnaires'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleNext = async () => {
    if (!id) return;
    setProcessing(true);
    try {
      if (selected === 'delete') {
        // In a real app, delete all responses via API
        await questionnaireApi.update(id, { status: 'draft' });
      } else if (selected === 'copy') {
        const res = await questionnaireApi.clone(id, { title: `${questionnaire?.title || '问卷'} 副本`, includeSettings: true });
        const newId = res.data.data.id;
        navigate(`/questionnaires/${newId}/edit`, { replace: true });
        return;
      }
      navigate(`/questionnaires/${id}/edit`, { replace: true });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-text-muted">加载中...</div>;
  if (!questionnaire) return null;

  const modes = [
    {
      key: 'keep' as const,
      icon: Clock,
      title: '保留答卷',
      subtitle: '修改受限制',
      desc: '只能修改问卷的细节，例如更改错别字、添加选项、增加跳题逻辑或者修改题目的属性等。',
      note: '不能对问卷做以下操作：删除题目或选项、移动题目或选项、转换题型',
    },
    {
      key: 'delete' as const,
      icon: Trash2,
      title: '删除所有答卷',
      subtitle: '修改不受限制',
      desc: '删除该问卷下的全部答卷，之后可以任意修改题目结构，包括删除、移动、转换题型等。',
      note: '删除后答卷无法恢复，请谨慎操作',
    },
    {
      key: 'copy' as const,
      icon: Copy,
      title: '复制此问卷并去编辑',
      subtitle: '原始问卷不受任何影响',
      desc: '生成一份问卷副本，您可以自由编辑副本，原始问卷及其答卷均不受影响。',
      note: '适合需要保留原问卷数据同时创建新版本的场景',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <QuestionnaireDesignNav
        questionnaire={questionnaire}
        activeTab="edit"
        questionnaireId={questionnaire.id}
      />

      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-10">请选择修改问卷模式</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selected === mode.key;
              return (
                <button
                  key={mode.key}
                  onClick={() => setSelected(mode.key)}
                  className={`card p-6 text-left transition-all relative ${
                    isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/30'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                    isSelected ? 'bg-primary text-white' : 'bg-primary-light text-primary'
                  }`}>
                    <Icon size={26} />
                  </div>
                  <h3 className="font-bold text-text-primary text-lg mb-1">{mode.title}</h3>
                  <p className="text-sm text-text-muted mb-3">{mode.subtitle}</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{mode.desc}</p>
                  <p className="text-xs text-text-muted mt-4">{mode.note}</p>
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={handleNext}
              disabled={processing}
              className="btn-primary px-10 py-2.5"
            >
              {processing ? '处理中...' : '下一步'}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
