import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import RequestDashboard from './components/RequestDashboard';
import RequestForm from './components/RequestForm';
import { Request, RequestStatus, RequestType } from './types';

// The initial mock data has been removed. The app will now fetch data from your backend.

const App: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // This function fetches all requests from your Rust backend.
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/requests');
      if (!response.ok) {
        throw new Error('無法從伺服器獲取資料');
      }
      const data = await response.json();
      const parsedRequests = data.map((req: any) => ({
        id: req.id,
        type: req.type,
        status: req.status,
        contactPerson: req.contactPerson ?? req.contact_person,
        contactPhone: req.contactPhone ?? req.contact_phone,
        address: req.address,
        description: req.description,
        createdAt: new Date(req.createdAt ?? req.created_at),
      }));
      setRequests(parsedRequests);
    } catch (err: any) {
      setError(err.message || '無法載入需求列表，請稍後再試。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch requests when the component mounts
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // This function sends a new request to your Rust backend.
  const addRequest = useCallback(async (newRequestData: Omit<Request, 'id' | 'status' | 'createdAt'>) => {
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newRequestData.type,
          contactPerson: newRequestData.contactPerson,
          contactPhone: newRequestData.contactPhone,
          address: newRequestData.address,
          description: newRequestData.description,
        }),
      });

      if (!response.ok) {
        throw new Error('新增需求失敗');
      }

      const created = await response.json();
      const normalized = {
        id: created.id,
        type: created.type,
        status: created.status,
        contactPerson: created.contactPerson ?? created.contact_person,
        contactPhone: created.contactPhone ?? created.contact_phone,
        address: created.address,
        description: created.description,
        createdAt: new Date(created.createdAt ?? created.created_at),
      };
      setRequests(prev => [normalized, ...prev]);
    } catch (err) {
      console.error(err);
      alert('新增需求時發生錯誤，請重試。');
    }
  }, []);

  // This function updates the status of a request on your Rust backend.
  const updateRequestStatus = useCallback(async (id: string, status: RequestStatus) => {
    try {
       // TODO: Replace with your actual API endpoint for updating a request.
      const response = await fetch(`/api/requests/${id}/status`, {
        method: 'PATCH', // or PUT
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('更新狀態失敗');
      }
      const updated = await response.json();
      const normalized = {
        id: updated.id,
        type: updated.type,
        status: updated.status,
        contactPerson: updated.contactPerson ?? updated.contact_person,
        contactPhone: updated.contactPhone ?? updated.contact_phone,
        address: updated.address,
        description: updated.description,
        createdAt: new Date(updated.createdAt ?? updated.created_at),
      };
      setRequests(prev => prev.map(req => req.id === id ? normalized : req));
    } catch (err) {
      console.error(err);
      alert('更新狀態時發生錯誤，請重試。');
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    if (requests.length === 0) {
      alert('目前沒有任何需求可匯出。');
      return;
    }

    const headers = ['ID', '類型', '狀態', '聯絡人', '聯絡電話', '地址', '需求說明', '建立時間'];
    
    const escapeCsvValue = (value: string | undefined | null) => {
      const stringValue = String(value || '');
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvRows = requests.map(req => [
      escapeCsvValue(req.id),
      escapeCsvValue(req.type),
      escapeCsvValue(req.status),
      escapeCsvValue(req.contactPerson),
      escapeCsvValue(req.contactPhone),
      escapeCsvValue(req.address),
      escapeCsvValue(req.description),
      escapeCsvValue(req.createdAt.toLocaleString('zh-TW')),
    ].join(','));

    const csvString = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.setAttribute('href', url);
    link.setAttribute('download', `花蓮光復鄉互助網_需求列表_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [requests]);

  const filters = ['全部', RequestType.VOLUNTEER, RequestType.SUPPLY];

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center py-12 text-slate-600">載入需求列表中...</div>;
    }
    if (error) {
      return (
        <div className="text-center py-12 text-red-600 bg-red-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold">發生錯誤</h3>
          <p className="mt-2">{error}</p>
          <button onClick={fetchRequests} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            重試
          </button>
        </div>
      );
    }
    return (
      <RequestDashboard 
        requests={requests} 
        onUpdateStatus={updateRequestStatus} 
        activeFilter={activeFilter} 
        searchTerm={searchTerm}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header searchTerm={searchTerm} onSearchChange={(e) => setSearchTerm(e.target.value)} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="w-full sm:w-auto">
                <div className="flex bg-slate-200 rounded-lg p-1">
                    {filters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                                activeFilter === filter
                                ? 'bg-white text-indigo-700 shadow'
                                : 'text-slate-600 hover:bg-slate-300'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={handleExportCSV}
                className="w-full sm:w-auto flex-shrink-0 px-5 py-2.5 bg-white text-slate-700 border border-slate-300 font-semibold rounded-lg shadow-sm hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center justify-center"
                aria-label="匯出所有需求為 CSV 檔案"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  匯出 CSV
              </button>
              <button
                  onClick={() => setIsFormOpen(true)}
                  className="w-full sm:w-auto flex-shrink-0 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center justify-center"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                  </svg>
                  登記新的需求
              </button>
            </div>
        </div>

        {renderContent()}
      </main>
      
      <RequestForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={addRequest}
      />
    </div>
  );
};

export default App;
