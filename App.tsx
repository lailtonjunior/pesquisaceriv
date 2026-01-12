import React, { useEffect, useState } from 'react';
import { speak, cancelSpeech } from './services/ttsService';
import { AccessibleButton } from './components/AccessibleButton';
import { Survey } from './components/Survey';

// Textos da aplicação
const TEXTS = {
  title: "SAÚDE SEM LIMITE",
  subtitle: "Rede de Cuidados à Pessoa com Deficiência",
  welcome: "Sua opinião fortalece o SUS e melhora o atendimento no CER IV.",
  startBtn: "INICIAR PESQUISA",
  ttsWelcome: "Bem-vindo ao Saúde Sem Limite. Pesquisa de satisfação do Centro Especializado em Reabilitação CER 4 APAE Colinas. Toque em Iniciar Pesquisa.",
  ttsConfirm: "Iniciando pesquisa...",
  };

// PASSO FINAL:
// 1. No Google Apps Script, clique em "Implantar" > "Nova implantação".
// 2. Certifique-se que "Quem pode acessar" está como "Qualquer pessoa".
// 3. Copie a URL que termina em '/exec'.
// 4. Cole dentro das aspas abaixo.
const GOOGLE_SCRIPT_URL_ADMIN = "https://script.google.com/macros/s/AKfycbxPebLi-kcJmhBhbbaHdEp4VSQwaYYWF2zHmI5J22vA6OWVB_qP1FDiJV10e1GnEuYr/exec".trim();

type ViewState = 'welcome' | 'survey' | 'thanks';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('welcome');
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Efeito para feedback sonoro ao ativar/desativar
  useEffect(() => {
    if (isAudioEnabled) {
      speak("Leitor de voz ativado. Toque nos textos para ouvir.");
    } else {
      cancelSpeech();
    }
  }, [isAudioEnabled]);

  // Toca as boas-vindas apenas se o áudio já estiver ativado
  useEffect(() => {
    if (view === 'welcome' && isAudioEnabled) {
      speak(TEXTS.ttsWelcome);
    }
    return () => {
      cancelSpeech();
    };
  }, [view, isAudioEnabled]);

  const handleStart = () => {
    if (isAudioEnabled) speak(TEXTS.ttsConfirm);
    setTimeout(() => {
      setView('survey');
    }, 800);
  };

  const handleFinishSurvey = () => {
    setView('thanks');
  };

  const handleRestart = () => {
    setView('welcome');
  };

  const handleReplayAudio = () => {
    if (isAudioEnabled) speak(TEXTS.ttsWelcome);
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  // Função Admin: Aciona a criação do Excel na Nuvem
  const handleExportData = async () => {
    if (!GOOGLE_SCRIPT_URL_ADMIN || GOOGLE_SCRIPT_URL_ADMIN.includes("COLE_SUA_URL")) {
        alert("ERRO DE CONFIGURAÇÃO: URL da API não atualizada. \n\n1. Vá no arquivo App.tsx\n2. Cole a URL na linha 19.\n(É a mesma URL que você deve colar no arquivo Survey.tsx)");
        return;
    }
    
    // Confirmação para evitar cliques acidentais
    if (!confirm("Isso gerará um Relatório Excel na pasta do Drive com os dados deste mês. Continuar?")) {
        return;
    }

    setIsExporting(true);
    console.log("--- INICIANDO EXPORTAÇÃO (ADMIN) ---");
    // console.log("URL:", GOOGLE_SCRIPT_URL_ADMIN);

    try {
        // TENTATIVA 1: CORS Padrão
        const response = await fetch(GOOGLE_SCRIPT_URL_ADMIN, {
            method: 'POST',
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({ action: "EXPORT_MONTHLY" })
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const json = await response.json();
        if (json.status === 'error') {
            throw new Error(json.message);
        }

        console.log("Sucesso Admin:", json);
        alert("Teste enviado! Verifique a aba 'RESPOSTAS' na planilha.");

    } catch (e) {
        console.warn("Erro no teste Admin (Tentativa 1):", e);
        try {
            // TENTATIVA 2: Fallback no-cors
            await fetch(GOOGLE_SCRIPT_URL_ADMIN, {
                method: 'POST',
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify({ action: "EXPORT_MONTHLY" }),
                mode: 'no-cors'
            });
            alert("Comando enviado (Modo Compatibilidade). Verifique a planilha.");
        } catch (fatal) {
             alert("Erro fatal de conexão: " + String(fatal));
        }
    } finally {
        setIsExporting(false);
    }
  };

  // Componente Botão de Voz Flutuante
  const AudioToggle = () => (
    <button
      onClick={toggleAudio}
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-yellow ${
        isAudioEnabled 
          ? 'bg-brand-blue text-white ring-2 ring-white' 
          : 'bg-white text-gray-600 border-2 border-gray-200'
      }`}
      aria-label={isAudioEnabled ? "Desativar leitor de voz" : "Ativar leitor de voz"}
      aria-pressed={isAudioEnabled}
    >
      <span className="text-xl">{isAudioEnabled ? '🔊' : '🔇'}</span>
      <span className="font-bold text-sm md:text-base hidden sm:inline">
        {isAudioEnabled ? 'Voz Ativada' : 'Ativar Voz'}
      </span>
    </button>
  );

  // Componente de Rodapé do Governo
  const GovernmentFooter = () => (
    <footer className="w-full bg-white border-t border-gray-200 mt-auto py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 opacity-90">
        
        {/* Bloco da Esquerda - Programa */}
        <div className="text-left">
            <h4 className="font-brand font-bold text-gray-500 text-sm uppercase tracking-wider mb-1">Programa</h4>
            <div className="text-xl font-brand font-extrabold text-brand-blue leading-none">
                VIVER SEM LIMITE
            </div>
            <div className="text-xs font-semibold text-gray-500">Novo Plano Nacional</div>
        </div>

        {/* Bloco da Direita - Logos Institucionais */}
        <div className="flex flex-wrap justify-center md:justify-end items-center gap-6 md:gap-8">
            <div className="font-bold text-gray-600">CER IV</div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div className="font-black text-xl text-gray-700 tracking-tighter">SUS</div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div className="text-right">
                <div className="text-xs font-bold text-gray-600 uppercase">Ministério da</div>
                <div className="text-sm font-black text-gray-800 uppercase">Saúde</div>
            </div>
            <div className="hidden md:block h-8 w-px bg-gray-300"></div>
            <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-gray-600 uppercase">Governo Federal</div>
                <div className="flex gap-1 mt-1">
                    <div className="w-4 h-1 bg-brand-green"></div>
                    <div className="w-4 h-1 bg-brand-yellow"></div>
                    <div className="w-4 h-1 bg-brand-blue"></div>
                </div>
            </div>
        </div>
      </div>
    </footer>
  );

  const renderWelcome = () => (
    <main className="min-h-screen flex flex-col bg-white animate-fade-in relative overflow-hidden">
      {/* Elemento Gráfico Decorativo - Ondas da Marca */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue opacity-5 rounded-bl-full -mr-16 -mt-16 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-yellow opacity-10 rounded-tr-full -ml-12 -mb-12 pointer-events-none"></div>

      <div className="flex-grow flex flex-col items-center justify-center p-6 md:p-12 text-center z-10">
        <header className="mb-12 w-full max-w-4xl">
            {/* Ícone da Marca */}
            <div className="mx-auto mb-6 w-20 h-20 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-brand-blue rounded-full"></div>
                <div className="absolute top-7 left-1/2 -translate-x-1/2 w-12 h-6 bg-brand-green rounded-t-full rounded-b-lg"></div>
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-12 h-6 bg-brand-red rounded-b-full rounded-t-lg mix-blend-multiply opacity-90"></div>
            </div>

            <h1 className="text-5xl md:text-7xl font-brand font-extrabold text-brand-blue mb-2 tracking-tight">
                {TEXTS.title}
            </h1>
            <h2 className="text-xl md:text-2xl font-brand font-bold text-gray-600 uppercase tracking-wide mb-8">
                {TEXTS.subtitle}
            </h2>
            
            <p className="text-2xl md:text-3xl text-gray-800 font-body leading-relaxed max-w-2xl mx-auto">
                {TEXTS.welcome}
            </p>
        </header>

        <section className="w-full flex flex-col items-center gap-6">
          <div className="w-full max-w-md">
            <AccessibleButton 
              label={TEXTS.startBtn}
              onClick={handleStart}
              ariaLabel="Botão Iniciar pesquisa de satisfação"
              className="shadow-xl hover:shadow-2xl hover:-translate-y-1"
            />
          </div>

          {/* Botão de Repetir só aparece se o áudio estiver ligado */}
          {isAudioEnabled && (
            <button 
                onClick={handleReplayAudio}
                className="flex items-center gap-2 mt-4 text-lg font-bold text-brand-blue hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-brand-yellow rounded-lg px-4 py-2 transition-colors bg-blue-50"
                aria-label="Repetir as instruções de voz"
            >
                <span>🔊</span> Repetir instruções
            </button>
          )}

          {!isAudioEnabled && (
             <p className="text-gray-500 text-sm mt-4 italic">
                Para ajuda auditiva, ative o botão "Ativar Voz" no topo da tela.
             </p>
          )}
        </section>
      </div>

      <GovernmentFooter />
    </main>
  );

  const renderThanks = () => (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center animate-fade-in relative">
       <div className="absolute inset-0 bg-brand-green opacity-5 pointer-events-none"></div>
       
       <div className="z-10 max-w-2xl w-full">
            <div className="w-24 h-24 bg-brand-green rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            
            <h2 className="text-5xl font-brand font-extrabold text-brand-blue mb-6">Obrigado!</h2>
            <p className="text-2xl text-gray-700 mb-12 font-medium">
                Sua avaliação contribui para um <strong>Brasil Bem Cuidado</strong>.
            </p>
            
            <div className="w-full max-w-md mx-auto flex flex-col gap-4">
                <AccessibleButton 
                  label="Voltar ao Início" 
                  onClick={handleRestart}
                  variant="secondary"
                />
                 {/* Admin / Debug Button atualizado para Nuvem */}
                 <button 
                   onClick={handleExportData}
                   disabled={isExporting}
                   className="text-gray-400 text-sm hover:text-brand-blue underline disabled:opacity-50"
                 >
                   {isExporting ? "(Processando...)" : "(Admin) Testar Conexão Google Sheet"}
                 </button>
            </div>
      </div>
      <div className="absolute bottom-0 w-full">
        <GovernmentFooter />
      </div>
    </main>
  );

  return (
    <>
      <AudioToggle />
      {view === 'welcome' && renderWelcome()}
      {view === 'survey' && (
        <main className="min-h-screen bg-gray-50 flex flex-col">
          <div className="p-4 md:p-8 flex-grow">
             <Survey 
                onFinish={handleFinishSurvey} 
                isAudioEnabled={isAudioEnabled}
             />
          </div>
          <GovernmentFooter />
        </main>
      )}
      {view === 'thanks' && renderThanks()}
    </>
  );
};

export default App;