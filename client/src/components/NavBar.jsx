import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FaExclamationCircle } from "react-icons/fa";
import Notification from "./chat/Notification";
import { FaInfoCircle } from "react-icons/fa";

const NavBar = () => {
  const { user, logoutUser } = useContext(AuthContext);

  const colors = ["#ef4444", "#f59e0b", "#eab308", "#3b82f6"];

  const [colorIndex, setColorIndex] = useState(0);

//   const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prevIndex) =>
        (prevIndex + 1) % colors.length
      );
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const currentColor = colors[colorIndex];

//   const toggleDarkMode = () => {
//     setIsDarkMode(!isDarkMode);

//     const body = document.querySelector("body");

//     body.style.backgroundColor = isDarkMode
//       ? "#ffffff"
//       : "#020617";
//   };

  return (
    <nav className="h-20 px-8 flex items-center justify-between bg-slate-900/80 backdrop-blur-lg border-b border-slate-700 shadow-lg">

      {/* LEFT SECTION */}
      <div className="flex items-center gap-6">

        {/* LOGO */}
        <Link
          to="/"
          className="text-4xl font-extrabold tracking-wide text-white no-underline"
        >
          DD
          <span
            style={{
              color: currentColor,
              transition: "0.4s",
            }}
          >
            World
          </span>
        </Link>

        {/* USER INFO */}
        {user && (
          <div className="hidden md:flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">

            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>

            <span className="text-slate-300 text-sm">
              Logged in as
            </span>

            <span className="text-yellow-400 font-semibold">
              {user?.name}
            </span>
          </div>
        )}
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-4">

        {/* LOGIN / REGISTER */}
        {!user && (
          <>
            <Link to="/login">
              <button className="px-5 py-2 rounded-xl border border-slate-600 text-white hover:bg-slate-800 transition duration-300">
                Login
              </button>
            </Link>

            <Link to="/register">
              <button className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition duration-300 shadow-lg">
                Register
              </button>
            </Link>
          </>
        )}

        {/* LOGOUT */}
        {user && (
          <button
            onClick={() => logoutUser()}
            className="px-5 py-2 rounded-xl border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition duration-300"
          >
            Logout
          </button>
        )}

        {/* DARK MODE BUTTON
        <button
          onClick={toggleDarkMode}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition duration-300"
        >
          {isDarkMode ? <FaSun /> : <FaMoon />}
        </button> */}

        {/* CONTACT BUTTON */}
        {/* <button
          onClick={() => {
            alert(
      "DDWorld\n\nBuilt using React, Node.js, Socket.IO, MongoDB and Tailwind CSS."
    );
          }}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition duration-300"
        >
          <FaInfoCircle />
        </button> */}

        {/* NOTIFICATIONS */}
        {user && <Notification />}
      </div>
    </nav>
  );
};

export default NavBar;