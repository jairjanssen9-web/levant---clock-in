import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { HoursAndPay } from './components/HoursAndPay';
import { Admin } from './components/Admin';
import { Employee, TimeLog, Role } from './types';
import { INITIAL_EMPLOYEES, INITIAL_LOGS } from './constants';
import { v4 as uuidv4 } from 'uuid'; // Standard practice, but in this env we might need simple random

// Simple UUID fallback if package not available in env
const uuid = () => Math.random().toString(36).substring(2, 9);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAdmin, setIsAdmin] = useState(false); // Toggle for demo purposes

  // State
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('levant_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [logs, setLogs] = useState<TimeLog[]>(() => {
    const saved = localStorage.getItem('levant_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  // Persistence
  useEffect(() => localStorage.setItem('levant_employees', JSON.stringify(employees)), [employees]);
  useEffect(() => localStorage.setItem('levant_logs', JSON.stringify(logs)), [logs]);

  // Actions
  const handleClockIn = (employeeId: string) => {
    const newLog: TimeLog = {
      id: uuid(),
      employeeId,
      date: new Date().toISOString().split('T')[0],
      clockIn: new Date().toISOString(),
      clockOut: null,
      status: 'active',
      edits: []
    };
    setLogs([...logs, newLog]);
  };

  const handleClockOut = (employeeId: string) => {
    setLogs(logs.map(log => {
      if (log.employeeId === employeeId && log.status === 'active') {
        return {
          ...log,
          clockOut: new Date().toISOString(),
          status: 'completed'
        };
      }
      return log;
    }));
  };

  const handleAddEmployee = (name: string, role: Role) => {
    setEmployees([...employees, { id: uuid(), name, role, isActive: true }]);
  };

  const handleRemoveEmployee = (id: string) => {
    // Soft delete usually, but for demo remove or deactive
    setEmployees(employees.map(e => e.id === id ? { ...e, isActive: false } : e));
  };

  const handleEditLog = (logId: string, newIn: string, newOut: string, reason: string) => {
    setLogs(logs.map(log => {
      if (log.id === logId) {
        return {
          ...log,
          clockIn: newIn,
          clockOut: newOut || null,
          status: newOut ? 'completed' : 'active',
          edits: [
            ...log.edits, 
            {
              date: new Date().toISOString(),
              previousIn: log.clockIn,
              previousOut: log.clockOut || undefined,
              reason,
              adminName: 'Admin'
            }
          ]
        };
      }
      return log;
    }));
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} toggleAdmin={() => setIsAdmin(!isAdmin)}>
      {activeTab === 'dashboard' && (
        <Dashboard 
          employees={employees} 
          logs={logs} 
          onClockIn={handleClockIn} 
          onClockOut={handleClockOut} 
        />
      )}
      {activeTab === 'hours' && (
        <HoursAndPay employees={employees} logs={logs} />
      )}
      {activeTab === 'admin' && (
        isAdmin ? (
          <Admin 
            employees={employees} 
            logs={logs}
            onAddEmployee={handleAddEmployee}
            onRemoveEmployee={handleRemoveEmployee}
            onEditLog={handleEditLog}
          />
        ) : (
          <div className="flex h-full items-center justify-center flex-col text-center">
            <h2 className="text-3xl font-serif text-levant-gold mb-4">Toegang Geweigerd</h2>
            <p className="text-neutral-400 mb-6">U moet beheerder zijn om deze pagina te bekijken.</p>
            <button 
              onClick={() => setIsAdmin(true)} 
              className="text-white underline hover:text-levant-gold"
            >
              Schakel Admin Modus in
            </button>
          </div>
        )
      )}
    </Layout>
  );
}