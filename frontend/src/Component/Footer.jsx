import React from "react";
import "./StyleComp/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
    
          <ul className="footer-links">
            <li><a href="/" >Home</a></li>
            <li><a href="/about">About</a></li>
          </ul>
        </div>
        </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;