import "./StyleComp/Board.css";
import Sidebar from "./SideBar";

function Board () {

    return(
        <div className="board-background">
            <Sidebar efaultOpen={false} />
            <div className="board-box">

            </div>
        </div>
    )
};

export default Board;