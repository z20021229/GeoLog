'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Label } from './Label';
import { Input } from './Input';

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  className?: string;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  id,
  name,
  required = false,
  className,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`grid grid-cols-12 gap-4 items-center ${className}`}>
      <Label htmlFor={id} className="col-span-3 text-right font-medium">
        {required && <span className="text-red-500 mr-1">*</span>}{label}
      </Label>
      <div className="col-span-9 relative">
        <Input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          required={required}
          className="w-full pr-10 focus:ring-blue-500"
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};

export { PasswordField };