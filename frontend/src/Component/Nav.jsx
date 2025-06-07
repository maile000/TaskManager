import { Link } from "react-router-dom";
import "./StyleComp/Nav.css";

function Nav({ user, onLogout }) {
    return (
        <nav className="navbar">
            <Link to="/" className="navbar-link">Home</Link>
            {user ? (
                <>
                    <Link to="/team" className="navbar-link" >Team</Link>
                    <Link to="/profile" className="navbar-link" >Profil</Link>
                    <button onClick={onLogout} className="button" >Logout</button>
                </>
            ) : (
                <Link to="/login" className="navbar-link" >Login</Link>
            )}
        </nav>
    );
}



export default Nav;
