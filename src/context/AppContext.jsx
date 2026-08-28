import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const AppContext = createContext();

const INITIAL_DEMO_PRODUCTS = [
  { id: 'PRD-101', sku: 'HDW-LOK-01', name: 'Digital Smart Door Lock X1', category: 'Hardware', barcode: '890123456701', price: 8500, costPrice: 6200, gstRate: 18, stock: 12, minStock: 5, unit: 'Pcs' },
  { id: 'PRD-102', sku: 'PNT-PRM-20', name: 'Asian Paints White Primer 20L', category: 'Paints', barcode: '890123456702', price: 3400, costPrice: 2650, gstRate: 28, stock: 4, minStock: 8, unit: 'Bucket' },
  { id: 'PRD-103', sku: 'HDW-HNG-SS', name: 'Stainless Steel Soft Close Hinge 4"', category: 'Hardware', barcode: '890123456703', price: 180, costPrice: 110, gstRate: 18, stock: 150, minStock: 30, unit: 'Pair' },
  { id: 'PRD-104', sku: 'ELE-LED-12', name: 'Havells 12W LED Panel Light White', category: 'Electrical', barcode: '890123456704', price: 420, costPrice: 280, gstRate: 18, stock: 45, minStock: 15, unit: 'Pcs' },
  { id: 'PRD-105', sku: 'PLM-TAP-BR', name: 'Jaquar Brass Basin Tap 1/2"', category: 'Plumbing', barcode: '890123456705', price: 1250, costPrice: 890, gstRate: 18, stock: 18, minStock: 6, unit: 'Pcs' },
  { id: 'PRD-106', sku: 'TOL-DRL-75', name: 'Bosch Professional Impact Drill 750W', category: 'Tools', barcode: '890123456706', price: 4900, costPrice: 3800, gstRate: 18, stock: 3, minStock: 5, unit: 'Pcs' },
  { id: 'PRD-107', sku: 'PLM-PIP-04', name: 'Finolex Heavy Duty PVC Pipe 4" (10ft)', category: 'Plumbing', barcode: '890123456707', price: 680, costPrice: 490, gstRate: 18, stock: 60, minStock: 20, unit: 'Length' },
  { id: 'PRD-108', sku: 'TOL-CTR-MB', name: 'DeWalt 4" Marble Cutter Machine', category: 'Tools', barcode: '890123456708', price: 3200, costPrice: 2400, gstRate: 18, stock: 2, minStock: 4, unit: 'Pcs' },
];

const INITIAL_DEMO_CUSTOMERS = [
  { id: 'CUST-001', name: 'Rajesh Kumar', company: 'Metro Infra Builders', phone: '+91 98765 43210', email: 'rajesh@metroinfra.in', address: '102 MG Road, Business Hub', totalOrders: 14, totalSpent: 124500, outstanding: 12500, gstIn: '32AAPFT8606A1ZB' },
  { id: 'CUST-002', name: 'Ananya Sharma', company: 'Sharma Interior Studio', phone: '+91 98123 55678', email: 'ananya@sharmastudio.com', address: '45 Green Park Avenue', totalOrders: 8, totalSpent: 68200, outstanding: 0, gstIn: '' },
  { id: 'CUST-003', name: 'Apex Tech Pvt Ltd', company: 'Apex Tech', phone: '+91 99000 11223', email: 'purchase@apextech.in', address: 'Plot 18 Tech Park', totalOrders: 22, totalSpent: 310000, outstanding: 45000, gstIn: '32BBBFG9911C1ZX' },
];

const INITIAL_DEMO_SUPPLIERS = [
  { id: 'SUPP-001', name: 'Asian Paints Regional Depot', company: 'Asian Paints Ltd', phone: '+91 98888 12345', email: 'sales@asianpaintsdepot.com', address: 'Industrial Zone, Hub 4', totalPurchases: 450000, payable: 32000, gstIn: '32AAACA1234F1Z1' },
  { id: 'SUPP-002', name: 'Ebco Hardware Hardware India', company: 'Ebco India', phone: '+91 97777 65432', email: 'order@ebco.in', address: 'Logistics Park B', totalPurchases: 280000, payable: 0, gstIn: '32BBBCE5678G2Z2' },
  { id: 'SUPP-003', name: 'Bosch Power Tools Dist.', company: 'Bosch Tools', phone: '+91 96666 99887', email: 'supplies@boschtools.in', address: 'Trade Center Sector 9', totalPurchases: 195000, payable: 18500, gstIn: '32CCCDD9876H3Z3' },
];

const INITIAL_DEMO_INVOICES = [
  {
    id: 'INV-2026-001',
    invoiceNumber: 'HB-1001',
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    customerId: 'CUST-001',
    customerName: 'Rajesh Kumar',
    customerGst: '32AAPFT8606A1ZB',
    items: [
      { productId: 'PRD-101', name: 'Digital Smart Door Lock X1', sku: 'HDW-LOK-01', price: 8500, qty: 2, gstRate: 18, discount: 500, total: 16500 },
      { productId: 'PRD-103', name: 'Stainless Steel Soft Close Hinge 4"', sku: 'HDW-HNG-SS', price: 180, qty: 10, gstRate: 18, discount: 0, total: 1800 }
    ],
    subtotal: 18800,
    discount: 500,
    taxTotal: 3006,
    total: 21306,
    paymentMode: 'UPI',
    paymentStatus: 'PAID',
    gstType: 'GST',
    createdBy: 'Admin User'
  },
  {
    id: 'INV-2026-002',
    invoiceNumber: 'HB-1002',
    date: new Date().toISOString().slice(0, 10),
    customerId: 'CUST-003',
    customerName: 'Apex Tech Pvt Ltd',
    customerGst: '32BBBFG9911C1ZX',
    items: [
      { productId: 'PRD-104', name: 'Havells 12W LED Panel Light White', sku: 'ELE-LED-12', price: 420, qty: 20, gstRate: 18, discount: 400, total: 8000 },
      { productId: 'PRD-106', name: 'Bosch Professional Impact Drill 750W', sku: 'TOL-DRL-75', price: 4900, qty: 1, gstRate: 18, discount: 0, total: 4900 }
    ],
    subtotal: 13300,
    discount: 400,
    taxTotal: 2200,
    total: 15100,
    paymentMode: 'Credit',
    paymentStatus: 'UNPAID',
    gstType: 'GST',
    createdBy: 'Staff Cashier'
  }
];

const INITIAL_DEMO_SETTINGS = {
  storeName: 'H BILLS Hardware & Trade Mart',
  tagline: 'Quality Building Supplies & Tools',
  gstIn: '32AAPFT8606A1ZB',
  phone: '+91 98765 00000',
  email: 'support@hbills.com',
  address: 'Main Commerce Street, Hardware Plaza, Kerala - 676505',
  upiId: 'hbills@upi',
  terms: '1. Goods once sold will not be returned. 2. 18% interest charged on unpaid bills after 30 days.',
  theme: 'dark',
  currency: '₹',
  taxInvoicePrefix: 'TAX-',
  retailBillPrefix: 'RET-'
};

export const AppProvider = ({ children }) => {
  // Clear old cached demo data once to ensure fresh clean state
  if (!localStorage.getItem('hb_fresh_start_v2')) {
    localStorage.removeItem('hb_products');
    localStorage.removeItem('hb_customers');
    localStorage.removeItem('hb_suppliers');
    localStorage.removeItem('hb_invoices');
    localStorage.removeItem('hb_purchases');
    localStorage.removeItem('hb_inventory_logs');
    localStorage.removeItem('hb_payments');
    localStorage.setItem('hb_fresh_start_v2', 'true');
  }

  const INITIAL_CATEGORIES = ['Hardware', 'Paints', 'Electrical', 'Plumbing', 'Tools', 'General'];

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('hb_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [products, setProducts] = useState([]);

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('hb_customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem('hb_suppliers');
    return saved ? JSON.parse(saved) : [];
  });

  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('hb_invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchases, setPurchases] = useState(() => {
    const saved = localStorage.getItem('hb_purchases');
    return saved ? JSON.parse(saved) : [];
  });

  const [inventoryLogs, setInventoryLogs] = useState(() => {
    const saved = localStorage.getItem('hb_inventory_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem('hb_payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('hb_settings');
    return saved ? JSON.parse(saved) : INITIAL_DEMO_SETTINGS;
  });

  const [taxInvoiceSeq, setTaxInvoiceSeq] = useState(() => {
    const saved = localStorage.getItem('hb_tax_invoice_seq');
    return saved ? Number(saved) : 1001;
  });

  const [retailBillSeq, setRetailBillSeq] = useState(() => {
    const saved = localStorage.getItem('hb_retail_bill_seq');
    return saved ? Number(saved) : 1001;
  });

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [cloudStatus, setCloudStatus] = useState({ synced: true, text: 'Cloud Live Sync' });
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      if (!firebaseUser) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.error('User profile not found in Firestore.');
        await signOut(auth);
        setUser(null);
        setAuthLoading(false);
        return;
      }

      const userData = userSnap.data();

      setUser({
        id: firebaseUser.uid,
        name: userData.name || firebaseUser.email || 'User',
        email: userData.email || firebaseUser.email || '',
        role: userData.role,
        avatar: userData.role === 'admin' ? '👑' : '👤'
      });

      setAuthLoading(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(null);
      setAuthLoading(false);
    }
  });

  return () => unsubscribe();
}, []);

// Load products from Firestore
useEffect(() => {
  if (!user) return;

  const loadProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'products'));

      const firebaseProducts = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      setProducts(firebaseProducts);

      console.log(
        'Products loaded from Firestore:',
        firebaseProducts.length
      );
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  loadProducts();
}, [user]);


  // Sync to localStorage
  useEffect(() => { localStorage.setItem('hb_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('hb_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('hb_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('hb_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('hb_invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('hb_purchases', JSON.stringify(purchases)); }, [purchases]);
  useEffect(() => { localStorage.setItem('hb_inventory_logs', JSON.stringify(inventoryLogs)); }, [inventoryLogs]);
  useEffect(() => { localStorage.setItem('hb_payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem('hb_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('hb_tax_invoice_seq', taxInvoiceSeq.toString()); }, [taxInvoiceSeq]);
  useEffect(() => { localStorage.setItem('hb_retail_bill_seq', retailBillSeq.toString()); }, [retailBillSeq]);

  const login = async (email, password) => {
  const result = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return result.user;
};

const logout = async () => {
  await signOut(auth);
};

  // Category Actions
  const addCategory = (catName) => {
    const trimmed = catName.trim();
    if (!trimmed) return false;
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Category "${trimmed}" already exists!`);
      return false;
    }
    setCategories(prev => [...prev, trimmed]);
    return true;
  };

  const deleteCategory = (catName) => {
    setCategories(prev => prev.filter(c => c.toLowerCase() !== catName.toLowerCase()));
  };

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
  }, [settings.theme]);

  // Product Actions
  const addProduct = async (prod) => {
  const newProd = {
    ...prod,
    id: `PRD-${Date.now().toString().slice(-6)}`,
    stock: Number(prod.stock) || 0,
    price: Number(prod.price) || 0,
    costPrice: Number(prod.costPrice) || 0,
    minStock: Number(prod.minStock) || 5,
    gstRate: Number(prod.gstRate) || 18,
  };

  try {
    await setDoc(
      doc(db, 'products', newProd.id),
      newProd
    );

    setProducts(prev => [newProd, ...prev]);

    console.log(
      'Product saved to Firestore:',
      newProd.id
    );
  } catch (error) {
    console.error(
      'Error saving product:',
      error
    );

    alert('Failed to save product to Firebase.');

    return null;
  }

  // Log inventory creation
  const log = {
    id: `LOG-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    productId: newProd.id,
    productName: newProd.name,
    changeQty: newProd.stock,
    previousStock: 0,
    newStock: newProd.stock,
    type: 'Initial Stock',
    reason: 'Product Created'
  };

  setInventoryLogs(prev => [log, ...prev]);

  return newProd;
};

    const updateProduct = async (id, updated) => {
    try {
      await updateDoc(
        doc(db, 'products', id),
        updated
      );

      setProducts(prev =>
        prev.map(p =>
          p.id === id
            ? { ...p, ...updated }
            : p
        )
      );

      console.log(
        'Product updated in Firestore:',
        id
      );
    } catch (error) {
      console.error(
        'Error updating product:',
        error
      );

      alert('Failed to update product in Firebase.');
    }
  };

  const deleteProduct = async (id) => {
  try {
    await deleteDoc(
      doc(db, 'products', id)
    );

    setProducts(prev =>
      prev.filter(p => p.id !== id)
    );

    console.log(
      'Product deleted from Firestore:',
      id
    );
  } catch (error) {
    console.error(
      'Error deleting product:',
      error
    );

    alert('Failed to delete product in Firebase.');
  }
};

  const adjustStock = (productId, changeQty, reason, type = 'Manual Adjustment') => {
    let affectedProdName = '';
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        affectedProdName = p.name;
        const previousStock = p.stock;
        const newStock = Math.max(0, previousStock + changeQty);
        
        // Add audit log entry
        const log = {
          id: `LOG-${Date.now()}-${Math.floor(Math.random()*100)}`,
          date: new Date().toISOString().slice(0, 10),
          productId,
          productName: p.name,
          changeQty,
          previousStock,
          newStock,
          type,
          reason
        };
        setInventoryLogs(logs => [log, ...logs]);

        return { ...p, stock: newStock };
      }
      return p;
    }));
  };

  const getNextInvoiceNumber = (gstType = 'GST') => {
    if (gstType === 'GST') {
      const prefix = settings.taxInvoicePrefix || 'TAX-';
      return `${prefix}${taxInvoiceSeq}`;
    } else {
      const prefix = settings.retailBillPrefix || 'RET-';
      return `${prefix}${retailBillSeq}`;
    }
  };

  // Create Invoice (Sale)
  const createInvoice = (invoiceData) => {
    const isTaxInvoice = (invoiceData.gstType === 'GST');
    let invoiceNumber = '';
    
    if (isTaxInvoice) {
      const prefix = settings.taxInvoicePrefix || 'TAX-';
      invoiceNumber = `${prefix}${taxInvoiceSeq}`;
      setTaxInvoiceSeq(prev => prev + 1);
    } else {
      const prefix = settings.retailBillPrefix || 'RET-';
      invoiceNumber = `${prefix}${retailBillSeq}`;
      setRetailBillSeq(prev => prev + 1);
    }

    const newInvoice = {
      ...invoiceData,
      id: `INV-${Date.now()}`,
      invoiceNumber,
      date: new Date().toISOString().slice(0, 10),
      createdBy: user ? user.name : 'Staff Cashier',
    };

    // 1. Deduct Stock for each item
    newInvoice.items.forEach(item => {
      adjustStock(item.productId, -Number(item.qty), `Invoice #${newInvoice.invoiceNumber}`, 'Sale');
    });

    // 2. Add Invoice
    setInvoices(prev => [newInvoice, ...prev]);

    // 3. Update Customer Outstanding if payment status is UNPAID or Credit
    if (newInvoice.paymentMode === 'Credit' || newInvoice.paymentStatus === 'UNPAID') {
      setCustomers(prev => prev.map(c => {
        if (c.id === newInvoice.customerId) {
          return {
            ...c,
            totalOrders: (c.totalOrders || 0) + 1,
            totalSpent: (c.totalSpent || 0) + newInvoice.total,
            outstanding: (c.outstanding || 0) + newInvoice.total
          };
        }
        return c;
      }));
    } else {
      // Payment received immediately
      setCustomers(prev => prev.map(c => {
        if (c.id === newInvoice.customerId) {
          return {
            ...c,
            totalOrders: (c.totalOrders || 0) + 1,
            totalSpent: (c.totalSpent || 0) + newInvoice.total
          };
        }
        return c;
      }));

      // Record in ledger
      const payRecord = {
        id: `PAY-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        type: 'IN',
        entityName: newInvoice.customerName || 'Walk-in Customer',
        amount: newInvoice.total,
        mode: newInvoice.paymentMode,
        reference: newInvoice.invoiceNumber
      };
      setPayments(prev => [payRecord, ...prev]);
    }

    return newInvoice;
  };

  // Customer Management
  const addCustomer = (custData) => {
    const newCust = {
      ...custData,
      id: `CUST-${Date.now().toString().slice(-4)}`,
      totalOrders: 0,
      totalSpent: 0,
      outstanding: Number(custData.outstanding) || 0
    };
    setCustomers(prev => [newCust, ...prev]);
    return newCust;
  };

  const updateCustomer = (id, updatedCust) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updatedCust } : c));
  };

  const deleteCustomer = (id) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const recordCustomerPayment = (customerId, amount, mode, note) => {
    const payAmt = Number(amount);
    let custName = '';
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        custName = c.name;
        return {
          ...c,
          outstanding: Math.max(0, (c.outstanding || 0) - payAmt)
        };
      }
      return c;
    }));

    const payRecord = {
      id: `PAY-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'IN',
      entityName: custName,
      amount: payAmt,
      mode: mode || 'Cash',
      reference: note || 'Outstanding Balance Payment'
    };
    setPayments(prev => [payRecord, ...prev]);
  };

  // Supplier Management
  const addSupplier = (suppData) => {
    const newSupp = {
      ...suppData,
      id: `SUPP-${Date.now().toString().slice(-4)}`,
      totalPurchases: 0,
      payable: Number(suppData.payable) || 0
    };
    setSuppliers(prev => [newSupp, ...prev]);
    return newSupp;
  };

  const updateSupplier = (id, updatedSupp) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updatedSupp } : s));
  };

  const deleteSupplier = (id) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const deleteInvoice = (id) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const deleteInventoryLog = (id) => {
    setInventoryLogs(prev => prev.filter(log => log.id !== id));
  };

  const deletePayment = (id) => {
    setPayments(prev => prev.filter(pay => pay.id !== id));
  };

  const recordSupplierPayment = (supplierId, amount, mode, note) => {
    const payAmt = Number(amount);
    let suppName = '';
    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        suppName = s.name;
        return {
          ...s,
          payable: Math.max(0, (s.payable || 0) - payAmt)
        };
      }
      return s;
    }));

    const payRecord = {
      id: `PAY-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'OUT',
      entityName: suppName,
      amount: payAmt,
      mode: mode || 'Bank Transfer',
      reference: note || 'Supplier Payment'
    };
    setPayments(prev => [payRecord, ...prev]);
  };

  // Create Purchase Entry
  const createPurchase = (purchaseData) => {
    const poNumber = `PO-${Date.now().toString().slice(-4)}`;
    const newPO = {
      ...purchaseData,
      id: `PUR-${Date.now()}`,
      poNumber,
      date: new Date().toISOString().slice(0, 10),
    };

    // Add stock
    purchaseData.items.forEach(item => {
      adjustStock(item.productId, Number(item.qty), `Purchase Order #${poNumber}`, 'Stock In');
    });

    setPurchases(prev => [newPO, ...prev]);

    // Update Supplier Payable
    setSuppliers(prev => prev.map(s => {
      if (s.id === purchaseData.supplierId) {
        return {
          ...s,
          totalPurchases: (s.totalPurchases || 0) + purchaseData.total,
          payable: (s.payable || 0) + (purchaseData.isPaid ? 0 : purchaseData.total)
        };
      }
      return s;
    }));

    if (purchaseData.isPaid) {
      const payRecord = {
        id: `PAY-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        type: 'OUT',
        entityName: purchaseData.supplierName,
        amount: purchaseData.total,
        mode: purchaseData.paymentMode || 'Bank',
        reference: poNumber
      };
      setPayments(prev => [payRecord, ...prev]);
    }

    return newPO;
  };

  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  const updateSettings = (newSet) => {
    setSettings(prev => ({ ...prev, ...newSet }));
  };

  // Backup & Restore
  const exportDataJSON = () => {
    const data = {
      products,
      customers,
      suppliers,
      invoices,
      purchases,
      inventoryLogs,
      payments,
      settings,
      version: '1.0.0',
      exportedAt: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HBills_Backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDataJSON = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.products) setProducts(parsed.products);
      if (parsed.customers) setCustomers(parsed.customers);
      if (parsed.suppliers) setSuppliers(parsed.suppliers);
      if (parsed.invoices) setInvoices(parsed.invoices);
      if (parsed.purchases) setPurchases(parsed.purchases);
      if (parsed.inventoryLogs) setInventoryLogs(parsed.inventoryLogs);
      if (parsed.payments) setPayments(parsed.payments);
      if (parsed.settings) setSettings(parsed.settings);
      alert('Data imported and restored successfully!');
      return true;
    } catch (err) {
      alert('Invalid backup file format. Please choose a valid H BILLS JSON backup.');
      return false;
    }
  };

  const resetToDemoData = () => {
    if (window.confirm('Reset all data to default demo records? Your current edits will be replaced.')) {
      setProducts(INITIAL_DEMO_PRODUCTS);
      setCustomers(INITIAL_DEMO_CUSTOMERS);
      setSuppliers(INITIAL_DEMO_SUPPLIERS);
      setInvoices(INITIAL_DEMO_INVOICES);
      setPurchases([]);
      setInventoryLogs([]);
      setPayments([]);
      setSettings(INITIAL_DEMO_SETTINGS);
      localStorage.clear();
      localStorage.setItem('hb_fresh_start_v2', 'true');
    }
  };

  const clearAllData = (showPrompt = true) => {
    if (!showPrompt || window.confirm('Are you sure you want to remove all sample stocks, customers, and invoices? Your app will start completely clean for your actual business data.')) {
      setProducts([]);
      setCustomers([]);
      setSuppliers([]);
      setInvoices([]);
      setPurchases([]);
      setInventoryLogs([]);
      setPayments([]);
      localStorage.removeItem('hb_products');
      localStorage.removeItem('hb_customers');
      localStorage.removeItem('hb_suppliers');
      localStorage.removeItem('hb_invoices');
      localStorage.removeItem('hb_purchases');
      localStorage.removeItem('hb_inventory_logs');
      localStorage.removeItem('hb_payments');
      if (showPrompt) alert('All sample products, customers, and stock data have been cleared successfully!');
    }
  };

  return (
    <AppContext.Provider value={{
      categories, addCategory, deleteCategory,
      products, setProducts, addProduct, updateProduct, deleteProduct, adjustStock,
      customers, addCustomer, updateCustomer, deleteCustomer, recordCustomerPayment,
      suppliers, addSupplier, updateSupplier, deleteSupplier, recordSupplierPayment, createPurchase, purchases,
      invoices, createInvoice, deleteInvoice, getNextInvoiceNumber,
      taxInvoiceSeq, setTaxInvoiceSeq, retailBillSeq, setRetailBillSeq,
      inventoryLogs, deleteInventoryLog,
      payments, deletePayment,
      settings, updateSettings, toggleTheme,
      user, login, logout, authLoading,
      activeTab, setActiveTab,
      cloudStatus,
      exportDataJSON, importDataJSON, resetToDemoData, clearAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
