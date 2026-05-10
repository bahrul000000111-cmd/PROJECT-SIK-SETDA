import React from 'react';

const EmptyState = ({ icon: Icon, title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px]">
      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-700">
        <Icon size={28} strokeWidth={1.5} className="text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-gray-900 dark:text-white font-semibold mb-1">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[250px]">{description}</p>
    </div>
  );
};

export default EmptyState;
