import { Link } from "react-router-dom";
import "./StyleComp/Nav.css";

function Nav({ user, onLogout }) {
    return (
        <nav className="navbar">
            <Link to="/" className="link">Home</Link>
            {user ? (
                <>
                    <Link to="/profile" className="navbar-link" >Profil</Link>
                    <Link to="/team" className="navbar-link" >Team</Link>
                    <button onClick={onLogout} className="button" >Logout</button>
                </>
            ) : (
                <Link to="/login" className="navbar-link" >Login</Link>
            )}
        </nav>
    );
}



export default Nav;
