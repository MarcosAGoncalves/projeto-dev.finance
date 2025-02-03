// Primeiro arquivo (Animação dos paths e tooltip no campo de input)
document.querySelector('.test').classList.add('animate');
// Função para determinar o comprimento de cada path
document.querySelectorAll('.test.animate path').forEach(function (element) {
  let comprimento = Math.round(element.getTotalLength());
  element.setAttribute('stroke-dasharray', comprimento);
  element.setAttribute('stroke-dashoffset', comprimento);
});

// Tooltip no campo de input
const inputElement = document.querySelector('#amount');
const tooltip = document.createElement('div');
tooltip.classList.add('tooltip');
tooltip.textContent = 'Use sinal negativo para despesas.';
document.body.appendChild(tooltip);

inputElement.addEventListener('mouseenter', (e) => {
  tooltip.style.display = 'block';
  tooltip.style.left = `${e.pageX + 10}px`;
  tooltip.style.top = `${e.pageY + 10}px`;
  tooltip.style.opacity = '1';
});

inputElement.addEventListener('mouseleave', () => {
  tooltip.style.opacity = '0';
  setTimeout(() => tooltip.style.display = 'none', 200);
});

// Função de exportação para Excel e PDF
function exportToExcel() {
  const rows = document.querySelectorAll('#data-table tbody tr');
  const data = Array.from(rows)
    .filter(row => row.style.display !== 'none')
    .map(row => {
      const description = row.querySelector('.data-table__description').textContent.trim();
      const amount = row.querySelector('.data-table__price-income, .data-table__price-expense').textContent.trim();
      const date = row.querySelector('.data-table__date').textContent.trim();
      return [description, amount, date];
    });

  if (data.length === 0) {
    alert('Não há transações visíveis para exportar!');
    return;
  }

  const header = ["Descrição", "Valor", "Data"];
  data.unshift(header);

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transações");

  // Obtém a data e hora atual do Brasil
  const currentDate = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  
  // Formata a data e hora
  const [datePart, timePart] = currentDate.split(' ');
  const [day, month, year] = datePart.split('/');
  const [hour, minute, second] = timePart.split(':');

  const formattedDate = `${day}-${month}-${year}_${hour.padStart(2, '0')}-${minute.padStart(2, '0')}-${second.padStart(2, '0')}`;

  // Define o nome do arquivo com a data e hora
  const fileName = `transacoes_${formattedDate}.xlsx`;

  // Exporta o arquivo com o nome atualizado
  XLSX.writeFile(wb, fileName);
}


function exportToPDF() {
  const rows = document.querySelectorAll('#data-table tbody tr');
  const data = Array.from(rows)
    .filter(row => row.style.display !== 'none')
    .map(row => {
      const description = row.querySelector('.data-table__description').textContent.trim();
      const amount = row.querySelector('.data-table__price-income, .data-table__price-expense').textContent.trim();
      const date = row.querySelector('.data-table__date').textContent.trim();
      return [description, amount, date];
    });

  if (data.length === 0) {
    alert('Não há transações visíveis para exportar!');
    return;
  }

  const header = ["Descrição", "Valor", "Data"];
  data.unshift(header);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Transações", 14, 10);
  doc.setFontSize(12);
  let y = 20;

  doc.text(header[0], 14, y);
  doc.text(header[1], 70, y);
  doc.text(header[2], 130, y);
  y += 10;

  data.slice(1).forEach(row => {
    doc.text(row[0], 14, y);
    doc.text(row[1], 70, y);
    doc.text(row[2], 130, y);
    y += 10;
  });

  // Obtém a data e hora atual do Brasil
  const currentDate = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  // Formata a data e hora
  const [datePart, timePart] = currentDate.split(' ');
  const [day, month, year] = datePart.split('/');
  const [hour, minute, second] = timePart.split(':');

  const formattedDate = `${day}-${month}-${year}_${hour.padStart(2, '0')}-${minute.padStart(2, '0')}-${second.padStart(2, '0')}`;

  // Define o nome do arquivo com a data e hora
  const fileName = `transacoes_${formattedDate}.pdf`;

  // Salva o PDF com o nome atualizado
  doc.save(fileName);
}

// Notificação de ações
function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.add('show');
  
  setTimeout(() => {
      notification.classList.remove('show');
  }, 3000);
}

// Funções de modal de exclusão
const deleteModalOverlay = document.getElementById("delete-modal-overlay");
let transactionIndexToDelete = null;

function openDeleteModal(index) {
  transactionIndexToDelete = index;
  deleteModalOverlay.classList.add("active");
}

function closeDeleteModal() {
  deleteModalOverlay.classList.remove("active");
}

function confirmDelete() {
  if (transactionIndexToDelete !== null) {
      Transaction.all.splice(transactionIndexToDelete, 1);
      showNotification("Transação deletada com sucesso!");
      App.reload();
  }
  closeDeleteModal();
}

// Armazenamento local
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

// Reprodutor de áudio para transações
const AudioFile = {
  audio: new Audio('assets/cash-register.mp3'),
  play() {
    AudioFile.audio.play();
  },
};

// Transações
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
    Modal.open(true);
  },

  remove(index) {
    openDeleteModal(index);
  },

  duplicate(index) {
    const transactionToDuplicate = Transaction.all[index];
    const duplicatedTransaction = {
      ...transactionToDuplicate,
      description: `${transactionToDuplicate.description} (Cópia)`,
    };
    
    Transaction.all.push(duplicatedTransaction);
    AudioFile.play();
    showNotification("Transação duplicada com sucesso!");
    App.reload();
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

// Modal de Transações
const Modal = {
  modalOverlay: document.querySelector('.modal-overlay'),
  
  open(isEdit = false) { 
    Modal.modalOverlay.classList.add('active');
    
    const title = document.querySelector('#form h2');
    if (isEdit) {
      title.textContent = 'Editar Transação';
    } else {
      title.textContent = 'Nova Transação';
    }
  },

  close() {
    Modal.modalOverlay.classList.remove('active');
    Form.clearFields();
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

// DOM manipulação
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
    
    visibleTransactions.forEach(row => {
      const transaction = Transaction.all[row.dataset.index];
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

// Utility functions
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

// Formulário
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

// Aplicação
const App = {
  init() {
    Transaction.all.forEach((transaction, index) => {
      DOM.addTransaction(transaction, index);
    });
    DOM.updateBalance([...document.querySelectorAll('#data-table tbody tr')]);
    Storage.set(Transaction.all);
  },
  reload() {
    DOM.clearTransaction();
    App.init();
  },
};

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

// Prevenção de input 'e' ou 'E' no campo de valor
document.getElementById('amount').addEventListener('keydown', function(event) {
  if (event.key === 'e' || event.key === 'E') {
      event.preventDefault();
  }
});

// Filtro de transações
function filterTransactions() {
  const filterValue = document.getElementById('filter-description').value.trim().toLowerCase();
  const rows = document.querySelectorAll('#data-table tbody tr');
  
  let visibleTransactions = [];

  rows.forEach(row => {
    const description = row.querySelector('td:first-child').textContent.trim().toLowerCase();
    
    if (filterValue === '' || description.startsWith(filterValue)) {
      row.style.display = '';
      visibleTransactions.push(row);
    } else {
      row.style.display = 'none';
    }
  });

  DOM.updateBalance(visibleTransactions);
}

// Ordenação da tabela
function sortTable(column, order) {
  const rows = Array.from(document.querySelectorAll('#data-table tbody tr'));
  
  const getCellValue = (row, column) => {
      const cell = row.querySelector(`td:nth-child(${column})`);
      return cell ? cell.textContent.trim() : '';
  };

  const compare = (a, b) => {
      const aValue = getCellValue(a, column).toLowerCase();
      const bValue = getCellValue(b, column).toLowerCase();

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
  };

  rows.sort(compare);

  rows.forEach(row => document.querySelector('#data-table tbody').appendChild(row));
}

document.querySelectorAll('.sortable').forEach(th => {
  th.addEventListener('click', () => {
      const column = th.dataset.column;
      const currentOrder = th.dataset.order || 'asc';

      const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
      th.dataset.order = newOrder;

      if (column === 'description') {
          sortTable(1, newOrder);
      } else if (column === 'amount') {
          sortTable(2, newOrder);
      } else if (column === 'date') {
          sortTable(3, newOrder);
      }
  });
});

// Código do tema escuro
const StorageX = {
  get() {
    return localStorage.getItem('dev.finance:theme') || '';
  },
  set(value) {
    localStorage.setItem('dev.finance:theme', value);
  },
};

const ThemeSwitch = {
  page: document.querySelector('html'),
  widget: document.querySelector('.theme-switch-label'),
  input: document.querySelector('#theme-switch'),
  circle: document.querySelector('.theme-switch-circle'),
  isThemeActive: localStorage.getItem('dev.finance:theme') || '',

  init() {
    if (ThemeSwitch.isThemeActive !== '') {
      ThemeSwitch.page.classList.toggle('night-mode');
    }
  },
  update() {
    ThemeSwitch.page.classList.toggle('night-mode');

    ThemeSwitch.page.classList.contains('night-mode')
      ? (ThemeSwitch.input.value = 'night-mode')
      : (ThemeSwitch.input.value = '');

    let x = ThemeSwitch.input.value;
    ThemeSwitch.save(x);
  },
  save(value) {
    localStorage.setItem('dev.finance:theme', value);
  },
};

const ThemeCheck = {};

ThemeSwitch.init();
ThemeSwitch.widget.addEventListener('click', ThemeSwitch.update);
