import React, { useState } from 'react';
import { Lock, User, Mail, GraduationCap, AlertCircle, CheckCircle, HelpCircle, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (username: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'signup' | 'recover'>('login');
  
  // Login fields
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  // Sign up fields
  const [registerName, setRegisterName] = useState('');
  const [registerUser, setRegisterUser] = useState('');
  const [registerPass, setRegisterPass] = useState('');
  const [registerPassConfirm, setRegisterPassConfirm] = useState('');
  
  // Recovery fields
  const [recoveryUser, setRecoveryUser] = useState('');
  
  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const getSavedUsers = () => {
    const saved = localStorage.getItem('academic_registered_users');
    return saved ? JSON.parse(saved) : [{ username: 'admin', password: '123', name: 'Estudante' }];
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginUser.trim() || !loginPass.trim()) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    const users = getSavedUsers();
    const found = users.find(
      (u: any) => u.username.toLowerCase() === loginUser.toLowerCase() && u.password === loginPass
    );

    if (found) {
      setSuccessMsg(`Bem-vindo(a) de volta, ${found.name}!`);
      setTimeout(() => {
        onLoginSuccess(found.name);
      }, 800);
    } else {
      setErrorMsg('Usuário ou senha incorretos. (Dica: use admin / 123 ou crie uma conta!)');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!registerName.trim() || !registerUser.trim() || !registerPass.trim() || !registerPassConfirm.trim()) {
      setErrorMsg('Por favor, preencha todos os campos do formulário.');
      return;
    }

    if (registerPass !== registerPassConfirm) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    const users = getSavedUsers();
    const exists = users.some((u: any) => u.username.toLowerCase() === registerUser.toLowerCase());
    
    if (exists) {
      setErrorMsg('Este nome de usuário já está cadastrado.');
      return;
    }

    const newUser = {
      name: registerName.trim(),
      username: registerUser.trim(),
      password: registerPass
    };

    users.push(newUser);
    localStorage.setItem('academic_registered_users', JSON.stringify(users));

    setSuccessMsg('Conta criada com sucesso! Você já pode fazer login.');
    setTimeout(() => {
      setLoginUser(registerUser);
      setLoginPass('');
      setView('login');
      setSuccessMsg('');
    }, 1500);
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!recoveryUser.trim()) {
      setErrorMsg('Por favor, insira seu nome de usuário ou e-mail cadastrado.');
      return;
    }

    const users = getSavedUsers();
    const exists = users.find((u: any) => u.username.toLowerCase() === recoveryUser.toLowerCase() || u.username.includes(recoveryUser));

    if (exists) {
      setSuccessMsg(`Link de recuperação enviado com sucesso! Sua senha temporária foi redefinida para "123".`);
      // Reset password to 123 for simplicity and accessibility
      const updatedUsers = users.map((u: any) => {
        if (u.username === exists.username) {
          return { ...u, password: '123' };
        }
        return u;
      });
      localStorage.setItem('academic_registered_users', JSON.stringify(updatedUsers));
    } else {
      setSuccessMsg('Se o usuário existir, enviamos as instruções de recuperação. Sua senha de teste agora é "123".');
    }

    setTimeout(() => {
      setView('login');
      setSuccessMsg('');
    }, 4000);
  };

  const handleGmailLogin = () => {
    setErrorMsg('');
    setSuccessMsg('Conectando à sua conta Google...');
    
    // Simulating a sleek Google OAuth experience
    setTimeout(() => {
      setSuccessMsg('Autenticado via Google com sucesso! Entrando...');
      setTimeout(() => {
        onLoginSuccess('Usuário Google');
      }, 1000);
    }, 1200);
  };

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
            Caderno Acadêmico
          </h1>
          <p className="text-xs text-[#919196]">
            Seu portal universitário completo, notas, tarefas e foco.
          </p>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN FORM VIEW */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#919196]">
                Nome de Usuário
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
                <input
                  type="text"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="Seu usuário (ou 'admin')"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#1C1C1F] border border-[#242427] rounded-xl text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
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
                  placeholder="Sua senha (ou '123')"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#1C1C1F] border border-[#242427] rounded-xl text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
            >
              Entrar no Sistema
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Google Sign In Option */}
            <div className="relative py-2">
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
              {/* Google stylized icon */}
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
              <span className="text-[11px] text-[#919196]">Não possui uma conta? </span>
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
                  placeholder="Ex: João da Silva"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#1C1C1F] border border-[#242427] rounded-xl text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#919196]">
                Nome de Usuário (Username)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
                <input
                  type="text"
                  value={registerUser}
                  onChange={(e) => setRegisterUser(e.target.value)}
                  placeholder="Ex: joao2026"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#1C1C1F] border border-[#242427] rounded-xl text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
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
                  placeholder="Mínimo 3 caracteres"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#1C1C1F] border border-[#242427] rounded-xl text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
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
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
            >
              Criar Minha Conta
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
                Insira seu nome de usuário. O sistema enviará um link de teste simulado e redefinirá temporariamente sua senha de acesso para <span className="font-bold text-white">123</span> para permitir seu login de forma rápida.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#919196]">
                Nome de Usuário ou E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
                <input
                  type="text"
                  value={recoveryUser}
                  onChange={(e) => setRecoveryUser(e.target.value)}
                  placeholder="Seu usuário cadastrado"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#1C1C1F] border border-[#242427] rounded-xl text-xs text-white placeholder-[#52525B] focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
            >
              Enviar Instruções de Recuperação
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
