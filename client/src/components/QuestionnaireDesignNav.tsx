import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid, FileEdit, Settings, Palette, Gift, ShieldCheck, GitPullRequest,
  Eye, ChevronDown, ArrowLeft
} from 'lucide-react';
import type { Questionnaire } from '../types';

export type DesignTab = 'wizard' | 'edit' | 'settings' | 'appearance' | 'rewards' | 'quality' | 'approval';

const tabs: { key: DesignTab; label: string; icon: React.ElementType }[] = [
  { key: 'wizard', label: '设计向导', icon: LayoutGrid },
  { key: 'edit', label: '编辑问卷', icon: FileEdit },
  { key: 'settings', label: '问卷设置', icon: Settings },
  { key: 'appearance', label: '问卷外观', icon: Palette },
  { key: 'rewards', label: '红包&奖品', icon: Gift },
  { key: 'quality', label: '质量控制', icon: ShieldCheck },
  { key: 'approval', label: '流程审批', icon: GitPullRequest },
];

interface Props {
  questionnaire?: Questionnaire | null;
  activeTab: DesignTab;
  questionnaireId: string;
  onTitleChange?: (title: string) => void;
}

export default function QuestionnaireDesignNav({ questionnaire, activeTab, questionnaireId, onTitleChange }: Props) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(questionnaire?.title || '未命名问卷');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (questionnaire?.title && questionnaire.title !== title) {
      setTitle(questionnaire.title);
    }
  }, [questionnaire?.title]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleBlur = () => {
    if (onTitleChange && title.trim()) {
      onTitleChange(title.trim());
    }
  };

  const goTo = (tab: DesignTab) => {
    const map: Record<DesignTab, string> = {
      wizard: `/questionnaires/${questionnaireId}/design`,
      edit: `/questionnaires/${questionnaireId}/edit-mode`,
      settings: `/questionnaires/${questionnaireId}/settings`,
      appearance: `/questionnaires/${questionnaireId}/appearance`,
      rewards: `/questionnaires/${questionnaireId}/rewards`,
      quality: `/questionnaires/${questionnaireId}/quality`,
      approval: `/questionnaires/${questionnaireId}/approval`,
    };
    navigate(map[tab]);
  };

  return (
    <div className="bg-white border-b border-border px-4 py-2 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/questionnaires')}
          className="text-text-secondary hover:text-text-primary p-1"
          title="返回"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm text-text-primary hover:bg-background transition"
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent outline-none max-w-[140px] truncate"
            />
            <ChevronDown size={14} className="text-text-muted" />
          </button>
          {showDropdown && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-border rounded-xl shadow-lg p-2 z-40">
              <div className="px-3 py-2 text-xs text-text-muted">当前问卷</div>
              <div className="px-3 py-2 font-medium text-text-primary truncate border-b border-border">
                {title}
              </div>
              <button
                onClick={() => { setShowDropdown(false); navigate('/questionnaires'); }}
                className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-background rounded-lg mt-1"
              >
                返回问卷列表
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => navigate(`/questionnaires/${questionnaireId}/preview`)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-primary text-primary rounded-lg text-sm hover:bg-primary-light transition"
        >
          <Eye size={14} /> 预览问卷
        </button>
      </div>

      <nav className="flex items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => goTo(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm transition border-b-2 ${
                isActive
                  ? 'border-primary text-primary font-medium bg-primary-light/50'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-background'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="w-32" /> {/* spacer to balance layout */}
    </div>
  );
}
