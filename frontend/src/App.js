import React from 'react'
import './App.css';
import Sidebar from './components/Sidebar.js';
import Chatwindow from './components/Chatwindow.js';

function App() {
  return (
    <div className="App flex min-h-screen">
      <Sidebar />
      <Chatwindow />
    </div>
  );
}

export default App;
