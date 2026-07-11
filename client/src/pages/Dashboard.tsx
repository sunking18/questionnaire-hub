import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Library, Share2, BarChart3, TrendingUp, Users } from 'lucide-react';
import apiClient from '../api/client';

interface DashboardData {
  totalQuestionnaires: number;
  publishedCount: number;
  totalResponses: number;
  totalScales: number;
  recentQuestionnaires: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    apiClient.get('/statistics/dashboard/overview').then(res => setData(res.data.data)).catch(() => {});
  }, []);

  const stats = [
    { label: '问卷总数', value: data?.totalQuestionnaires ?? '-', icon: ClipboardList, color: 'text-cyan-600 bg-cyan-50' },
    { label: '已发布', value: data?.publishedCount ?? '-', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: '总答卷数', value: data?.totalResponses ?? '-', icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: '收录量表', value: data?.totalScales ?? '-', icon: Library, color: 'text-orange-600 bg-orange-50' },
  ];

  const quickActions = [
    { to: '/questionnaires/new', icon: ClipboardList, label: '新建问卷', color: 'bg-cyan-500' },
    { to: '/scales', icon: Library, label: '引用量表', color: 'bg-green-500' },
    { to: '/distribution', icon: Share2, label: '分发问卷', color: 'bg-purple-500' },
    { to: '/statistics', icon: BarChart3, label: '数据分析', color: 'bg-orange-500' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text">工作台</h2>
        <p className="text-text-muted mt-1">欢迎回来，查看您的问卷数据概览</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface rounded-xl p-5 border border-border shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">{stat.value}</p>
                <p className="text-sm text-text-muted">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-text mb-4">快捷操作</h3>
        <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={`${action.color} text-white rounded-xl p-5 flex items-center gap-3 hover:opacity-90 transition shadow-sm`}
            >
              <action.icon size={22} />
              <span className="font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Questionnaires */}
      <div className="bg-surface rounded-xl border border-border shadow-sm">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-text">最近问卷</h3>
          <Link to="/questionnaires" className="text-primary text-sm hover:text-primary-hover">查看全部 →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-text-muted border-b border-border">
                <th className="px-5 py-3 font-medium">问卷名称</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">答卷数</th>
                <th className="px-5 py-3 font-medium">更新时间</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentQuestionnaires?.map((q: any) => (
                <tr key={q.id} className="border-b border-border hover:bg-gray-50 transition">
                  <td className="px-5 py-3">
                    <Link to={`/questionnaires/${q.id}`} className="text-text hover:text-primary font-medium">
                      {q.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      q.status === 'published' ? 'bg-green-100 text-green-700' :
                      q.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {q.status === 'published' ? '已发布' : q.status === 'draft' ? '草稿' : q.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{q.fillCount}</td>
                  <td className="px-5 py-3 text-text-muted text-sm">
                    {new Date(q.updatedAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-5 py-3">
                    <Link to={`/questionnaires/${q.id}`} className="text-primary text-sm hover:underline">查看</Link>
                  </td>
                </tr>
              ))}
              {(!data?.recentQuestionnaires || data.recentQuestionnaires.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-text-muted">
                    暂无问卷，<Link to="/questionnaires/new" className="text-primary hover:underline">创建第一个问卷</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
