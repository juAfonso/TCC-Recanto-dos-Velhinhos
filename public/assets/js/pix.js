/* =========================================================
   pix.js — monta o BR Code de um Pix ESTÁTICO (FR-007)
   Padrão EMV QRCPS-MPM definido pelo Banco Central. O texto
   gerado aqui é o "Pix copia e cola"; o QR code é só esse
   mesmo texto desenhado (assets/vendor/qrcode.js).
   Nada aqui fala com banco ou provedor: não é Pix dinâmico,
   e o valor embutido não confirma pagamento nenhum.
   ========================================================= */

const Pix = (() => {

  // Campo EMV: ID (2 dígitos) + tamanho (2 dígitos) + valor
  function campo(id, valor) {
    return id + String(valor.length).padStart(2, '0') + valor;
  }

  // Nome e cidade só aceitam ASCII sem acento, com tamanho máximo
  function limpar(texto, max) {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().trim().slice(0, max);
  }

  // CNPJ/CPF vão só com dígitos; telefone no formato +55DDDNUMERO
  function normalizarChave(chave, tipo) {
    if (tipo === 'cnpj' || tipo === 'cpf') return chave.replace(/\D/g, '');
    if (tipo === 'telefone') {
      const d = chave.replace(/\D/g, '');
      return '+' + (d.startsWith('55') ? d : '55' + d);
    }
    if (tipo === 'email') return chave.trim().toLowerCase();
    return chave.trim();
  }

  // CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido no campo 63
  function crc16(texto) {
    let crc = 0xFFFF;
    for (let i = 0; i < texto.length; i++) {
      crc ^= texto.charCodeAt(i) << 8;
      for (let b = 0; b < 8; b++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  function payload({ chave, tipoChave, nomeRecebedor, cidade, valor }) {
    const corpo =
      campo('00', '01') +
      campo('26', campo('00', 'br.gov.bcb.pix') + campo('01', normalizarChave(chave, tipoChave))) +
      campo('52', '0000') +
      campo('53', '986') +
      (valor ? campo('54', Number(valor).toFixed(2)) : '') +
      campo('58', 'BR') +
      campo('59', limpar(nomeRecebedor, 25)) +
      campo('60', limpar(cidade, 15)) +
      campo('62', campo('05', '***')) +
      '6304';
    return corpo + crc16(corpo);
  }

  // Desenha o QR em SVG dentro do elemento; titulo vira o texto lido pelo leitor de tela
  function renderQR(el, texto, titulo) {
    const qr = qrcode(0, 'M');
    qr.addData(texto);
    qr.make();
    el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true, title: titulo });
  }

  return { payload, renderQR, crc16 };
})();
