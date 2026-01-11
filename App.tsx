import React, { useEffect, useState } from 'react';
import { speak, cancelSpeech } from './services/ttsService';
import { AccessibleButton } from './components/AccessibleButton';
import { Survey } from './components/Survey';

// Textos da aplicação
const TEXTS = {
  title: "Pesquisa de Satisfação",
  welcome: "Sua opinião é muito importante para melhorarmos o atendimento do CER IV.",
  startBtn: "INICIAR",
  ttsWelcome: "Olá! Bem-vindo à pesquisa de satisfação do Centro Especializado em Reabilitação ser 4 apae Colinas. Toque no botão iniciar para começar.",
  ttsConfirm: "Iniciando a pesquisa. Por favor, aguarde.",
};

type ViewState = 'welcome' | 'survey' | 'thanks';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('welcome');

  // Efeito para ler o texto de boas-vindas imediatamente ao carregar
  useEffect(() => {
    if (view === 'welcome') {
      // Chamada direta sem setTimeout para iniciar o mais rápido possível
      speak(TEXTS.ttsWelcome);
    }
  }, [view]);

  const handleStart = () => {
    speak(TEXTS.ttsConfirm);
    // Simular tempo de carregamento/transição
    setTimeout(() => {
      setView('survey');
    }, 1000);
  };

  const handleFinishSurvey = () => {
    setView('thanks');
  };

  const handleRestart = () => {
    setView('welcome');
  };

  const handleReplayAudio = () => {
    speak(TEXTS.ttsWelcome);
  };

  // --- RENDERIZADORES DE VIEW ---

  const renderWelcome = () => (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white p-6 md:p-12 text-center animate-fade-in">
      <header className="mb-12 w-full max-w-4xl">
        <h1 
          className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight text-cer-blue-dark"
          aria-label={TEXTS.title}
        >
          {TEXTS.title}
        </h1>
        
        <p className="text-2xl md:text-4xl text-gray-700 leading-relaxed font-medium">
          {TEXTS.welcome}
        </p>
      </header>

      <section className="w-full flex flex-col items-center gap-8">
        <div className="w-full max-w-md">
          <AccessibleButton 
            label={TEXTS.startBtn}
            onClick={handleStart}
            ariaLabel="Botão Iniciar pesquisa de satisfação"
          />
        </div>

        <button 
          onClick={handleReplayAudio}
          className="mt-8 text-xl text-blue-800 underline hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-2"
          aria-label="Repetir as instruções de voz"
        >
          🔊 Repetir instruções
        </button>
      </section>

      <footer className="fixed bottom-4 text-gray-500 text-lg">
        CER IV - APAE
      </footer>
    </main>
  );

  const renderThanks = () => (
    <main className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-6 text-center animate-fade-in">
      <h2 className="text-5xl font-bold text-green-800 mb-8">Obrigado!</h2>
      <p className="text-3xl text-gray-800 mb-12">Sua avaliação foi registrada com sucesso.</p>
      
      <div className="w-full max-w-md">
        <AccessibleButton 
          label="Voltar ao Início" 
          onClick={handleRestart}
          variant="secondary"
        />
      </div>
    </main>
  );

  return (
    <>
      {view === 'welcome' && renderWelcome()}
      {view === 'survey' && (
        <main className="min-h-screen bg-gray-50 p-4 md:p-8">
          <Survey onFinish={handleFinishSurvey} />
        </main>
      )}
      {view === 'thanks' && renderThanks()}
    </>
  );
};

export default App;