// Salvar histórico de PDFs
function salvarHistoricoPdf(dadosPdf) {
    const historico = JSON.parse(localStorage.getItem('bneural_historico_pdfs')) || [];
    const novoPdf = {
        id: Date.now(),
        ...dadosPdf,
        dataGeracao: new Date().toISOString()
    };
    
    historico.push(novoPdf);
    localStorage.setItem('bneural_historico_pdfs', JSON.stringify(historico));
    
    // Atualizar a lista se estiver na tela
    if (document.getElementById('historico-pdfs').classList.contains('active')) {
        carregarHistoricoPdfs();
    }
}

// Carregar histórico de PDFs
function carregarHistoricoPdfs() {
    const historico = JSON.parse(localStorage.getItem('bneural_historico_pdfs')) || [];
    const lista = document.getElementById('listaHistoricoPdfs');
    
    if (!lista) return;
    
    lista.innerHTML = '';
    
    if (historico.length === 0) {
        lista.innerHTML = '<p>Nenhum PDF gerado ainda.</p>';
        return;
    }
    
    historico.sort((a, b) => new Date(b.dataGeracao) - new Date(a.dataGeracao)).forEach(pdf => {
        const div = document.createElement('div');
        div.className = 'item-pdf';
        div.innerHTML = `
            <div class="pdf-info">
                <strong>${pdf.cliente}</strong>
                <small>Empresa: ${pdf.empresa}</small>
                <small>Data: ${new Date(pdf.dataGeracao).toLocaleDateString('pt-BR')}</small>
                <small>Total: R$ ${formatarMoeda(pdf.total)}</small>
                <small>Vendedor: ${pdf.nomeVendedor || 'NÃO INFORMADO'}</small>
                <small>Garantia: ${pdf.garantiaMeses === 'NÃO INFORMADO' ? 'NÃO INFORMADO' : `${pdf.garantiaMeses} MESES`}</small>
            </div>
            <div class="pdf-actions">
                <button onclick="regerarPDF(${pdf.id})" class="btn-info" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">✏️ Editar e Regerar</button>
                <button onclick="removerPdfHistorico(${pdf.id})" class="btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">🗑️ Remover</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

// Remover PDF do histórico
function removerPdfHistorico(id) {
    if (confirm('Deseja remover este PDF do histórico?')) {
        const historico = JSON.parse(localStorage.getItem('bneural_historico_pdfs')) || [];
        const novoHistorico = historico.filter(pdf => pdf.id !== id);
        localStorage.setItem('bneural_historico_pdfs', JSON.stringify(novoHistorico));
        carregarHistoricoPdfs();
    }
}

// Enviar WhatsApp
function enviarWhatsApp() {
    const form = document.getElementById('formOrcamento');
    const dados = Object.fromEntries(new FormData(form));
    const config = JSON.parse(localStorage.getItem('bneural_config')) || {};
    
    if (!dados.cliente || !dados.telefone) {
        alert('Por favor, preencha o nome do cliente e telefone.');
        return;
    }
    
    const total = document.getElementById('totalOrcamento').textContent;
    
    let texto = `Olá! Segue o orçamento solicitado:%0A%0A`;
    texto += `Cliente: ${dados.cliente}%0A`;
    texto += `Empresa: ${dados.empresa || 'N/A'}%0A`;
    texto += `Total: R$ ${total}%0A%0A`;
    
    // Adicionar descrições dos itens
    const itens = document.querySelectorAll('.item-orcamento');
    texto += `Descrição dos serviços:%0A`;
    itens.forEach((item, index) => {
        const descricao = item.querySelector(`input[name*="descricao"]`).value;
        const largura = parseFloat(item.querySelector(`input[name*="largura"]`).value) || 0;
        const altura = parseFloat(item.querySelector(`input[name*="altura"]`).value) || 0;
        
        texto += `${index + 1}. ${descricao}`;
        if (largura > 0 && altura > 0) {
            texto += ` (${largura}m x ${altura}m)`;
        }
        texto += `%0A`;
    });
    
    texto += `%0AQualquer dúvida, estou à disposição!%0A%0A`;
    texto += `ORÇAMENTO VÁLIDO POR 10 DIAS%0A%0A`;
    texto += `${config.nome_fantasia || 'BNeural'}%0A`;
    texto += `CNPJ: ${config.cnpj || 'N/A'}%0A`;
    if (config.endereco) {
        texto += `Endereço: ${config.endereco}%0A`;
    }
    texto += `Sistema de gestão empresarial`;
    
    const telefone = dados.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${telefone}?text=${texto}`, '_blank');
}

// Lançar no caixa
function lancarCaixa() {
    const form = document.getElementById('formOrcamento');
    const dados = Object.fromEntries(new FormData(form));
    const total = parseFloat(document.getElementById('totalOrcamento').textContent.replace(/[^\d,]/g, '').replace(',', '.'));
    
    if (!dados.cliente || total === 0) {
        alert('Por favor, preencha os dados do orçamento.');
        return;
    }
    
    const valorEntrada = parseFloat(prompt("Valor de entrada recebido agora (R$):")) || 0;
    const restante = total - valorEntrada;
    let vencimento = '';
    
    if (restante > 0) {
        vencimento = prompt("Data de vencimento do restante (AAAA-MM-DD):") || "";
    }
    
    const transacao = {
        id: Date.now(),
        tipo: "venda",
        descricao: `Venda - ${dados.cliente}`,
        entrada: valorEntrada,
        restante,
        vencimento,
        data: new Date().toISOString().slice(0, 10),
        cliente: dados.cliente,
        empresa: dados.empresa || '',
        telefone: dados.telefone
    };
    
    const historico = JSON.parse(localStorage.getItem('bneural_caixa')) || [];
    historico.push(transacao);
    localStorage.setItem('bneural_caixa', JSON.stringify(historico));
    
    alert("Venda lançada no caixa com sucesso!");
    calcularSaldo();
    atualizarDashboard();
    carregarHistoricoCaixa();
    
    // Limpar formulário
    document.getElementById('formOrcamento').reset();
    document.getElementById('totalOrcamento').textContent = '0,00';
}