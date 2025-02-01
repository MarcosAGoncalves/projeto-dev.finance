const inputElement = document.querySelector('#amount'); // Seleciona o campo de entrada
const tooltip = document.createElement('div'); // Cria a div do tooltip

tooltip.classList.add('tooltip'); // Adiciona a classe de estilo

// Definindo o conteúdo do tooltip
tooltip.textContent = 'Digite o valor da transação. Use ponto (.) para casas decimais e sinal negativo para despesas.';

// Adicionando o tooltip ao body
document.body.appendChild(tooltip);

// Mostra o tooltip quando o mouse passa sobre o campo de entrada
inputElement.addEventListener('mouseenter', (e) => {
  tooltip.style.display = 'block';
  tooltip.style.left = `${e.pageX + 10}px`; // Ajuste da posição horizontal
  tooltip.style.top = `${e.pageY + 10}px`; // Ajuste da posição vertical
  tooltip.style.opacity = '1'; // Torna o tooltip visível
});

// Oculta o tooltip quando o mouse sai do campo
inputElement.addEventListener('mouseleave', () => {
  tooltip.style.opacity = '0'; // Torna o tooltip invisível
  setTimeout(() => tooltip.style.display = 'none', 200); // Oculta após a transição
});

function exportToExcel() {
  // Pega todas as linhas da tabela
  const rows = document.querySelectorAll('#data-table tbody tr');

  // Criação de um array com os dados das transações visíveis (aquelas que não estão com display 'none')
  const data = Array.from(rows)
    .filter(row => row.style.display !== 'none')  // Filtra para pegar apenas as linhas visíveis
    .map(row => {
      const description = row.querySelector('.data-table__description').textContent.trim();
      const amount = row.querySelector('.data-table__price-income, .data-table__price-expense').textContent.trim();
      const date = row.querySelector('.data-table__date').textContent.trim();

      // Formata o valor da transação para a exibição correta
      const formattedAmount = amount;

      return [description, formattedAmount, date];
    });

  // Se não houver transações visíveis, exibe uma mensagem e não realiza a exportação
  if (data.length === 0) {
    alert('Não há transações visíveis para exportar!');
    return;
  }

  // Adiciona o cabeçalho da tabela
  const header = ["Descrição", "Valor", "Data"];
  data.unshift(header); // Adiciona o cabeçalho como a primeira linha

  // Criação do objeto de planilha
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Criação do objeto de trabalho (workbook)
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transações");

  // Geração do arquivo Excel
  XLSX.writeFile(wb, "transacoes.xlsx");
}


function exportToPDF() {
  // Pega todas as linhas da tabela
  const rows = document.querySelectorAll('#data-table tbody tr');

  // Criação de um array com os dados das transações visíveis (aquelas que não estão com display 'none')
  const data = Array.from(rows)
    .filter(row => row.style.display !== 'none')  // Filtra para pegar apenas as linhas visíveis
    .map(row => {
      const description = row.querySelector('.data-table__description').textContent.trim();
      const amount = row.querySelector('.data-table__price-income, .data-table__price-expense').textContent.trim();
      const date = row.querySelector('.data-table__date').textContent.trim();

      // Formata o valor da transação para a exibição correta
      const formattedAmount = amount;

      return [description, formattedAmount, date];
    });

  // Se não houver transações visíveis, exibe uma mensagem e não realiza a exportação
  if (data.length === 0) {
    alert('Não há transações visíveis para exportar!');
    return;
  }

  // Adiciona o cabeçalho da tabela
  const header = ["Descrição", "Valor", "Data"];
  data.unshift(header); // Adiciona o cabeçalho como a primeira linha

  // Criação do PDF
  const { jsPDF } = window.jspdf;  // Referência à biblioteca jsPDF
  const doc = new jsPDF();

  // Define o título
  doc.setFontSize(18);
  doc.text("Transações", 14, 10);

  // Define o estilo da tabela
  doc.setFontSize(12);
  let y = 20;

  // Adiciona o cabeçalho
  doc.text(header[0], 14, y);
  doc.text(header[1], 70, y);
  doc.text(header[2], 130, y);
  y += 10;

  // Adiciona as linhas de transações
  data.slice(1).forEach(row => {  // Começa a partir de 1 para pular o cabeçalho
    doc.text(row[0], 14, y);
    doc.text(row[1], 70, y);
    doc.text(row[2], 130, y);
    y += 10;
  });

  // Gera o arquivo PDF
  doc.save("transacoes.pdf");
}


function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.add('show');
  
  // Após 3 segundos, esconder a notificação
  setTimeout(() => {
      notification.classList.remove('show');
  }, 3000);
}

// Variáveis para o modal de exclusão
const deleteModalOverlay = document.getElementById("delete-modal-overlay");
let transactionIndexToDelete = null; 

function openDeleteModal(index) {
  transactionIndexToDelete = index; // Armazenando o índice da transação a ser excluída
  deleteModalOverlay.classList.add("active"); // Mostrar o modal de exclusão
}

function closeDeleteModal() {
    deleteModalOverlay.classList.remove("active");
}

function confirmDelete() {
  if (transactionIndexToDelete !== null) {
      // Remover a transação
      Transaction.all.splice(transactionIndexToDelete, 1);
      showNotification("Transação deletada com sucesso!");
      App.reload(); // Atualiza a tabela
  }
  closeDeleteModal(); // Fechar o modal após confirmar a exclusão
}

const Storage = {
  get() {
    return JSON.parse(localStorage.getItem('dev.finance:transactions')) || [];
  },
  set(transactions) {
    localStorage.setItem(
      'dev.finance:transactions',
      JSON.stringify(transactions),
    );
  },
};

const AudioFile = {
  audio: new Audio('assets/cash-register.mp3'),

  play() {
    AudioFile.audio.play();
  },
};

const Transaction = {
  all: Storage.get(),
  add(transaction) {
    AudioFile.play();
    if (transaction.edit === 'true') {
      Transaction.all[transaction.transactionEditNumber] = transaction;
      showNotification("Transação editada com sucesso!");  
    } else {
      Transaction.all.push(transaction);
      showNotification("Transação criada com sucesso!");
    }
    
    App.reload();
  },
  edit(index) {
    Modal.setValues(Transaction.all[index], index);
    Modal.open(true); // Passando 'true' para indicar edição
  },

  remove(index) {
    openDeleteModal(index);  // Abre o modal de exclusão e passa o índice da transação
},

  duplicate(index) {
    const transactionToDuplicate = Transaction.all[index];
    const duplicatedTransaction = {
      ...transactionToDuplicate,
      description: `${transactionToDuplicate.description} (Cópia)`, // Adiciona "(Cópia)" à descrição
    };
    
    Transaction.all.push(duplicatedTransaction); // Adiciona a nova transação duplicada
    AudioFile.play();
    showNotification("Transação duplicada com sucesso!");
    App.reload(); // Atualiza a tabela
  },
  incomes() {
    let income = 0;

    Transaction.all.forEach((transaction) => {
      if (transaction.amount > 0) {
        income += transaction.amount;
      }
    });
    return income;
  },
  expenses() {
    let expense = 0;

    Transaction.all.forEach((transaction) => {
      if (transaction.amount < 0) {
        expense += transaction.amount;
      }
    });

    return expense;
  },
  total() {
    let total = 0;

    let income = Transaction.incomes();
    let expense = Transaction.expenses();

    return (total = income + expense);
  },
};

const Modal = {
  modalOverlay: document.querySelector('.modal-overlay'),
  open(isEdit = false) { 
    Modal.modalOverlay.classList.add('active');
    
    // Alterar o título conforme a ação
    const title = document.querySelector('#form h2');
    if (isEdit) {
      title.textContent = 'Editar Transação';  // Quando estiver editando
    } else {
      title.textContent = 'Nova Transação';   // Quando estiver criando nova
    }
  },


  close() {
    Modal.modalOverlay.classList.remove('active');
    Form.clearFields();
    // Garantir que a borda volte ao normal quando o modal for fechado
    Form.resetInputBorders();
  },

  setValues(transaction, index) {
    document.querySelector('.modal-overlay #description').value = transaction.description;
    document.querySelector('.modal-overlay #amount').value = Utils.formatAmountToModal(transaction.amount);
    document.querySelector('.modal-overlay #date').value = Utils.formatDateToModal(transaction.date);
    document.querySelector('.modal-overlay #edit').value = 'true';
    document.querySelector('.modal-overlay #edit').dataset.index = index;
  },
};

const DOM = {
  transactionsContainer: document.querySelector('#data-table tbody'),

  addTransaction(transaction, index) {
    const tr = document.createElement('tr');
    tr.innerHTML = DOM.innerHTMLTransaction(transaction, index);
    tr.dataset.index = index;
    this.transactionsContainer.appendChild(tr);
  },
  clearTransaction() {
    DOM.transactionsContainer.innerHTML = '';
  },
  innerHTMLTransaction(transaction, index) {
    const CSSclass = transaction.amount > 0 ? 'income' : 'expense';
    const amount = Utils.formatCurrency(transaction.amount);

    const html = `
      <td class="data-table__description">${transaction.description}</td>
      <td class="data-table__price-${CSSclass}">${amount}</td>
      <td class="data-table__date">${transaction.date}</td>
      <td>
        <img class="data-table-edit" onClick="Transaction.edit(${index})" src="assets/edit.png" alt="Editar transação" title="Editar transação">
        <img class="data-table-edit" onClick="Transaction.duplicate(${index})" src="assets/duplicate.png" alt="Duplicar transação" title="Duplicar transação">
        <img class="data-table-edit" onClick="Transaction.remove(${index})" src="assets/remove.png" alt="Remover transação" title="Excluir transação">
      </td>
    `;
    return html;
  },
  updateBalance(visibleTransactions) {
    let income = 0;
    let expense = 0;
    
    // Calculando a entrada e a saída com base nas transações visíveis
    visibleTransactions.forEach(row => {
      const transaction = Transaction.all[row.dataset.index]; // Obtem a transação associada à linha
      if (transaction.amount > 0) {
        income += transaction.amount;
      } else {
        expense += transaction.amount;
      }
    });
    
    document.querySelector('.card__income').innerHTML = Utils.formatCurrency(income);
    document.querySelector('.card__expense').innerHTML = Utils.formatCurrency(expense);
    document.querySelector('.card__amount').innerHTML = Utils.formatCurrency(income + expense);
  },
};

const Utils = {
  formatAmout(value) {
    value = Number(value) * 100;
    return Math.round(value);
  },
  formatAmountToModal(value) {
    value = value / 100;

    return value.toFixed(2);
  },
  formatCurrency(value) {
    const signal = +value < 0 ? '-' : '';

    // encontre tudo que não é numero
    value = String(value).replace(/\D/gi, '');

    value = Number(value) / 100;

    value = value.toLocaleString('pt-br', {
      style: 'currency',
      currency: 'BRL',
    });

    return signal + value;
  },
  formatDate(date) {
    const splitedDate = date.split('-');

    return `${splitedDate[2]}/${splitedDate[1]}/${splitedDate[0]}`;
  },
  formatDateToModal(date) {
    const splitedDate = date.split('/');

    return `${splitedDate[2]}-${splitedDate[1]}-${splitedDate[0]}`;
  },
};

const Form = {
  description: document.querySelector('input#description'),
  amount: document.querySelector('input#amount'),
  date: document.querySelector('input#date'),
  edit: document.querySelector('input#edit'),

  getValues() {
    return {
      description: Form.description.value,
      amount: Form.amount.value,
      date: Form.date.value,
      edit: Form.edit.value,
      transactionEditNumber: Form.edit.dataset.index,
    };
  },
  formatValues() {
    let {
      description,
      amount,
      date,
      edit,
      transactionEditNumber,
    } = Form.getValues();

    amount = Utils.formatAmout(amount);

    date = Utils.formatDate(date);

    return { description, amount, date, edit, transactionEditNumber };
  },

  validateFields() {
    let { description, amount, date } = Form.getValues();

    if (
      description.trim() === '' ||
      amount.trim() === '' ||
      date.trim() === ''
    ) {
      // Marca os campos vazios como inválidos
      if (description.trim() === '') {
        Form.description.classList.add('invalid');
      }
      if (amount.trim() === '') {
        Form.amount.classList.add('invalid');
      }
      if (date.trim() === '') {
        Form.date.classList.add('invalid');
      }

      throw new Error('Por favor preencha todos os campos');
    }
  },
  
  clearFields() {
    Form.description.value = '';
    Form.amount.value = '';
    Form.date.value = '';
    Form.edit.dataset.index = '';
    Form.edit.value = 'false';
  },
  resetInputBorders() {
    // Reseta as bordas para a cor normal
    Form.description.classList.remove('invalid');
    Form.amount.classList.remove('invalid');
    Form.date.classList.remove('invalid');
  },
  submit(event) {
    event.preventDefault();

    try {
      Form.validateFields();
      const transaction = Form.formatValues();
      Transaction.add(transaction);
      Form.clearFields();

      Modal.close();
    } catch (err) {
      alert(err.message);
    }
  },
};

const App = {
  init() {
    Transaction.all.forEach((transaction, index) => {
      DOM.addTransaction(transaction, index);
    });

    // Calcula os valores iniciais sem o filtro
    DOM.updateBalance([...document.querySelectorAll('#data-table tbody tr')]); // Passa todas as transações para o cálculo
    Storage.set(Transaction.all);
  },
  reload() {
    DOM.clearTransaction();
    App.init();
  },
};

// Função para remover a borda vermelha assim que o usuário digitar no campo
Form.description.addEventListener('input', () => {
  if (Form.description.value.trim() !== '') {
    Form.description.classList.remove('invalid');
  }
});

Form.amount.addEventListener('input', () => {
  if (Form.amount.value.trim() !== '') {
    Form.amount.classList.remove('invalid');
  }
});

Form.date.addEventListener('input', () => {
  if (Form.date.value.trim() !== '') {
    Form.date.classList.remove('invalid');
  }
});

App.init();

document.getElementById('amount').addEventListener('keydown', function(event) {
  // Verifica se a tecla pressionada é a 'e'
  if (event.key === 'e' || event.key === 'E') {
      event.preventDefault();  // Impede a tecla 'e' de ser registrada
  }
});

function filterTransactions() {
  const filterValue = document.getElementById('filter-description').value.trim().toLowerCase();
  const rows = document.querySelectorAll('#data-table tbody tr');
  
  let visibleTransactions = [];

  rows.forEach(row => {
    const description = row.querySelector('td:first-child').textContent.trim().toLowerCase();
    
    // Se o filtro estiver vazio, exibe todas as transações
    if (filterValue === '' || description.startsWith(filterValue)) {
      row.style.display = ''; // Exibe a linha
      visibleTransactions.push(row); // Adiciona a linha à lista de transações visíveis
    } else {
      row.style.display = 'none'; // Oculta a linha
    }
  });

  // Atualiza o saldo com as transações visíveis
  DOM.updateBalance(visibleTransactions);
}

// Função para ordenar os dados da tabela
function sortTable(column, order) {
  const rows = Array.from(document.querySelectorAll('#data-table tbody tr'));
  
  // Função para pegar o valor da célula
  const getCellValue = (row, column) => {
      const cell = row.querySelector(`td:nth-child(${column})`);
      return cell ? cell.textContent.trim() : '';
  };

  // Função de comparação para ordenar
  const compare = (a, b) => {
      const aValue = getCellValue(a, column).toLowerCase();
      const bValue = getCellValue(b, column).toLowerCase();

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
  };

  // Ordena as linhas com base na comparação
  rows.sort(compare);

  // Coloca as linhas ordenadas de volta no corpo da tabela
  rows.forEach(row => document.querySelector('#data-table tbody').appendChild(row));
}

// Adiciona eventos de clique nos títulos das colunas para ordenar
document.querySelectorAll('.sortable').forEach(th => {
  th.addEventListener('click', () => {
      const column = th.dataset.column;
      const currentOrder = th.dataset.order || 'asc';  // Se não tiver ordem, assume 'asc'

      // Alterna a ordem de 'asc' para 'desc' e vice-versa
      const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
      th.dataset.order = newOrder;

      // Realiza a ordenação
      if (column === 'description') {
          sortTable(1, newOrder);  // Coluna 1 é 'Descrição'
      } else if (column === 'amount') {
          sortTable(2, newOrder);  // Coluna 2 é 'Valor'
      } else if (column === 'date') {
          sortTable(3, newOrder);  // Coluna 3 é 'Data'
      }
  });
});

