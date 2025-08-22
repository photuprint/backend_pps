// src/components/IconMap.js
import React from "react";
import { MdLogout } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { MdAddAPhoto } from "react-icons/md";
import { MdAccessTime } from "react-icons/md";
import { MdAccountBalanceWallet } from "react-icons/md";
import { MdAccountCircle } from "react-icons/md";
import { MdAccountBox } from "react-icons/md";
import { MdAdd } from "react-icons/md";
import { MdAddCard } from "react-icons/md";
import { MdClose } from "react-icons/md";
import { MdDensitySmall } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import { MdDiscount } from "react-icons/md";
import { MdDone } from "react-icons/md";
import { MdDownload } from "react-icons/md";
import { MdDownloadDone } from "react-icons/md";
import { MdExpandLess } from "react-icons/md";
import { MdExpandMore } from "react-icons/md";
import { MdFileUpload } from "react-icons/md";
import { MdInfoOutline } from "react-icons/md";

const iconMap = {
    FcGoogle,
    MdLogout,
    MdAddAPhoto,
    MdAccessTime,
    MdAccountBalanceWallet,
    MdAccountCircle,
    MdAccountBox,
    MdAdd,
    MdAddCard,
    MdClose,
    MdDensitySmall,
    MdDelete,
    MdDiscount,
    MdDone,
    MdDownload,
    MdDownloadDone,
    MdExpandLess,
    MdExpandMore,
    MdFileUpload,
    MdInfoOutline
  };
  
  export default function IconMap({ name, size = 30 }) {
    const Icon = iconMap[name]; // pick component
    return Icon ? <Icon size={size} /> : null; // render dynamically
  }
  
  
