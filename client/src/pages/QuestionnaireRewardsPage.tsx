import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { questionnaireApi } from '../api';
import QuestionnaireDesignNav from '../components/QuestionnaireDesignNav';
import type { Questionnaire } from '../types';

export default function QuestionnaireRewardsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    questionnaireApi.getById(id)
      .then(res => setQuestionnaire(res.data.data))
      .catch(() => navigate('/questionnaires'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-text-muted">加载中...</div>;
  if (!questionnaire) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <QuestionnaireDesignNav questionnaire={questionnaire} activeTab="rewards" questionnaireId={questionnaire.id} />
      <div className="flex-1 p-10 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-warning-light flex items-center justify-center mb-4">
          <Gift size={32} className="text-warning" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">红包 & 奖品</h2>
        <p className="text-text-secondary max-w-md text-center">红包与奖品功能正在开发中，敬请期待。</p>
      </div>
    </div>
  );
}
