import axios from "axios";
import "./StyleComp/Modal.css";

const CreatTaskModal = ({onClose, onCreate}) => {

return(
    <div className="modalOverlay">
        <div className="modalContent">
            <h2>Task erstellen</h2>
            <input>
            </input>
            <button onClick={onClose} className="button" >Schließen</button>
        </div>
    </div>
)
};

export default CreatTaskModal;