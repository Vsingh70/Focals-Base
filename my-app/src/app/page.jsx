"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useGetProjects, useUpdateProject, useGetFinances, useUpdateFinance, useGetForm, useGetProfile, useUpdateProfile } from "@/utils/api";
import DesktopBar from "./components/DesktopBar";
import Select from 'react-select';
import List from "./components/Element/List";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [timeFilter, setTimeFilter] = useState({ value: 'all', label: 'All Time' });
  const [paymentTimeFilter, setPaymentTimeFilter] = useState({ value: 'all', label: 'All Time' });
  const [expenseTimeFilter, setExpenseTimeFilter] = useState({ value: 'all', label: 'All Time' });
  const [showProjectPopup, setShowProjectPopup] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [showExpensePopup, setShowExpensePopup] = useState(false);
  
  // Graph filter states
  const [elementToggle, setElementToggle] = useState('income'); // 'income' or 'expenses'
  const [elementCategory, setElementCategory] = useState('all');
  const [elementPeriod, setElementPeriod] = useState('all time');
  const [profitCategory, setProfitCategory] = useState('all');
  const [profitPeriod, setProfitPeriod] = useState('all time');
  
  // FieldWindow states
  const [windowField1, setWindowField1] = useState(null); // Field name for window 1
  const [windowField2, setWindowField2] = useState(null); // Field name for window 2  
  const [windowField3, setWindowField3] = useState(null); // Field name for window 3
  const [showFieldPopup1, setShowFieldPopup1] = useState(false);
  const [showFieldPopup2, setShowFieldPopup2] = useState(false);
  const [showFieldPopup3, setShowFieldPopup3] = useState(false);
  const [fieldTimeFilter1, setFieldTimeFilter1] = useState({ value: 'all', label: 'All Time' });
  const [fieldTimeFilter2, setFieldTimeFilter2] = useState({ value: 'all', label: 'All Time' });
  const [fieldTimeFilter3, setFieldTimeFilter3] = useState({ value: 'all', label: 'All Time' });
  
  const router = useRouter();

  // Fetch projects, finances, form data, and profile data when user is logged in
  const { data: projectsData, loading: projectsLoading } = useGetProjects();
  const { data: financesData, loading: financesLoading } = useGetFinances();
  const { data: formData, loading: formLoading } = useGetForm();
  const { data: profileData, loading: profileLoading } = useGetProfile();
  const { mutate: updateProject } = useUpdateProject();
  const { mutate: updateFinance } = useUpdateFinance();
  const { mutate: updateProfile } = useUpdateProfile();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Set projects data when available
  useEffect(() => {
    if (projectsData?.data && user) {
      setProjects(projectsData.data);
    }
  }, [projectsData?.data, user]);

  // Set finances data when available
  useEffect(() => {
    if (financesData?.data && user) {
      // Filter for pending payments (finances with Amount Paid = false and Amount > 0)
      const pendingPaymentFinances = financesData.data.filter(finance => 
        finance.type === 'income' && 
        finance.fields?.['Amount Paid']?.value === false && 
        parseFloat(finance.fields?.Amount?.value || 0) > 0
      );
      setPayments(pendingPaymentFinances);

      // Filter for pending expenses (finances with Amount Paid = false and Amount > 0 and type = expense)
      const pendingExpenseFinances = financesData.data.filter(finance => 
        finance.type === 'expense' && 
        finance.fields?.['Amount Paid']?.value === false && 
        parseFloat(finance.fields?.Amount?.value || 0) > 0
      );
      setExpenses(pendingExpenseFinances);
    }
  }, [financesData?.data, user]);

  // Load field window preferences from profile
  useEffect(() => {
    if (profileData?.data && user) {
      setWindowField1(profileData.data.window1);
      setWindowField2(profileData.data.window2);
      setWindowField3(profileData.data.window3);
    }
  }, [profileData?.data, user]);

  const handleLogin = () => {
    router.push("/login");
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleAccountAccess = async () => {
    router.push("/account");
  };

  // Helper function to get dynamic fields from form data
  const getDynamicFields = () => {
    if (!formData || !formData.data || !formData.data.fields) return [];
    
    // Define fields that should not appear in dropdowns (matching edit-form/page.jsx)
    const immutableFields = ['Name', 'Date', 'Category'];
    const fixedFields = ['Pay', 'Expenses', 'Expenses Paid', 'Payment Received'];
    const hiddenSystemFields = ['Payment Received Date', 'Expenses Paid Date'];
    const excludedFields = [...immutableFields, ...fixedFields, ...hiddenSystemFields];
    
    return Object.keys(formData.data.fields).filter(fieldName => 
      !excludedFields.includes(fieldName)
    );
  };

  // Get field options for dropdowns
  const getFieldOptions = () => {
    const dynamicFields = getDynamicFields();
    return dynamicFields.map(field => ({ value: field, label: field }));
  };

  // Helper function to check if a field is boolean type
  const isFieldBoolean = (fieldName) => {
    if (!formData || !formData.data || !formData.data.fields) return false;
    return formData.data.fields[fieldName]?.type === 'boolean';
  };

  // Handle project checkbox toggle for boolean fields
  const toggleProjectFieldValue = (projectId, fieldName) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const currentValue = project.fields?.[fieldName]?.value || false;
    const newValue = !currentValue;
    
    // Update local state immediately for instant UI feedback
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? {
            ...p,
            fields: {
              ...p.fields,
              [fieldName]: {
                ...p.fields?.[fieldName],
                value: newValue
              }
            }
          }
        : p
    ));

    // Update database in the background
    updateProject({ 
      id: projectId, 
      fields: {
        ...project.fields,
        [fieldName]: {
          ...project.fields?.[fieldName],
          value: newValue
        }
      }
    });
  };

  // Helper function to save window field preference to profile
  const saveWindowFieldPreference = async (windowNumber, fieldName) => {
    if (!user) return;
    
    const updateData = {};
    updateData[`window${windowNumber}`] = fieldName;
    
    try {
      await updateProfile(updateData);
    } catch (error) {
      console.error(`Failed to save window ${windowNumber} preference:`, error);
    }
  };

  // Enhanced setter functions that save to profile
  const setWindowField1WithSave = (fieldName) => {
    setWindowField1(fieldName);
    saveWindowFieldPreference(1, fieldName);
  };

  const setWindowField2WithSave = (fieldName) => {
    setWindowField2(fieldName);
    saveWindowFieldPreference(2, fieldName);
  };

  const setWindowField3WithSave = (fieldName) => {
    setWindowField3(fieldName);
    saveWindowFieldPreference(3, fieldName);
  };

  // Custom styles for react-select dropdowns  
  const selectCustomStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: 'var(--button-bg)',
      borderColor: 'var(--border)',
      minHeight: '32px',
      fontSize: '0.85rem'
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--border)'
    }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isFocused ? 'var(--button-bg-hover)' : 'var(--card-bg)',
      color: 'var(--text)',
      fontSize: '0.85rem'
    })
  };

  // Time filter options
  const timeFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'biannual', label: 'Bi-Yearly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'daily', label: 'Daily' }
  ];

  // Filter projects by time period and only show upcoming projects
  const filteredUpcomingProjects = useMemo(() => {
    if (!projects.length) return [];

    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Filter upcoming projects
    const upcomingProjects = projects.filter(project => {
      const projectDate = project?.fields?.Date?.value;
      if (!projectDate) return false;
      
      const projDate = new Date(projectDate);
      return projDate >= currentDate;
    });

    if (timeFilter.value === 'all') return upcomingProjects;

    const endDate = new Date(currentDate);
    
    switch (timeFilter.value) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'biannual':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    return upcomingProjects.filter(project => {
      const projectDate = new Date(project.fields.Date.value);
      return projectDate <= endDate;
    });
  }, [projects, timeFilter]);

  // Filter pending payments by time period (projects and finances combined)
  const filteredPendingPayments = useMemo(() => {
    if (!projects.length && !payments.length) return [];

    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get pending payment projects (Payment Received = false, Pay > 0)
    const pendingProjectPayments = projects.filter(project => {
      const fields = project.fields || {};
      const paymentReceived = fields['Payment Received']?.value === false;
      const payAmount = parseFloat(fields.Pay?.value || 0);
      return paymentReceived && payAmount > 0;
    }).map(project => ({
      ...project,
      source: 'project',
      amount: parseFloat(project.fields.Pay.value),
      category: project.fields?.Category?.value || 'Uncategorized'
    }));

    // Get pending finance payments
    const pendingFinancePayments = payments.map(finance => ({
      ...finance,
      source: 'finance',
      amount: parseFloat(finance.fields.Amount.value),
      category: finance.fields?.Category?.value || 'Uncategorized'
    }));

    // Combine both types
    let allPendingPayments = [...pendingProjectPayments, ...pendingFinancePayments];

    // Filter by time if not 'all'
    if (paymentTimeFilter.value !== 'all') {
      const endDate = new Date(currentDate);
      
      switch (paymentTimeFilter.value) {
        case 'daily':
          endDate.setDate(endDate.getDate() - 1);
          break;
        case 'weekly':
          endDate.setDate(endDate.getDate() - 7);
          break;
        case 'monthly':
          endDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'biannual':
          endDate.setMonth(endDate.getMonth() - 6);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      allPendingPayments = allPendingPayments.filter(item => {
        const itemDate = new Date(item.fields.Date.value);
        return itemDate >= endDate;
      });
    }

    // Sort by date (oldest first)
    return allPendingPayments.sort((a, b) => {
      const dateA = new Date(a.fields.Date.value);
      const dateB = new Date(b.fields.Date.value);
      return dateA - dateB;
    });
  }, [projects, payments, paymentTimeFilter]);

  // Filter pending expenses by time period (projects and finances combined)
  const filteredPendingExpenses = useMemo(() => {
    if (!projects.length && !expenses.length) return [];

    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get pending expense projects (Expenses Paid = false, Expenses > 0)
    const pendingProjectExpenses = projects.filter(project => {
      const fields = project.fields || {};
      const expensesPaid = fields['Expenses Paid']?.value === false;
      const expensesAmount = parseFloat(fields.Expenses?.value || 0);
      return expensesPaid && expensesAmount > 0;
    }).map(project => ({
      ...project,
      source: 'project',
      amount: parseFloat(project.fields.Expenses.value),
      category: project.fields?.Category?.value || 'Uncategorized'
    }));

    // Get pending finance expenses
    const pendingFinanceExpenses = expenses.map(finance => ({
      ...finance,
      source: 'finance',
      amount: parseFloat(finance.fields.Amount.value),
      category: finance.fields?.Category?.value || 'Uncategorized'
    }));

    // Combine both types
    let allPendingExpenses = [...pendingProjectExpenses, ...pendingFinanceExpenses];

    // Filter by time if not 'all'
    if (expenseTimeFilter.value !== 'all') {
      const endDate = new Date(currentDate);
      
      switch (expenseTimeFilter.value) {
        case 'daily':
          endDate.setDate(endDate.getDate() - 1);
          break;
        case 'weekly':
          endDate.setDate(endDate.getDate() - 7);
          break;
        case 'monthly':
          endDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'biannual':
          endDate.setMonth(endDate.getMonth() - 6);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      allPendingExpenses = allPendingExpenses.filter(item => {
        const itemDate = new Date(item.fields.Date.value);
        return itemDate >= endDate;
      });
    }

    // Sort by date (oldest first)
    return allPendingExpenses.sort((a, b) => {
      const dateA = new Date(a.fields.Date.value);
      const dateB = new Date(b.fields.Date.value);
      return dateA - dateB;
    });
  }, [projects, expenses, expenseTimeFilter]);

  // Filter projects for FieldWindow 1
  const filteredFieldProjects1 = useMemo(() => {
    if (!projects.length || !windowField1) return [];

    let filteredProjects;
    
    // For boolean fields, show all projects so users can toggle them
    if (isFieldBoolean(windowField1)) {
      filteredProjects = projects;
    } else {
      // For non-boolean fields, only show projects that have data for this field
      filteredProjects = projects.filter(project => {
        const fieldValue = project.fields?.[windowField1]?.value;
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      });
    }

    if (fieldTimeFilter1.value === 'all') return filteredProjects;

    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(currentDate);
    
    switch (fieldTimeFilter1.value) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'biannual':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    return filteredProjects.filter(project => {
      const projectDate = project.fields?.Date?.value;
      if (!projectDate) return true; // Include projects without dates
      const projDate = new Date(projectDate);
      return projDate >= currentDate && projDate <= endDate;
    });
  }, [projects, windowField1, fieldTimeFilter1]);

  // Filter projects for FieldWindow 2
  const filteredFieldProjects2 = useMemo(() => {
    if (!projects.length || !windowField2) return [];

    let filteredProjects;
    
    // For boolean fields, show all projects so users can toggle them
    if (isFieldBoolean(windowField2)) {
      filteredProjects = projects;
    } else {
      // For non-boolean fields, only show projects that have data for this field
      filteredProjects = projects.filter(project => {
        const fieldValue = project.fields?.[windowField2]?.value;
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      });
    }

    if (fieldTimeFilter2.value === 'all') return filteredProjects;

    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(currentDate);
    
    switch (fieldTimeFilter2.value) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'biannual':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    return filteredProjects.filter(project => {
      const projectDate = project.fields?.Date?.value;
      if (!projectDate) return true; // Include projects without dates
      const projDate = new Date(projectDate);
      return projDate >= currentDate && projDate <= endDate;
    });
  }, [projects, windowField2, fieldTimeFilter2]);

  // Filter projects for FieldWindow 3
  const filteredFieldProjects3 = useMemo(() => {
    if (!projects.length || !windowField3) return [];

    let filteredProjects;
    
    // For boolean fields, show all projects so users can toggle them
    if (isFieldBoolean(windowField3)) {
      filteredProjects = projects;
    } else {
      // For non-boolean fields, only show projects that have data for this field
      filteredProjects = projects.filter(project => {
        const fieldValue = project.fields?.[windowField3]?.value;
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      });
    }

    if (fieldTimeFilter3.value === 'all') return filteredProjects;

    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(currentDate);
    
    switch (fieldTimeFilter3.value) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'biannual':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    return filteredProjects.filter(project => {
      const projectDate = project.fields?.Date?.value;
      if (!projectDate) return true; // Include projects without dates
      const projDate = new Date(projectDate);
      return projDate >= currentDate && projDate <= endDate;
    });
  }, [projects, windowField3, fieldTimeFilter3]);

  // Process data for graphs (similar to finances page)
  const processedGraphData = useMemo(() => {
    const financeItems = financesData?.data || [];
    const projectItems = projects || [];
    
    const allItems = [];
    
    // Add finance items (only if Amount Paid is true)
    financeItems.forEach(item => {
      if (item.fields?.['Amount Paid']?.value === true) {
        allItems.push({
          ...item,
          source: 'finance',
          category: item.fields?.Category?.value || 'Uncategorized',
          amount: parseFloat(item.fields?.Amount?.value || 0),
          date: item.fields?.Date?.value,
          name: item.fields?.Name?.value || 'Unnamed',
          isIncome: item.type === 'income',
          isExpense: item.type === 'expense'
        });
      }
    });
    
    // Add valid project items (income if Payment Received and Pay > 0)
    projectItems.forEach(project => {
      const fields = project.fields || {};
      const paymentReceived = fields['Payment Received']?.value === true;
      const payAmount = parseFloat(fields.Pay?.value || 0);
      const expensesPaid = fields['Expenses Paid']?.value === true;
      const expensesAmount = parseFloat(fields.Expenses?.value || 0);
      
      // Add as income if payment received and pay > 0
      if (paymentReceived && payAmount > 0) {
        allItems.push({
          id: `project-income-${project.id}`,
          source: 'project',
          type: 'income',
          category: fields.Category?.value || 'Uncategorized',
          amount: payAmount,
          date: fields.Date?.value,
          name: fields.Name?.value || 'Unnamed',
          isIncome: true,
          isExpense: false
        });
      }
      
      // Add as expense if expenses paid and expenses > 0
      if (expensesPaid && expensesAmount > 0) {
        allItems.push({
          id: `project-expense-${project.id}`,
          source: 'project',
          type: 'expense',
          category: fields.Category?.value || 'Uncategorized',
          amount: expensesAmount,
          date: fields.Date?.value,
          name: fields.Name?.value || 'Unnamed',
          isIncome: false,
          isExpense: true
        });
      }
    });
    
    return allItems;
  }, [financesData, projects]);

  // Time period options for graphs
  const timePeriods = ['all time', 'yearly', 'bi-yearly', 'quarterly', 'monthly', 'weekly', 'daily'];

  // Get unique categories from graph data
  const categories = useMemo(() => {
    const cats = [...new Set(processedGraphData.map(item => item.category))].filter(Boolean);
    return ['all', ...cats];
  }, [processedGraphData]);

  // Filter data by period
  const filterByPeriod = (data, period) => {
    if (period === 'all time') return data;
    
    const now = new Date();
    const filtered = data.filter(item => {
      if (!item.date) return false;
      const itemDate = new Date(item.date);
      const diffTime = Math.abs(now - itemDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (period) {
        case 'daily': return diffDays <= 1;
        case 'weekly': return diffDays <= 7;
        case 'monthly': return diffDays <= 30;
        case 'quarterly': return diffDays <= 90;
        case 'bi-yearly': return diffDays <= 180;
        case 'yearly': return diffDays <= 365;
        default: return true;
      }
    });
    
    return filtered;
  };

  // Prepare element graph data (line chart with timeline)
  const elementGraphData = useMemo(() => {
    let filtered = processedGraphData.filter(item => 
      elementToggle === 'income' ? item.isIncome : item.isExpense
    );
    
    if (elementCategory !== 'all') {
      filtered = filtered.filter(item => item.category === elementCategory);
    }
    
    filtered = filterByPeriod(filtered, elementPeriod);
    
    // Group by date for timeline
    const grouped = filtered.reduce((acc, item) => {
      const date = item.date || 'Unknown';
      if (!acc[date]) acc[date] = 0;
      acc[date] += item.amount;
      return acc;
    }, {});
    
    return Object.entries(grouped)
      .map(([date, amount]) => ({
        date,
        amount: Math.round(amount * 100) / 100,
        displayDate: date !== 'Unknown' ? new Date(date).toLocaleDateString() : 'Unknown'
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [processedGraphData, elementToggle, elementCategory, elementPeriod]);

  // Prepare profit graph data (profit line chart with timeline)
  const profitGraphData = useMemo(() => {
    let filtered = processedGraphData;
    
    if (profitCategory !== 'all') {
      filtered = filtered.filter(item => item.category === profitCategory);
    }
    
    filtered = filterByPeriod(filtered, profitPeriod);
    
    // Group by date for timeline
    const grouped = filtered.reduce((acc, item) => {
      const date = item.date || 'Unknown';
      if (!acc[date]) acc[date] = { income: 0, expenses: 0 };
      
      if (item.isIncome) {
        acc[date].income += item.amount;
      } else {
        acc[date].expenses += item.amount;
      }
      return acc;
    }, {});
    
    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        profit: Math.round((data.income - data.expenses) * 100) / 100,
        displayDate: date !== 'Unknown' ? new Date(date).toLocaleDateString() : 'Unknown'
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [processedGraphData, profitCategory, profitPeriod]);

  const ProjectWindow = () => {
    const handleWindowClick = (e) => {
      // Check if the click is on the window background and not on any interactive elements
      if (e.target === e.currentTarget) {
        setShowProjectPopup(true);
      }
    };

    const handleProjectClick = (projectId, e) => {
      e.stopPropagation(); // Prevent window click from triggering
      router.push(`/projects/${projectId}`);
    };

    return (
      <div 
        style={{
          border: '2px solid var(--border)',
          borderRadius: '12px',
          background: 'var(--bg)',
          padding: '1rem',
          height: '300px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'background 0.2s',
          cursor: 'pointer'
        }}
        onClick={handleWindowClick}
        onMouseOver={e => {
            e.currentTarget.style.backgroundColor = 'var(--card-bg)';
        }}
        onMouseOut={e => {
            e.currentTarget.style.backgroundColor = 'var(--bg)';
        }}
      >
        {/* Header with title and dropdown */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.5rem'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent window click on header
        >
          <h3 style={{
            margin: 0,
            color: 'var(--text)',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}>
            Upcoming Projects
          </h3>
          <div style={{ width: '150px' }}>
            <Select
              value={timeFilter}
              onChange={setTimeFilter}
              options={timeFilterOptions}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: 'var(--button-bg)',
                  borderColor: 'var(--border)',
                  minHeight: '32px',
                  fontSize: '0.85rem'
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }),
                option: (base, { isFocused }) => ({
                  ...base,
                  backgroundColor: isFocused ? 'var(--button-bg-hover)' : 'var(--card-bg)',
                  color: 'var(--text)',
                  fontSize: '0.85rem'
                })
              }}
              isSearchable={false}
            />
          </div>
        </div>

        {/* Scrollable project list */}
        <div 
          className="project-window-scroll"
          style={{
            flex: 1,
            overflow: 'auto',
            paddingRight: '5px'
          }}
          onWheel={(e) => {
            e.stopPropagation();
          }}>
          {projectsLoading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              color: 'var(--text)' 
            }}>
              Loading...
            </div>
          ) : filteredUpcomingProjects.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              color: 'var(--text)' 
            }}>
              No upcoming projects
            </div>
          ) : (
            filteredUpcomingProjects.map((project, index) => {
              const formatDate = (timestamp) => {
                if (!timestamp) return '';
                const date = new Date(timestamp);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
              };

              return (
                <div key={project.id} style={{
                  padding: '8px 12px',
                  background: 'var(--button-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  marginBottom: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontSize: '0.9rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                }}
                onClick={(e) => handleProjectClick(project.id, e)}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '4px'
                  }}>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: 'var(--text)',
                      flex: '1',
                      minWidth: '100px'
                    }}>
                      {project.fields?.Name?.value || 'Untitled'}
                    </span>
                    <span style={{ 
                      color: 'var(--text)', 
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatDate(project.fields?.Date?.value)}
                    </span>
                  </div>
                  {project.fields?.Category?.value && (
                    <div style={{
                      marginTop: '4px',
                      fontSize: '0.8rem',
                      color: 'var(--secondary)'
                    }}>
                      {project.fields.Category.value}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Project Details Popup */}
        {showProjectPopup && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg)',
              color: 'var(--text)',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              minWidth: '600px',
              maxWidth: '80vw',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '1rem'
              }}>
                <h2 style={{ margin: 0 }}>Upcoming Projects Details</h2>
                <button
                  onClick={() => setShowProjectPopup(false)}
                  style={{
                    background: 'var(--unselected)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    color: 'black',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--unselected-hover)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--unselected)';
                  }}
                >
                  Close
                </button>
              </div>
              <List 
                list={filteredUpcomingProjects}
                updatePath="/api/projects/update-project"
                fetchPath="/api/projects/get-project"
                selected={[]}
                setSelected={() => {}}
                handleSelect={() => {}}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const PaymentWindow = () => {
    const handleWindowClick = (e) => {
      // Check if the click is on the window background and not on any interactive elements
      if (e.target === e.currentTarget) {
        setShowPaymentPopup(true);
      }
    };

    const handlePaymentClick = (item, e) => {
      e.stopPropagation(); // Prevent window click from triggering
      if (item.source === 'project') {
        router.push(`/projects/${item.id}`);
      } else {
        router.push(`/finances/${item.id}`);
      }
    };

    const handlePaymentReceived = async (item, e) => {
      e.stopPropagation(); // Prevent item click from triggering

      try {
        if (item.source === 'project') {
          // Update project's Payment Received field
          const updatedFields = {
            ...item.fields,
            'Payment Received': {
              ...item.fields['Payment Received'],
              value: true
            }
          };

          await updateProject({
            id: item.id,
            fields: updatedFields
          });

          // Remove from projects list locally
          setProjects(prev => prev.map(project => 
            project.id === item.id 
              ? { ...project, fields: updatedFields }
              : project
          ));
        } else {
          // Update finance's Amount Paid field
          const updatedFields = {
            ...item.fields,
            'Amount Paid': {
              ...item.fields['Amount Paid'],
              value: true
            }
          };

          await updateFinance({
            id: item.id,
            fields: updatedFields,
            type: item.type
          });

          // Remove from payments list locally
          setPayments(prev => prev.filter(payment => payment.id !== item.id));
        }
      } catch (error) {
        console.error('Error updating payment status:', error);
        alert(`Failed to update payment status: ${error.message}`);
      }
    };

    return (
      <div 
        style={{
          border: '2px solid var(--border)',
          borderRadius: '12px',
          background: 'var(--bg)',
          padding: '1rem',
          height: '300px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          cursor: 'pointer'
        }}
        onClick={handleWindowClick}
        onMouseOver={e => {
            e.currentTarget.style.backgroundColor = 'var(--card-bg)';
        }}
        onMouseOut={e => {
            e.currentTarget.style.backgroundColor = 'var(--bg)';
        }}
      >
        {/* Header with title and dropdown */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.5rem'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent window click on header
        >
          <h3 style={{
            margin: 0,
            color: 'var(--text)',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}>
            Pending Payments
          </h3>
          <div style={{ width: '150px' }}>
            <Select
              value={paymentTimeFilter}
              onChange={setPaymentTimeFilter}
              options={timeFilterOptions}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: 'var(--button-bg)',
                  borderColor: 'var(--border)',
                  minHeight: '32px',
                  fontSize: '0.85rem'
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }),
                option: (base, { isFocused }) => ({
                  ...base,
                  backgroundColor: isFocused ? 'var(--button-bg-hover)' : 'var(--card-bg)',
                  color: 'var(--text)',
                  fontSize: '0.85rem'
                })
              }}
              isSearchable={false}
            />
          </div>
        </div>

        {/* Scrollable payment list */}
        <div 
          className="project-window-scroll"
          style={{
            flex: 1,
            overflow: 'auto',
            paddingRight: '5px'
          }}
          onWheel={(e) => {
            e.stopPropagation();
          }}>
          {(projectsLoading || financesLoading) ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              color: 'var(--text)' 
            }}>
              Loading...
            </div>
          ) : filteredPendingPayments.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              color: 'var(--text)' 
            }}>
              No pending payments
            </div>
          ) : (
            filteredPendingPayments.map((item, index) => {
              const formatDate = (timestamp) => {
                if (!timestamp) return '';
                const date = new Date(timestamp);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
              };

              const formatCurrency = (amount) => {
                return `$${amount.toFixed(2)}`;
              };

              return (
                <div key={`${item.source}-${item.id}`} style={{
                  padding: '8px 12px',
                  background: 'var(--button-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  marginBottom: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                }}
                onClick={(e) => handlePaymentClick(item, e)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '4px'
                    }}>
                      <span style={{ 
                        fontWeight: 'bold', 
                        color: 'var(--text)',
                        flex: '1',
                        minWidth: '80px'
                      }}>
                        {item.fields?.Name?.value || 'Untitled'}
                      </span>
                      <span style={{ 
                        color: 'var(--text)', 
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap'
                      }}>
                        {formatDate(item.fields?.Date?.value)}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '4px',
                      gap: '4px'
                    }}>
                      <span style={{
                        fontSize: '0.8rem',
                        color: 'var(--secondary)'
                      }}>
                        {item.category}
                      </span>
                      <span style={{
                        fontSize: '0.8rem',
                        color: 'green',
                        fontWeight: 'bold'
                      }}>
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Received Checkbox */}
                  <div style={{ marginLeft: '8px' }}>
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={(e) => handlePaymentReceived(item, e)}
                      style={{
                        cursor: 'pointer',
                        accentColor: 'var(--primary)',
                        transform: 'scale(1.1)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                      title="Mark as paid"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Payment Details Popup */}
        {showPaymentPopup && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg)',
              color: 'var(--text)',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              minWidth: '600px',
              maxWidth: '80vw',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '1rem'
              }}>
                <h2 style={{ margin: 0 }}>Pending Payments Details</h2>
                <button
                  onClick={() => setShowPaymentPopup(false)}
                  style={{
                    background: 'var(--unselected)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    color: 'black',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--unselected-hover)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--unselected)';
                  }}
                >
                  Close
                </button>
              </div>
              <List 
                list={filteredPendingPayments}
                updatePath="/api/projects/update-project"
                fetchPath="/api/projects/get-project"
                selected={[]}
                setSelected={() => {}}
                handleSelect={() => {}}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const ExpenseWindow = () => {
    const handleWindowClick = (e) => {
      // Check if the click is on the window background and not on any interactive elements
      if (e.target === e.currentTarget) {
        setShowExpensePopup(true);
      }
    };

    const handleExpenseClick = (item, e) => {
      e.stopPropagation(); // Prevent window click from triggering
      if (item.source === 'project') {
        router.push(`/projects/${item.id}`);
      } else {
        router.push(`/finances/${item.id}`);
      }
    };

    const handleExpensePaid = async (item, e) => {
      e.stopPropagation(); // Prevent item click from triggering

      try {
        if (item.source === 'project') {
          // Update project's Expenses Paid field
          const updatedFields = {
            ...item.fields,
            'Expenses Paid': {
              ...item.fields['Expenses Paid'],
              value: true
            }
          };

          await updateProject({
            id: item.id,
            fields: updatedFields
          });

          // Remove from projects list locally
          setProjects(prev => prev.map(project => 
            project.id === item.id 
              ? { ...project, fields: updatedFields }
              : project
          ));
        } else {
          // Update finance's Amount Paid field
          const updatedFields = {
            ...item.fields,
            'Amount Paid': {
              ...item.fields['Amount Paid'],
              value: true
            }
          };

          await updateFinance({
            id: item.id,
            fields: updatedFields,
            type: item.type
          });

          // Remove from expenses list locally
          setExpenses(prev => prev.filter(expense => expense.id !== item.id));
        }
      } catch (error) {
        console.error('Error updating expense status:', error);
        alert(`Failed to update expense status: ${error.message}`);
      }
    };

    return (
      <div 
        style={{
          border: '2px solid var(--border)',
          borderRadius: '12px',
          background: 'var(-bg)',
          padding: '1rem',
          height: '300px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'background 0.2s',
          cursor: 'pointer'
        }}
        onClick={handleWindowClick}
        onMouseOver={e => {
            e.currentTarget.style.backgroundColor = 'var(--card-bg)';
        }}
        onMouseOut={e => {
            e.currentTarget.style.backgroundColor = 'var(--bg)';
        }}
      >
        {/* Header with title and dropdown */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.5rem'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent window click on header
        >
          <h3 style={{
            margin: 0,
            color: 'var(--text)',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}>
            Pending Expenses
          </h3>
          <div style={{ width: '150px' }}>
            <Select
              value={expenseTimeFilter}
              onChange={setExpenseTimeFilter}
              options={timeFilterOptions}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: 'var(--button-bg)',
                  borderColor: 'var(--border)',
                  minHeight: '32px',
                  fontSize: '0.85rem'
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }),
                option: (base, { isFocused }) => ({
                  ...base,
                  backgroundColor: isFocused ? 'var(--button-bg-hover)' : 'var(--card-bg)',
                  color: 'var(--text)',
                  fontSize: '0.85rem'
                })
              }}
              isSearchable={false}
            />
          </div>
        </div>

        {/* Scrollable expense list */}
        <div 
          className="project-window-scroll"
          style={{
            flex: 1,
            overflow: 'auto',
            paddingRight: '5px'
          }}
          onWheel={(e) => {
            e.stopPropagation();
          }}>
          {(projectsLoading || financesLoading) ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              color: 'var(--text)' 
            }}>
              Loading...
            </div>
          ) : filteredPendingExpenses.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              color: 'var(--text)' 
            }}>
              No pending expenses
            </div>
          ) : (
            filteredPendingExpenses.map((item, index) => {
              const formatDate = (timestamp) => {
                if (!timestamp) return '';
                const date = new Date(timestamp);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
              };

              const formatCurrency = (amount) => {
                return `$${amount.toFixed(2)}`;
              };

              return (
                <div key={`${item.source}-${item.id}`} style={{
                  padding: '8px 12px',
                  background: 'var(--button-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  marginBottom: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                }}
                onClick={(e) => handleExpenseClick(item, e)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '4px'
                    }}>
                      <span style={{ 
                        fontWeight: 'bold', 
                        color: 'var(--text)',
                        flex: '1',
                        minWidth: '80px'
                      }}>
                        {item.fields?.Name?.value || 'Untitled'}
                      </span>
                      <span style={{ 
                        color: 'var(--text)', 
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap'
                      }}>
                        {formatDate(item.fields?.Date?.value)}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '4px',
                      gap: '4px'
                    }}>
                      <span style={{
                        fontSize: '0.8rem',
                        color: 'var(--secondary)'
                      }}>
                        {item.category}
                      </span>
                      <span style={{
                        fontSize: '0.8rem',
                        color: 'red',
                        fontWeight: 'bold'
                      }}>
                        -{formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Expense Paid Checkbox */}
                  <div style={{ marginLeft: '8px' }}>
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={(e) => handleExpensePaid(item, e)}
                      style={{
                        cursor: 'pointer',
                        accentColor: 'var(--primary)',
                        transform: 'scale(1.1)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                      title="Mark as paid"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Expense Details Popup */}
        {showExpensePopup && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg)',
              color: 'var(--text)',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              minWidth: '600px',
              maxWidth: '80vw',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '1rem'
              }}>
                <h2 style={{ margin: 0 }}>Pending Expenses Details</h2>
                <button
                  onClick={() => setShowExpensePopup(false)}
                  style={{
                    background: 'var(--unselected)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    color: 'black',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--unselected-hover)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--unselected)';
                  }}
                >
                  Close
                </button>
              </div>
              <List 
                list={filteredPendingExpenses}
                updatePath="/api/projects/update-project"
                fetchPath="/api/projects/get-project"
                selected={[]}
                setSelected={() => {}}
                handleSelect={() => {}}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const FieldWindow = ({ windowNumber, windowField, setWindowField, showFieldPopup, setShowFieldPopup, fieldTimeFilter, setFieldTimeFilter, filteredProjects }) => {
    const fieldOptions = getFieldOptions();
    
    // Check if the current windowField exists in available options, if not reset it
    const validWindowField = fieldOptions.some(option => option.value === windowField) ? windowField : null;
    
    // If windowField is not valid and we have a windowField set, clear it
    useEffect(() => {
      if (windowField && !fieldOptions.some(option => option.value === windowField)) {
        setWindowField(null);
      }
    }, [fieldOptions, windowField, setWindowField]);

    const handleWindowClick = (e) => {
      // Check if the click is on the window background and not on any interactive elements
      if (e.target === e.currentTarget && validWindowField) {
        setShowFieldPopup(true);
      }
    };

    const handleProjectClick = (projectId, e) => {
      e.stopPropagation(); // Prevent window click from triggering
      router.push(`/projects/${projectId}`);
    };
    
    // Show loading while form data is being fetched
    if (formLoading) {
      return (
        <div 
          style={{
            border: '2px solid var(--border)',
            borderRadius: '12px',
            background: 'var(--bg)',
            padding: '1rem',
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ color: 'var(--text)' }}>Loading fields...</div>
        </div>
      );
    }
    
    return (
      <div 
        style={{
          border: '2px solid var(--border)',
          borderRadius: '12px',
          background: 'var(--bg)',
          padding: '1rem',
          height: '300px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'background 0.2s',
          cursor: validWindowField ? 'pointer' : 'default'
        }}
        onClick={handleWindowClick}
        onMouseOver={e => {
            e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
        }}
        onMouseOut={e => {
            e.currentTarget.style.backgroundColor = 'var(--bg)';
        }}
      >
        {/* Header with title and dropdowns */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.5rem'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent window click on header
        >
          <h3 style={{
            margin: 0,
            color: 'var(--text)',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}>
            {validWindowField || `Field Window ${windowNumber}`}
          </h3>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Field Selection Dropdown */}
            <div style={{ width: '140px' }}>
              <Select
                value={fieldOptions.find(option => option.value === validWindowField) || null}
                onChange={(selectedOption) => setWindowField(selectedOption ? selectedOption.value : null)}
                options={fieldOptions}
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: 'var(--button-bg)',
                    borderColor: 'var(--border)',
                    minHeight: '32px',
                    fontSize: '0.85rem'
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)'
                  }),
                  option: (base, { isFocused }) => ({
                    ...base,
                    backgroundColor: isFocused ? 'var(--button-bg-hover)' : 'var(--card-bg)',
                    color: 'var(--text)',
                    fontSize: '0.85rem'
                  })
                }}
                placeholder="Select Field"
                isClearable
                isSearchable={false}
              />
            </div>
            
            {/* Time Filter Dropdown - only show if field is selected */}
            {validWindowField && (
              <div style={{ width: '120px' }}>
                <Select
                  value={fieldTimeFilter}
                  onChange={setFieldTimeFilter}
                  options={timeFilterOptions}
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: 'var(--button-bg)',
                      borderColor: 'var(--border)',
                      minHeight: '32px',
                      fontSize: '0.85rem'
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border)'
                    }),
                    option: (base, { isFocused }) => ({
                      ...base,
                      backgroundColor: isFocused ? 'var(--button-bg-hover)' : 'var(--card-bg)',
                      color: 'var(--text)',
                      fontSize: '0.85rem'
                    })
                  }}
                  isSearchable={false}
                />
              </div>
            )}
          </div>
        </div>

        {/* Scrollable content area */}
        <div 
          className="project-window-scroll"
          style={{
            flex: 1,
            overflow: 'auto',
            paddingRight: '5px'
          }}
          onWheel={(e) => {
            e.stopPropagation();
          }}>
          {!validWindowField ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              color: 'var(--text)',
              textAlign: 'center'
            }}>
              Select a field to display project data
            </div>
          ) : projectsLoading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              color: 'var(--text)' 
            }}>
              Loading...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              color: 'var(--text)' 
            }}>
              No projects have data for this field
            </div>
          ) : isFieldBoolean(validWindowField) ? (
            // Boolean field - show all projects with checkboxes like PaymentWindow/ExpenseWindow
            filteredProjects.map((project, index) => (
              <div key={project.id} style={{
                padding: '8px 12px',
                background: 'var(--button-bg)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                marginBottom: '6px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--button-bg)';
              }}
              onClick={(e) => handleProjectClick(project.id, e)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '4px'
                  }}>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: 'var(--text)',
                      flex: '1',
                      minWidth: '80px'
                    }}>
                      {project.fields?.Name?.value || 'Untitled'}
                    </span>
                    <span style={{ 
                      color: 'var(--text)', 
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap'
                    }}>
                      {project.fields?.Date?.value ? new Date(project.fields.Date.value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : ''}
                    </span>
                  </div>
                  {project.fields?.Category?.value && (
                    <div style={{
                      marginTop: '4px',
                      fontSize: '0.8rem',
                      color: 'var(--secondary)'
                    }}>
                      {project.fields.Category.value}
                    </div>
                  )}
                </div>

                {/* Boolean Checkbox */}
                <div style={{ marginLeft: '8px' }}>
                  <input
                    type="checkbox"
                    checked={project.fields?.[validWindowField]?.value || false}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleProjectFieldValue(project.id, validWindowField);
                    }}
                    style={{
                      cursor: 'pointer',
                      accentColor: 'var(--primary)',
                      transform: 'scale(1.1)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    title={`Toggle ${validWindowField}`}
                  />
                </div>
              </div>
            ))
          ) : (
            // Non-boolean field - display like ProjectWindow with field value
            filteredProjects.map((project, index) => {
              const formatDate = (timestamp) => {
                if (!timestamp) return '';
                const date = new Date(timestamp);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
              };

              return (
                <div key={project.id} style={{
                  padding: '8px 12px',
                  background: 'var(--button-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  marginBottom: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontSize: '0.9rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                }}
                onClick={(e) => handleProjectClick(project.id, e)}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '4px'
                  }}>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: 'var(--text)',
                      flex: '1',
                      minWidth: '100px'
                    }}>
                      {project.fields?.Name?.value || 'Untitled'}
                    </span>
                    <span style={{ 
                      color: 'var(--text)', 
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatDate(project.fields?.Date?.value)}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '4px',
                    gap: '4px'
                  }}>
                    {project.fields?.Category?.value && (
                      <span style={{
                        fontSize: '0.8rem',
                        color: 'var(--secondary)'
                      }}>
                        {project.fields.Category.value}
                      </span>
                    )}
                    <span style={{
                      fontSize: '0.8rem',
                      color: 'var(--text)',
                      fontWeight: 'bold'
                    }}>
                      {project.fields?.[validWindowField]?.value || 'N/A'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Field Details Popup */}
        {showFieldPopup && validWindowField && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg)',
              color: 'var(--text)',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              minWidth: '600px',
              maxWidth: '80vw',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '1rem'
              }}>
                <h2 style={{ margin: 0 }}>{validWindowField} Details</h2>
                <button
                  onClick={() => setShowFieldPopup(false)}
                  style={{
                    background: 'var(--unselected)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    color: 'black',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--unselected-hover)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--unselected)';
                  }}
                >
                  Close
                </button>
              </div>
              <List 
                list={filteredProjects}
                updatePath="/api/projects/update-project"
                fetchPath="/api/projects/get-project"
                selected={[]}
                setSelected={() => {}}
                handleSelect={() => {}}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const ElementGraph = () => {
    // Convert arrays to Select options format
    const categoryOptions = categories.map(cat => ({ value: cat, label: cat }));
    const timePeriodOptions = timePeriods.map(period => ({ value: period, label: period }));
    
    return (
      <div style={{ 
        background: 'var(--button-bg)', 
        border: '2px solid var(--border)',
        borderRadius: '12px',
        padding: '1.5rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          {/* Category Dropdown */}
          <div style={{ width: '120px' }}>
            <Select
              value={categoryOptions.find(option => option.value === elementCategory)}
              onChange={(selectedOption) => setElementCategory(selectedOption.value)}
              options={categoryOptions}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: 'var(--button-bg)',
                  borderColor: 'var(--border)',
                  minHeight: '32px',
                  fontSize: '0.85rem'
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }),
                option: (base, { isFocused }) => ({
                  ...base,
                  backgroundColor: isFocused ? 'var(--button-bg-hover)' : 'var(--card-bg)',
                  color: 'var(--text)',
                  fontSize: '0.85rem'
                })
              }}
              isSearchable={false}
            />
          </div>
          
          {/* Income/Expenses Toggle */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              onClick={() => setElementToggle('income')}
              style={{
                padding: '0.4rem 0.8rem',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                background: elementToggle === 'income' ? 'var(--primary)' : 'var(--bg)',
                color: elementToggle === 'income' ? 'white' : 'var(--text)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'background 0.2s'
              }}
            >
              Income
            </button>
            <button
              onClick={() => setElementToggle('expenses')}
              style={{
                padding: '0.4rem 0.8rem',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                background: elementToggle === 'expenses' ? 'var(--primary)' : 'var(--bg)',
                color: elementToggle === 'expenses' ? 'white' : 'var(--text)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'background 0.2s'
              }}
            >
              Expenses
            </button>
          </div>
          
          {/* Time Period Dropdown */}
          <div style={{ width: '120px' }}>
            <Select
              value={timePeriodOptions.find(option => option.value === elementPeriod)}
              onChange={(selectedOption) => setElementPeriod(selectedOption.value)}
              options={timePeriodOptions}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: 'var(--button-bg)',
                  borderColor: 'var(--border)',
                  minHeight: '32px',
                  fontSize: '0.85rem'
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }),
                option: (base, { isFocused }) => ({
                  ...base,
                  backgroundColor: isFocused ? 'var(--button-bg-hover)' : 'var(--card-bg)',
                  color: 'var(--text)',
                  fontSize: '0.85rem'
                })
              }}
              isSearchable={false}
            />
          </div>
        </div>
        
        {/* Chart Container */}
        <div style={{ flex: 1, minHeight: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={elementGraphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="displayDate" 
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line 
                type="monotone"
                dataKey="amount" 
                stroke={elementToggle === 'income' ? '#22c55e' : '#ef4444'}
                strokeWidth={2}
                dot={{ fill: elementToggle === 'income' ? '#22c55e' : '#ef4444' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Net Total Display */}
        <div style={{ 
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <h4 style={{ 
            margin: '0 0 0.25rem 0',
            color: 'var(--text)',
            fontSize: '0.9rem'
          }}>
            Net {elementToggle === 'income' ? 'Income' : 'Expenses'}
          </h4>
          <p style={{ 
            margin: 0,
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: elementToggle === 'income' ? '#22c55e' : '#ef4444'
          }}>
            ${elementGraphData.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
          </p>
        </div>
      </div>
    );
  };

  const ProfitGraph = () => {
    // Convert arrays to Select options format
    const categoryOptions = categories.map(cat => ({ value: cat, label: cat }));
    const timePeriodOptions = timePeriods.map(period => ({ value: period, label: period }));
    
    return (
      <div style={{ 
        background: 'var(--button-bg)', 
        border: '2px solid var(--border)',
        borderRadius: '12px',
        padding: '1.5rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          {/* Category Dropdown */}
          <div style={{ width: '120px' }}>
            <Select
              value={categoryOptions.find(option => option.value === profitCategory)}
              onChange={(selectedOption) => setProfitCategory(selectedOption.value)}
              options={categoryOptions}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: 'var(--button-bg)',
                  borderColor: 'var(--border)',
                  minHeight: '32px',
                  fontSize: '0.85rem'
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }),
                option: (base, { isFocused }) => ({
                  ...base,
                  backgroundColor: isFocused ? 'var(--button-bg-hover)' : 'var(--card-bg)',
                  color: 'var(--text)',
                  fontSize: '0.85rem'
                })
              }}
              isSearchable={false}
            />
          </div>
          
          {/* Profit Label */}
          <h3 style={{ 
            margin: 0, 
            color: 'var(--text)', 
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}>
            Profit Analysis
          </h3>
          
          {/* Time Period Dropdown */}
          <div style={{ width: '120px' }}>
            <Select
              value={timePeriodOptions.find(option => option.value === profitPeriod)}
              onChange={(selectedOption) => setProfitPeriod(selectedOption.value)}
              options={timePeriodOptions}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: 'var(--button-bg)',
                  borderColor: 'var(--border)',
                  minHeight: '32px',
                  fontSize: '0.85rem'
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }),
                option: (base, { isFocused }) => ({
                  ...base,
                  backgroundColor: isFocused ? 'var(--button-bg-hover)' : 'var(--card-bg)',
                  color: 'var(--text)',
                  fontSize: '0.85rem'
                })
              }}
              isSearchable={false}
            />
          </div>
        </div>
        
        {/* Chart Container */}
        <div style={{ flex: 1, minHeight: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={profitGraphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="displayDate"
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line 
                type="monotone"
                dataKey="profit" 
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Net Profit Display */}
        <div style={{ 
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <h4 style={{ 
            margin: '0 0 0.25rem 0',
            color: 'var(--text)',
            fontSize: '0.9rem'
          }}>
            Net Profit
          </h4>
          <p style={{ 
            margin: 0,
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: profitGraphData.reduce((sum, item) => sum + item.profit, 0) >= 0 ? '#22c55e' : '#ef4444'
          }}>
            ${profitGraphData.reduce((sum, item) => sum + item.profit, 0).toFixed(2)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DesktopBar
        Title="Dashboard"
      />
      <div className="main-content">
        {user ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
            gap: '1.5rem',
            height: 'calc(100vh - 120px)',
            minHeight: '600px'
          }}>
            {/* Top Left - Project Window */}
            <div style={{ gridColumn: '1', gridRow: '1' }}>
              <ProjectWindow />
            </div>

            {/* Placeholder for other windows */}
            <div style={{ gridColumn: '2', gridRow: '1' }}>
              <PaymentWindow />
            </div>
            <div style={{ gridColumn: '3', gridRow: '1' }}>
              <ExpenseWindow />
            </div>
            <div style={{ gridColumn: '1 / 2', gridRow: '2' }}>
              <ElementGraph />
            </div>
            <div style={{ gridColumn: '2 / 4', gridRow: '2' }}>
              <ProfitGraph />
            </div>
            <div style={{ gridColumn: '1', gridRow: '3', paddingBottom: '2rem' }}>
              <FieldWindow 
                windowNumber={1}
                windowField={windowField1}
                setWindowField={setWindowField1WithSave}
                showFieldPopup={showFieldPopup1}
                setShowFieldPopup={setShowFieldPopup1}
                fieldTimeFilter={fieldTimeFilter1}
                setFieldTimeFilter={setFieldTimeFilter1}
                filteredProjects={filteredFieldProjects1}
              />
            </div>
            <div style={{ gridColumn: '2', gridRow: '3' }}>
              <FieldWindow 
                windowNumber={2}
                windowField={windowField2}
                setWindowField={setWindowField2WithSave}
                showFieldPopup={showFieldPopup2}
                setShowFieldPopup={setShowFieldPopup2}
                fieldTimeFilter={fieldTimeFilter2}
                setFieldTimeFilter={setFieldTimeFilter2}
                filteredProjects={filteredFieldProjects2}
              />
            </div>
            <div style={{ gridColumn: '3', gridRow: '3' }}>
              <FieldWindow 
                windowNumber={3}
                windowField={windowField3}
                setWindowField={setWindowField3WithSave}
                showFieldPopup={showFieldPopup3}
                setShowFieldPopup={setShowFieldPopup3}
                fieldTimeFilter={fieldTimeFilter3}
                setFieldTimeFilter={setFieldTimeFilter3}
                filteredProjects={filteredFieldProjects3}
              />
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'calc(100vh - 120px)',
            color: 'var(--text)'
          }}>
            <h2>Welcome to Photography Manager</h2>
            <p>Please log in to view your dashboard</p>
            <button
              onClick={handleLogin}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--secondary)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary)';
              }}
            >
              Log In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}