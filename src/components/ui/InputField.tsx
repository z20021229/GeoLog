'use client';

import React from 'react';
import { Label } from './Label';
import { Input } from './Input';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  className?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  name,
  required = false,
  className,
  ...props
}) => {
  return (
    <div className={`grid grid-cols-12 gap-4 items-center ${className}`}>
      <Label htmlFor={id} className="col-span-3 text-right font-medium">
        {required && <span className="text-red-500 mr-1">*</span>}{label}
      </Label>
      <Input
        id={id}
        name={name}
        required={required}
        className="col-span-9 focus:ring-blue-500"
        {...props}
      />
    </div>
  );
};

export { InputField };