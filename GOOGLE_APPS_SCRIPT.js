/**
 * --- INSTRUÇÕES PARA ATIVAR A GERAÇÃO DE PDF ---
 * 
 * 1. Copie TODO este código.
 * 2. Vá para o editor do Google Apps Script (onde você colou o código anterior).
 * 3. Apague tudo que está lá e cole este código.
 * 4. Salve o projeto (Ícone de disquete).
 * 5. Clique em "Implantar" > "Gerenciar Implantações".
 * 6. Clique no ícone de lápis (Editar) no canto superior direito.
 * 7. Em "Versão", mude para "Nova Versão" (IMPORTANTE!).
 * 8. Clique em "Implantar".
 * 9. O Google pedirá permissão novamente (pois agora acessamos o Google Drive). Autorize tudo.
 * 10. A URL deve permanecer a mesma, então o App continuará funcionando.
 */

// --- CONFIGURAÇÕES ---
// URL da sua planilha (Extraída do seu código anterior)
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1nlH8weJAkZhdFjt9oDDJwI6e4_ePKOhOp3W86zocdC8/edit?usp=drive_link";

// Nome da pasta principal onde os PDFs serão salvos no Google Drive
const ROOT_FOLDER_NAME = "SURVEY_CER_IV_PDFs"; 

function doPost(e) {
  // Lock Service impede que dois PDFs sejam gerados ao mesmo tempo exato, evitando erros
  const lock = LockService.getScriptLock();
  // Aguarda até 30 segundos para conseguir a vez (PDFs demoram um pouco)
  lock.tryLock(30000); 

  try {
    // 1. Conecta na Planilha
    const ss = SpreadsheetApp.openByUrl(SHEET_URL);
    const sheet = getOrCreateSheet(ss);

    // 2. Processa os Dados recebidos do React (App)
    let data = {};
    let action = "SUBMIT";

    if (e && e.postData && e.postData.contents) {
      try {
        const json = JSON.parse(e.postData.contents);
        data = json.data || {};
        action = json.action || "SUBMIT";
      } catch (jsonError) {
        // Se falhar o parse, segue com dados vazios
      }
    }

    // --- AÇÃO: SUBMETER PESQUISA E GERAR PDF ---
    if (action === "SUBMIT") {
      const now = new Date();
      
      // 3. Gerenciamento de Pastas (Cria pasta do Mês/Ano se não existir)
      // Ex: SURVEY_CER_IV_PDFs > 2023-10
      const folder = getOrCreateFolderStructure(now);
      
      // 4. Gera o Arquivo PDF
      const pdfFile = createPDF(data, folder, now);
      
      // Pega o Link para salvar na planilha
      const pdfUrl = pdfFile.getUrl();

      // 5. Salva na Planilha
      sheet.appendRow([
        now, // Coluna A: Data/Hora
        data.nome || '-',
        data.cpf || '-',
        data.quemPreenche || '-',
        data.modalidades ? data.modalidades.join(', ') : '-',
        data.avaliacoes ? data.avaliacoes['triagem'] : '-',
        data.avaliacoes ? data.avaliacoes['consulta_medica'] : '-',
        data.avaliacoes ? data.avaliacoes['exames'] : '-',
        data.avaliacoes ? data.avaliacoes['multidisciplinar'] : '-',
        data.avaliacoes ? data.avaliacoes['limpeza'] : '-',
        data.avaliacoes ? data.avaliacoes['acomodacoes'] : '-',
        data.avaliacoes ? data.avaliacoes['geral'] : '-',
        data.comentario || '-',
        pdfUrl // Coluna N: Link do PDF
      ]);
    }

    // --- AÇÃO: EXPORTAÇÃO MENSAL (Admin) ---
    if (action === "EXPORT_MONTHLY") {
       sheet.appendRow([new Date(), "ADMIN EXPORT", "Teste de Conexão OK", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "Verifique o Drive"]);
    }

    // Retorna Sucesso para o App React
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Retorna Erro para o App React
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- FUNÇÕES AUXILIARES ---

// Cria a aba DADOS se ela não existir
function getOrCreateSheet(ss) {
  let sheet = ss.getSheetByName("DADOS");
  if (!sheet) {
    sheet = ss.insertSheet("DADOS");
    // Cria o cabeçalho
    sheet.appendRow([
      "DATA/HORA", "NOME", "CPF", "QUEM PREENCHEU", "MODALIDADES",
      "TRIAGEM", "CONSULTA MEDICA", "EXAMES", "EQUIPE MULTI", 
      "LIMPEZA", "ACOMODAÇÕES", "GERAL", "COMENTÁRIOS", "LINK PDF"
    ]);
  }
  return sheet;
}

// Lógica de Pastas: Raiz -> Ano-Mês
function getOrCreateFolderStructure(date) {
  // 1. Procura ou cria a pasta RAIZ
  const rootFolders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  let rootFolder;
  if (rootFolders.hasNext()) {
    rootFolder = rootFolders.next();
  } else {
    rootFolder = DriveApp.createFolder(ROOT_FOLDER_NAME);
  }

  // 2. Define nome da sub-pasta (Ex: 2023-10)
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const monthFolderName = `${year}-${month}`;

  // 3. Procura ou cria a pasta do MÊS dentro da RAIZ
  const monthFolders = rootFolder.getFoldersByName(monthFolderName);
  if (monthFolders.hasNext()) {
    return monthFolders.next();
  } else {
    return rootFolder.createFolder(monthFolderName);
  }
}

// Geração do HTML e conversão para PDF
function createPDF(data, folder, date) {
  // Template HTML simples e limpo
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 40px; max-width: 800px;">
      
      <div style="border-bottom: 3px solid #003CFF; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #003CFF; margin: 0; font-size: 24px;">PESQUISA DE SATISFAÇÃO - CER IV</h1>
        <p style="margin: 5px 0; color: #666;">Data do envio: ${date.toLocaleString('pt-BR')}</p>
      </div>

      <h3 style="background-color: #f5f5f5; padding: 10px; border-left: 5px solid #003CFF;">1. IDENTIFICAÇÃO</h3>
      <div style="margin-left: 15px; margin-bottom: 20px;">
        <p><strong>Nome:</strong> ${data.nome || 'Não informado'}</p>
        <p><strong>CPF:</strong> ${data.cpf || 'Não informado'}</p>
        <p><strong>Preenchido por:</strong> ${data.quemPreenche === 'paciente' ? 'Próprio Paciente' : 'Responsável'}</p>
        <p><strong>Modalidades:</strong> ${data.modalidades ? data.modalidades.join(', ') : 'Nenhuma'}</p>
      </div>

      <h3 style="background-color: #f5f5f5; padding: 10px; border-left: 5px solid #FFC800;">2. AVALIAÇÃO (NOTAS 0-10)</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background-color: #eee;"><th style="text-align: left; padding: 8px;">Item</th><th style="padding: 8px;">Nota</th></tr>
        
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Triagem</td><td style="padding: 8px; font-weight: bold; text-align: center;">${data.avaliacoes['triagem'] || '-'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Consulta Médica</td><td style="padding: 8px; font-weight: bold; text-align: center;">${data.avaliacoes['consulta_medica'] || '-'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Exames / Avaliação</td><td style="padding: 8px; font-weight: bold; text-align: center;">${data.avaliacoes['exames'] || '-'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Equipe Multidisciplinar</td><td style="padding: 8px; font-weight: bold; text-align: center;">${data.avaliacoes['multidisciplinar'] || '-'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Limpeza</td><td style="padding: 8px; font-weight: bold; text-align: center;">${data.avaliacoes['limpeza'] || '-'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Acomodações</td><td style="padding: 8px; font-weight: bold; text-align: center;">${data.avaliacoes['acomodacoes'] || '-'}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Satisfação Geral</td><td style="padding: 8px; font-weight: bold; text-align: center;">${data.avaliacoes['geral'] || '-'}</td></tr>
      </table>

      <h3 style="background-color: #f5f5f5; padding: 10px; border-left: 5px solid #00C800;">3. COMENTÁRIOS</h3>
      <div style="border: 1px solid #ddd; padding: 15px; border-radius: 5px; background-color: #fff; min-height: 60px;">
        ${data.comentario || 'Sem comentários.'}
      </div>

      <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #999;">
        Documento gerado automaticamente pelo Sistema Saúde Sem Limite.<br>
        CER IV - APAE Colinas
      </div>
    </div>
  `;

  // Nome do arquivo: PESQUISA_NOME_CPF_TIMESTAMP.pdf
  const fileName = `PESQUISA_${(data.nome || 'ANONIMO').toUpperCase().replace(/ /g, '_')}_${data.cpf || 'SEM_CPF'}_${date.getTime()}.pdf`;
  
  // Cria o BLOB (objeto binário) HTML e converte para PDF
  const blob = Utilities.newBlob(htmlContent, MimeType.HTML).setName(fileName);
  const pdfFile = folder.createFile(blob.getAs(MimeType.PDF));
  
  return pdfFile;
}
