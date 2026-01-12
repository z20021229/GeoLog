import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full border-collapse ${className || ''}`}>
        {children}
      </table>
    </div>
  );
};

export default Table;