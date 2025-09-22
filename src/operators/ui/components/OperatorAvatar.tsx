import React from 'react';
import { Operator } from '../../domain/OperatorsModels';

interface OperatorAvatarProps {
  operator: Operator;
}

const OperatorAvatar: React.FC<OperatorAvatarProps> = ({ operator }) => {
  const getFullName = (): string => {
    return `${operator.first_name} ${operator.last_name}`;
  };

  if (operator.photo) {
    return (
      <img
        className="h-12 w-12 rounded-full object-cover"
        src={operator.photo}
        alt={getFullName()}
      />
    );
  } else {
    return (
      <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
        <span className="text-sm font-medium text-white">
          {operator.first_name.charAt(0)}{operator.last_name.charAt(0)}
        </span>
      </div>
    );
  }
};

export default OperatorAvatar;