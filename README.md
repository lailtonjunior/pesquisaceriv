# 📝 Pesquisa de Satisfação – CER IV

Aplicação web para realização de **pesquisa de satisfação de usuários em Centros Especializados em Reabilitação (CER IV)**, com foco em acessibilidade, simplicidade de uso e suporte a **voz humanizada (Text-to-Speech)**.

---

## 📌 Sobre o Projeto

Este projeto foi desenvolvido para apoiar instituições de saúde e reabilitação na coleta estruturada de feedback de usuários, familiares ou responsáveis, permitindo avaliar a qualidade dos serviços prestados.

A aplicação é leve, moderna e preparada para **uso em tablets, computadores ou totens**, com deploy simplificado via Vercel.

---

## 🚀 Funcionalidades

- Interface acessível e responsiva
- Perguntas exibidas passo a passo
- Respostas por escala e texto livre
- Leitura das perguntas em voz (Text-to-Speech)
- Estrutura pronta para integração com backend
- Deploy automático no Vercel

---

## 🧩 Tecnologias Utilizadas

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Vercel
- ElevenLabs (Text-to-Speech – prova de conceito)
- Google Cloud Text-to-Speech (opcional para produção)

---

## 📂 Estrutura do Projeto

```
app/
├── page.tsx
├── pesquisa/
│   ├── page.tsx
│   └── components/
│       ├── QuestionCard.tsx
│       ├── RatingScale.tsx
│       ├── VoiceButton.tsx
│       └── NavigationButtons.tsx
├── sucesso/
│   └── page.tsx
components/
├── Header.tsx
├── Footer.tsx
└── AssistantMessage.tsx
lib/
├── questions.ts
├── tone.ts
└── voice.ts
```

---

## ▶️ Executando Localmente

```bash
git clone https://github.com/lailtonjunior/pesquisaceriv.git
cd pesquisaceriv
npm install
npm run dev
```

---

## 🔊 Voz Humanizada (Text-to-Speech)

### ElevenLabs (Free – Prova de Conceito)

- ~10.000 caracteres/mês
- Voz natural e fluida
- Não exige cartão no plano gratuito

Variáveis de ambiente:

```env
ELEVENLABS_API_KEY=your_api_key
ELEVENLABS_VOICE_ID=voice_id
```

---

## ☁️ Deploy no Vercel

1. Importar o repositório no Vercel
2. Configurar variáveis de ambiente
3. Deploy automático

---

## 📄 Licença

Projeto de uso institucional e educacional.
