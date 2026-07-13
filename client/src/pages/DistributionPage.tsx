import { useEffect, useState, useMemo } from 'react';
import { Plus, Link2, QrCode, Copy, Check, Trash2, Rocket, AlertCircle, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { questionnaireApi } from '../api';
import apiClient from '../api/client';
import type { Questionnaire, Distribution } from '../types';

export default function DistributionPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQ, setSelectedQ] = useState<Questionnaire | null>(null);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [activeTab, setActiveTab] = useState<'link' | 'qrcode'>('link');
  const [copied, setCopied] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    setLoading(true);
    questionnaireApi.list({ limit: 100 })
      .then(res => setQuestionnaires(res.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedQ) {
      setDistributions([]);
      return;
    }
    apiClient.get(`/distributions/${selectedQ.id}`)
      .then(res => setDistributions(res.data.data || []))
      .catch(() => setDistributions([]));
  }, [selectedQ]);

  const shareUrl = (code: string) => `${window.location.origin}/fill/${code}`;

  const createDistribution = async () => {
    if (!selectedQ) return alert('请选择问卷');
    try {
      const res = await apiClient.post(`/distributions/${selectedQ.id}`, { channelType: activeTab });
      setDistributions([res.data.data, ...distributions]);
    } catch (err: any) {
      alert(err.response?.data?.message || '创建失败');
    }
  };

  const publishAndDistribute = async () => {
    if (!selectedQ) return;
    setPublishing(true);
    try {
      await questionnaireApi.update(selectedQ.id, { status: 'published' });
      const res = await apiClient.post(`/distributions/${selectedQ.id}`, { channelType: activeTab });
      setDistributions([res.data.data, ...distributions]);
      // 更新本地问卷状态
      setSelectedQ({ ...selectedQ, status: 'published' });
      setQuestionnaires(prev => prev.map(q => q.id === selectedQ.id ? { ...q, status: 'published' } : q));
    } catch (err: any) {
      alert(err.response?.data?.message || '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  const copyLink = (code: string) => {
    const url = shareUrl(code);
    navigator.clipboard.writeText(url);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  const deleteDist = async (id: string) => {
    if (!confirm('确定删除此分发链接？')) return;
    try {
      await apiClient.delete(`/distributions/record/${id}`);
      setDistributions(distributions.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const draftQuestionnaires = useMemo(() => questionnaires.filter(q => q.status === 'draft'), [questionnaires]);
  const publishedQuestionnaires = useMemo(() => questionnaires.filter(q => q.status === 'published'), [questionnaires]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text">问卷分发</h2>
        <p className="text-text-muted text-sm mt-1">首页 / 分发</p>
      </div>

      {/* Selector & Action Bar */}
      <div className="bg-surface rounded-xl border border-border p-4 mb-6 flex flex-wrap items-center gap-4">
        <select
          value={selectedQ?.id || ''}
          onChange={(e) => {
            const q = questionnaires.find(item => item.id === e.target.value) || null;
            setSelectedQ(q);
          }}
          disabled={loading}
          className="border border-border rounded-lg px-3 py-2.5 text-sm bg-white outline-none min-w-[280px]"
        >
          <option value="">选择要分发的问卷</option>
          {publishedQuestionnaires.length > 0 && (
            <optgroup label="已发布">
              {publishedQuestionnaires.map(q => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </optgroup>
          )}
          {draftQuestionnaires.length > 0 && (
            <optgroup label="草稿箱">
              {draftQuestionnaires.map(q => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </optgroup>
          )}
        </select>

        {selectedQ && (
          <>
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
              selectedQ.status === 'published'
                ? 'bg-green-100 text-green-700'
                : selectedQ.status === 'draft'
                ? 'bg-gray-100 text-gray-600'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {selectedQ.status === 'published' ? '已发布' : selectedQ.status === 'draft' ? '草稿' : selectedQ.status}
            </span>

            <div className="flex border border-border rounded-lg overflow-hidden ml-auto">
              {(['link', 'qrcode'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm transition flex items-center gap-1.5 ${
                    activeTab === tab ? 'bg-primary text-white' : 'hover:bg-gray-50'
                  }`}
                >
                  {tab === 'link' ? <><Link2 size={14} /> 分享链接</> : <><QrCode size={14} /> 二维码</>}
                </button>
              ))}
            </div>

            {selectedQ.status === 'published' ? (
              <button
                onClick={createDistribution}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition"
              >
                <Plus size={16} /> 生成
              </button>
            ) : (
              <button
                onClick={publishAndDistribute}
                disabled={publishing}
                className="flex items-center gap-1.5 px-4 py-2 bg-success text-white rounded-lg text-sm hover:bg-success-hover transition disabled:opacity-60"
              >
                {publishing ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                {publishing ? '发布中...' : '发布并生成'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Draft Hint */}
      {selectedQ?.status === 'draft' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">当前选择的问卷为草稿状态</p>
            <p className="text-sm text-yellow-700 mt-0.5">
              草稿问卷需要先发布才能生成分享链接或二维码。点击「发布并生成」将自动发布问卷并创建分发链接。
            </p>
          </div>
        </div>
      )}

      {/* Distribution List */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-text">分发记录</h3>
        </div>
        {!selectedQ ? (
          <div className="p-12 text-center text-text-muted">请先选择一份问卷</div>
        ) : distributions.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            {selectedQ.status === 'published'
              ? '暂无分发记录，点击「生成」创建分享链接或二维码'
              : '该问卷尚未发布，点击「发布并生成」创建分发链接'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {distributions.map(d => (
              <div key={d.id} className="p-5 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {d.channelType === 'link' ? (
                      <Link2 size={20} className="text-primary flex-shrink-0" />
                    ) : (
                      <QrCode size={20} className="text-primary flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      {activeTab === 'qrcode' || d.channelType === 'qrcode' ? (
                        <div className="flex items-start gap-4 flex-wrap">
                          <QRCodeSVG value={shareUrl(d.shareCode)} size={120} level="M" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text break-all">{shareUrl(d.shareCode)}</p>
                            <p className="text-xs text-text-muted mt-1">
                              填写次数: {d.fillCount}{d.maxFills ? ` / ${d.maxFills}` : ''} · {new Date(d.createdAt).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-text break-all">{shareUrl(d.shareCode)}</p>
                          <p className="text-xs text-text-muted mt-1">
                            填写次数: {d.fillCount}{d.maxFills ? ` / ${d.maxFills}` : ''} · {new Date(d.createdAt).toLocaleDateString('zh-CN')}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyLink(d.shareCode)}
                      className="p-1.5 text-text-muted hover:text-primary transition"
                      title="复制链接"
                    >
                      {copied === d.shareCode ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={() => deleteDist(d.id)}
                      className="p-1.5 text-text-muted hover:text-danger transition"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
