import "./Style/Home.css";
import React from "react";
import StatusPie from "../Component/StatusPie";

function Home () {

    const today = new Date();
    const datumString = today.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return(
        <div className="home-background">
            <div className="home-grid">
                <div className="item item1">1

                </div>
                <div className="item item2">2
                    <StatusPie/>
                </div>
                <div className="item item3">
                    <div style={{ fontSize: "20px", fontWeight: "bold", textAlign: "center", color: "white" }}>
                        {datumString}
                    </div>
                </div>
            </div>
            
        </div>
    )
};

export default Home;