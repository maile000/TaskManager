import React, { useState, useRef, useEffect } from 'react';
import "./Style/Landing.css";
import KreuzWort from "../Assets/KreuzWort.svg";

const buttonData = [
    { label: 'Option 1', activeLabel: 'Mehr Infos zu 1' },
    { label: 'Option 2', activeLabel: 'Details zu 2' },
    { label: 'Option 3', activeLabel: 'Erklärung 3' },
  ];

function Landing () {
    const [activeButton, setActiveButton] = useState(null);
    const containerRef = useRef(null);
  
    const handleClick = (index) => {
      setActiveButton(index === activeButton ? null : index);
    };
  
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
          setActiveButton(null);
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    return (
        <div className="landing">
            <div className="landing-block1">
                <div className="landing-block1-div">
                    <img src={KreuzWort} className="landing-img"/>
                </div>
                <h1>Welcome to Karen</h1>
            </div>
            <div className='landing-block2'>
                
            </div>
            <div className="landing-block3" >
                {buttonData.map((btn, index) => (
                    <button
                    ref={containerRef}
                    key={index}
                    className={`
                        landing-block3-div
                        ${activeButton === index ? 'active' : ''}
                        ${activeButton !== null && activeButton !== index ? 'shrink' : ''}
                    `}
                    onClick={() => handleClick(index)}
                    >
                    {activeButton === index ? btn.activeLabel : btn.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Landing;