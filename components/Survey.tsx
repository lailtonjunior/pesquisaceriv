import React, { useState, useEffect } from 'react';
import { speak, cancelSpeech } from '../services/ttsService';
import { AccessibleButton } from './AccessibleButton';

interface SurveyData {
  nome: string;
  cpf: string;
  dataPreenchimento: string;
  quemPreenche: 'paciente' | 'responsavel' | '';
  modalidades: string[];
  avaliacoes: Record<string, number | null>;
  comentario: string;
}

const INITIAL_DATA: SurveyData = {
  nome: '',
  cpf: '',
  dataPreenchimento: '', // Will be set on mount
  quemPreenche: '',
  modalidades: [],
  avaliacoes: {},
  comentario: ''
};

const QUESTIONS = [
  {
    id: 'triagem',
    title: '1) TRIAGEM',
    desc: 'A triagem é o primeiro atendimento, onde o paciente é acolhido e encaminhado para os serviços necessários.',
    question: 'Como você avalia a triagem?'
  },
  {
    id: 'consulta_medica',
    title: '2) CONSULTA MÉDICA',
    desc: 'A consulta médica é o atendimento realizado pelo médico para avaliação da sua condição de saúde.',
    question: 'Como você avalia a consulta médica?'
  },
  {
    id: 'exames',
    title: '3) AVALIAÇÃO / EXAMES',
    desc: 'As avaliações e exames são realizados para entender melhor suas necessidades de tratamento.',
    question: 'Como você avalia as avaliações e exames realizados?'
  },
  {
    id: 'multidisciplinar',
    title: '4) ATENDIMENTO COM A EQUIPE MULTIDISCIPLINAR',
    desc: 'O atendimento com a equipe multidisciplinar envolve profissionais como fisioterapeuta, fonoaudiólogo, terapeuta ocupacional, psicólogo, entre outros.',
    question: 'Como você avalia o atendimento com a equipe multidisciplinar?'
  },
  {
    id: 'limpeza',
    title: '5) LIMPEZA',
    desc: 'A limpeza envolve a higiene e organização dos ambientes do local de atendimento.',
    question: 'Como você avalia a limpeza do local?'
  },
  {
    id: 'acomodacoes',
    title: '6) ACOMODAÇÕES',
    desc: 'As acomodações se referem ao conforto, acessibilidade e estrutura do local.',
    question: 'Como você avalia as acomodações?'
  },
  {
    id: 'geral',
    title: '7) SATISFAÇÃO GERAL',
    desc: 'Esta é uma avaliação geral sobre sua experiência no serviço.',
    question: 'De forma geral, qual o seu nível de satisfação?'
  }
];

// Helper component para a dica de áudio
const AudioHint = () => (
  <span className="block text-sm md:text-base font-semibold text-brand-blue mt-2 flex items-center gap-2">
    <span className="bg-brand-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">🔊</span>
    Toque para ouvir
  </span>
);

interface RatingButtonProps {
  num: number;
  isSelected: boolean;
  onSelect: (n: number) => void;
}

// Sub-componente para botão de nota com efeito visual temporário
const RatingButton: React.FC<RatingButtonProps> = ({ num, isSelected, onSelect }) => {
  const [isJustClicked, setIsJustClicked] = useState(false);

  const handleClick = () => {
    setIsJustClicked(true);
    onSelect(num);
    setTimeout(() => {
      setIsJustClicked(false);
    }, 400);
  };

  // Cores baseadas na identidade: Azul (selecionado), Amarelo (click)
  let buttonClasses = "w-12 h-12 md:w-16 md:h-16 rounded-lg text-xl md:text-2xl font-brand font-bold border-2 transition-all duration-200 transform focus:outline-none focus:ring-4 focus:ring-offset-2 ";

  if (isJustClicked) {
    // Feedback de clique: Amarelo da marca
    buttonClasses += "bg-brand-yellow text-brand-gray border-brand-yellow scale-110 shadow-lg ring-4 ring-brand-yellow z-10";
  } else if (isSelected) {
    // Selecionado: Azul da marca
    buttonClasses += "bg-brand-blue text-white border-brand-blue scale-105 shadow-md ring-brand-blue";
  } else {
    // Padrão: Branco com borda cinza suave, hover azul claro
    buttonClasses += "bg-white text-gray-700 border-gray-300 hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50";
  }

  return (
    <button
      onClick={handleClick}
      className={buttonClasses}
      aria-label={`Nota ${num}`}
      aria-pressed={isSelected}
    >
      {num}
    </button>
  );
};

export const Survey: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [formData, setFormData] = useState<SurveyData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const now = new Date().toLocaleString('pt-BR');
    setFormData(prev => ({ ...prev, dataPreenchimento: now }));
    speak("Iniciando pesquisa de satisfação. Por favor, preencha a identificação abaixo.");
    
    // Cleanup: cancela o áudio se o componente for desmontado
    return () => {
      cancelSpeech();
    };
  }, []);

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'cpf') finalValue = formatCPF(value);
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFocus = (text: string) => {
    speak(text);
  };

  const handleModalityToggle = (value: string) => {
    setFormData(prev => {
      const current = prev.modalidades;
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      const action = current.includes(value) ? 'desmarcado' : 'marcado';
      speak(`${value} ${action}`);
      return { ...prev, modalidades: updated };
    });
  };

  const handleRating = (questionId: string, rating: number) => {
    setFormData(prev => ({
      ...prev,
      avaliacoes: { ...prev.avaliacoes, [questionId]: rating }
    }));
    speak(`Nota ${rating} selecionada.`);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.cpf || formData.cpf.length < 14) newErrors.cpf = 'CPF incompleto ou obrigatório.';
    if (!formData.quemPreenche) newErrors.quemPreenche = 'Informe quem está preenchendo.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      speak("Atenção. Existem campos obrigatórios não preenchidos.");
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (validate()) {
      console.log('Dados da Pesquisa:', formData);
      speak("Pesquisa enviada com sucesso! Muito obrigado pela sua colaboração.");
      onFinish();
    }
  };

  const RatingButtons = ({ questionId, currentRating }: { questionId: string, currentRating: number | null }) => (
    <div className="flex flex-wrap gap-2 justify-center mt-6">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
        <RatingButton 
          key={num}
          num={num}
          isSelected={currentRating === num}
          onSelect={(n) => handleRating(questionId, n)}
        />
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto pb-24 font-body text-brand-gray">
      
      {/* HEADER DA PESQUISA - Estilo "Cartão do SUS" clean */}
      <section 
        className="bg-white border-t-8 border-brand-blue p-8 rounded-b-xl shadow-lg mb-10 animate-slide-in cursor-pointer hover:bg-gray-50 transition-colors"
        onFocus={() => handleFocus("Título: Pesquisa de Satisfação. Questionário para avaliar o Centro Especializado em Reabilitação.")}
        onClick={() => handleFocus("Título: Pesquisa de Satisfação. Questionário para avaliar o Centro Especializado em Reabilitação.")}
        tabIndex={0}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h2 className="text-3xl md:text-4xl font-brand font-extrabold text-brand-blue uppercase tracking-tight">
                Pesquisa de Satisfação
            </h2>
            <div className="flex gap-2">
                <div className="w-4 h-4 rounded-full bg-brand-green"></div>
                <div className="w-4 h-4 rounded-full bg-brand-red"></div>
                <div className="w-4 h-4 rounded-full bg-brand-yellow"></div>
            </div>
        </div>
        <p className="text-lg md:text-xl leading-relaxed">
          Sua opinião é fundamental para fortalecermos a <strong>Rede de Cuidados à Pessoa com Deficiência</strong>.
        </p>
        <AudioHint />
      </section>

      {/* IDENTIFICAÇÃO */}
      <section 
        className="mb-10 animate-slide-in opacity-0 [animation-delay:200ms]" 
        aria-label="Identificação do Usuário"
      >
        <div 
          className="flex items-center gap-3 border-b-2 border-gray-100 pb-4 mb-6 cursor-pointer"
          tabIndex={0}
          onFocus={() => handleFocus("Seção: Identificação do Usuário")}
          onClick={() => handleFocus("Seção: Identificação do Usuário")}
        >
          <div className="w-2 h-8 bg-brand-yellow rounded-full"></div>
          <h3 className="text-2xl md:text-3xl font-brand font-bold text-gray-800">
            Identificação
          </h3>
          <AudioHint />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Nome */}
            <div className="flex flex-col gap-2">
            <label htmlFor="nome" className="text-lg font-bold text-gray-700">
                1) Nome (Opcional)
            </label>
            <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                onFocus={() => handleFocus("Campo Nome. Opcional.")}
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all bg-gray-50 focus:bg-white"
            />
            </div>

            {/* CPF */}
            <div className="flex flex-col gap-2">
            <label htmlFor="cpf" className="text-lg font-bold text-gray-700">
                2) CPF (Obrigatório)
            </label>
            <input
                type="tel"
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleInputChange}
                onFocus={() => handleFocus("Campo CPF. Obrigatório.")}
                maxLength={14}
                placeholder="000.000.000-00"
                className={`w-full p-4 text-lg border-2 rounded-lg focus:ring-1 transition-all bg-gray-50 focus:bg-white ${errors.cpf ? 'border-brand-red ring-brand-red focus:border-brand-red' : 'border-gray-300 focus:border-brand-blue focus:ring-brand-blue'}`}
                aria-invalid={!!errors.cpf}
            />
            {errors.cpf && <span className="text-brand-red font-bold text-sm mt-1">{errors.cpf}</span>}
            </div>
        </div>

        {/* Quem preenche */}
        <div className="mt-8 flex flex-col gap-4">
          <div 
            className="cursor-pointer"
            tabIndex={0}
            onFocus={() => handleFocus("Pergunta 4: Quem está preenchendo as informações?")}
            onClick={() => handleFocus("Pergunta 4: Quem está preenchendo as informações?")}
          >
            <span className="text-lg font-bold text-gray-700 block mb-2">
              4) Quem está preenchendo as informações?
            </span>
            <AudioHint />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className={`flex-1 flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.quemPreenche === 'paciente' ? 'border-brand-blue bg-blue-50' : 'border-gray-200 hover:border-brand-blue'}`}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.quemPreenche === 'paciente' ? 'border-brand-blue' : 'border-gray-400'}`}>
                {formData.quemPreenche === 'paciente' && <div className="w-3 h-3 rounded-full bg-brand-blue" />}
              </div>
              <input 
                type="radio" 
                name="quemPreenche" 
                value="paciente" 
                className="sr-only"
                checked={formData.quemPreenche === 'paciente'}
                onChange={() => {
                    setFormData(prev => ({...prev, quemPreenche: 'paciente'}));
                    speak("Próprio paciente selecionado");
                }}
              />
              <span className="text-lg font-semibold">Próprio paciente</span>
            </label>

            <label className={`flex-1 flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.quemPreenche === 'responsavel' ? 'border-brand-blue bg-blue-50' : 'border-gray-200 hover:border-brand-blue'}`}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.quemPreenche === 'responsavel' ? 'border-brand-blue' : 'border-gray-400'}`}>
                {formData.quemPreenche === 'responsavel' && <div className="w-3 h-3 rounded-full bg-brand-blue" />}
              </div>
              <input 
                type="radio" 
                name="quemPreenche" 
                value="responsavel"
                className="sr-only"
                checked={formData.quemPreenche === 'responsavel'}
                onChange={() => {
                    setFormData(prev => ({...prev, quemPreenche: 'responsavel'}));
                    speak("Responsável selecionado");
                }}
              />
              <span className="text-lg font-semibold">Responsável</span>
            </label>
          </div>
          {errors.quemPreenche && <span className="text-brand-red font-bold text-sm">{errors.quemPreenche}</span>}
        </div>

        {/* Modalidade */}
        <div className="mt-8 flex flex-col gap-4">
          <div
            className="cursor-pointer"
            tabIndex={0}
            onFocus={() => handleFocus("Pergunta 5: Qual modalidade de reabilitação foi atendido?")}
            onClick={() => handleFocus("Pergunta 5: Qual modalidade de reabilitação foi atendido?")}
          >
            <span className="text-lg font-bold text-gray-700 block mb-2">
              5) Qual modalidade de reabilitação foi atendido?
            </span>
            <AudioHint />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['Reabilitação Auditiva', 'Reabilitação Física', 'Reabilitação Intelectual', 'Reabilitação Visual'].map((mod) => {
              const checked = formData.modalidades.includes(mod);
              return (
                <label key={mod} className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${checked ? 'border-brand-green bg-green-50' : 'border-gray-200 hover:border-brand-green'}`}>
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${checked ? 'border-brand-green bg-brand-green' : 'border-gray-400'}`}>
                        {checked && <span className="text-white font-bold text-sm">✓</span>}
                    </div>
                    <input 
                        type="checkbox" 
                        value={mod}
                        className="sr-only"
                        checked={checked}
                        onChange={() => handleModalityToggle(mod)}
                    />
                    <span className="text-lg font-semibold">{mod}</span>
                </label>
              );
            })}
          </div>
        </div>
      </section>

      {/* AVALIAÇÃO DE SATISFAÇÃO */}
      <section 
        className="mb-12 space-y-8 animate-slide-in opacity-0 [animation-delay:400ms]" 
        aria-label="Avaliação de Satisfação"
      >
        <div 
          className="bg-brand-yellow/10 p-6 rounded-lg border-l-8 border-brand-yellow cursor-pointer"
          tabIndex={0}
          onFocus={() => handleFocus("Seção de Avaliação. Notas de 0 a 10.")}
          onClick={() => handleFocus("Seção de Avaliação. Notas de 0 a 10.")}
        >
          <h3 className="text-2xl md:text-3xl font-brand font-bold text-gray-900">
            Avaliação de Satisfação
          </h3>
          <p className="text-gray-700 mt-2 font-medium">Classifique de 0 (Muito Insatisfeito) a 10 (Muito Satisfeito)</p>
          <AudioHint />
        </div>

        {QUESTIONS.map((q, idx) => (
          <div key={q.id} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div 
              tabIndex={0} 
              onFocus={() => handleFocus(`${q.title}. ${q.question}`)}
              onClick={() => handleFocus(`${q.title}. ${q.question}`)}
              className="mb-6 cursor-pointer group"
            >
              <h4 className="text-xl font-brand font-bold text-brand-blue mb-2 uppercase tracking-wide">{q.title}</h4>
              <p className="text-base text-gray-500 mb-4">{q.desc}</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{q.question}</p>
              <AudioHint />
            </div>
            
            <RatingButtons 
              questionId={q.id} 
              currentRating={formData.avaliacoes[q.id] || null} 
            />
          </div>
        ))}
      </section>

      {/* FEEDBACK FINAL */}
      <section className="mb-12 animate-slide-in opacity-0 [animation-delay:600ms]">
        <div className="mb-4">
          <h3 className="text-2xl md:text-3xl font-brand font-bold text-gray-900">Considerações Finais</h3>
          <p className="text-gray-600 mt-1">Espaço para críticas, sugestões ou elogios (Opcional)</p>
        </div>
        <textarea
          name="comentario"
          value={formData.comentario}
          onChange={handleInputChange}
          onFocus={() => handleFocus("Campo de comentários finais.")}
          className="w-full p-6 text-lg border-2 border-gray-300 rounded-lg min-h-[160px] focus:border-brand-blue focus:ring-1 focus:ring-brand-blue bg-gray-50 focus:bg-white transition-all resize-y"
          placeholder="Digite sua mensagem aqui..."
        />
      </section>

      {/* BOTÃO FINAL */}
      <div className="flex justify-center pb-8 animate-fade-in [animation-delay:800ms]">
        <AccessibleButton 
          label="ENVIAR AVALIAÇÃO" 
          onClick={handleSubmit} 
          ariaLabel="Botão Enviar avaliação"
          className="max-w-md shadow-xl hover:shadow-2xl"
        />
      </div>
    </div>
  );
};