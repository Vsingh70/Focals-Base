'use client';
import DesktopBar from "@/app/components/DesktopBar";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useGetFinances, useGetProjects } from "@/utils/api";
import List from "@/app/components/Element/List";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DeleteSelectedButton from "@/app/components/Navbar/DeleteSelectedButton";
import DeletePopUpCard from "@/app/components/Navbar/Filter/DeletePopUpCard";
import Toast from "@/app/components/toast";

export default function FinancesPage() {
    const { data: financesData, loading: financesLoading, error: financesError } = useGetFinances();
    const { data: projectsData, loading: projectsLoading, error: projectsError } = useGetProjects();
    
    // State for finances list management (like links page)
    const [finances, setFinances] = useState([]);
    const [filteredFinances, setFilteredFinances] = useState([]);
    const [selected, setSelected] = useState([]);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [message, setMessage] = useState("");
    
    // Filter states for left graph
    const [leftToggle, setLeftToggle] = useState('income'); // 'income' or 'expenses'
    const [leftCategory, setLeftCategory] = useState('all');
    const [leftPeriod, setLeftPeriod] = useState('all time');
    
    // Filter states for right graph (profit)
    const [rightCategory, setRightCategory] = useState('all');
    const [rightPeriod, setRightPeriod] = useState('all time');
    
    // Filter state for list
    const [listFilter, setListFilter] = useState('all'); // 'all', 'income', 'expenses'

    // Check if there's any valid finance data for graphs
    const hasValidFinanceData = useMemo(() => {
        const financeItems = financesData?.data || [];
        const projectItems = projectsData?.data || [];
        
        // Check finance items with Amount Paid = true
        const validFinanceItems = financeItems.filter(item => 
            item.fields?.['Amount Paid']?.value === true
        );
        
        // Check project items with valid payment/expense conditions
        const validProjectItems = projectItems.filter(project => {
            const fields = project.fields || {};
            const paymentReceived = fields['Payment Received']?.value === true;
            const payAmount = parseFloat(fields.Pay?.value || 0);
            const expensesPaid = fields['Expenses Paid']?.value === true;
            const expensesAmount = parseFloat(fields.Expenses?.value || 0);
            
            return (paymentReceived && payAmount > 0) || (expensesPaid && expensesAmount > 0);
        });
        
        return validFinanceItems.length > 0 || validProjectItems.length > 0;
    }, [financesData, projectsData]);

    // Check if there's any finance data for showing delete button
    const hasFinanceData = useMemo(() => {
        const financeItems = financesData?.data || [];
        return financeItems.length > 0;
    }, [financesData]);

    // Process data to combine finances and valid projects (only for graphs)
    const processedGraphData = useMemo(() => {
        const financeItems = financesData?.data || [];
        const projectItems = projectsData?.data || [];
        
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
    }, [financesData, projectsData]);

    // Process data for list (only finance items, not projects)
    const processedListData = useMemo(() => {
        const financeItems = financesData?.data || [];
        
        return financeItems.map(item => ({
            ...item,
            source: 'finance',
            category: item.fields?.Category?.value || 'Uncategorized',
            amount: parseFloat(item.fields?.Amount?.value || 0),
            date: item.fields?.Date?.value,
            name: item.fields?.Name?.value || 'Unnamed',
            isIncome: item.type === 'income',
            isExpense: item.type === 'expense'
        }));
    }, [financesData]);

    // Sync processed data to state (like links page)
    useEffect(() => {
        if (processedListData) {
            setFinances(processedListData);
            setFilteredFinances(processedListData);
        }
    }, [processedListData]);

    // This will be called by the SearchBar (via DesktopBar)
    const handleSearchResults = useCallback((results) => {
        setFilteredFinances(results);
    }, []);

    const handleSelect = (id) => {
        setSelected(prev =>
            prev.includes(id)
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        );
    };

    const handleDeleteSelected = async () => {
        try {
            await Promise.all(selected.map(async (id) => {
                // Only delete actual finance entries, not project-derived entries
                if (!id.startsWith('project-')) {
                    await fetch(`/api/finances/delete-finance?id=${id}`, {
                        method: 'DELETE',
                    });
                }
            }));
            setFinances(prev => prev.filter(finance => !selected.includes(finance.id)));
            setFilteredFinances(prev => prev.filter(finance => !selected.includes(finance.id)));
            setSelected([]);
            setMessage("Selected finances deleted");
            setShowToast(true);
        } catch (err) {
            setMessage('Failed to delete selected items.');
            setShowToast(true);
        }
    };

    const NewDeleteButton = () => {
        return (
            <DeleteSelectedButton selected={selected} setShowDeletePopup={setShowDeletePopup}/>
        );
    };

    // Get unique categories from graph data
    const categories = useMemo(() => {
        const cats = [...new Set(processedGraphData.map(item => item.category))].filter(Boolean);
        return ['all', ...cats];
    }, [processedGraphData]);

    // Time period options
    const timePeriods = ['all time', 'yearly', 'bi-yearly', 'quarterly', 'monthly', 'weekly', 'daily'];

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

    // Prepare left graph data (line chart with timeline)
    const leftGraphData = useMemo(() => {
        let filtered = processedGraphData.filter(item => 
            leftToggle === 'income' ? item.isIncome : item.isExpense
        );
        
        if (leftCategory !== 'all') {
            filtered = filtered.filter(item => item.category === leftCategory);
        }
        
        filtered = filterByPeriod(filtered, leftPeriod);
        
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
    }, [processedGraphData, leftToggle, leftCategory, leftPeriod]);

    // Prepare right graph data (profit line chart with timeline)
    const rightGraphData = useMemo(() => {
        let filtered = processedGraphData;
        
        if (rightCategory !== 'all') {
            filtered = filtered.filter(item => item.category === rightCategory);
        }
        
        filtered = filterByPeriod(filtered, rightPeriod);
        
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
    }, [processedGraphData, rightCategory, rightPeriod]);

    // Prepare list data
    const listData = useMemo(() => {
        if (!filteredFinances || filteredFinances.length === 0) {
            return [];
        }
        
        let filtered = filteredFinances;
        
        if (listFilter === 'income') {
            filtered = filtered.filter(item => item.isIncome);
        } else if (listFilter === 'expenses') {
            filtered = filtered.filter(item => item.isExpense);
        }
        
        return filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }, [filteredFinances, listFilter]);

    if (financesLoading || projectsLoading) {
        return (
            <div>
                <DesktopBar Title="Finances" />
                <div className="main-content">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        Loading finances...
                    </div>
                </div>
            </div>
        );
    }

    if (financesError || projectsError) {
        return (
            <div>
                <DesktopBar Title="Finances" />
                <div className="main-content">
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
                        Error loading finances: {financesError || projectsError}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <DesktopBar 
                Title="Finances"
                Search={hasFinanceData}
                Add={true}
                AddText="+ Add Finance"
                AddLink="/add"
                Input={finances}
                update={handleSearchResults}
                Filter={hasFinanceData}
                Delete={hasFinanceData}
                DeleteButton={NewDeleteButton}
            />
            <div className="main-content">
                <DeletePopUpCard
                    trigger={showDeletePopup}
                    setTrigger={setShowDeletePopup}
                    onConfirm={handleDeleteSelected}
                />
                {showToast && (
                    <Toast 
                        Message={message} 
                        close={() => setShowToast(false)}
                        duration={2000}
                    />
                )}
                
                {/* Graphs Section */}
                {hasValidFinanceData ? (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '2rem', 
                        marginBottom: '3rem' 
                    }}>
                        {/* Left Graph - Income/Expenses */}
                        <div style={{ 
                            background: 'var(--button-bg)', 
                            border: '2px solid var(--border)',
                            borderRadius: '8px',
                            padding: '1.5rem'
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                marginBottom: '1rem'
                            }}>
                                {/* Category Dropdown */}
                                <select 
                                    value={leftCategory} 
                                    onChange={(e) => setLeftCategory(e.target.value)}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg)',
                                        color: 'var(--text)'
                                    }}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                
                                {/* Income/Expenses Toggle */}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setLeftToggle('income')}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            border: '1px solid var(--border)',
                                            borderRadius: '4px',
                                            background: leftToggle === 'income' ? 'var(--primary)' : 'var(--bg)',
                                            color: leftToggle === 'income' ? 'white' : 'var(--text)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Income
                                    </button>
                                    <button
                                        onClick={() => setLeftToggle('expenses')}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            border: '1px solid var(--border)',
                                            borderRadius: '4px',
                                            background: leftToggle === 'expenses' ? 'var(--primary)' : 'var(--bg)',
                                            color: leftToggle === 'expenses' ? 'white' : 'var(--text)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Expenses
                                    </button>
                                </div>
                                
                                {/* Time Period Dropdown */}
                                <select 
                                    value={leftPeriod} 
                                    onChange={(e) => setLeftPeriod(e.target.value)}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg)',
                                        color: 'var(--text)'
                                    }}
                                >
                                    {timePeriods.map(period => (
                                        <option key={period} value={period}>{period}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={leftGraphData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="displayDate" 
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Line 
                                        type="monotone"
                                        dataKey="amount" 
                                        stroke={leftToggle === 'income' ? '#22c55e' : '#ef4444'}
                                        strokeWidth={2}
                                        dot={{ fill: leftToggle === 'income' ? '#22c55e' : '#ef4444' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                            
                            {/* Net Total Display */}
                            <div style={{ 
                                marginTop: '1rem',
                                padding: '1rem',
                                background: 'var(--bg)',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                textAlign: 'center'
                            }}>
                                <h4 style={{ 
                                    margin: '0 0 0.5rem 0',
                                    color: 'var(--text)',
                                    fontSize: '1rem'
                                }}>
                                    Net {leftToggle === 'income' ? 'Income' : 'Expenses'}
                                </h4>
                                <p style={{ 
                                    margin: 0,
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    color: leftToggle === 'income' ? '#22c55e' : '#ef4444'
                                }}>
                                    ${leftGraphData.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Right Graph - Profit */}
                        <div style={{ 
                            background: 'var(--button-bg)', 
                            border: '2px solid var(--border)',
                            borderRadius: '8px',
                            padding: '1.5rem'
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                marginBottom: '1rem'
                            }}>
                                {/* Category Dropdown */}
                                <select 
                                    value={rightCategory} 
                                    onChange={(e) => setRightCategory(e.target.value)}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg)',
                                        color: 'var(--text)'
                                    }}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                
                                {/* Profit Label */}
                                <h3 style={{ 
                                    margin: 0, 
                                    color: 'var(--text)', 
                                    fontSize: '1.25rem' 
                                }}>
                                    Profit
                                </h3>
                                
                                {/* Time Period Dropdown */}
                                <select 
                                    value={rightPeriod} 
                                    onChange={(e) => setRightPeriod(e.target.value)}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg)',
                                        color: 'var(--text)'
                                    }}
                                >
                                    {timePeriods.map(period => (
                                        <option key={period} value={period}>{period}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={rightGraphData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="displayDate"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis />
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
                            
                            {/* Net Profit Display */}
                            <div style={{ 
                                marginTop: '1rem',
                                padding: '1rem',
                                background: 'var(--bg)',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                textAlign: 'center'
                            }}>
                                <h4 style={{ 
                                    margin: '0 0 0.5rem 0',
                                    color: 'var(--text)',
                                    fontSize: '1rem'
                                }}>
                                    Net Profit
                                </h4>
                                <p style={{ 
                                    margin: 0,
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    color: rightGraphData.reduce((sum, item) => sum + item.profit, 0) >= 0 ? '#22c55e' : '#ef4444'
                                }}>
                                    ${rightGraphData.reduce((sum, item) => sum + item.profit, 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '3rem',
                        marginBottom: '3rem',
                        background: 'var(--button-bg)',
                        border: '2px solid var(--border)',
                        borderRadius: '8px'
                    }}>
                        <h3 style={{ 
                            color: 'var(--text)', 
                            marginBottom: '1rem' 
                        }}>
                            No Financial Data Available
                        </h3>
                        <p style={{ 
                            color: 'var(--text-secondary)', 
                            fontSize: '1.1rem' 
                        }}>
                            Please add some financial data with "Amount Paid" set to true to see the graph visualizations.
                        </p>
                    </div>
                )}

                {/* List Section */}
                <div>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginBottom: '1.5rem',
                        gap: '0.5rem'
                    }}>
                        <button
                            onClick={() => setListFilter('all')}
                            style={{
                                padding: '0.5rem 1rem',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                background: listFilter === 'all' ? 'var(--primary)' : 'var(--bg)',
                                color: listFilter === 'all' ? 'white' : 'var(--text)',
                                cursor: 'pointer'
                            }}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setListFilter('income')}
                            style={{
                                padding: '0.5rem 1rem',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                background: listFilter === 'income' ? 'var(--primary)' : 'var(--bg)',
                                color: listFilter === 'income' ? 'white' : 'var(--text)',
                                cursor: 'pointer'
                            }}
                        >
                            Income
                        </button>
                        <button
                            onClick={() => setListFilter('expenses')}
                            style={{
                                padding: '0.5rem 1rem',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                background: listFilter === 'expenses' ? 'var(--primary)' : 'var(--bg)',
                                color: listFilter === 'expenses' ? 'white' : 'var(--text)',
                                cursor: 'pointer'
                            }}
                        >
                            Expenses
                        </button>
                    </div>
                    
                    <List 
                        list={listData} 
                        updatePath="/api/finances/update-finance"
                        fetchPath="/api/finances/get-finance"
                        reqList={[]}
                        selected={selected}
                        setSelected={setSelected}
                        handleSelect={handleSelect}
                        route="finances" 
                        name="Finance"
                    />
                </div>
            </div>
        </div>
    );
}