import React from 'react';
import { FarmerSchemesView } from '../components/schemes/FarmerSchemesView.js';

export const PublicSchemesPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <FarmerSchemesView />
    </div>
  );
};
