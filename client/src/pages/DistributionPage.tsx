import { useEffect, useState } from 'react';
import { Plus, Link2, QrCode, Copy, Check, Trash2 } from 'lucide-react';
import { questionnaireApi } from '../api';
import apiClient from '../api/client';
import type { Questionnaire, Distribution } from '../types';

export default function DistributionPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQ, setSelectedQ] = useState('');
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [activeTab, setActiveTab] = useState<'link' | 'qrcode'>('link');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    questionnaireApi.list({ status: 'published', limit: 100 }).then(res => setQuestionnaires(res.data.data));
  }, []);

  useEffect(() => {
    if (!selectedQ) return;
    apiClient.get(`/distributions/${selectedQ}`).then(res => setDistributions(res.data.data)).catch(() => {});
  }, [selectedQ]);

  const createDistribution = async () => {
    if (!selectedQ) return alert('请选择问卷');
    try {
      const res = await apiClient.post(`/distributions/${selectedQ}`, { channelType: activeTab });
      setDistributions([res.data.data, ...distributions]);
    } catch (err: any) {
      alert(err.response?.data?.message || '创建失败');
    }
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/fill/${code}`;
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text">问卷分发</h2>
        <p className="text-text-muted text-sm mt-1">首页 / 分发</p>
      </div>

      <div className="bg-surface rounded-xl border border-border p-4 mb-6 flex items-center gap-4">
        <select value={selectedQ} onChange={(e) => setSelectedQ(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-white outline-none min-w-[250px]">
          <option value="">选择已发布的问卷</option>
          {questionnaires.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
        </select>
        <div className="flex border border-border rounded-lg overflow-hidden">
          {(['link', 'qrcode'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm transition ${activeTab === tab ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}>
              {tab === 'link' ? '分享链接' : '二维码'}
            </button>
          ))}
        </div>
        <button onClick={createDistribution} disabled={!selectedQ}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition disabled:opacity-50">
          <Plus size={16} /> 生成
        </button>
      </div>

      {/* Distribution List */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-text">分发记录</h3>
        </div>
        {distributions.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            {selectedQ ? '暂无分发记录，点击"生成"创建' : '请先选择一份已发布的问卷'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {distributions.map(d => (
              <div key={d.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {d.channelType === 'link' ? <Link2 size={18} className="text-primary" /> : <QrCode size={18} className="text-primary" />}
                  <div>
                    <p className="text-sm font-medium text-text">
                      {window.location.origin}/fill/{d.shareCode}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      填写次数: {d.fillCount}{d.maxFills ? ` / ${d.maxFills}` : ''} · {new Date(d.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyLink(d.shareCode)}
                    className="p-1.5 text-text-muted hover:text-primary transition" title="复制链接">
                    {copied === d.shareCode ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                  <button onClick={() => deleteDist(d.id)}
                    className="p-1.5 text-text-muted hover:text-danger transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
