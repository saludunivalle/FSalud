// src/context/SaturationContext.jsx
import React, { createContext, useState, useContext } from 'react';

const SaturationContext = createContext();

export const useSaturation = () => useContext(SaturationContext);

export const SaturationProvider = ({ children }) => {
  const [modoSaturado, setModoSaturado] = useState(false);

  return (
    <SaturationContext.Provider value={{ modoSaturado, setModoSaturado }}>
      {children}
    </SaturationContext.Provider>
  );
};
