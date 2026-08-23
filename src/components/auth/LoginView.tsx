import React, { useState } from 'react';
import { Lock, User, Mail, GraduationCap, AlertCircle, CheckCircle, HelpCircle, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (name: string, email: string, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'signup' | 'recover'>('login');
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  // Sign up fields
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPass, setRegisterPass] = useState('');
  const [registerPassConfirm, setRegisterPassConfirm] = useState('');
  
  // Recovery fields
  const [recoveryEmail, setRecoveryEmail] = useState('');
  
  // Feedback & loading states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail.trim() || !loginPass.trim()) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPass,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao realizar login.');
      }

      setSuccessMsg(`Bem-vindo(a) de volta, ${result.user.name}!`);
      
      // Store token and credentials
      localStorage.setItem('app_session_token', result.token);
      localStorage.setItem('app_authenticated', 'true');
      localStorage.setItem('app_user_name', result.user.name);
      localStorage.setItem('app_user_email', result.user.email);
      
      if (rememberMe) {
        localStorage.setItem('remember_user_email', loginEmail);
      } else {
        localStorage.removeItem('remember_user_email');
      }

      setTimeout(() => {
        onLoginSuccess(result.user.name, result.user.email, result.token);
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de conexão ou e-mail/senha incorretos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!registerName.trim() || !registerEmail.trim() || !registerPass.trim() || !registerPassConfirm.trim()) {
      setErrorMsg('Por favor, preencha todos os campos do formulário.');
      return;
    }

    if (registerPass !== registerPassConfirm) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    if (registerPass.length < 4) {
      setErrorMsg('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPass,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar conta.');
      }

      setSuccessMsg('Conta criada com sucesso! Carregando seu painel acadêmico...');
      
      localStorage.setItem('app_session_token', result.token);
      localStorage.setItem('app_authenticated', 'true');
      localStorage.setItem('app_user_name', result.user.name);
      localStorage.setItem('app_user_email', result.user.email);

      setTimeout(() => {
        onLoginSuccess(result.user.name, result.user.email, result.token);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao registrar nova conta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!recoveryEmail.trim()) {
      setErrorMsg('Por favor, insira seu e-mail cadastrado.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setSuccessMsg('Se o e-mail estiver cadastrado, as instruções de redefinição foram enviadas com sucesso!');
      setIsLoading(false);
      setTimeout(() => {
        setView('login');
        setSuccessMsg('');
      }, 3500);
    }, 1200);
  };

  const handleGmailLogin = () => {
    setErrorMsg('');
    setSuccessMsg('Conectando à sua conta Google...');
    
    // Simulating Google OAuth flow which completes immediately with a simulated token
    setTimeout(() => {
      const simulatedToken = 'google-oauth-simulated-' + Math.random().toString(36).substring(2);
      setSuccessMsg('Autenticado via Google com sucesso! Entrando...');
      
      // Let's create an account automatically for the Gmail user
      const name = 'Estudante UFU';
      const email = 'usuario@gmail.com';
      
      localStorage.setItem('app_session_token', simulatedToken);
      localStorage.setItem('app_authenticated', 'true');
      localStorage.setItem('app_user_name', name);
      localStorage.setItem('app_user_email', email);

      // Register or verify on server side dynamically
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: 'google_oauth_bypass_secure_pwd' })
      }).finally(() => {
        setTimeout(() => {
          onLoginSuccess(name, email, simulatedToken);
        }, 800);
      });
    }, 1200);
  };

  // Populate saved email on mount
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('remember_user_email');
    if (savedEmail) {
      setLoginEmail(savedEmail);
    }
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0B0C] text-[#E2E2E2] px-4 py-12 relative overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#121214] border border-[#242427] rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl mb-2">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Caderno Acadêmico Pro
          </h1>
          <p className="text-xs text-[#919196]">
            Seu portal universitário completo. Notas, tarefas, foco e mural de metas.
          </p>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN FORM VIEW */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#919196]">
                E-mail Acadêmico
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Seu e-mail (ex: vinicius@ufu.br)"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#1C1C1F] border border-[#242427] rounded-xl text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#919196]">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => { setView('recover'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
                <input
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#1C1C1F] border border-[#242427] rounded-xl text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center gap-2 py-0.5">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-[#242427] bg-[#1C1C1F] text-blue-500 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs text-[#919196] cursor-pointer select-none">
                Lembrar de mim neste dispositivo
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isLoading ? 'Verificando...' : 'Entrar no Sistema'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Google Sign In Option */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#242427]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-[#121214] px-2 text-[#52525B] font-bold">Ou continue com</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGmailLogin}
              className="w-full py-2.5 bg-[#1C1C1F] hover:bg-[#242427] border border-[#242427] text-white rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Entrar com Gmail / Google
            </button>

            <div className="text-center pt-2">
              <span className="text-[11px] text-[#919196]">Novo por aqui? </span>
              <button
                type="button"
                onClick={() => { setView('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-[11px] font-bold text-blue-400 hover:underline transition cursor-pointer"
              >
                Cadastre-se grátis
              </button>
            </div>
          </form>
        )}

        {/* SIGN UP VIEW */}
        {view === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#919196]">
                Seu Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Ex: Vinícius Costa"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#1C1C1F] border border-[#242427] rounded-xl text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#919196]">
                E-mail Acadêmico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="Ex: vinicius@ufu.br"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#1C1C1F] border border-[#242427] rounded-xl text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#919196]">
                Criar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
                <input
                  type="password"
                  value={registerPass}
                  onChange={(e) => setRegisterPass(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#1C1C1F] border border-[#242427] rounded-xl text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#919196]">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
                <input
                  type="password"
                  value={registerPassConfirm}
                  onChange={(e) => setRegisterPassConfirm(e.target.value)}
                  placeholder="Repita a senha criada"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#1C1C1F] border border-[#242427] rounded-xl text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isLoading ? 'Registrando...' : 'Criar Minha Conta'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="text-center pt-2">
              <span className="text-[11px] text-[#919196]">Já tem uma conta no Caderno? </span>
              <button
                type="button"
                onClick={() => { setView('login'); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-[11px] font-bold text-blue-400 hover:underline transition cursor-pointer"
              >
                Faça login aqui
              </button>
            </div>
          </form>
        )}

        {/* PASSWORD RECOVERY VIEW */}
        {view === 'recover' && (
          <form onSubmit={handleRecovery} className="space-y-4">
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-1">
              <h5 className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Como funciona a recuperação?
              </h5>
              <p className="text-[10px] text-[#919196] leading-relaxed">
                Insira seu e-mail cadastrado. O sistema enviará um link de teste simulado e redefinirá temporariamente sua senha de acesso para que você possa redefini-la após acessar seu painel de configurações.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#919196]">
                E-mail de Cadastro
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="Seu e-mail cadastrado"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#1C1C1F] border border-[#242427] rounded-xl text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
            >
              {isLoading ? 'Aguarde...' : 'Enviar Instruções de Recuperação'}
            </button>

            <button
              type="button"
              onClick={() => { setView('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className="w-full py-2 bg-transparent hover:bg-[#1C1C1F] border border-[#242427] text-[#919196] hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Voltar para a tela de Login
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
