import React, { useState, useRef, useEffect } from 'react';
import {
  VscFiles, VscSearch, VscSourceControl, VscDebugAlt, VscExtensions, VscAccount,
  VscSettingsGear, VscClose, VscRemote, VscChevronRight, VscChevronDown,
  VscChromeMinimize, VscChromeRestore, VscChromeClose, VscError, VscWarning,
  VscBell, VscArrowLeft, VscArrowRight, VscEllipsis
} from 'react-icons/vsc';
import { SiHtml5, SiReact, SiSpringboot, SiGmail, SiPrettier } from 'react-icons/si';
import { FaCss3Alt, FaGithub, FaLinkedin } from 'react-icons/fa';
import { MdSensors } from 'react-icons/md';
import { CgProfile } from 'react-icons/cg';
import { DiJava, DiMysql } from 'react-icons/di';
import './App.css';

const MOBILE_QUERY = '(max-width: 768px)';
const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;

// Which files open the bottom panel, and on which tab
const FILE_TERMINAL_VIEW = {
  'projects.json': 'PROJECTS',
  'contact.css': 'CONTACT',
};

const TERMINAL_TABS = ['TERMINAL', 'PROJECTS', 'CONTACT'];
const ALL_FILES = ['about.html', 'skills.jsx', 'projects.json', 'contact.css'];

// One line of "code": the line number and the text are separate boxes,
// so spaces between coloured spans are kept and long lines can wrap on mobile.
const Line = ({ n, indent = 0, children }) => (
  <div className={`code-line type-${n}`}>
    <span className="line-num">{n}</span>
    <span className="code-text" style={{ paddingLeft: `${indent * 2}ch` }}>
      {children}
    </span>
  </div>
);

// Simple Tilt Effect Component
const TiltCard = ({ children }) => {
  const [style, setStyle] = useState({});

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setStyle({ transform: `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)` });
  };

  return (
    <div
      className="tilt-wrapper"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setStyle({ transform: 'perspective(1000px) rotateY(0) rotateX(0)' })}
      style={style}
    >
      {children}
    </div>
  );
};

function App() {
  const [activeFile, setActiveFile] = useState('about.html');
  // Mobile: every tab is open from the start so visitors can swipe through the whole portfolio
  const [openTabs, setOpenTabs] = useState(() => (isMobile() ? ALL_FILES : ['about.html']));
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalView, setTerminalView] = useState('TERMINAL');
  // Explorer is open on desktop, closed (drawer) on mobile
  const [explorerOpen, setExplorerOpen] = useState(() => !isMobile());
  const [portfolioFolderOpen, setPortfolioFolderOpen] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef(null);
  const codeAreaRef = useRef(null);
  const touchStartY = useRef(0);
  const startedAtBottom = useRef(false);
  const startedAtTop = useRef(true);
  const scrollTargetRef = useRef('top'); // where the next file should start: 'top' or 'bottom'

  // Clear any pending timer when the component unmounts
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // After a file switch has rendered, put the scroll position at the top
  // (going forward) or the bottom (coming back from the next file).
  useEffect(() => {
    const el = codeAreaRef.current;
    if (el) el.scrollTop = scrollTargetRef.current === 'bottom' ? el.scrollHeight : 0;
    scrollTargetRef.current = 'top';
  }, [activeFile]);

  const fileIcons = {
    'about.html': <SiHtml5 size={16} color="#e34c26" />,
    'skills.jsx': <SiReact size={16} color="#61dafb" />,
    'projects.json': (
      <span className="json-icon">{'{}'}</span>
    ),
    'contact.css': <FaCss3Alt size={16} color="#264de4" />,
  };

  const syncTerminal = (fileName) => {
    const view = FILE_TERMINAL_VIEW[fileName];
    if (view) {
      setTerminalOpen(true);
      setTerminalView(view);
    } else {
      setTerminalOpen(false);
    }
  };

  const handleFileClick = (fileName, scrollTo = 'top') => {
    // On mobile the explorer is a drawer: close it after choosing a file
    if (isMobile()) setExplorerOpen(false);

    if (activeFile === fileName) {
      // Same file clicked again: just bring the panel back if it was closed
      if (FILE_TERMINAL_VIEW[fileName] && !terminalOpen) syncTerminal(fileName);
      return;
    }

    clearTimeout(timerRef.current);
    setTransitioning(true);
    timerRef.current = setTimeout(() => {
      setOpenTabs((tabs) => (tabs.includes(fileName) ? tabs : [...tabs, fileName]));
      setActiveFile(fileName);
      scrollTargetRef.current = scrollTo;
      setTransitioning(false);
      syncTerminal(fileName);
    }, 150);
  };

  const closeTab = (e, fileName) => {
    e.stopPropagation();
    const index = openTabs.indexOf(fileName);
    const newTabs = openTabs.filter((tab) => tab !== fileName);
    setOpenTabs(newTabs);

    if (activeFile === fileName) {
      const next = newTabs[Math.min(index, newTabs.length - 1)] || '';
      setActiveFile(next);
      syncTerminal(next); // closes the panel if no file is left
    }
  };

  // ----- Mobile: swipe up at the end of a file -> go to the next tab -----
  const nextFile = activeFile ? openTabs[openTabs.indexOf(activeFile) + 1] : undefined;
  const prevFile = activeFile ? openTabs[openTabs.indexOf(activeFile) - 1] : undefined;

  const atBottom = (el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 2;

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    // Only count the swipe if the user was ALREADY at the end when the finger touched down,
    // so reaching the bottom by scrolling doesn't jump to the next tab straight away.
    startedAtBottom.current = atBottom(e.currentTarget);
    startedAtTop.current = e.currentTarget.scrollTop <= 1;
  };

  const handleTouchEnd = (e) => {
    if (!isMobile() || transitioning) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY; // + = finger moved up
    if (delta > 50 && startedAtBottom.current && nextFile) {
      handleFileClick(nextFile, 'top');
    } else if (delta < -50 && startedAtTop.current && prevFile) {
      handleFileClick(prevFile, 'bottom'); // coming back: land at the end of the previous file
    }
  };

  const renderContent = () => {
    switch (activeFile) {
      case 'about.html':
        return (
          <>
            <Line n={1}><span className="html-tag">&lt;h1&gt;</span> <span className="big-title">Hi, I'm Dillibabu D</span> <span className="html-tag">&lt;/h1&gt;</span></Line>
            <Line n={2}><span className="html-tag">&lt;h3&gt;</span> <span className="sub-title">Java Fullstack Developer</span> <span className="html-tag">&lt;/h3&gt;</span></Line>
            <Line n={3}>{'\u00A0'}</Line>
            <Line n={4}><span className="html-tag">&lt;p&gt;</span></Line>
            <Line n={5} indent={1}>Specializing in <span className="keyword">Spring Boot</span>, <span className="keyword">React</span>, and <span className="keyword">MySQL</span>.</Line>
            <Line n={6} indent={1}>I build scalable web applications and solve complex business problems.</Line>
            <Line n={7}><span className="html-tag">&lt;/p&gt;</span></Line>
          </>
        );
      case 'skills.jsx':
        return (
          <>
            <Line n={1}><span className="keyword">import</span> React <span className="keyword">from</span> <span className="string">'react'</span>;</Line>
            <Line n={2}>{'\u00A0'}</Line>
            <Line n={3}><span className="keyword">const</span> <span className="class-name">Skills</span> = () =&gt; {'{'}</Line>
            <Line n={4} indent={1}><span className="keyword">const</span> techStack = {'{'}</Line>
            <Line n={5} indent={2}><span className="value">frontend</span>: [<span className="string">'React'</span>, <span className="string">'Bootstrap'</span>, <span className="string">'HTML/CSS'</span>],</Line>
            <Line n={6} indent={2}><span className="value">backend</span>: [<span className="string">'Java 21'</span>, <span className="string">'Spring Boot'</span>],</Line>
            <Line n={7} indent={2}><span className="value">database</span>: [<span className="string">'MySQL'</span>],</Line>
            <Line n={8} indent={2}><span className="value">tools</span>: [<span className="string">'Git'</span>, <span className="string">'GitHub'</span>, <span className="string">'Postman'</span>]</Line>
            <Line n={9} indent={1}>{'}'};</Line>
            <Line n={10}>{'}'};</Line>
          </>
        );
      case 'projects.json':
        return (
          <>
            <Line n={1}><span className="html-tag">// Check the terminal below for Project Cards ⬇️</span></Line>
            <Line n={2}>{'{'}</Line>
            <Line n={3} indent={1}><span className="string">"status"</span>: <span className="value">"Terminal Opened"</span></Line>
            <Line n={4}>{'}'}</Line>
          </>
        );
      case 'contact.css':
        return (
          <>
            <Line n={1}><span className="html-tag">/* Check the terminal below for Contact &amp; Resume ⬇️ */</span></Line>
            <Line n={2}><span className="class-name">.contact-info</span> {'{'}</Line>
            <Line n={3} indent={1}><span className="value">display</span>: flex;</Line>
            <Line n={4}>{'}'}</Line>
          </>
        );
      default:
        // No file open
        return (
          <div className="empty-state">
            No file open.
            <br />
            Pick one from the Explorer (folder icon).
          </div>
        );
    }
  };

  return (
    <div className="vscode-wrapper">
      {/* ===== Top menu ===== */}
      <div className="top-menu">
        <div className="menu-left">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/9/9a/Visual_Studio_Code_1.35_icon.svg"
            alt="VS Code"
            className="vs-logo"
          />
          <div className="menu-items">
            <span>File</span><span>Edit</span><span>Selection</span><span>View</span><span>Go</span><span>Run</span>
            <span className="menu-ellipsis"><VscEllipsis size={22} /></span>
          </div>
        </div>

        <div className="menu-center">
          <div className="nav-arrows">
            <VscArrowLeft className="nav-arrow" size={20} />
            <VscArrowRight className="nav-arrow" size={20} />
          </div>
          <div className="search-box">
            <VscSearch size={15} className="search-icon" />
            <span>Dillibabu_Portfolio - Visual Studio Code</span>
          </div>
        </div>

        <div className="menu-right">
          <div className="window-icon-btn"><VscChromeMinimize size={16} /></div>
          <div className="window-icon-btn"><VscChromeRestore size={16} /></div>
          <div className="window-icon-btn close-btn"><VscChromeClose size={16} /></div>
        </div>
      </div>

      {/* ===== Main area ===== */}
      <div className="main-layout">
        <div className="activity-bar">
          <div className="activity-top">
            <div
              className={`icon ${explorerOpen ? 'active' : ''}`}
              title="Explorer"
              onClick={() => setExplorerOpen((open) => !open)}
            >
              <VscFiles size={24} />
            </div>
            <div className="icon"><VscSearch size={24} /></div>
            <div className="icon"><VscSourceControl size={24} /></div>
            <div className="icon"><VscDebugAlt size={24} /></div>
            <div className="icon"><VscExtensions size={24} /></div>
          </div>
          <div className="activity-bottom">
            <div className="icon"><VscAccount size={24} /></div>
            <div className="icon"><VscSettingsGear size={24} /></div>
          </div>
        </div>

        {/* Dark overlay behind the drawer (only visible on mobile) */}
        {explorerOpen && <div className="sidebar-backdrop" onClick={() => setExplorerOpen(false)} />}

        {explorerOpen && (
          <div className="sidebar">
            <div className="sidebar-header">EXPLORER</div>
            <div className="folder-name" onClick={() => setPortfolioFolderOpen(!portfolioFolderOpen)}>
              {portfolioFolderOpen ? <VscChevronDown /> : <VscChevronRight />} PORTFOLIO
            </div>
            {portfolioFolderOpen && (
              <ul className="file-tree">
                {Object.keys(fileIcons).map((file) => (
                  <li key={file} className={activeFile === file ? 'active' : ''} onClick={() => handleFileClick(file)}>
                    <span className="file-icon-wrapper">{fileIcons[file]}</span>
                    <span className="file-name-text">{file}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="editor-container">
          <div className="tabs-bar">
            {openTabs.map((tab) => (
              <div key={tab} className={`tab ${activeFile === tab ? 'active' : ''}`} onClick={() => handleFileClick(tab)}>
                <span className="tab-icon-wrapper">{fileIcons[tab]}</span>
                {tab}
                <VscClose className="close-icon" onClick={(e) => closeTab(e, tab)} />
              </div>
            ))}
          </div>

          <div
            className="code-area"
            ref={codeAreaRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className={`code-content ${transitioning ? 'fade-out' : 'fade-in-smooth'}`}>
              {prevFile && <div className="prev-hint">↓ Swipe down for previous: {prevFile}</div>}
              {/* key forces the typing animation to replay on every file change */}
              <div key={activeFile} className="code-lines">
                {renderContent()}
              </div>
              {nextFile && <div className="next-hint">Swipe up for next: {nextFile} ↑</div>}
            </div>
          </div>

          {terminalOpen && (
            <div className="terminal-panel slide-up">
              <div className="terminal-header">
                <div className="segmented-control">
                  <div
                    className="active-bg"
                    style={{ transform: `translateX(${TERMINAL_TABS.indexOf(terminalView) * 100}%)` }}
                  />
                  {TERMINAL_TABS.map((tab) => (
                    <button
                      key={tab}
                      className={`segment-btn ${terminalView === tab ? 'active-text' : ''}`}
                      onClick={() => setTerminalView(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <VscClose size={18} className="panel-close" onClick={() => setTerminalOpen(false)} />
              </div>

              <div className="terminal-content">
                {terminalView === 'TERMINAL' && (
                  <div className="term-text fade-in-smooth">
                    <span className="term-path">PS C:\Users\Dillibabu\Portfolio&gt;</span> npm run build<br />
                    <span className="term-success">Portfolio successfully compiled! Ready for hire.</span>
                  </div>
                )}

                {terminalView === 'PROJECTS' && (
                  <div className="projects-grid fade-in-smooth">
                    <TiltCard>
                      <div className="mac-card">
                        <div className="mac-header"><span className="red"></span><span className="yellow"></span><span className="green"></span></div>
                        <div className="card-title">Cafe &amp; Bakery Management</div>
                        <p className="card-description">Full-stack web app to manage daily sales, pre-orders, and inventory.</p>
                        <div className="tech-icons">
                          <span className="tech-tag"><SiSpringboot size={15} color="#6db33f" /> Spring Boot</span>
                          <span className="tech-tag"><SiReact size={15} color="#61dafb" /> React</span>
                          <span className="tech-tag"><DiMysql size={15} color="#00a8d8" /> MySQL</span>
                        </div>
                      </div>
                    </TiltCard>

                    <TiltCard>
                      <div className="mac-card">
                        <div className="mac-header"><span className="red"></span><span className="yellow"></span><span className="green"></span></div>
                        <div className="card-title">Apparel E-Commerce</div>
                        <p className="card-description">Responsive online retail store for clothing with secure cart management.</p>
                        <div className="tech-icons">
                          <span className="tech-tag"><DiJava size={18} color="#f89820" /> Java 21</span>
                          <span className="tech-tag"><SiReact size={15} color="#61dafb" /> React</span>
                          <span className="tech-tag"><DiMysql size={15} color="#00a8d8" /> MySQL</span>
                        </div>
                      </div>
                    </TiltCard>
                  </div>
                )}

                {terminalView === 'CONTACT' && (
                  <div className="term-text fade-in-smooth terminal-contact">
                    <span className="term-path">PS C:\Users\Dillibabu\Portfolio&gt;</span> cat contact_info.txt<br /><br />
                    <div className="terminal-link-row">
                      <span className="keyword">Github:</span>
                      <a href="https://github.com/dillibabu" target="_blank" rel="noopener noreferrer" className="term-link"><FaGithub size={16} /> github.com/dillibabu</a>
                    </div>
                    <div className="terminal-link-row">
                      <span className="keyword">LinkedIn:</span>
                      <a href="https://linkedin.com/in/dillibabu" target="_blank" rel="noopener noreferrer" className="term-link"><FaLinkedin size={16} /> linkedin.com/in/dillibabu</a>
                    </div>
                    <div className="terminal-link-row">
                      <span className="keyword">Email:</span>
                      <a href="mailto:dillibabu302002@gmail.com" className="term-link"><SiGmail size={16} /> dillibabu.d@example.com</a>
                    </div>
                    <br />
                    <span className="term-path">PS C:\Users\Dillibabu\Portfolio&gt;</span> ./download_cv.sh<br /><br />
                    {/* Put your resume in the public/ folder with this exact name */}
                    <div className="button"><a href="/Dillibabu_CV.pdf" download className="anchor"><span>Download CV</span></a></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Status bar ===== */}
      <div className="status-bar">
        <div className="status-left">
          <span className="status-item"><VscRemote size={14} /></span>
          <span className="status-item hide-mobile"><VscError size={14} /> 0 <VscWarning size={14} style={{ marginLeft: '5px' }} /> 0</span>
        </div>
        <div className="status-right">
          <span className="status-item hide-mobile">Ln 1, Col 1</span>
          <span className="status-item hide-mobile">Spaces: 2</span>
          <span className="status-item hide-mobile">UTF-8</span>
          <span className="status-item hide-mobile">LF</span>
          <span className="status-item hide-mobile">{'{ }'} JavaScript JSX</span>
          <span className="status-item hide-mobile"><CgProfile size={14} /> Sign In</span>
          <span className="status-item hide-mobile"><MdSensors size={14} /> Go Live</span>
          <span className="status-item hide-mobile"><SiPrettier size={14} /> Prettier</span>
          <span className="status-item"><VscBell size={14} /></span>
        </div>
      </div>
    </div>
  );
}

export default App;