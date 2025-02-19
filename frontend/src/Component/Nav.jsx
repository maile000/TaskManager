import { Link } from "react-router-dom";

function Nav({ user, onLogout }) {
    return (
        <nav style={styles.navbar}>
            <Link to="/" style={styles.link}>Home</Link>
            {user ? (
                <>
                    <Link to="/dashboard" style={styles.link}>Board</Link>
                    <Link to="/profile" style={styles.link}>Profil</Link>
                    <button onClick={onLogout} style={styles.button}>Logout</button>
                </>
            ) : (
                <Link to="/login" style={styles.link}>Login</Link>
            )}
        </nav>
    );
}

const styles = {
    navbar: {
        display: "flex",
        gap: "20px",
        padding: "10px",
        backgroundColor: "#282c34",
        color: "white",
        justifyContent: "center",
    },
    link: {
        color: "white",
        textDecoration: "none",
        fontSize: "18px",
    },
    button: {
        backgroundColor: "red",
        border: "none",
        color: "white",
        padding: "5px 10px",
        cursor: "pointer",
        fontSize: "18px",
    }
};

export default Nav;
