// Ledger Service - Handles automatic ledger entries for expenses and transactions

export const createLedgerEntry = (entry) => {
  const ledgers = JSON.parse(localStorage.getItem('ledgerEntries') || '[]');
  
  const newEntry = {
    id: Date.now() + Math.random(),
    ...entry,
    createdAt: new Date().toISOString()
  };
  
  ledgers.push(newEntry);
  localStorage.setItem('ledgerEntries', JSON.stringify(ledgers));
  
  // Update account balance
  updateAccountBalance(entry.accountId, entry.type, entry.amount);
  
  return newEntry;
};

export const updateAccountBalance = (accountId, type, amount) => {
  const accounts = JSON.parse(localStorage.getItem('accountMaster') || '[]');
  const account = accounts.find(a => a.id.toString() === accountId.toString());
  
  if (!account) return;
  
  const currentBalance = parseFloat(account.currentBalance || account.openingBalance || 0);
  let newBalance = currentBalance;
  
  // Determine if this increases or decreases balance based on account type and entry type
  const isAsset = account.category === 'Assets' || account.group === 'Current Assets' || account.group === 'Fixed Assets';
  const isLiability = account.category === 'Liabilities' || account.group === 'Current Liabilities';
  const isExpense = account.category === 'Expenses';
  const isIncome = account.category === 'Income';
  
  if (type === 'Debit') {
    if (isAsset || isExpense) {
      newBalance = currentBalance + parseFloat(amount);
    } else if (isLiability || isIncome) {
      newBalance = currentBalance - parseFloat(amount);
    }
  } else if (type === 'Credit') {
    if (isAsset || isExpense) {
      newBalance = currentBalance - parseFloat(amount);
    } else if (isLiability || isIncome) {
      newBalance = currentBalance + parseFloat(amount);
    }
  }
  
  account.currentBalance = newBalance;
  account.lastUpdated = new Date().toISOString();
  
  const updatedAccounts = accounts.map(a => 
    a.id.toString() === accountId.toString() ? account : a
  );
  
  localStorage.setItem('accountMaster', JSON.stringify(updatedAccounts));
};

// Create branch expense ledger entry
export const createBranchExpenseLedger = (expense) => {
  const accounts = JSON.parse(localStorage.getItem('accountMaster') || '[]');
  const branchAccounts = JSON.parse(localStorage.getItem('branchAccounts') || '[]');
  const branches = JSON.parse(localStorage.getItem('branches') || '[]');
  
  const branch = branches.find(b => b.id.toString() === expense.branch.toString());
  if (!branch) return;
  
  // Find the branch account used for payment
  const branchAccountData = branchAccounts.find(a => 
    a.id.toString() === expense.account.toString() &&
    a.status === 'Active'
  );
  
  if (!branchAccountData) {
    console.error('Branch account not found for expense');
    return;
  }
  
  // Find corresponding account in Account Master
  let branchAccount = accounts.find(a => 
    a.linkedAccountId === branchAccountData.id ||
    (a.linkedEntityType === (branchAccountData.branch === 'HO' ? 'Head Office' : 'Branch') &&
     a.linkedEntity === branchAccountData.branch.toString() &&
     a.accountCode.includes(branchAccountData.accountNumber.slice(-4)))
  );
  
  if (!branchAccount && branchAccountData.accountMasterId) {
    branchAccount = accounts.find(a => a.id.toString() === branchAccountData.accountMasterId.toString());
  }
  
  if (!branchAccount) {
    console.error('Account master entry not found for branch account');
    return;
  }
  
  // Find expense account - use expenseHead from Expense Master if available
  let expenseAccount = null;
  
  if (expense.expenseHead) {
    // Use expense head from Expense Master
    expenseAccount = accounts.find(a => 
      a.id.toString() === expense.expenseHead.toString()
    );
  }
  
  if (!expenseAccount && expense.expenseType) {
    // Try to find matching expense account by type
    expenseAccount = accounts.find(a => 
      a.accountName.toLowerCase().includes(expense.expenseType.toLowerCase()) ||
      a.subGroup === expense.expenseType
    );
  }
  
  if (!expenseAccount) {
    // Create a generic expense account if not found
    expenseAccount = {
      id: Date.now() + 1,
      accountName: expense.expenseType || 'Other Expenses',
      accountCode: `EXP-${expense.expenseType?.replace(/\s+/g, '-').toUpperCase() || 'OTHER'}`,
      category: 'Expenses',
      group: expense.expenseCategory === 'Operating' ? 'Operating Expenses' : 
             expense.expenseCategory === 'Administrative' ? 'Administrative Expenses' :
             expense.expenseCategory === 'Financial' ? 'Financial Expenses' : 'Other Expenses',
      subGroup: expense.expenseType || 'Miscellaneous',
      openingBalance: '0',
      currentBalance: '0',
      balanceType: 'Debit',
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    accounts.push(expenseAccount);
    localStorage.setItem('accountMaster', JSON.stringify(accounts));
  }
  
  const totalAmount = parseFloat(expense.amount) + (parseFloat(expense.gstAmount) || 0);
  
  // Debit expense account
  createLedgerEntry({
    voucherNumber: expense.expenseNumber,
    voucherDate: expense.expenseDate,
    accountId: expenseAccount.id,
    accountName: expenseAccount.accountName,
    type: 'Debit',
    amount: totalAmount,
    narration: `Expense: ${expense.description || expense.expenseType} - ${expense.expenseNumber}`,
    referenceType: 'Branch Expense',
    referenceId: expense.id,
    branchId: expense.branch,
    branchName: branch.branchName
  });
  
  // Credit branch cash/bank account
  createLedgerEntry({
    voucherNumber: expense.expenseNumber,
    voucherDate: expense.expenseDate,
    accountId: branchAccount.id,
    accountName: branchAccount.accountName,
    type: 'Credit',
    amount: totalAmount,
    narration: `Payment: ${expense.description || expense.expenseType} - ${expense.expenseNumber}`,
    referenceType: 'Branch Expense',
    referenceId: expense.id,
    branchId: expense.branch,
    branchName: branch.branchName
  });
  
  // If linked to trip, also create trip expense entry
  if (expense.tripId) {
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    const trip = trips.find(t => t.id.toString() === expense.tripId.toString());
    
    if (trip) {
      // Update trip expenses
      const tripExpenses = trip.expenses || {};
      const otherExpenses = tripExpenses.other || [];
      
      otherExpenses.push({
        id: Date.now(),
        amount: totalAmount,
        description: `Branch Expense: ${expense.description || expense.expenseType}`,
        date: expense.expenseDate,
        location: branch.branchName,
        expenseId: expense.id
      });
      
      tripExpenses.other = otherExpenses;
      tripExpenses.totalExpenses = (parseFloat(tripExpenses.totalExpenses) || 0) + totalAmount;
      trip.expenses = tripExpenses;
      
      const updatedTrips = trips.map(t => 
        t.id.toString() === expense.tripId.toString() ? trip : t
      );
      localStorage.setItem('trips', JSON.stringify(updatedTrips));
    }
  }
};

// Create driver salary/bhatta ledger entries
export const createDriverSalaryLedger = (trip, salaryAmount, bhattaAmount, branchId, salaryPaymentMode = 'Cash', bhattaExpenses = [], otherExpenses = []) => {
  const accounts = JSON.parse(localStorage.getItem('accountMaster') || '[]');
  const branches = JSON.parse(localStorage.getItem('branches') || '[]');
  const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
  
  const branch = branches.find(b => b.id.toString() === branchId.toString());
  const driver = drivers.find(d => d.id.toString() === trip.driverId?.toString());
  
  if (!branch || !driver) return;
  
  // Find or create branch cash account
  let branchAccount = accounts.find(a => 
    a.linkedEntityType === 'Branch' && 
    a.linkedEntity === branchId.toString() &&
    (a.subGroup === 'Branch Cash Book' || a.subGroup === 'Cash in Hand')
  );
  
  if (!branchAccount) {
    branchAccount = {
      id: Date.now(),
      accountName: `${branch.branchName} - Cash Book`,
      accountCode: `BR-${branch.branchCode}-CASH`,
      category: 'Assets',
      group: 'Current Assets',
      subGroup: 'Cash in Hand',
      openingBalance: '0',
      currentBalance: '0',
      balanceType: 'Debit',
      linkedEntity: branchId.toString(),
      linkedEntityType: 'Branch',
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    accounts.push(branchAccount);
  }
  
  // Find or create driver account
  let driverAccount = accounts.find(a => 
    a.linkedEntityType === 'Driver' && 
    a.linkedEntity === driver.id.toString()
  );
  
  if (!driverAccount) {
    driverAccount = {
      id: Date.now() + 1,
      accountName: driver.driverName,
      accountCode: `DRV-${driver.licenseNumber || driver.id}`,
      category: 'Liabilities',
      group: 'Current Liabilities',
      subGroup: 'Outstanding Expenses',
      openingBalance: '0',
      currentBalance: '0',
      balanceType: 'Credit',
      linkedEntity: driver.id.toString(),
      linkedEntityType: 'Driver',
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    accounts.push(driverAccount);
  }
  
  // Find salary expense account
  let salaryAccount = accounts.find(a => 
    a.subGroup === 'Driver Salary' || 
    a.subGroup === 'Daily Wages' ||
    (a.accountName.toLowerCase().includes('driver') && a.accountName.toLowerCase().includes('salary'))
  );
  
  if (!salaryAccount) {
    salaryAccount = {
      id: Date.now() + 2,
      accountName: 'Driver Salary & Wages',
      accountCode: 'EXP-DRV-SAL',
      category: 'Expenses',
      group: 'Administrative Expenses',
      subGroup: 'Salary & Wages',
      openingBalance: '0',
      currentBalance: '0',
      balanceType: 'Debit',
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    accounts.push(salaryAccount);
  }
  
  // Calculate amounts by payment mode
  const cashSalary = salaryPaymentMode === 'Cash' ? parseFloat(salaryAmount || 0) : 0;
  const onAccountSalary = salaryPaymentMode === 'On Account' ? parseFloat(salaryAmount || 0) : 0;
  
  const cashBhatta = bhattaExpenses
    .filter(e => e.paymentMode !== 'On Account')
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const onAccountBhatta = bhattaExpenses
    .filter(e => e.paymentMode === 'On Account')
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  
  const onAccountOther = otherExpenses
    .filter(e => e.paymentMode === 'On Account')
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  
  const totalCashAmount = cashSalary + cashBhatta;
  const totalOnAccountAmount = onAccountSalary + onAccountBhatta + onAccountOther;
  const totalAmount = totalCashAmount + totalOnAccountAmount;
  
  if (totalAmount > 0) {
    // Debit salary expense account for all amounts
    createLedgerEntry({
      voucherNumber: trip.tripNumber || `TRIP-${trip.id}`,
      voucherDate: trip.tripDate || new Date().toISOString().split('T')[0],
      accountId: salaryAccount.id,
      accountName: salaryAccount.accountName,
      type: 'Debit',
      amount: totalAmount,
      narration: `Driver Salary/Bhatta/Other Expenses: ${driver.driverName} - Trip ${trip.tripNumber || trip.id}`,
      referenceType: 'Trip Expense',
      referenceId: trip.id,
      branchId: branchId,
      branchName: branch.branchName
    });
    
    // If cash payment: Credit branch cash account
    if (totalCashAmount > 0) {
      createLedgerEntry({
        voucherNumber: trip.tripNumber || `TRIP-${trip.id}`,
        voucherDate: trip.tripDate || new Date().toISOString().split('T')[0],
        accountId: branchAccount.id,
        accountName: branchAccount.accountName,
        type: 'Credit',
        amount: totalCashAmount,
        narration: `Cash Payment: ${driver.driverName} - Trip ${trip.tripNumber || trip.id}`,
        referenceType: 'Trip Expense',
        referenceId: trip.id,
        branchId: branchId,
        branchName: branch.branchName
      });
    }
    
    // If on-account payment: Credit driver account (liability - we owe driver)
    if (totalOnAccountAmount > 0) {
      createLedgerEntry({
        voucherNumber: trip.tripNumber || `TRIP-${trip.id}`,
        voucherDate: trip.tripDate || new Date().toISOString().split('T')[0],
        accountId: driverAccount.id,
        accountName: driverAccount.accountName,
        type: 'Credit',
        amount: totalOnAccountAmount,
        narration: `On Account Payable: ${driver.driverName} - Trip ${trip.tripNumber || trip.id} (Salary: ₹${onAccountSalary.toFixed(2)}, Bhatta: ₹${onAccountBhatta.toFixed(2)}, Other: ₹${onAccountOther.toFixed(2)})`,
        referenceType: 'Trip Expense',
        referenceId: trip.id,
        branchId: branchId,
        branchName: branch.branchName
      });
    }
  }
  
  localStorage.setItem('accountMaster', JSON.stringify(accounts));
};

// Create ledger entries for Sundry Creditor LR booking
export const createSundryCreditorLedger = (lrData) => {
  if (!lrData || lrData.paymentMode !== 'SundryCreditor' || !lrData.sundryCreditor) {
    return;
  }
  
  const accounts = JSON.parse(localStorage.getItem('accountMaster') || '[]');
  const clients = JSON.parse(localStorage.getItem('clients') || '[]');
  const branches = JSON.parse(localStorage.getItem('branches') || '[]');
  
  const client = clients.find(c => c.id.toString() === lrData.sundryCreditor.toString());
  const branch = branches.find(b => b.id.toString() === lrData.branch.toString());
  
  if (!client || !branch) return;
  
  const totalAmount = parseFloat(lrData.totalAmount) || 0;
  if (totalAmount <= 0) return;
  
  // Find or create Sundry Creditor account for this client
  let sundryCreditorAccount = accounts.find(a => 
    a.linkedEntityType === 'Client' && 
    a.linkedEntity === client.id.toString() &&
    a.subGroup === 'Sundry Creditors'
  );
  
  if (!sundryCreditorAccount) {
    sundryCreditorAccount = {
      id: Date.now(),
      accountName: `${client.companyName || client.clientName} - Sundry Creditor`,
      accountCode: `SC-${client.code || client.clientCode || client.id}`,
      category: 'Liabilities',
      group: 'Current Liabilities',
      subGroup: 'Sundry Creditors',
      openingBalance: '0',
      currentBalance: '0',
      balanceType: 'Credit',
      linkedEntity: client.id.toString(),
      linkedEntityType: 'Client',
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    accounts.push(sundryCreditorAccount);
    localStorage.setItem('accountMaster', JSON.stringify(accounts));
  }
  
  // Find or create Freight Income account
  let freightIncomeAccount = accounts.find(a => 
    a.group === 'Income' && 
    (a.accountName.toLowerCase().includes('freight') || a.accountName.toLowerCase().includes('transport'))
  );
  
  if (!freightIncomeAccount) {
    freightIncomeAccount = {
      id: Date.now() + 1,
      accountName: 'Freight Income',
      accountCode: 'INC-FREIGHT-001',
      category: 'Income',
      group: 'Income',
      subGroup: 'Operating Income',
      openingBalance: '0',
      currentBalance: '0',
      balanceType: 'Credit',
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    accounts.push(freightIncomeAccount);
    localStorage.setItem('accountMaster', JSON.stringify(accounts));
  }
  
  // Create ledger entries: Debit Sundry Creditor (we owe them), Credit Freight Income
  createLedgerEntry({
    voucherNumber: lrData.lrNumber || `LR-${lrData.id}`,
    voucherDate: lrData.bookingDate || new Date().toISOString().split('T')[0],
    accountId: sundryCreditorAccount.id,
    accountName: sundryCreditorAccount.accountName,
    type: 'Credit', // Credit increases liability (we owe more)
    amount: totalAmount,
    narration: `LR Booking: ${lrData.lrNumber || lrData.id} - ${client.companyName || client.clientName}`,
    referenceType: 'LR Booking',
    referenceId: lrData.id,
    branchId: branch.id,
    branchName: branch.branchName
  });
  
  createLedgerEntry({
    voucherNumber: lrData.lrNumber || `LR-${lrData.id}`,
    voucherDate: lrData.bookingDate || new Date().toISOString().split('T')[0],
    accountId: freightIncomeAccount.id,
    accountName: freightIncomeAccount.accountName,
    type: 'Credit', // Credit increases income
    amount: totalAmount,
    narration: `LR Booking: ${lrData.lrNumber || lrData.id} - Sundry Creditor: ${client.companyName || client.clientName}`,
    referenceType: 'LR Booking',
    referenceId: lrData.id,
    branchId: branch.id,
    branchName: branch.branchName
  });
};

