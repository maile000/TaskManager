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
    const sectionRefs = useRef([]);

    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
            }
          });
        },
        { threshold: 0.2 }
      );

      sectionRefs.current.forEach((el) => el && observer.observe(el));

      return () => {
        sectionRefs.current.forEach((el) => el && observer.unobserve(el));
      };
    }, []);

  
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
            <div className="landing-block3 fade-in"
            ref={(el) => (sectionRefs.current[2] = el)} >
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
            <div className="fade-in"
            ref={(el) => (sectionRefs.current[3] = el)} >
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.  

Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.  

Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi.  

Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum. Lorem
          </div>
        </div>
    );
};

export default Landing;