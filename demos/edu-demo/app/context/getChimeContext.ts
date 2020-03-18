import React from 'react';

const context = React.createContext();

export default function getChimeContext() {
  return context;
}
