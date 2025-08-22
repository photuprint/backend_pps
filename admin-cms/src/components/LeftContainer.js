import React from 'react';
import { NavLink } from 'react-router-dom';
import IconMap from '../common/IconMap';

const LeftContainer = ({data}) => {
    return(
        <aside className="sidebarContainer">
            <div className="top">
                <div className="logo">
                    <div className="logoStyle textLogo">PhotuPrint</div>
                </div>
                <div className="close">✖</div>
            </div>

            <div className="sidebar">
            {data.map((item) => (
                <NavLink
                    key={item.id}
                    to={item.link}
                    className={({ isActive }) =>
                    `navLink ${isActive ? "active" : ""}`
                    }
                >
                    <IconMap name={item.icon} size={22} /> 
                    <span>{item.title}</span>
                </NavLink>
                ))}
            </div>
        </aside>
    )
}

export default LeftContainer;