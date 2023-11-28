import React, { useState, useEffect } from 'react';
import './App.css';

// Define the structure of a transaction
interface Transaction {
  id: number;
  nome: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  tipoPagamento: 'dinheiro' | 'cartao' | 'pix';
}

// Function to calculate the total value of transactions based on type (receita or despesa)
const calculateTotal = (transactions: Transaction[], type: 'receita' | 'despesa') => {
  return transactions
    .filter((transaction) => transaction.tipo === type)
    .reduce((total, transaction) => total + transaction.valor, 0);
};

// React functional component for the main application
const App: React.FC = () => {
  // State variables
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('despesa');
  const [tipoPagamento, setTipoPagamento] = useState<'dinheiro' | 'cartao' | 'pix'>('dinheiro');
  const [receitas, setReceitas] = useState<Transaction[]>([]);
  const [despesas, setDespesas] = useState<Transaction[]>([]);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const [showDetailsId, setShowDetailsId] = useState<number | null>(null);

  // Load transactions from local storage on component mount
  useEffect(() => {
    const localStorageReceitas = JSON.parse(localStorage.getItem('receitas') || '[]');
    const localStorageDespesas = JSON.parse(localStorage.getItem('despesas') || '[]');

    setReceitas(localStorageReceitas);
    setDespesas(localStorageDespesas);
  }, []);

  // Save transactions to local storage with a delay to avoid frequent updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('receitas', JSON.stringify(receitas));
      localStorage.setItem('despesas', JSON.stringify(despesas));
    }, 500); // Delay of 500 milliseconds

    return () => clearTimeout(timeoutId); // Clear the timeout if the component is unmounted before execution
  }, [receitas, despesas]);

  // Event handlers for form input changes
  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNome(e.target.value);
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValor(e.target.value);
  };

  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTipo(e.target.value as 'receita' | 'despesa');
  };

  const handleTipoPagamentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTipoPagamento(e.target.value as 'dinheiro' | 'cartao' | 'pix');
  };

  // Add a new transaction based on user input
  const handleAddTransaction = () => {
    if (!nome || !valor) {
      alert('Please fill in all fields.');
      return;
    }

    const newTransaction: Transaction = {
      id: receitas.length + despesas.length + 1,
      nome,
      valor: parseFloat(valor),
      tipo,
      tipoPagamento,
    };

    if (tipo === 'receita') {
      setReceitas([...receitas, newTransaction]);
    } else {
      setDespesas([...despesas, newTransaction]);
    }

    setNome('');
    setValor('');
  };

  // Edit an existing transaction
  const handleEditTransaction = (id: number, type: 'receita' | 'despesa') => {
    const transactionsToUpdate = type === 'receita' ? receitas : despesas;
    const transactionToEdit = transactionsToUpdate.find((transaction) => transaction.id === id);

    if (transactionToEdit) {
      setNome(transactionToEdit.nome);
      setValor(transactionToEdit.valor.toString());
      setTipo(transactionToEdit.tipo);
      setTipoPagamento(transactionToEdit.tipoPagamento);
      setEditingTransactionId(id);
    }
  };

  // Delete an existing transaction
  const handleDeleteTransaction = (id: number, type: 'receita' | 'despesa') => {
    const transactionsToUpdate = type === 'receita' ? receitas : despesas;
    const updatedTransactions = transactionsToUpdate.filter((transaction) => transaction.id !== id);

    if (type === 'receita') {
      setReceitas(updatedTransactions);
    } else {
      setDespesas(updatedTransactions);
    }

    setShowDetailsId(null);
  };

  // Cancel the edit mode
  const handleCancelEdit = () => {
    setNome('');
    setValor('');
    setTipoPagamento('dinheiro');
    setEditingTransactionId(null);
  };

  // Save the edited transaction
  const handleSaveEdit = (type: 'receita' | 'despesa') => {
    if (editingTransactionId !== null) {
      const transactionsToUpdate = type === 'receita' ? receitas : despesas;
      const updatedTransactions = transactionsToUpdate.map((transaction) =>
        transaction.id === editingTransactionId
          ? {
              ...transaction,
              nome,
              valor: parseFloat(valor),
              tipo,
              tipoPagamento,
            }
          : transaction
      );

      if (type === 'receita') {
        setReceitas(updatedTransactions);
      } else {
        setDespesas(updatedTransactions);
      }

      handleCancelEdit();
    }
  };

  // Show or hide details of a transaction
  const handleShowDetails = (id: number, type: 'receita' | 'despesa') => {
    const transactionsToShowDetails = type === 'receita' ? receitas : despesas;
    setShowDetailsId(showDetailsId === id ? null : id);
  };

  // Render a row for a transaction in the table
  const renderTransactionRow = (transaction: Transaction, type: 'receita' | 'despesa') => {
    return (
      <React.Fragment key={transaction.id}>
        <tr>
          <td>{transaction.nome}</td>
          <td>
            <button className="action-button" onClick={() => handleShowDetails(transaction.id, type)}>
              {showDetailsId === transaction.id ? 'Hide Details' : 'Show Details'}
            </button>
            {showDetailsId === transaction.id && (
              <>
                <button className="action-button" onClick={() => handleEditTransaction(transaction.id, type)}>
                  Edit
                </button>
                <button className="action-button" onClick={() => handleDeleteTransaction(transaction.id, type)}>
                  Delete
                </button>
              </>
            )}
          </td>
        </tr>
        {showDetailsId === transaction.id && (
          <tr>
            <td colSpan={2}>
              <div>
                <p><strong>Details:</strong></p>
                <p><strong>Name:</strong> {transaction.nome}</p>
                <p><strong>Value:</strong> ${transaction.valor.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <p><strong>Type:</strong> {transaction.tipo}</p>
                <p><strong>Payment Type:</strong> {transaction.tipoPagamento}</p>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  // Calculate total receitas, total despesas, and saldo
  const totalReceitas = calculateTotal(receitas, 'receita');
  const totalDespesas = calculateTotal(despesas, 'despesa');
  const saldo = totalReceitas - totalDespesas;

  // Render the main application
  return (
    <div className="App">
      <h1>Expense and Revenue Tracker</h1>
      <div className="container">
        <div className="form-container">
          <h2>{editingTransactionId !== null ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <form>
            <label>
              Name:
              <input type="text" value={nome} onChange={handleNomeChange} />
            </label>
            <label>
              Value:
              <input type="number" value={valor} onChange={handleValorChange} />
            </label>
            <label>
              Type:
              <select value={tipo} onChange={handleTipoChange}>
                <option value="despesa">Expense</option>
                <option value="receita">Revenue</option>
              </select>
            </label>
            <label>
              Payment Type:
              <select value={tipoPagamento} onChange={handleTipoPagamentoChange}>
                <option value="dinheiro">Cash</option>
                <option value="cartao">Card</option>
                <option value="pix">PIX</option>
              </select>
            </label>
            {editingTransactionId !== null ? (
              <>
                <div className="button-container">
                  <button className="action-button" type="button" onClick={() => handleSaveEdit(tipo)}>
                    Save Edit
                  </button>
                  <button className="action-button" type="button" onClick={handleCancelEdit}>
                    Cancel Edit
                  </button>
                </div>
              </>
            ) : (
              <button className="action-button" type="button" onClick={handleAddTransaction}>
                Add Transaction
              </button>
            )}
          </form>
        </div>
        <div className="table-container">
          <h2>Revenue</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Actions</th>
              </tr>
              <tr>
                <td colSpan={2}>
                  <p>Total Revenue: ${totalReceitas.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </td>
              </tr>
            </thead>
            <tbody>
              {receitas.map((transaction) => renderTransactionRow(transaction, 'receita'))}
            </tbody>
          </table>
        </div>
        <div className="table-container">
          <h2>Expenses</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Actions</th>
              </tr>
              <tr>
                <td colSpan={2}>
                  <p>Total Expenses: ${totalDespesas.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </td>
              </tr>
            </thead>
            <tbody>
              {despesas.map((transaction) => renderTransactionRow(transaction, 'despesa'))}
            </tbody>
          </table>
        </div>
        <div className="table-container">
          <h2>Balance</h2>
          <p>Balance: ${saldo.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
    </div>
  );
};

export default App;
