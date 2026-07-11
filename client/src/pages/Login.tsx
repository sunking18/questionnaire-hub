import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('researcher@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-soft">
            <Sparkles className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-text-primary">
            Q-Hub
          </h1>
          <p className="text-text-secondary mt-2">问卷量表管理平台</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl shadow-card p-8 space-y-5 border border-border">
          <h2 className="text-xl font-semibold text-text-primary">登录</h2>

          {error && (
            <div className="bg-danger-light text-danger text-sm p-3 rounded-lg border border-danger/20">
              {error}
            </div>
          )}

          <div>
            <label className="label">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="researcher@example.com"
              required
            />
          </div>

          <div>
            <label className="label">密码</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
              <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
              记住我
            </label>
            <a href="#" className="text-primary hover:text-primary-hover">忘记密码？</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            <LogIn size={18} />
            {loading ? '登录中...' : '登录'}
          </button>

          <p className="text-center text-sm text-text-muted">
            还没有账号？{' '}
            <a href="/register" className="text-primary hover:text-primary-hover font-medium">注册</a>
          </p>
        </form>
      </div>
    </div>
  );
}
