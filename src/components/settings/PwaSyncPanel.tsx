import React, { useState, useEffect } from 'react';
import { PwaService, SyncQueueItem, SyncStatus } from '../../lib/pwa';
import { Wifi, WifiOff, RefreshCw, Smartphone, Check, HelpCircle, AlertTriangle, Trash2, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const PwaSyncPanel: React.FC = () => {
  const [pwaState, setPwaState] = useState(PwaService.getSyncState() as any);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [browserInfo, setBrowserInfo] = useState({ isIos: false, isAndroid: false, isSafari: false });

  useEffect(() => {
    // Subscribe to real-time status updates from the PWA service
    const unsubscribe = PwaService.subscribe((state) => {
      setPwaState(state);
    });

    // Detect browser platform for custom fallback instructions
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|crmodo/.test(ua);
    setBrowserInfo({ isIos, isAndroid, isSafari });

    return () => unsubscribe();
  }, []);

  const handleInstallClick = async () => {
    if (pwaState.deferredPrompt) {
      const installed = await PwaService.installApp();
      if (installed) {
        confetti({ particleCount: 100, spread: 80 });
      }
    }
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await PwaService.syncWithServer();
    setIsManualSyncing(false);
    
    if (PwaService.getSyncState().status === 'synced') {
      confetti({ particleCount: 30, spread: 40 });
    }
  };

  const handleClearQueue = () => {
    if (confirm('Tem certeza de que deseja esvaziar a fila de alterações sem enviá-las ao servidor? Suas anotações locais continuarão salvas neste navegador.')) {
      PwaService.clearQueue();
    }
  };

  // Helper to determine active display mode (PWA mode)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

  return (
    <div className="space-y-6">
      {/* 1. Sync & Connection Status Header */}
      <div className="bg-[#121214] p-6 rounded-2xl border border-[#242427] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242427] pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {pwaState.isOnline ? (
                <Wifi className="w-5 h-5 text-emerald-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-amber-500" />
              )}
              Sincronização & Modo Offline
            </h3>
            <p className="text-xs text-[#919196] mt-1">
              Gerencie a integridade dos seus dados acadêmicos e acompanhe as atualizações em tempo real com o servidor
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            {pwaState.status === 'synced' && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                🟢 Sincronizado
              </span>
            )}
            {pwaState.status === 'offline' && (
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                🟠 Trabalhando offline
              </span>
            )}
            {pwaState.status === 'syncing' && (
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                🔄 Sincronizando alterações...
              </span>
            )}
            {pwaState.status === 'error' && (
              <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                🔴 Não foi possível sincronizar
              </span>
            )}
            {pwaState.status === 'conflict' && (
              <span className="px-3 py-1 rounded-full bg-[#3B2E1C] border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ⚠️ Conflito de versão
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-[#919196] leading-relaxed">
          O Caderno Digital Universitário opera com arquitetura <strong>Offline-First</strong>. 
          Todas as anotações, tarefas, fotos de perfil, provas e mapas mentais que você criar ou editar são 
          salvos instantaneamente no navegador. Assim que você restabelecer a conexão com a internet, 
          as alterações pendentes serão enviadas e consolidadas no servidor automaticamente.
        </p>
      </div>

      {/* 2. Sync Conflict Warning and Actions */}
      {pwaState.status === 'conflict' && pwaState.serverDatabase && (
        <div className="bg-[#1C1814] p-5 rounded-2xl border border-amber-500/30 space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white">Conflito de Versão Encontrado</h4>
              <p className="text-xs text-[#919196] mt-1 leading-relaxed">
                As notas salvas no servidor possuem modificações mais recentes do que as modificações pendentes no seu dispositivo.
                Para evitar perda de trabalhos acadêmicos ou sobreposições indesejadas, selecione como deseja resolver o conflito:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => PwaService.resolveConflict('use_server', pwaState.serverDatabase)}
              className="p-4 rounded-xl border border-[#242427] bg-[#121214] hover:bg-[#1C1C1F] text-left transition cursor-pointer"
            >
              <div className="text-xs font-bold text-amber-400">Utilizar Versão do Servidor</div>
              <p className="text-[10px] text-[#919196] mt-1">
                Substitui as notas do seu dispositivo pela versão mais recente que está guardada no servidor. (Recomendado se você editou em outro computador)
              </p>
            </button>
            <button
              onClick={() => PwaService.resolveConflict('keep_local')}
              className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-left transition cursor-pointer"
            >
              <div className="text-xs font-bold text-blue-400">Manter Minha Versão Local</div>
              <p className="text-[10px] text-[#919196] mt-1">
                Sobrescreve a cópia do servidor utilizando todos os dados e alterações atualmente presentes neste dispositivo.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* 3. Install App Section (PWA) */}
      <div className="bg-[#121214] p-6 rounded-2xl border border-[#242427] space-y-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-1.5">
            <Smartphone className="w-5 h-5 text-blue-400" />
            Instalação do Aplicativo (PWA)
          </h3>
          <p className="text-xs text-[#919196] mt-0.5">
            Instale o Caderno Digital e use-o diretamente da sua área de trabalho ou tela inicial, com maior performance e atalhos rápidos
          </p>
        </div>

        {isStandalone ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Aplicativo Executando em Modo Standalone Nativo!</p>
              <p className="text-[11px] text-[#919196] mt-0.5">Você já está usando a experiência nativa instalada no dispositivo. Todos os recursos offline e arquivos estão otimizados.</p>
            </div>
          </div>
        ) : pwaState.deferredPrompt ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#1C1C1F] border border-[#242427] text-xs text-[#919196] leading-relaxed">
              Dispositivo elegível para instalação nativa direta! Ao instalar, você criará um ícone na tela de aplicativos do celular ou computador e poderá abrir as anotações instantaneamente sem digitar a URL.
            </div>
            <button
              onClick={handleInstallClick}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md hover:scale-[1.01]"
            >
              <Smartphone className="w-4 h-4" />
              Instalar Caderno Acadêmico no Dispositivo
            </button>
          </div>
        ) : (
          /* Browser specific installation instructions when deferred prompt is NOT available */
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-4.5 rounded-xl bg-[#1C1C1F] border border-[#242427] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                Como instalar no seu dispositivo / navegador:
              </div>

              {browserInfo.isIos ? (
                /* iOS Safari instructions */
                <div className="text-xs text-[#E2E2E2] space-y-2 leading-relaxed">
                  <p>Para adicionar o caderno à sua tela inicial no <strong>iOS (iPhone ou iPad)</strong>:</p>
                  <ol className="list-decimal list-inside text-[#919196] space-y-1.5 pl-1.5">
                    <li>Abra este aplicativo utilizando o navegador nativo <strong>Safari</strong>.</li>
                    <li>Toque no botão de <strong>Compartilhar</strong> <span className="inline-block px-1.5 py-0.5 bg-[#2E2E32] rounded text-[10px] text-white">📤</span> na barra inferior.</li>
                    <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> <span className="inline-block px-1.5 py-0.5 bg-[#2E2E32] rounded text-[10px] text-white">➕</span>.</li>
                    <li>Toque em <strong>"Adicionar"</strong> no canto superior direito.</li>
                  </ol>
                </div>
              ) : browserInfo.isAndroid ? (
                /* Android Custom Browser instructions */
                <div className="text-xs text-[#E2E2E2] space-y-2 leading-relaxed">
                  <p>Para instalar o aplicativo no seu dispositivo <strong>Android</strong>:</p>
                  <ol className="list-decimal list-inside text-[#919196] space-y-1.5 pl-1.5">
                    <li>Toque no menu de <strong>três pontos ⋮</strong> no canto superior direito do seu navegador.</li>
                    <li>Selecione a opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                    <li>Confirme a ação clicando em "Instalar" ou "Adicionar".</li>
                  </ol>
                </div>
              ) : (
                /* General Desktop instructions */
                <div className="text-xs text-[#E2E2E2] space-y-2 leading-relaxed">
                  <p>Para instalar em computadores <strong>(Chrome, Edge ou Opera)</strong>:</p>
                  <ol className="list-decimal list-inside text-[#919196] space-y-1.5 pl-1.5">
                    <li>Observe a barra de endereços (URL) do seu navegador no topo direito.</li>
                    <li>Clique no ícone de <strong>instalação</strong> (computador com uma seta para baixo ou um ícone de "+" circular).</li>
                    <li>Confirme clicando em <strong>"Instalar"</strong>.</li>
                    <li>Se o ícone não aparecer, clique no menu de três pontos ⋮ do navegador e escolha <strong>"Salvar e Compartilhar" &rarr; "Instalar página como app"</strong>.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Local Outbox Sync Queue Detail */}
      <div className="bg-[#121214] p-6 rounded-2xl border border-[#242427] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242427] pb-4">
          <div>
            <h3 className="text-xs font-bold text-[#E2E2E2] uppercase tracking-wider">
              Fila de Alterações Pendentes ({pwaState.queue.length})
            </h3>
            <p className="text-[11px] text-[#919196] mt-0.5">
              Lista das últimas ações registradas no dispositivo que aguardam envio para o servidor
            </p>
          </div>

          <div className="flex items-center gap-2">
            {pwaState.queue.length > 0 && (
              <>
                <button
                  onClick={handleClearQueue}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Esvaziar Fila
                </button>
                <button
                  onClick={handleManualSync}
                  disabled={isManualSyncing || !pwaState.isOnline}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                  Forçar Sincronização
                </button>
              </>
            )}
          </div>
        </div>

        {pwaState.queue.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/80 mx-auto" />
            <div className="text-xs font-semibold text-white">Dispositivo Totalmente Sincronizado</div>
            <p className="text-[11px] text-[#919196] max-w-sm mx-auto leading-relaxed">
              Não há nenhuma alteração pendente armazenada localmente. Todas as suas anotações estão sincronizadas e em segurança com o servidor central!
            </p>
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto divide-y divide-[#242427] pr-1 scrollbar-thin">
            {pwaState.queue.map((item: SyncQueueItem) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-[#1C1C1F]/40 px-2 rounded-lg transition">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold rounded uppercase">
                      {item.action}
                    </span>
                    <span className="font-semibold text-white">{item.description}</span>
                  </div>
                  <span className="text-[10px] text-[#919196] block mt-0.5">
                    Ação registrada localmente às {new Date(item.timestamp).toLocaleTimeString('pt-BR')} do dia {new Date(item.timestamp).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase">
                  Aguardando Conexão
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
