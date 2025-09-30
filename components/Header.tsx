
import React from 'react';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">
            花蓮光復鄉 互助支援平台
          </h1>
          <p className="mt-2 text-md text-slate-600">
            整合需求，集中資源，讓我們一起度過難關。
          </p>
        </div>
        <div className="mt-4 max-w-xl mx-auto">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="搜尋聯絡人、地址、需求說明..."
              value={searchTerm}
              onChange={onSearchChange}
              className="block w-full rounded-md border-0 bg-white py-2.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              aria-label="搜尋需求"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
