import React, { useState, useEffect } from 'react';
import { speak } from '../services/ttsService';
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
  <span className="block text-sm md:text-base font-normal text-cer-blue mt-1 opacity-90">
    🔊 Toque aqui para ouvir
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
    // Ativa o efeito visual temporário
    setIsJustClicked(true);
    
    // Chama a função principal (que aciona o TTS)
    onSelect(num);

    // Remove o efeito visual após 400ms
    setTimeout(() => {
      setIsJustClicked(false);
    }, 400);
  };

  // Definição dinâmica de classes baseada no estado
  let buttonClasses = "w-12 h-12 md:w-16 md:h-16 rounded-full text-xl md:text-2xl font-bold border-2 transition-all duration-200 transform focus:outline-none focus:ring-4 focus:ring-offset-2 ";

  if (isJustClicked) {
    // ESTADO: ACABOU DE CLICAR (Feedback Visual Forte)
    // Fundo Amarelo (cer-yellow), Texto Preto, Borda Laranja, Escala 125%
    buttonClasses += "bg-cer-yellow text-black border-yellow-600 scale-125 shadow-xl ring-4 ring-yellow-300 z-10";
  } else if (isSelected) {
    // ESTADO: SELECIONADO
    // Fundo Azul, Texto Branco, Escala 110%
    buttonClasses += "bg-cer-blue text-white border-cer-blue scale-110 shadow-lg ring-cer-blue";
  } else {
    // ESTADO: PADRÃO
    buttonClasses += "bg-white text-gray-800 border-gray-300 hover:border-cer-blue hover:bg-blue-50";
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
    // Set date on mount
    const now = new Date().toLocaleString('pt-BR');
    setFormData(prev => ({ ...prev, dataPreenchimento: now }));
    
    // Read intro
    speak("Iniciando pesquisa de satisfação. Por favor, preencha a identificação abaixo.");
  }, []);

  // --- Handlers ---

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

    if (name === 'cpf') {
      finalValue = formatCPF(value);
    }

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
    
    if (!formData.cpf || formData.cpf.length < 14) {
      newErrors.cpf = 'CPF incompleto ou obrigatório.';
    }

    if (!formData.quemPreenche) {
      newErrors.quemPreenche = 'Informe quem está preenchendo.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const msg = "Atenção. Existem campos obrigatórios não preenchidos. Verifique o CPF e quem está preenchendo.";
      speak(msg);
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

  // --- Render Helpers ---

  const RatingButtons = ({ questionId, currentRating }: { questionId: string, currentRating: number | null }) => (
    <div className="flex flex-wrap gap-3 justify-center mt-4">
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
    <div className="w-full max-w-4xl mx-auto pb-20">
      
      {/* HEADER DA PESQUISA */}
      <section 
        className="bg-blue-50 p-6 md:p-8 rounded-2xl mb-8 border-l-8 border-cer-blue shadow-sm animate-slide-in cursor-pointer hover:bg-blue-100 transition-colors"
        onFocus={() => handleFocus("Título: Pesquisa de Satisfação. Esse questionário tem como finalidade avaliar a satisfação de usuários do serviço do Centro Especializado em Reabilitação.")}
        onClick={() => handleFocus("Título: Pesquisa de Satisfação. Esse questionário tem como finalidade avaliar a satisfação de usuários do serviço do Centro Especializado em Reabilitação.")}
        tabIndex={0}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-cer-blue-dark mb-2">PESQUISA DE SATISFAÇÃO</h2>
        <AudioHint />
        <p className="text-xl md:text-2xl text-gray-800 mt-4">
          Esse questionário tem como finalidade avaliar a satisfação de usuários do serviço do 
          <strong> Centro Especializado em Reabilitação (CER IV)</strong> de Colinas do Tocantins.
        </p>
      </section>

      {/* IDENTIFICAÇÃO */}
      <section 
        className="mb-12 space-y-8 animate-slide-in opacity-0 [animation-delay:200ms]" 
        aria-label="Identificação do Usuário"
      >
        <div 
          className="border-b-2 border-gray-200 pb-2 cursor-pointer"
          tabIndex={0}
          onFocus={() => handleFocus("Seção: Identificação do Usuário")}
          onClick={() => handleFocus("Seção: Identificação do Usuário")}
        >
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
            Identificação do Usuário
          </h3>
          <AudioHint />
        </div>

        {/* Nome */}
        <div className="flex flex-col gap-2">
          <label htmlFor="nome" className="text-xl font-semibold text-gray-800">
            1) Nome (Opcional)
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            onFocus={() => handleFocus("Campo Nome. Opcional.")}
            className="w-full p-4 text-xl border-2 border-gray-300 rounded-lg focus:border-cer-blue focus:ring-2 focus:ring-cer-blue"
          />
        </div>

        {/* CPF */}
        <div className="flex flex-col gap-2">
          <label htmlFor="cpf" className="text-xl font-semibold text-gray-800">
            2) CPF (Obrigatório)
          </label>
          <input
            type="tel"
            id="cpf"
            name="cpf"
            value={formData.cpf}
            onChange={handleInputChange}
            onFocus={() => handleFocus("Campo cê pê é fí. Obrigatório. Digite apenas números.")}
            maxLength={14}
            placeholder="000.000.000-00"
            className={`w-full p-4 text-xl border-2 rounded-lg focus:ring-2 ${errors.cpf ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:border-cer-blue focus:ring-cer-blue'}`}
            aria-invalid={!!errors.cpf}
          />
          {errors.cpf && <span className="text-red-600 font-bold" role="alert">{errors.cpf}</span>}
        </div>

        {/* Quem preenche */}
        <div className="flex flex-col gap-4">
          <div 
            className="cursor-pointer"
            tabIndex={0}
            onFocus={() => handleFocus("Pergunta 4: Quem está preenchendo as informações?")}
            onClick={() => handleFocus("Pergunta 4: Quem está preenchendo as informações?")}
          >
            <span className="text-xl font-semibold text-gray-800">
              4) Quem está preenchendo as informações?
            </span>
            <AudioHint />
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 active:bg-blue-50 transition-colors">
              <input 
                type="radio" 
                name="quemPreenche" 
                value="paciente" 
                checked={formData.quemPreenche === 'paciente'}
                onChange={(e) => {
                  setFormData(prev => ({...prev, quemPreenche: 'paciente'}));
                  speak("Próprio paciente selecionado");
                }}
                className="w-8 h-8 text-cer-blue focus:ring-cer-blue"
              />
              <span className="text-xl font-medium">Próprio paciente</span>
            </label>
            <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 active:bg-blue-50 transition-colors">
              <input 
                type="radio" 
                name="quemPreenche" 
                value="responsavel"
                checked={formData.quemPreenche === 'responsavel'}
                onChange={(e) => {
                  setFormData(prev => ({...prev, quemPreenche: 'responsavel'}));
                  speak("Responsável selecionado");
                }}
                className="w-8 h-8 text-cer-blue focus:ring-cer-blue"
              />
              <span className="text-xl font-medium">Responsável</span>
            </label>
          </div>
          {errors.quemPreenche && <span className="text-red-600 font-bold" role="alert">{errors.quemPreenche}</span>}
        </div>

        {/* Modalidade */}
        <div className="flex flex-col gap-4">
          <div
            className="cursor-pointer"
            tabIndex={0}
            onFocus={() => handleFocus("Pergunta 5: Qual modalidade de reabilitação foi atendido? Pode marcar mais de uma.")}
            onClick={() => handleFocus("Pergunta 5: Qual modalidade de reabilitação foi atendido? Pode marcar mais de uma.")}
          >
            <span className="text-xl font-semibold text-gray-800">
              5) Qual modalidade de reabilitação foi atendido?
            </span>
            <AudioHint />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Reabilitação Auditiva', 'Reabilitação Física', 'Reabilitação Intelectual', 'Reabilitação Visual'].map((mod) => (
              <label key={mod} className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 active:bg-blue-50 transition-colors">
                <input 
                  type="checkbox" 
                  value={mod}
                  checked={formData.modalidades.includes(mod)}
                  onChange={() => handleModalityToggle(mod)}
                  className="w-8 h-8 text-cer-blue rounded focus:ring-cer-blue"
                />
                <span className="text-xl font-medium">{mod}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* AVALIAÇÃO DE SATISFAÇÃO */}
      <section 
        className="mb-12 space-y-12 animate-slide-in opacity-0 [animation-delay:400ms]" 
        aria-label="Avaliação de Satisfação"
      >
        <div 
          className="bg-yellow-50 p-4 rounded-t-lg border-b-2 border-gray-200 cursor-pointer hover:bg-yellow-100 transition-colors"
          tabIndex={0}
          onFocus={() => handleFocus("Seção: Classifique de acordo com o nível de satisfação. Notas de zero a dez, onde zero é muito insatisfeito e dez é muito satisfeito.")}
          onClick={() => handleFocus("Seção: Classifique de acordo com o nível de satisfação. Notas de zero a dez, onde zero é muito insatisfeito e dez é muito satisfeito.")}
        >
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
            Classifique de acordo com o nível de satisfação (0 a 10)
          </h3>
          <AudioHint />
        </div>

        {QUESTIONS.map((q) => (
          <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div 
              tabIndex={0} 
              onFocus={() => handleFocus(`${q.title}. ${q.desc}. Pergunta: ${q.question}`)}
              onClick={() => handleFocus(`${q.title}. ${q.desc}. Pergunta: ${q.question}`)}
              className="mb-6 cursor-pointer group"
            >
              <h4 className="text-2xl font-bold text-cer-blue mb-2 group-hover:text-blue-800 transition-colors">{q.title}</h4>
              <p className="text-lg text-gray-600 mb-4 italic">{q.desc}</p>
              <p className="text-xl md:text-2xl font-semibold text-gray-900">{q.question}</p>
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
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Críticas, sugestões ou elogios</h3>
        </div>
        <textarea
          name="comentario"
          value={formData.comentario}
          onChange={handleInputChange}
          onFocus={() => handleFocus("Campo para críticas, sugestões ou elogios. Opcional.")}
          className="w-full p-4 text-xl border-2 border-gray-300 rounded-xl min-h-[150px] focus:border-cer-blue focus:ring-2 focus:ring-cer-blue"
          placeholder="Digite aqui..."
        />
      </section>

      {/* BOTÃO FINAL */}
      <div className="flex justify-center pb-8 animate-fade-in [animation-delay:800ms]">
        <AccessibleButton 
          label="ENVIAR PESQUISA" 
          onClick={handleSubmit} 
          ariaLabel="Botão Enviar pesquisa de satisfação"
        />
      </div>
    </div>
  );
};