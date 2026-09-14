import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  runTransaction,
  onSnapshot
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

// ============================================================
// LOAD ALL BUSINESS DATA FROM FIRESTORE
// Firebase is becoming the main source of truth.
// ============================================================
useEffect(() => {
  if (!user) return;
 // ==========================================================
  // REALTIME PRODUCTS LISTENER
  // ==========================================================
  const unsubscribeProducts = onSnapshot(
    collection(db, 'products'),

    (snapshot) => {
      const realtimeProducts = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      setProducts(realtimeProducts);

      console.log(
        'Realtime products updated:',
        realtimeProducts.length
      );
    },

    (error) => {
      console.error(
        'Realtime products listener error:',
        error
      );
    }
    );

  // ==========================================================
  // REALTIME CUSTOMERS LISTENER
  // ==========================================================
  const unsubscribeCustomers = onSnapshot(
    collection(db, 'customers'),

    (snapshot) => {
      const realtimeCustomers = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      setCustomers(realtimeCustomers);

      console.log(
        'Realtime customers updated:',
        realtimeCustomers.length
      );
    },

    (error) => {
      console.error(
        'Realtime customers listener error:',
        error
      );
    }
  );
  // ==========================================================
// REALTIME SUPPLIERS LISTENER
// ==========================================================
const unsubscribeSuppliers = onSnapshot(
  collection(db, 'suppliers'),

  (snapshot) => {
    const realtimeSuppliers = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    setSuppliers(realtimeSuppliers);

    console.log(
      'Realtime suppliers updated:',
      realtimeSuppliers.length
    );
  },

  (error) => {
    console.error(
      'Realtime suppliers listener error:',
      error
    );
  }
);
  // ==========================================================
// REALTIME PURCHASES LISTENER
// ==========================================================
const unsubscribePurchases = onSnapshot(
  collection(db, 'purchases'),

  (snapshot) => {
    const realtimePurchases = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    setPurchases(realtimePurchases);

    console.log(
      'Realtime purchases updated:',
      realtimePurchases.length
    );
  },

  (error) => {
    console.error(
      'Realtime purchases listener error:',
      error
    );
  }
);
  // ==========================================================
// REALTIME INVOICES LISTENER
// ==========================================================
const unsubscribeInvoices = onSnapshot(
  collection(db, 'invoices'),

  (snapshot) => {
    const realtimeInvoices = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    setInvoices(realtimeInvoices);

    console.log(
      'Realtime invoices updated:',
      realtimeInvoices.length
    );
  },

  (error) => {
    console.error(
      'Realtime invoices listener error:',
      error
    );
  }
);
  // ==========================================================
// REALTIME PAYMENTS LISTENER
// ==========================================================
const unsubscribePayments = onSnapshot(
  collection(db, 'payments'),

  (snapshot) => {
    const realtimePayments = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    setPayments(realtimePayments);

    console.log(
      'Realtime payments updated:',
      realtimePayments.length
    );
  },

  (error) => {
    console.error(
      'Realtime payments listener error:',
      error
    );
  }
);
  // ==========================================================
// REALTIME INVENTORY LOGS LISTENER
// ==========================================================
const unsubscribeInventoryLogs = onSnapshot(
  collection(db, 'inventoryLogs'),

  (snapshot) => {
    const realtimeInventoryLogs = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    setInventoryLogs(realtimeInventoryLogs);

    console.log(
      'Realtime inventory logs updated:',
      realtimeInventoryLogs.length
    );
  },

  (error) => {
    console.error(
      'Realtime inventory logs listener error:',
      error
    );
  }
);
  // ==========================================================
// REALTIME CATEGORIES LISTENER
// ==========================================================
const unsubscribeCategories = onSnapshot(
  doc(db, 'categories', 'config'),

  (snapshot) => {
    if (!snapshot.exists()) return;

    const categoryData = snapshot.data();

    if (Array.isArray(categoryData.categories)) {
      setCategories(categoryData.categories);
    }

    console.log(
      'Realtime categories updated:',
      Array.isArray(categoryData.categories)
        ? categoryData.categories.length
        : 0
    );
  },

  (error) => {
    console.error(
      'Realtime categories listener error:',
      error
    );
  }
);
  // ==========================================================
// REALTIME SETTINGS LISTENER
// ==========================================================
const unsubscribeSettings = onSnapshot(
  doc(db, 'settings', 'store'),

  (snapshot) => {
    if (!snapshot.exists()) return;

    setSettings(prev => ({
      ...prev,
      ...snapshot.data()
    }));

    console.log(
      'Realtime settings updated'
    );
  },

  (error) => {
    console.error(
      'Realtime settings listener error:',
      error
    );
  }
);
 // ==========================================================
// REALTIME INVOICE COUNTERS LISTENER
// ==========================================================
const unsubscribeCounters = onSnapshot(
  doc(db, 'counters', 'invoices'),

  (snapshot) => {
    if (!snapshot.exists()) return;

    const counterData = snapshot.data();

    if (counterData.taxInvoiceSeq !== undefined) {
      setTaxInvoiceSeq(
        Number(counterData.taxInvoiceSeq)
      );
    }

    if (counterData.retailBillSeq !== undefined) {
      setRetailBillSeq(
        Number(counterData.retailBillSeq)
      );
    }

    console.log(
      'Realtime invoice counters updated:',
      counterData
    );
  },

  (error) => {
    console.error(
      'Realtime invoice counters listener error:',
      error
    );
  }
);

 return () => {
  unsubscribeProducts();
  unsubscribeCustomers();
  unsubscribeSuppliers();
  unsubscribePurchases();
  unsubscribeInvoices();
  unsubscribePayments();
  unsubscribeInventoryLogs();
  unsubscribeCategories();
  unsubscribeSettings();
  unsubscribeCounters();
};
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

  // ============================================================
// CATEGORY ACTIONS - FIRESTORE
// ============================================================

const addCategory = async (catName) => {
  const trimmed = catName.trim();

  if (!trimmed) return false;

  if (
    categories.some(
      c => c.toLowerCase() === trimmed.toLowerCase()
    )
  ) {
    alert(`Category "${trimmed}" already exists!`);
    return false;
  }

  const updatedCategories = [
    ...categories,
    trimmed
  ];

  try {
    await setDoc(
      doc(db, 'categories', 'config'),
      {
        categories: updatedCategories,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    setCategories(updatedCategories);

    console.log(
      'Category saved to Firestore:',
      trimmed
    );

    return true;

  } catch (error) {
    console.error(
      'Error saving category to Firestore:',
      error
    );

    alert('Failed to save category to Firebase.');

    return false;
  }
};


const deleteCategory = async (catName) => {
  const updatedCategories = categories.filter(
    c => c.toLowerCase() !== catName.toLowerCase()
  );

  try {
    await setDoc(
      doc(db, 'categories', 'config'),
      {
        categories: updatedCategories,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    setCategories(updatedCategories);

    console.log(
      'Category deleted from Firestore:',
      catName
    );

    return true;

  } catch (error) {
    console.error(
      'Error deleting category from Firestore:',
      error
    );

    alert('Failed to delete category from Firebase.');

    return false;
  }
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

  const adjustStock = async (
  productId,
  changeQty,
  reason,
  type = 'Manual Adjustment'
) => {
  try {
    const result = await runTransaction(
      db,
      async (transaction) => {

        const productRef = doc(
          db,
          'products',
          productId
        );

        const productSnap =
          await transaction.get(productRef);

        if (!productSnap.exists()) {
          throw new Error(
            'Product not found in Firebase.'
          );
        }

        const productData =
          productSnap.data();

        const previousStock =
          Number(productData.stock) || 0;

        const qtyChange =
          Number(changeQty) || 0;

        const newStock = Math.max(
          0,
          previousStock + qtyChange
        );

        const logId =
          `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const log = {
          id: logId,
          date: new Date()
            .toISOString()
            .slice(0, 10),
          productId,
          productName:
            productData.name || '',
          changeQty: qtyChange,
          previousStock,
          newStock,
          type,
          reason
        };

        transaction.update(
          productRef,
          {
            stock: newStock
          }
        );

        transaction.set(
          doc(
            db,
            'inventoryLogs',
            logId
          ),
          log
        );

        return {
          productId,
          newStock,
          log
        };
      }
    );

    setProducts(prev =>
      prev.map(product =>
        product.id === result.productId
          ? {
              ...product,
              stock: result.newStock
            }
          : product
      )
    );

    setInventoryLogs(prev => [
      result.log,
      ...prev
    ]);

    console.log(
      'Stock adjustment saved to Firestore:',
      result.log.id
    );

    return true;

  } catch (error) {
    console.error(
      'Error adjusting stock in Firestore:',
      error
    );

    alert(
      `Stock adjustment failed.\n\n${
        error.message ||
        'Firebase transaction failed.'
      }`
    );

    return false;
  }
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

  // ============================================================
// CREATE INVOICE - FIRESTORE ATOMIC TRANSACTION
// ============================================================

const createInvoice = async (invoiceData) => {
  const isTaxInvoice = invoiceData.gstType === 'GST';

  const invoiceId = `INV-${Date.now()}`;
  const paymentId = `PAY-${Date.now()}`;

  const inventoryLogIds = invoiceData.items.map(
    (_, index) => `LOG-${Date.now()}-${index}`
  );

  try {
    const result = await runTransaction(db, async (transaction) => {

      // --------------------------------------------------------
      // 1. Read invoice counter
      // --------------------------------------------------------
      const counterRef = doc(db, 'counters', 'invoices');
      const counterSnap = await transaction.get(counterRef);

      const counterData = counterSnap.exists()
        ? counterSnap.data()
        : {};

      const currentTaxSeq =
        Number(counterData.taxInvoiceSeq) || 1001;

      const currentRetailSeq =
        Number(counterData.retailBillSeq) || 1001;

      let invoiceNumber;

      if (isTaxInvoice) {
        const prefix = settings.taxInvoicePrefix || 'TAX-';
        invoiceNumber = `${prefix}${currentTaxSeq}`;
      } else {
        const prefix = settings.retailBillPrefix || 'RET-';
        invoiceNumber = `${prefix}${currentRetailSeq}`;
      }

      // --------------------------------------------------------
      // 2. Read all product documents
      // --------------------------------------------------------
      const productSnapshots = [];

      for (const item of invoiceData.items) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await transaction.get(productRef);

        if (!productSnap.exists()) {
          throw new Error(
            `Product not found in Firebase: ${item.productId}`
          );
        }

        productSnapshots.push({
          item,
          ref: productRef,
          snap: productSnap
        });
      }

      // --------------------------------------------------------
      // 3. Read customer document if not walk-in
      // --------------------------------------------------------
      let customerRef = null;
      let customerSnap = null;

      if (
        invoiceData.customerId &&
        invoiceData.customerId !== 'WALK-IN'
      ) {
        customerRef = doc(
          db,
          'customers',
          invoiceData.customerId
        );

        customerSnap = await transaction.get(customerRef);

        if (!customerSnap.exists()) {
          throw new Error('Customer not found in Firebase.');
        }
      }

      // --------------------------------------------------------
      // 4. Prepare invoice
      // --------------------------------------------------------
      const newInvoice = {
        ...invoiceData,
        id: invoiceId,
        invoiceNumber,
        date: new Date().toISOString().slice(0, 10),
        createdBy: user ? user.name : 'Staff Cashier'
      };

      // --------------------------------------------------------
      // 5. Save invoice
      // --------------------------------------------------------
      transaction.set(
        doc(db, 'invoices', invoiceId),
        newInvoice
      );

      // --------------------------------------------------------
      // 6. Deduct stock + create inventory logs
      // --------------------------------------------------------
      const updatedProducts = [];
      const newInventoryLogs = [];

      productSnapshots.forEach((entry, index) => {
        const productData = entry.snap.data();

        const previousStock = Number(productData.stock) || 0;

        const changeQty = -Number(entry.item.qty);

        const newStock = Math.max(
          0,
          previousStock + changeQty
        );

        transaction.update(
          entry.ref,
          {
            stock: newStock
          }
        );

        const log = {
          id: inventoryLogIds[index],
          date: new Date().toISOString().slice(0, 10),
          productId: entry.item.productId,
          productName:
            productData.name || entry.item.name || '',
          changeQty,
          previousStock,
          newStock,
          type: 'Sale',
          reason: `Invoice #${invoiceNumber}`
        };

        transaction.set(
          doc(db, 'inventoryLogs', log.id),
          log
        );

        updatedProducts.push({
          id: entry.item.productId,
          stock: newStock
        });

        newInventoryLogs.push(log);
      });

      // --------------------------------------------------------
      // 7. Update customer
      // --------------------------------------------------------
      let updatedCustomer = null;

      if (customerRef && customerSnap) {
        const customerData = customerSnap.data();

        const totalOrders =
          (Number(customerData.totalOrders) || 0) + 1;

        const totalSpent =
          (Number(customerData.totalSpent) || 0) +
          Number(newInvoice.total);

        const balanceDue =
           Number(newInvoice.balanceDue) || 0;

        const customerUpdate = {
           totalOrders,
           totalSpent
        };

        if (balanceDue > 0) {
          customerUpdate.outstanding =
            (Number(customerData.outstanding) || 0) +
            balanceDue;
        }

        transaction.update(
          customerRef,
          customerUpdate
        );

        updatedCustomer = {
          id: invoiceData.customerId,
          ...customerUpdate
        };
      }

      // --------------------------------------------------------
      // 8. Save payment if invoice is paid
      // --------------------------------------------------------
      let payRecord = null;

      const amountPaid =
        Number(newInvoice.amountPaid) || 0;

      if (amountPaid > 0) {
        payRecord = {
          id: paymentId,
          date: new Date().toISOString().slice(0, 10),
          type: 'IN',
          entityName:
             newInvoice.customerName || 'Walk-in Customer',
          amount: amountPaid,
          mode: newInvoice.paymentMode,
          reference: newInvoice.invoiceNumber
        };
      }

      // --------------------------------------------------------
      // 9. Increment correct invoice counter
      // --------------------------------------------------------
      const updatedCounter = isTaxInvoice
        ? {
            taxInvoiceSeq: currentTaxSeq + 1,
            retailBillSeq: currentRetailSeq
          }
        : {
            taxInvoiceSeq: currentTaxSeq,
            retailBillSeq: currentRetailSeq + 1
          };

      transaction.set(
        counterRef,
        updatedCounter,
        { merge: true }
      );

      return {
        newInvoice,
        updatedProducts,
        newInventoryLogs,
        updatedCustomer,
        payRecord,
        updatedCounter
      };
    });

    // ----------------------------------------------------------
    // Firebase transaction succeeded.
    // Now update React state.
    // ----------------------------------------------------------

    setInvoices(prev => [
      result.newInvoice,
      ...prev
    ]);

    setProducts(prev =>
      prev.map(product => {
        const updated = result.updatedProducts.find(
          p => p.id === product.id
        );

        return updated
          ? {
              ...product,
              stock: updated.stock
            }
          : product;
      })
    );

    setInventoryLogs(prev => [
      ...result.newInventoryLogs,
      ...prev
    ]);

    if (result.updatedCustomer) {
      setCustomers(prev =>
        prev.map(customer =>
          customer.id === result.updatedCustomer.id
            ? {
                ...customer,
                ...result.updatedCustomer
              }
            : customer
        )
      );
    }

    if (result.payRecord) {
      setPayments(prev => [
        result.payRecord,
        ...prev
      ]);
    }

    setTaxInvoiceSeq(
      result.updatedCounter.taxInvoiceSeq
    );

    setRetailBillSeq(
      result.updatedCounter.retailBillSeq
    );

    console.log(
      'Invoice saved to Firestore:',
      result.newInvoice.invoiceNumber
    );

    return result.newInvoice;

  } catch (error) {
    console.error(
      'Error creating invoice in Firestore:',
      error
    );

    alert(
      `Invoice was NOT created.\n\n${error.message || 'Firebase transaction failed.'}`
    );

    return null;
  }
};

  // ============================================================
// CUSTOMER MANAGEMENT - FIRESTORE
// ============================================================

const addCustomer = async (custData) => {
  const newCust = {
    ...custData,
    id: `CUST-${Date.now().toString().slice(-4)}`,
    totalOrders: 0,
    totalSpent: 0,
    outstanding: Number(custData.outstanding) || 0
  };

  try {
    await setDoc(
      doc(db, 'customers', newCust.id),
      newCust
    );

    setCustomers(prev => [newCust, ...prev]);

    console.log(
      'Customer saved to Firestore:',
      newCust.id
    );

    return newCust;

  } catch (error) {
    console.error(
      'Error saving customer to Firestore:',
      error
    );

    alert('Failed to save customer to Firebase.');

    return null;
  }
};


const updateCustomer = async (id, updatedCust) => {
  try {
    await updateDoc(
      doc(db, 'customers', id),
      updatedCust
    );

    setCustomers(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, ...updatedCust }
          : c
      )
    );

    console.log(
      'Customer updated in Firestore:',
      id
    );

    return true;

  } catch (error) {
    console.error(
      'Error updating customer in Firestore:',
      error
    );

    alert('Failed to update customer in Firebase.');

    return false;
  }
};


const deleteCustomer = async (id) => {
  try {
    await deleteDoc(
      doc(db, 'customers', id)
    );

    setCustomers(prev =>
      prev.filter(c => c.id !== id)
    );

    console.log(
      'Customer deleted from Firestore:',
      id
    );

    return true;

  } catch (error) {
    console.error(
      'Error deleting customer from Firestore:',
      error
    );

    alert('Failed to delete customer from Firebase.');

    return false;
  }
};
  const recordCustomerPayment = async (customerId, amount, mode, note) => {
  const payAmt = Number(amount);

  const customer = customers.find(c => c.id === customerId);

  if (!customer) {
    alert('Customer not found.');
    return false;
  }

  const updatedOutstanding = Math.max(
    0,
    (customer.outstanding || 0) - payAmt
  );

  const payRecord = {
    id: `PAY-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    type: 'IN',
    entityName: customer.name,
    amount: payAmt,
    mode: mode || 'Cash',
    reference: note || 'Outstanding Balance Payment'
  };

  try {
    const batch = writeBatch(db);

    // Update customer outstanding
    batch.update(
      doc(db, 'customers', customerId),
      {
        outstanding: updatedOutstanding
      }
    );

    // Save payment record
    batch.set(
      doc(db, 'payments', payRecord.id),
      payRecord
    );

    await batch.commit();

    // Update local React state after Firebase succeeds
    setCustomers(prev =>
      prev.map(c =>
        c.id === customerId
          ? {
              ...c,
              outstanding: updatedOutstanding
            }
          : c
      )
    );

    setPayments(prev => [
      payRecord,
      ...prev
    ]);

    console.log(
      'Customer payment saved to Firestore:',
      payRecord.id
    );

    return true;

  } catch (error) {
    console.error(
      'Error saving customer payment to Firestore:',
      error
    );

    alert('Failed to save customer payment to Firebase.');

    return false;
  }
};

  // ============================================================
// SUPPLIER MANAGEMENT - FIRESTORE
// ============================================================

const addSupplier = async (suppData) => {
  const newSupp = {
    ...suppData,
    id: `SUPP-${Date.now().toString().slice(-4)}`,
    totalPurchases: 0,
    payable: Number(suppData.payable) || 0
  };

  try {
    await setDoc(
      doc(db, 'suppliers', newSupp.id),
      newSupp
    );

    setSuppliers(prev => [newSupp, ...prev]);

    console.log(
      'Supplier saved to Firestore:',
      newSupp.id
    );

    return newSupp;

  } catch (error) {
    console.error(
      'Error saving supplier to Firestore:',
      error
    );

    alert('Failed to save supplier to Firebase.');

    return null;
  }
};


const updateSupplier = async (id, updatedSupp) => {
  try {
    await updateDoc(
      doc(db, 'suppliers', id),
      updatedSupp
    );

    setSuppliers(prev =>
      prev.map(s =>
        s.id === id
          ? { ...s, ...updatedSupp }
          : s
      )
    );

    console.log(
      'Supplier updated in Firestore:',
      id
    );

    return true;

  } catch (error) {
    console.error(
      'Error updating supplier in Firestore:',
      error
    );

    alert('Failed to update supplier in Firebase.');

    return false;
  }
};


const deleteSupplier = async (id) => {
  try {
    await deleteDoc(
      doc(db, 'suppliers', id)
    );

    setSuppliers(prev =>
      prev.filter(s => s.id !== id)
    );

    console.log(
      'Supplier deleted from Firestore:',
      id
    );

    return true;

  } catch (error) {
    console.error(
      'Error deleting supplier from Firestore:',
      error
    );

    alert('Failed to delete supplier from Firebase.');

    return false;
  }
};

  const deleteInvoice = async (id) => {
  try {
    await deleteDoc(
      doc(db, 'invoices', id)
    );

    setInvoices(prev =>
      prev.filter(inv => inv.id !== id)
    );

    console.log(
      'Invoice deleted from Firestore:',
      id
    );

    return true;

  } catch (error) {
    console.error(
      'Error deleting invoice from Firestore:',
      error
    );

    alert('Failed to delete invoice from Firebase.');

    return false;
  }
};

  const deleteInventoryLog = async (id) => {
  try {
    await deleteDoc(
      doc(db, 'inventoryLogs', id)
    );

    setInventoryLogs(prev =>
      prev.filter(log => log.id !== id)
    );

    console.log(
      'Inventory log deleted from Firestore:',
      id
    );

    return true;

  } catch (error) {
    console.error(
      'Error deleting inventory log from Firestore:',
      error
    );

    alert(
      'Failed to delete inventory log from Firebase.'
    );

    return false;
  }
};

  const deletePayment = async (id) => {
  try {
    await deleteDoc(
      doc(db, 'payments', id)
    );

    setPayments(prev =>
      prev.filter(pay => pay.id !== id)
    );

    console.log(
      'Payment deleted from Firestore:',
      id
    );

    return true;

  } catch (error) {
    console.error(
      'Error deleting payment from Firestore:',
      error
    );

    alert(
      'Failed to delete payment from Firebase.'
    );

    return false;
  }
};

  const recordSupplierPayment = async (
  supplierId,
  amount,
  mode,
  note
) => {
  const payAmt = Number(amount);

  const supplier = suppliers.find(
    s => s.id === supplierId
  );

  if (!supplier) {
    alert('Supplier not found.');
    return false;
  }

  const updatedPayable = Math.max(
    0,
    (Number(supplier.payable) || 0) - payAmt
  );

  const payRecord = {
    id: `PAY-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    type: 'OUT',
    entityName: supplier.name,
    amount: payAmt,
    mode: mode || 'Bank Transfer',
    reference: note || 'Supplier Payment'
  };

  try {
    const batch = writeBatch(db);

    batch.update(
      doc(db, 'suppliers', supplierId),
      {
        payable: updatedPayable
      }
    );

    batch.set(
      doc(db, 'payments', payRecord.id),
      payRecord
    );

    await batch.commit();

    setSuppliers(prev =>
      prev.map(s =>
        s.id === supplierId
          ? {
              ...s,
              payable: updatedPayable
            }
          : s
      )
    );

    setPayments(prev => [
      payRecord,
      ...prev
    ]);

    console.log(
      'Supplier payment saved to Firestore:',
      payRecord.id
    );

    return true;

  } catch (error) {
    console.error(
      'Error saving supplier payment to Firestore:',
      error
    );

    alert('Failed to save supplier payment to Firebase.');

    return false;
  }
};

  // ============================================================
// CREATE PURCHASE - FIRESTORE ATOMIC TRANSACTION
// ============================================================

const createPurchase = async (purchaseData) => {
  const timestamp = Date.now();

  const purchaseId = `PUR-${timestamp}`;
  const poNumber = `PO-${timestamp.toString().slice(-4)}`;
  const paymentId = `PAY-${timestamp}`;

  const inventoryLogIds = purchaseData.items.map(
    (_, index) => `LOG-${timestamp}-PUR-${index}`
  );

  try {
    const result = await runTransaction(
      db,
      async (transaction) => {

        // ------------------------------------------------------
        // 1. Read supplier
        // ------------------------------------------------------
        const supplierRef = doc(
          db,
          'suppliers',
          purchaseData.supplierId
        );

        const supplierSnap =
          await transaction.get(supplierRef);

        if (!supplierSnap.exists()) {
          throw new Error(
            'Supplier not found in Firebase.'
          );
        }

        const supplierData =
          supplierSnap.data();

        // ------------------------------------------------------
        // 2. Read all products
        // ------------------------------------------------------
        const productSnapshots = [];

        for (const item of purchaseData.items) {
          const productRef = doc(
            db,
            'products',
            item.productId
          );

          const productSnap =
            await transaction.get(productRef);

          if (!productSnap.exists()) {
            throw new Error(
              `Product not found in Firebase: ${item.productId}`
            );
          }

          productSnapshots.push({
            item,
            ref: productRef,
            snap: productSnap
          });
        }

        // ------------------------------------------------------
        // 3. Prepare purchase
        // ------------------------------------------------------
        const newPO = {
          ...purchaseData,
          id: purchaseId,
          poNumber,
          date: new Date()
            .toISOString()
            .slice(0, 10),
          createdBy:
            user?.name || 'Admin'
        };

        // ------------------------------------------------------
        // 4. Save purchase
        // ------------------------------------------------------
        transaction.set(
          doc(db, 'purchases', purchaseId),
          newPO
        );

        // ------------------------------------------------------
        // 5. Increase stock + inventory logs
        // ------------------------------------------------------
        const updatedProducts = [];
        const newInventoryLogs = [];

        productSnapshots.forEach(
          (entry, index) => {

            const productData =
              entry.snap.data();

            const previousStock =
              Number(productData.stock) || 0;

            const changeQty =
              Number(entry.item.qty) || 0;

            const newStock =
              previousStock + changeQty;

            transaction.update(
              entry.ref,
              {
                stock: newStock
              }
            );

            const log = {
              id: inventoryLogIds[index],

              date: new Date()
                .toISOString()
                .slice(0, 10),

              productId:
                entry.item.productId,

              productName:
                productData.name ||
                entry.item.name ||
                '',

              changeQty,
              previousStock,
              newStock,

              type: 'Stock In',

              reason:
                `Purchase Order #${poNumber}`
            };

            transaction.set(
              doc(
                db,
                'inventoryLogs',
                log.id
              ),
              log
            );

            updatedProducts.push({
              id: entry.item.productId,
              stock: newStock
            });

            newInventoryLogs.push(log);
          }
        );

               // ------------------------------------------------------
        // 6. Update supplier
        // ------------------------------------------------------
        const purchaseTotal =
          Number(purchaseData.total) || 0;

        const amountPaid = Math.min(
          Math.max(
            Number(purchaseData.amountPaid) || 0,
            0
          ),
          purchaseTotal
        );

        const balanceDue = Math.max(
          0,
          purchaseTotal - amountPaid
        );

        const paymentStatus =
          balanceDue <= 0
            ? 'PAID'
            : amountPaid > 0
              ? 'PARTIAL'
              : 'UNPAID';

        const updatedTotalPurchases =
          (Number(
            supplierData.totalPurchases
          ) || 0) + purchaseTotal;

        const updatedPayable =
          (Number(
            supplierData.payable
          ) || 0) + balanceDue;

        transaction.update(
          supplierRef,
          {
            totalPurchases:
              updatedTotalPurchases,

            payable:
              updatedPayable
          }
        );

        // ------------------------------------------------------
        // 7. Payment record if any amount was paid
        // ------------------------------------------------------
        let payRecord = null;

        if (amountPaid > 0) {
          payRecord = {
            id: paymentId,

            date: new Date()
              .toISOString()
              .slice(0, 10),

            type: 'OUT',

            entityName:
              purchaseData.supplierName,

            supplierId:
              purchaseData.supplierId,

            purchaseId,

            amount:
              amountPaid,

            mode:
              purchaseData.paymentMode ||
              'Cash',

            reference:
              purchaseData.supplierInvoiceNo
                ? `${poNumber} / ${purchaseData.supplierInvoiceNo}`
                : poNumber
          };

          transaction.set(
            doc(
              db,
              'payments',
              paymentId
            ),
            payRecord
          );
        }

        // ------------------------------------------------------
        // 8. Ensure normalized payment values are saved
        // ------------------------------------------------------
        transaction.update(
          doc(db, 'purchases', purchaseId),
          {
            amountPaid,
            balanceDue,
            paymentStatus,
            paymentMode:
              amountPaid > 0
                ? purchaseData.paymentMode || 'Cash'
                : 'Credit'
          }
        );

        return {
          newPO,
          updatedProducts,
          newInventoryLogs,

          updatedSupplier: {
            id:
              purchaseData.supplierId,

            totalPurchases:
              updatedTotalPurchases,

            payable:
              updatedPayable
          },

          payRecord
        };
      }
    );

    // ----------------------------------------------------------
    // Firestore succeeded → update React state
    // ----------------------------------------------------------

    setPurchases(prev => [
      result.newPO,
      ...prev
    ]);

    setProducts(prev =>
      prev.map(product => {

        const updated =
          result.updatedProducts.find(
            p => p.id === product.id
          );

        return updated
          ? {
              ...product,
              stock: updated.stock
            }
          : product;
      })
    );

    setInventoryLogs(prev => [
      ...result.newInventoryLogs,
      ...prev
    ]);

    setSuppliers(prev =>
      prev.map(supplier =>
        supplier.id ===
        result.updatedSupplier.id
          ? {
              ...supplier,
              ...result.updatedSupplier
            }
          : supplier
      )
    );

    if (result.payRecord) {
      setPayments(prev => [
        result.payRecord,
        ...prev
      ]);
    }

    console.log(
      'Purchase saved to Firestore:',
      result.newPO.poNumber
    );

    return result.newPO;

  } catch (error) {
    console.error(
      'Error creating purchase in Firestore:',
      error
    );

    alert(
      `Purchase was NOT created.\n\n${
        error.message ||
        'Firebase transaction failed.'
      }`
    );

    return null;
  }
};
  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  const updateSettings = async (newSet) => {
  try {
    const updatedSettings = {
      ...settings,
      ...newSet
    };

    await setDoc(
      doc(db, 'settings', 'store'),
      updatedSettings,
      { merge: true }
    );

    setSettings(updatedSettings);

    console.log(
      'Settings updated in Firestore'
    );

    return true;

  } catch (error) {
    console.error(
      'Error updating settings in Firestore:',
      error
    );

    alert(
      'Failed to save settings to Firebase.'
    );

    return false;
  }
};

const updateInvoiceCounters = async (
  newTaxSeq,
  newRetailSeq
) => {
  try {
    const taxSeq =
      Number(newTaxSeq) || 1001;

    const retailSeq =
      Number(newRetailSeq) || 1001;

    await setDoc(
      doc(db, 'counters', 'invoices'),
      {
        taxInvoiceSeq: taxSeq,
        retailBillSeq: retailSeq
      },
      { merge: true }
    );

    setTaxInvoiceSeq(taxSeq);
    setRetailBillSeq(retailSeq);

    console.log(
      'Invoice counters updated in Firestore'
    );

    return true;

  } catch (error) {
    console.error(
      'Error updating invoice counters:',
      error
    );

    alert(
      'Failed to update invoice counters in Firebase.'
    );

    return false;
  }
};
  // ============================================================
  // ONE-TIME PRODUCTION DATA MIGRATION
  // Copies current browser localStorage data to Firestore.
  // Does NOT delete localStorage data.
  // ============================================================

  const migrateProductionDataToFirebase = async () => {
    if (!user) {
      alert('Please login before starting the migration.');
      return;
    }

    if (user.role !== 'admin') {
      alert('Only an Admin can run the migration.');
      return;
    }

    try {
      setCloudStatus({
        synced: false,
        text: 'Migrating data to Firebase...'
      });

      console.log('Starting production data migration...');

      const categoriesData = JSON.parse(
        localStorage.getItem('hb_categories') || '[]'
      );

      const customersData = JSON.parse(
        localStorage.getItem('hb_customers') || '[]'
      );

      const suppliersData = JSON.parse(
        localStorage.getItem('hb_suppliers') || '[]'
      );

      const purchasesData = JSON.parse(
        localStorage.getItem('hb_purchases') || '[]'
      );

      const invoicesData = JSON.parse(
        localStorage.getItem('hb_invoices') || '[]'
      );

      const paymentsData = JSON.parse(
        localStorage.getItem('hb_payments') || '[]'
      );

      const inventoryLogsData = JSON.parse(
        localStorage.getItem('hb_inventory_logs') || '[]'
      );

      const settingsData = JSON.parse(
        localStorage.getItem('hb_settings') || '{}'
      );

      const taxSeq = Number(
        localStorage.getItem('hb_tax_invoice_seq') || 1001
      );

      const retailSeq = Number(
        localStorage.getItem('hb_retail_bill_seq') || 1001
      );

      console.log('Production data found:', {
        categories: categoriesData.length,
        customers: customersData.length,
        suppliers: suppliersData.length,
        purchases: purchasesData.length,
        invoices: invoicesData.length,
        payments: paymentsData.length,
        inventoryLogs: inventoryLogsData.length,
        taxInvoiceSeq: taxSeq,
        retailBillSeq: retailSeq
      });

      // ------------------------------------------------------------
      // Helper: write documents in batches
      // ------------------------------------------------------------

      const writeCollection = async (collectionName, records) => {
        if (!Array.isArray(records) || records.length === 0) {
          console.log(`No records to migrate for ${collectionName}`);
          return;
        }

        for (let start = 0; start < records.length; start += 450) {
          const batch = writeBatch(db);
          const chunk = records.slice(start, start + 450);

          chunk.forEach((record) => {
            if (!record || !record.id) {
              console.warn(
                `Skipping invalid record in ${collectionName}:`,
                record
              );
              return;
            }

            const recordRef = doc(
              db,
              collectionName,
              String(record.id)
            );

            batch.set(recordRef, record);
          });

          await batch.commit();

          console.log(
            `Migrated ${chunk.length} records to ${collectionName}`
          );
        }
      };

      // ------------------------------------------------------------
      // Migrate collections
      // ------------------------------------------------------------

      await writeCollection('customers', customersData);

      await writeCollection('suppliers', suppliersData);

      await writeCollection('purchases', purchasesData);

      await writeCollection('invoices', invoicesData);

      await writeCollection('payments', paymentsData);

      await writeCollection('inventoryLogs', inventoryLogsData);

      // ------------------------------------------------------------
      // Categories
      // ------------------------------------------------------------

      await setDoc(
        doc(db, 'categories', 'config'),
        {
          categories: categoriesData,
          migratedAt: new Date().toISOString()
        }
      );

      // ------------------------------------------------------------
      // Store Settings
      // ------------------------------------------------------------

      await setDoc(
        doc(db, 'settings', 'store'),
        {
          ...settingsData,
          migratedAt: new Date().toISOString()
        }
      );

      // ------------------------------------------------------------
      // Invoice Counters
      // ------------------------------------------------------------

      await setDoc(
        doc(db, 'counters', 'invoices'),
        {
          taxInvoiceSeq: taxSeq,
          retailBillSeq: retailSeq,
          migratedAt: new Date().toISOString()
        }
      );

      // ------------------------------------------------------------
      // Products intentionally NOT migrated.
      // Existing Firestore products remain untouched.
      // ------------------------------------------------------------

      setCloudStatus({
        synced: true,
        text: 'Migration completed'
      });

      console.log('====================================');
      console.log('PRODUCTION MIGRATION COMPLETED');
      console.log('====================================');

      alert(
        'Production data migration completed successfully!\n\n' +
        `Invoices: ${invoicesData.length}\n` +
        `Payments: ${paymentsData.length}\n` +
        `Inventory Logs: ${inventoryLogsData.length}\n` +
        `Customers: ${customersData.length}\n` +
        `Suppliers: ${suppliersData.length}\n` +
        `Purchases: ${purchasesData.length}`
      );

      return true;

    } catch (error) {
      console.error(
        'PRODUCTION MIGRATION FAILED:',
        error
      );

      setCloudStatus({
        synced: false,
        text: 'Migration failed'
      });

      alert(
        'Migration failed.\n\n' +
        'Your localStorage data has NOT been deleted.\n\n' +
        'Check the browser console for the error.'
      );

      return false;
    }
  };
 // ============================================================
  // Backup & Restore
  // ============================================================

  const exportDataJSON = () => {
    const data = {
  products,
  customers,
  suppliers,
  invoices,
  purchases,
  inventoryLogs,
  payments,
  categories,
  settings,

  counters: {
    taxInvoiceSeq,
    retailBillSeq
  },

  version: '2.0.0',
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

  const importDataJSON = async (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);

    const restoreCollection = async (
      collectionName,
      records = []
    ) => {
      for (let i = 0; i < records.length; i += 500) {
        const batch = writeBatch(db);

        records
          .slice(i, i + 500)
          .forEach(record => {
            if (!record?.id) return;

            batch.set(
              doc(db, collectionName, record.id),
              record,
              { merge: true }
            );
          });

        await batch.commit();
      }
    };

    await restoreCollection(
      'products',
      parsed.products || []
    );

    await restoreCollection(
      'customers',
      parsed.customers || []
    );

    await restoreCollection(
      'suppliers',
      parsed.suppliers || []
    );

    await restoreCollection(
      'invoices',
      parsed.invoices || []
    );

    await restoreCollection(
      'purchases',
      parsed.purchases || []
    );

    await restoreCollection(
      'inventoryLogs',
      parsed.inventoryLogs || []
    );

    await restoreCollection(
      'payments',
      parsed.payments || []
    );

    if (parsed.categories) {
      await setDoc(
        doc(db, 'categories', 'config'),
        {
          categories: parsed.categories
        },
        { merge: true }
      );
    }

    if (parsed.settings) {
      await setDoc(
        doc(db, 'settings', 'store'),
        parsed.settings,
        { merge: true }
      );
    }

    if (parsed.counters) {
      await setDoc(
        doc(db, 'counters', 'invoices'),
        {
          taxInvoiceSeq:
            Number(parsed.counters.taxInvoiceSeq) || 1001,

          retailBillSeq:
            Number(parsed.counters.retailBillSeq) || 1001
        },
        { merge: true }
      );
    }

    if (parsed.products) {
      setProducts(parsed.products);
    }

    if (parsed.customers) {
      setCustomers(parsed.customers);
    }

    if (parsed.suppliers) {
      setSuppliers(parsed.suppliers);
    }

    if (parsed.invoices) {
      setInvoices(parsed.invoices);
    }

    if (parsed.purchases) {
      setPurchases(parsed.purchases);
    }

    if (parsed.inventoryLogs) {
      setInventoryLogs(parsed.inventoryLogs);
    }

    if (parsed.payments) {
      setPayments(parsed.payments);
    }

    if (parsed.categories) {
      setCategories(parsed.categories);
    }

    if (parsed.settings) {
      setSettings(parsed.settings);
    }

    if (parsed.counters) {
      setTaxInvoiceSeq(
        Number(parsed.counters.taxInvoiceSeq) || 1001
      );

      setRetailBillSeq(
        Number(parsed.counters.retailBillSeq) || 1001
      );
    }

    alert(
      'Backup restored successfully to Firebase!'
    );

    return true;

  } catch (error) {
    console.error(
      'Error restoring backup to Firebase:',
      error
    );

    alert(
      `Backup restore failed.\n\n${
        error.message ||
        'Please choose a valid H BILLS backup file.'
      }`
    );

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

  const clearAllData = async (showPrompt = true) => {
  const confirmed =
    !showPrompt ||
    window.confirm(
      'Are you sure you want to permanently remove all products, customers, suppliers, invoices, purchases, payments, and inventory logs from Firebase?\n\nThis cannot be undone.'
    );

  if (!confirmed) {
    return false;
  }

  try {
    const collectionsToClear = [
      'products',
      'customers',
      'suppliers',
      'invoices',
      'purchases',
      'inventoryLogs',
      'payments'
    ];

    for (const collectionName of collectionsToClear) {
      const snapshot = await getDocs(
        collection(db, collectionName)
      );

      // Firestore write batches support up to 500 operations.
      for (let i = 0; i < snapshot.docs.length; i += 500) {
        const batch = writeBatch(db);

        snapshot.docs
          .slice(i, i + 500)
          .forEach(docSnap => {
            batch.delete(
              doc(db, collectionName, docSnap.id)
            );
          });

        await batch.commit();
      }

      console.log(
        `Cleared Firestore collection: ${collectionName}`
      );
    }

    // Clear React state only after Firebase succeeds.
    setProducts([]);
    setCustomers([]);
    setSuppliers([]);
    setInvoices([]);
    setPurchases([]);
    setInventoryLogs([]);
    setPayments([]);

    // Temporary localStorage cleanup while we are still
    // completing the Firebase migration.
    localStorage.removeItem('hb_products');
    localStorage.removeItem('hb_customers');
    localStorage.removeItem('hb_suppliers');
    localStorage.removeItem('hb_invoices');
    localStorage.removeItem('hb_purchases');
    localStorage.removeItem('hb_inventory_logs');
    localStorage.removeItem('hb_payments');

    console.log(
      'All business data cleared from Firestore.'
    );

    if (showPrompt) {
      alert(
        'All business data has been cleared successfully from Firebase.'
      );
    }

    return true;

  } catch (error) {
    console.error(
      'Error clearing Firebase business data:',
      error
    );

    alert(
      `Failed to clear all data from Firebase.\n\n${
        error.message || 'Unknown Firebase error.'
      }`
    );

    return false;
  }
};

  return (
  <AppContext.Provider
    value={{
      categories,
      addCategory,
      deleteCategory,

      products,
      setProducts,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,

      customers,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      recordCustomerPayment,

      suppliers,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      recordSupplierPayment,
      createPurchase,
      purchases,

      invoices,
      createInvoice,
      deleteInvoice,
      getNextInvoiceNumber,

      taxInvoiceSeq,
      setTaxInvoiceSeq,
      retailBillSeq,
      setRetailBillSeq,
      updateInvoiceCounters,

      inventoryLogs,
      deleteInventoryLog,

      payments,
      deletePayment,

      settings,
      updateSettings,
      toggleTheme,

      user,
      login,
      logout,
      authLoading,

      activeTab,
      setActiveTab,

      cloudStatus,

      exportDataJSON,
      importDataJSON,
      resetToDemoData,
      clearAllData,

      migrateProductionDataToFirebase
    }}
  >
    {children}
  </AppContext.Provider>
);

};

export const useApp = () => useContext(AppContext);

