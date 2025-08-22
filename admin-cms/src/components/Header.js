import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MdLogout } from "react-icons/md";


const Header = () => {
    const { user, logout } = useAuth();
    return(
        <div className="headerWrapper">
            <div className="makeFlex">
                <h2 className="font16 blackText fontMedium appendRight10 paddingRight10 borderRight1px">
                    Welcome, <span className="fontBold">{user?.user?.name || 'Admin'}!</span> 👋
                </h2>
                <button onClick={logout} className="logoutButtonStyle"><span className="makeFlex alignCenter"><MdLogout size={18} />&nbsp;Logout</span></button>
            </div>
      </div>
    )
}

export default Header;